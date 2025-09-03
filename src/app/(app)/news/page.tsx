
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, DocumentData, onSnapshot } from "firebase/firestore";
import { Newspaper, Loader2 } from "lucide-react";
import { NewsTeamManagement, NewsTeam } from "@/components/app/news-team-management";

type CurrentUser = {
  uid: string;
  role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

type Member = {
  uid: string;
  name: string;
};

export default function NewsPage() {
    const searchParams = useSearchParams();
    const centerId = searchParams.get('centerId');
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [newsTeam, setNewsTeam] = useState<NewsTeam | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!centerId) {
            setIsLoading(false);
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const centerDocRef = doc(db, "student_centers", centerId);
                const centerDoc = await getDoc(centerDocRef);

                if (centerDoc.exists()) {
                    const centerData = centerDoc.data();
                    const roles = centerData.roles || {};
                    let role: CurrentUser['role'] = 'Alumno';
                    if (roles.owner === user.uid) role = 'Propietario';
                    else if (roles.adminPlus?.includes(user.uid)) role = 'Admin Plus';
                    else if (roles.admin?.includes(user.uid)) role = 'Admin';
                    
                    setCurrentUser({ uid: user.uid, role });

                    // Fetch all members of the center
                    const allMemberIds = [roles.owner, ...roles.adminPlus, ...roles.admin, ...roles.student].filter(id => id);
                     if (allMemberIds.length > 0) {
                        const membersQuery = query(collection(db, "users"), where('__name__', 'in', allMemberIds));
                        const membersSnapshot = await getDocs(membersQuery);
                        const membersList = membersSnapshot.docs.map(doc => {
                            const data = doc.data();
                            return { 
                                uid: doc.id, 
                                name: `${data.firstName} ${data.lastName}`,
                            } as Member;
                        });
                        setAllMembers(membersList);
                    }
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });
        
        // Listener for news team config
        const newsConfigRef = doc(db, 'student_centers', centerId, 'news', 'config');
        const unsubscribeNewsConfig = onSnapshot(newsConfigRef, (doc) => {
            if (doc.exists()) {
                setNewsTeam(doc.data() as NewsTeam);
            } else {
                setNewsTeam(null);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNewsConfig();
        };

    }, [centerId]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }
    
    const isOwner = currentUser?.role === 'Propietario';

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Newspaper className="w-8 h-8" />
                    Noticiero del Centro
                </h1>
                <p className="text-muted-foreground">Las últimas noticias y actualizaciones de la comunidad.</p>
            </header>

            {isOwner && centerId && (
                <NewsTeamManagement 
                    centerId={centerId} 
                    allMembers={allMembers}
                    currentTeam={newsTeam}
                />
            )}
            
            {/* News feed will go here */}
        </div>
    );
}
