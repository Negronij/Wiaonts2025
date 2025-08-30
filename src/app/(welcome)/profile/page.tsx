
"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogOut, Trash2, User as UserIcon, Building } from "lucide-react";
import Link from "next/link";
import { AnimalLogo } from "@/components/icons/animal-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { CenterCard } from "@/components/app/center-card";
import { useToast } from "@/hooks/use-toast";
import { leaveCenter } from "@/lib/actions";

type UserProfileData = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarUrl?: string;
    studentCenterIds?: string[];
};

type CenterInfo = {
    id: string;
    name: string;
    animal: any;
    color: string;
    href: string;
};

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <header className="flex flex-col items-center text-center">
                <Skeleton className="w-24 h-24 rounded-full mb-4" />
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
            </header>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary"/>Acciones de la Cuenta</CardTitle>
                    <CardDescription>Gestiona la seguridad y configuración de tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Separator/>
                    <Skeleton className="h-10 w-full bg-destructive/50" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary"/>Mis Centros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full"/>
                    <Skeleton className="h-16 w-full"/>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [userCenters, setUserCenters] = useState<CenterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfileData;
            setUser(userData);

            if (userData.studentCenterIds && userData.studentCenterIds.length > 0) {
                const centersQuery = query(collection(db, 'student_centers'), where('__name__', 'in', userData.studentCenterIds));
                const centersSnapshot = await getDocs(centersQuery);
                const centersData = centersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().centerName,
                    animal: doc.data().animal,
                    color: doc.data().color,
                    href: `/home?centerId=${doc.id}`
                } as CenterInfo));
                setUserCenters(centersData);
            } else {
                setUserCenters([]);
            }

        } else {
            console.log("No such document!");
            setUser({
                email: firebaseUser.email || "",
                firstName: "Usuario",
                lastName: "Anónimo",
                username: "anonimo"
            });
        }
        setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
           await fetchUserData(firebaseUser);
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);

  const handleLeaveCenter = async (centerId: string, centerName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres salir de "${centerName}"?`)) {
        const user = auth.currentUser;
        if (!user) {
            toast({ title: "Error", description: "Debes estar autenticado.", variant: "destructive" });
            return;
        }
        const result = await leaveCenter({ userId: user.uid, centerId });
        toast({
            title: result.success ? "Has salido del centro" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive"
        });
        if (result.success && auth.currentUser) {
            // Re-fetch user data to update the UI
            fetchUserData(auth.currentUser);
        }
    }
  }


  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
      return (
          <div className="text-center">
              <p>No has iniciado sesión.</p>
              <Button asChild className="mt-4">
                  <Link href="/login">Ir a Iniciar Sesión</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <header className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="user avatar" />}
                <AvatarFallback className="text-3xl">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            {(user.firstName || user.lastName) && (
                <h1 className="text-2xl font-bold font-headline">{user.firstName} {user.lastName}</h1>
            )}
            {user.username && <p className="text-muted-foreground">@{user.username}</p>}
            {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </header>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary"/>Acciones de la Cuenta</CardTitle>
                 <CardDescription>Gestiona la seguridad y configuración de tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/login">
                        <LogOut className="mr-2"/> Cerrar Sesión
                    </Link>
                </Button>
                <Separator/>
                <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="mr-2"/> Eliminar Cuenta
                </Button>
            </CardContent>
        </Card>

        {userCenters.length > 0 && (
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary"/>Mis Centros</CardTitle>
                    <CardDescription>Gestiona tu pertenencia a los centros de estudiantes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {userCenters.map(center => (
                        <div key={center.id} className="flex items-center justify-between p-3 border rounded-lg">
                             <div className="flex items-center gap-3">
                                <div 
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: center.color }}
                                >
                                    <AnimalLogo animal={center.animal} className="h-6 w-6 text-white" />
                                </div>
                                <p className="font-semibold text-sm">{center.name}</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleLeaveCenter(center.id, center.name)}>
                                Salir
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
