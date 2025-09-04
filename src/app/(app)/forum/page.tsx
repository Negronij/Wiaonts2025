
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { CreateForumDialog, ForumData } from "@/components/app/create-forum-dialog";
import { ForumCard } from "@/components/app/forum-card";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

type Member = { 
    uid: string; 
    name: string; 
    course: string;
    role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

export type Forum = { 
    id: string; 
    title: string;
    description: string;
    type: 'public' | 'private' | 'general' | 'admins' | 'custom';
    members: Member[];
    access: ('Propietario' | 'Admin Plus' | 'Admin' | 'Alumno')[];
    creatorId?: string;
};

type CurrentUser = {
    uid: string;
    role: Member['role'];
    name: string;
}

export default function ForumPage() {
    const searchParams = useSearchParams();
    const centerId = searchParams.get('centerId');

    const [forums, setForums] = useState<Forum[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getDefaultForums = (allMembers: Member[], centerId: string): Forum[] => {
        const admins = allMembers.filter(m => m.role === 'Propietario' || m.role === 'Admin Plus' || m.role === 'Admin');
        return [
        { 
            id: `general`,
            title: "Chat General", 
            description: "Un espacio para que todos los miembros del centro hablen.", 
            type: 'general',
            members: allMembers,
            access: ["Propietario", "Admin Plus", "Admin", "Alumno"],
        },
        { 
            id: `admins`,
            title: "Chat de Admins", 
            description: "Comunicación interna solo para el equipo administrativo.", 
            type: 'admins',
            members: admins,
            access: ["Propietario", "Admin Plus", "Admin"],
        },
    ]};

    const fetchForums = async (user: FirebaseUser, centerId: string) => {
        setIsLoading(true);
        // Fetch current user's profile
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
             const userData = userDoc.data();
             const currentUserData: CurrentUser = { 
                 uid: user.uid, 
                 role: userData.role,
                 name: `${userData.firstName} ${userData.lastName}`
             };
             setCurrentUser(currentUserData);
            
            // Fetch all members of the center
            const membersQuery = query(collection(db, "users"), where("studentCenterIds", "array-contains", centerId));
            const membersSnapshot = await getDocs(membersQuery);
            const membersList = membersSnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    uid: doc.id, 
                    name: `${data.firstName} ${data.lastName}`,
                    course: 'N/A', // Course info is not in user doc currently
                    role: data.role,
                } as Member;
            });
            setAllMembers(membersList);

            // Fetch custom forums
            const forumsQuery = query(collection(db, `student_centers/${centerId}/forums`));
            const forumsSnapshot = await getDocs(forumsQuery);
            const customForums: Forum[] = await Promise.all(forumsSnapshot.docs.map(async docSnapshot => {
                const data = docSnapshot.data();
                 // Fetch members for private forums
                let forumMembers = membersList;
                if (data.type === 'custom' && data.memberIds) {
                   forumMembers = membersList.filter(m => data.memberIds.includes(m.uid));
                } else if (data.type === 'admins') {
                    forumMembers = membersList.filter(m => m.role === 'Propietario' || m.role === 'Admin Plus' || m.role === 'Admin');
                }
                
                return {
                    id: docSnapshot.id,
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    members: forumMembers,
                    access: data.access || ["Propietario", "Admin Plus", "Admin", "Alumno"],
                    creatorId: data.creatorId
                }
            }));
            
            const defaultForums = getDefaultForums(membersList, centerId);
            setForums([...defaultForums, ...customForums]);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user && centerId) {
                fetchForums(user, centerId);
            } else {
                 setCurrentUser(null);
                 setForums([]);
                 setIsLoading(false);
            }
        });
        
        return () => unsubscribe();

    }, [centerId]);

    const handleCreateForum = async (newForumData: ForumData) => {
        if (!centerId || !currentUser) return;
        
        let memberIds: string[] = [];
        let access: string[] = [];

        if (newForumData.type === 'custom') {
            memberIds = [currentUser.uid, ...(newForumData.memberIds || [])];
            // In a real scenario, you might want more granular access control
            access = ["Propietario", "Admin Plus", "Admin", "Alumno"]; 
        } else {
             // For general and admins forum, member list is dynamic, not stored
            memberIds = [];
            access = newForumData.type === 'general'
                ? ["Propietario", "Admin Plus", "Admin", "Alumno"]
                : ["Propietario", "Admin Plus", "Admin"];
        }

        const forumToAdd = {
            title: newForumData.title,
            description: newForumData.description,
            type: newForumData.type,
            creatorId: currentUser.uid,
            creatorName: currentUser.name,
            createdAt: serverTimestamp(),
            memberIds, // Only relevant for 'custom' type
            access
        };

        try {
            await addDoc(collection(db, `student_centers/${centerId}/forums`), forumToAdd);
            toast({
                title: "Foro Creado",
                description: `El foro "${newForumData.title}" ha sido creado con éxito.`,
            });
            // Re-fetch forums to update the list
            if(auth.currentUser) {
                fetchForums(auth.currentUser, centerId);
            }
        } catch(error) {
            console.error("Error creating forum:", error);
            toast({
                title: "Error",
                description: "No se pudo crear el foro.",
                variant: "destructive"
            })
        }
    };
    
    const onForumDeleted = () => {
        // Re-fetch forums after deletion
        if(auth.currentUser && centerId) {
            fetchForums(auth.currentUser, centerId);
        }
    }


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
            </div>
        );
    }
    
    const userRole = currentUser?.role;
    const isMemberOf = (forum: Forum) => {
        if (forum.type === 'general') return true;
        if (forum.type === 'admins') return userRole === 'Propietario' || userRole === 'Admin' || userRole === 'Admin Plus';
        return forum.members.some(m => m.uid === currentUser?.uid);
    }
    
    // Filter forums based on user's role and membership
    const myForums = forums.filter(f => {
        if (!userRole || !currentUser) return false;
        // Check if user's role is in the access list
        const hasAccess = f.access.includes(userRole);
        // For custom groups, also check if user is a member
        if (f.type === 'custom') {
            return hasAccess && f.members.some(m => m.uid === currentUser.uid);
        }
        return hasAccess;
    });

    const canCreateForum = (userRole === 'Propietario' || userRole === 'Admin' || userRole === 'Admin Plus') && allMembers.length > 0;

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <MessageSquare className="w-8 h-8" />
                        Foro del Centro
                    </h1>
                    <p className="text-muted-foreground">Salas de chat para la comunicación interna.</p>
                </div>
                {canCreateForum && centerId && (
                    <CreateForumDialog 
                        allMembers={allMembers.filter(m => m.uid !== currentUser?.uid)} // Exclude self from list
                        onCreateForum={handleCreateForum}
                        existingForums={forums}
                    />
                )}
            </header>

            <section>
                <h2 className="text-2xl font-semibold mb-4">Mis Foros</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myForums.length > 0 ? (
                        myForums.map((forum) => (
                           <ForumCard 
                             key={forum.id} 
                             forum={forum} 
                             centerId={centerId!} 
                             currentUserId={currentUser!.uid}
                             onForumDeleted={onForumDeleted}
                            />
                        ))
                    ) : (
                         <p className="text-muted-foreground col-span-full">No estás en ningún foro todavía.</p>
                    )}
                </div>
            </section>

             {myForums.length === 0 && !isLoading && (
                 <div className="text-center py-10 bg-card rounded-lg col-span-full">
                    <h3 className="text-xl font-semibold">No hay foros disponibles</h3>
                    <p className="text-muted-foreground mt-2">
                         {canCreateForum ? 'Crea el primer foro para empezar a comunicarte.' : 'No se han creado foros o no tienes acceso a ninguno.'}
                    </p>
                </div>
            )}
        </div>
    );
}
