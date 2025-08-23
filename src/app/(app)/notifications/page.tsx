"use client";


"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number; };
  link?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const notifsQuery = query(
          collection(db, `users/${user.uid}/notifications`),
          orderBy("createdAt", "desc")
        );
        const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
          const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
          setNotifications(notifsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching notifications:", error);
          setIsLoading(false);
        });
        return () => unsubscribeNotifs();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const batch = writeBatch(db);
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;
    
    unreadNotifs.forEach(notif => {
      const notifRef = doc(db, `users/${currentUser.uid}/notifications`, notif.id);
      batch.update(notifRef, { read: true });
    });

    try {
      await batch.commit();
      toast({ title: "Notificaciones actualizadas", description: "Todas las notificaciones han sido marcadas como leídas." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron marcar las notificaciones como leídas.", variant: "destructive" });
    }
  };

  const handleDeleteRead = async () => {
     if (!currentUser) return;
    const batch = writeBatch(db);
    const readNotifs = notifications.filter(n => n.read);
    if (readNotifs.length === 0) return;
    
    readNotifs.forEach(notif => {
      const notifRef = doc(db, `users/${currentUser.uid}/notifications`, notif.id);
      batch.delete(notifRef);
    });

    try {
      await batch.commit();
      toast({ title: "Notificaciones eliminadas", description: "Las notificaciones leídas han sido eliminadas." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron eliminar las notificaciones.", variant: "destructive" });
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
      if (!currentUser || notification.read) return;
      const notifRef = doc(db, `users/${currentUser.uid}/notifications`, notification.id);
      try {
        await writeBatch(db).update(notifRef, { read: true }).commit();
      } catch (e) {
        console.error("Failed to mark notification as read", e)
      }
  }

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      onClick={() => handleNotificationClick(notification)}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
        notification.read ? "bg-card text-muted-foreground" : "bg-primary/10",
      )}
    >
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start">
                <h3 className={cn("font-semibold", !notification.read && "text-primary-foreground")}>{notification.title}</h3>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true, locale: es })}
                </p>
            </div>
            <p className="text-sm">{notification.message}</p>
            {notification.link && (
                <Button asChild variant="link" size="sm" className="p-0 h-auto mt-1">
                    <Link href={notification.link}>
                        Ver detalles
                    </Link>
                </Button>
            )}
        </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Bell className="w-8 h-8" />
          Notificaciones
        </h1>
        <p className="text-muted-foreground">Aquí encontrarás todas tus alertas y actualizaciones importantes.</p>
      </header>

      <div className="flex gap-2">
        <Button onClick={handleMarkAllAsRead} disabled={notifications.filter(n => !n.read).length === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
        </Button>
         <Button variant="outline" onClick={handleDeleteRead} disabled={notifications.filter(n => n.read).length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar leídas
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
            {notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map(notif => (
                        <NotificationItem key={notif.id} notification={notif} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">Todo tranquilo por aquí</h3>
                    <p className="mt-2">No tienes notificaciones nuevas.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
