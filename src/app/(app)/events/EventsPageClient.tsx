"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CreateProposalDialog } from "@/components/app/create-proposal-dialog";
import { CreateEventDialog } from "@/components/app/create-event-dialog";
import { EventCard, Event } from "@/components/app/event-card";

type CurrentUser = {
  id: string;
  role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

export default function EventsPageClient() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && centerId) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
           const centerDocRef = doc(db, "student_centers", centerId);
           const centerDoc = await getDoc(centerDocRef);
           if (centerDoc.exists()) {
               const centerData = centerDoc.data();
               const roles = centerData.roles || {};
               let role: CurrentUser['role'] = 'Alumno';
               if (roles.owner === firebaseUser.uid) role = 'Propietario';
               else if (roles.adminPlus?.includes(firebaseUser.uid)) role = 'Admin Plus';
               else if (roles.admin?.includes(firebaseUser.uid)) role = 'Admin';

               setCurrentUser({ id: firebaseUser.uid, role });
           }
        }
        
        // Fetch events
        const eventsQuery = query(collection(db, `student_centers/${centerId}/events`), orderBy('startDate', 'asc'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to JS Dates
                registrationOpen: doc.data().registrationOpen.toDate(),
                registrationClose: doc.data().registrationClose.toDate(),
                startDate: doc.data().startDate.toDate(),
                endDate: doc.data().endDate.toDate(),
                drawDate: doc.data().drawDate ? doc.data().drawDate.toDate() : undefined,
            } as Event));
            setEvents(eventsData);
            setIsLoading(false);
        });

        return () => unsubscribeEvents();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [centerId]);
  
  const canCreateEvent = currentUser?.role === 'Propietario' || currentUser?.role === 'Admin Plus' || currentUser?.role === 'Admin';

  const now = new Date();
  const upcomingEvents = events.filter(e => e.startDate > now);
  const activeEvents = events.filter(e => e.startDate <= now && e.endDate >= now);
  const inactiveEvents = events.filter(e => e.endDate < now);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Eventos</h1>
          <p className="text-muted-foreground">
            Participa, compite y diviértete con los eventos del centro.
          </p>
        </div>
        <div className="flex gap-2">
            {centerId && <CreateProposalDialog centerId={centerId} />}
            {canCreateEvent && centerId && <CreateEventDialog centerId={centerId} />}
        </div>
      </header>
      <Tabs defaultValue="proximamente" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="propuestos">Propuestos</TabsTrigger>
          <TabsTrigger value="proximamente">Próximamente</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
        </TabsList>
        <TabsContent value="propuestos">
          <div className="py-8 text-center text-muted-foreground">
            <p>Aquí se mostrarán los eventos propuestos por los usuarios.</p>
          </div>
        </TabsContent>
        <TabsContent value="proximamente">
            {upcomingEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    <p>No hay eventos programados próximamente.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="activos">
           {activeEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    {activeEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    <p>No hay eventos activos en este momento.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="inactivos">
           {inactiveEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    {inactiveEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    <p>No hay eventos finalizados o cancelados.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
