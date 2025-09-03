
"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Crown, Shield, UserX, MoreVertical, Loader2, ShieldCheck, BadgeInfo } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { updateUserRole, removeUserFromCenter } from "@/lib/actions";
import { useSearchParams } from "next/navigation";

type Member = {
  uid: string;
  firstName: string;
  lastName: string;
  role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
  dni?: string;
  avatarUrl?: string;
};

type CenterRoles = {
    owner: string;
    adminPlus: string[];
    admin: string[];
    student: string[];
};

const RoleIcon = ({ role }: { role: Member['role'] }) => {
    switch (role) {
        case 'Propietario':
            return <Crown className="h-4 w-4 text-yellow-500" title="Propietario" />;
        case 'Admin Plus':
            return <ShieldCheck className="h-4 w-4 text-green-500" title="Admin Plus" />;
        case 'Admin':
            return <Shield className="h-4 w-4 text-blue-500" title="Admin" />;
        default:
            return null;
    }
}

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<{uid: string, role: Member['role']} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!centerId) {
        setIsLoading(false);
        return;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const centerDocRef = doc(db, "student_centers", centerId);
        const unsubscribeCenter = onSnapshot(centerDocRef, async (centerDoc) => {
            if (centerDoc.exists()) {
                const centerData = centerDoc.data();
                const roles: CenterRoles = centerData.roles || { owner: '', adminPlus: [], admin: [], student: [] };

                let userRole: Member['role'] = 'Alumno';
                if (roles.owner === user.uid) userRole = 'Propietario';
                else if (roles.adminPlus?.includes(user.uid)) userRole = 'Admin Plus';
                else if (roles.admin?.includes(user.uid)) userRole = 'Admin';
                
                setCurrentUser({ uid: user.uid, role: userRole });

                const allMemberIds = [roles.owner, ...roles.adminPlus, ...roles.admin, ...roles.student].filter(id => id);
                if (allMemberIds.length === 0) {
                  setMembers([]);
                  setIsLoading(false);
                  return;
                }

                const usersQuery = query(collection(db, "users"), where('__name__', 'in', allMemberIds));
                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.reduce((acc, doc) => {
                    acc[doc.id] = doc.data();
                    return acc;
                }, {} as {[key: string]: DocumentData});
                
                const membersList = allMemberIds.map(uid => {
                    const userData = usersData[uid];
                    let role: Member['role'] = 'Alumno';
                    if (roles.owner === uid) role = 'Propietario';
                    else if (roles.adminPlus.includes(uid)) role = 'Admin Plus';
                    else if (roles.admin.includes(uid)) role = 'Admin';

                    return {
                        uid,
                        firstName: userData?.firstName || 'Usuario',
                        lastName: userData?.lastName || 'Desconocido',
                        avatarUrl: userData?.avatarUrl,
                        dni: userData?.dni,
                        role,
                    };
                });
                
                setMembers(membersList);
                setIsLoading(false);
            } else {
                 setIsLoading(false);
            }
        });
        
        return () => unsubscribeCenter();
      } else {
        setIsLoading(false);
        setCurrentUser(null);
        setMembers([]);
      }
    });

    return () => unsubscribeAuth();
  }, [centerId]);

  const handleRoleChange = async (memberUid: string, currentRole: Member['role'], newRole: Member['role']) => {
    if (!currentUser || !centerId || currentRole === newRole) return;
    const result = await updateUserRole({
        centerId,
        currentUserId: currentUser.uid, 
        targetUserId: memberUid, 
        currentRole,
        newRole
    });
     toast({
        title: result.success ? "Rol Actualizado" : "Error al actualizar",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
  }

  const handleRemoveUser = async (member: Member) => {
      if (!currentUser || !centerId) return;
      if (window.confirm(`¿Estás seguro de que quieres expulsar a ${member.firstName} ${member.lastName} del centro?`)) {
          const result = await removeUserFromCenter({
              currentUserId: currentUser.uid, 
              targetUserId: member.uid, 
              centerId, 
              targetUserRole: member.role
          });
           toast({
            title: result.success ? "Usuario Expulsado" : "Error al expulsar",
            description: result.message,
            variant: result.success ? "default" : "destructive",
          });
      }
  }

  const isOwner = currentUser?.role === 'Propietario';

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full">
              <Loader2 className="w-10 h-10 animate-spin text-primary"/>
          </div>
      )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Users className="w-8 h-8" />
            Miembros del Centro
        </h1>
        <p className="text-muted-foreground">Gestiona los roles y miembros de tu comunidad.</p>
      </header>

      {members.length > 0 ? (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {members.map(member => (
                    <div key={member.uid} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl} data-ai-hint="person face" />
                            <AvatarFallback>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                                {member.firstName} {member.lastName}
                                <RoleIcon role={member.role} />
                            </p>
                             <p className="text-xs text-muted-foreground">{member.role}</p>
                             {isOwner && member.dni && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <BadgeInfo className="w-3 h-3"/> DNI: {member.dni}
                                </p>
                             )}
                        </div>

                        { isOwner && member.uid !== currentUser?.uid && member.role !== 'Propietario' && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'Admin Plus')} disabled={member.role === 'Admin Plus'}>Asignar Admin Plus</DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'Admin')} disabled={member.role === 'Admin'}>Asignar Admin</DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'Alumno')} disabled={member.role === 'Alumno'}>Asignar Alumno</DropdownMenuItem>
                                     <DropdownMenuSeparator/>
                                     <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveUser(member)}>
                                         <UserX className="mr-2 h-4 w-4"/> Expulsar
                                     </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                       
                    </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card>
            <CardContent className="py-20 text-center">
                 <h3 className="text-xl font-semibold">La comunidad está vacía</h3>
                 <p className="text-muted-foreground mt-2">
                     Invita a miembros para que empiecen a unirse a tu centro.
                 </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
