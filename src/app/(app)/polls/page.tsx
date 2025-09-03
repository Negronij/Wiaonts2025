
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PollCard, Poll } from '@/components/app/poll-card';
import { CreatePollDialog } from '@/components/app/create-poll-dialog';
import { Vote, Loader2 } from 'lucide-react';

type CurrentUser = {
    id: string;
    role: "Propietario" | "Admin" | "Admin Plus" | "Alumno";
};

export default function PollsPage() {
    const searchParams = useSearchParams();
    const centerId = searchParams.get('centerId');
    const [polls, setPolls] = useState<Poll[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user && centerId) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({
                        id: user.uid,
                        role: userData.role || 'Alumno',
                    });

                    const pollsQuery = query(collection(db, 'student_centers', centerId, 'polls'), orderBy('createdAt', 'desc'));
                    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
                        const pollsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as Poll));
                        setPolls(pollsData);
                        setLoading(false);
                    }, (error) => {
                        console.error("Error fetching polls: ", error);
                        setLoading(false);
                    });
                    
                    return () => unsubscribePolls();
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, [centerId]);
    
    const canCreatePoll = currentUser?.role === 'Admin' || currentUser?.role === 'Admin Plus' || currentUser?.role === 'Propietario';

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Vote className="w-8 h-8"/>
                        Encuestas
                    </h1>
                    <p className="text-muted-foreground">Participa y mira los resultados de las encuestas del centro.</p>
                </div>
                {canCreatePoll && centerId && (
                     <CreatePollDialog centerId={centerId} createdBy={{id: currentUser!.id, name: currentUser!.role }} />
                )}
            </header>

            {loading ? (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                 </div>
            ) : (
                <div className="grid gap-6 max-w-2xl mx-auto">
                    {polls.length > 0 ? (
                        polls.map((poll) => (
                           currentUser && centerId && <PollCard key={poll.id} pollData={poll} currentUser={currentUser} centerId={centerId} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-card rounded-lg">
                            <h3 className="text-xl font-semibold">No hay encuestas activas</h3>
                            <p className="text-muted-foreground mt-2">
                               {canCreatePoll ? 'Crea la primera encuesta para empezar.' : 'Vuelve más tarde para ver las novedades.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
