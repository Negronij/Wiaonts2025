
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldQuestion, ChevronRight, MessageSquare, Loader2, User, Ghost } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CurrentUser = {
  id: string;
  role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

type AnonymousChat = {
  id: string;
  studentAlias: string;
  lastMessage?: string;
};

export default function AnonymousChatListPage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [chats, setChats] = useState<AnonymousChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!centerId) {
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userProfile: CurrentUser = {
            id: user.uid,
            role: userData.role || 'Alumno',
          };
          setCurrentUser(userProfile);

          // If admin, fetch all chats. If student, this will be handled on their chat page.
          if (userProfile.role === 'Propietario' || userProfile.role === 'Admin Plus') {
            const chatsQuery = query(collection(db, `student_centers/${centerId}/anonymous_chats`));
            const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
              const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              } as AnonymousChat));
              setChats(chatList);
              setIsLoading(false);
            }, (error) => {
                console.error("Error fetching chats: ", error);
                toast({ title: "Error", description: "No se pudieron cargar los chats.", variant: "destructive" });
                setIsLoading(false);
            });
            return () => unsubscribeChats();
          } else {
             setIsLoading(false);
          }
        }
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [centerId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'Propietario' || currentUser?.role === 'Admin Plus';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <ShieldQuestion className="w-8 h-8" />
          Chat Anónimo
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Revisa y responde a las consultas anónimas de los estudiantes." 
            : "Comunícate de forma segura y confidencial con un administrador."
          }
        </p>
      </header>

      {isAdmin ? (
         <Card>
            <CardHeader>
                <CardTitle>Bandeja de Entrada Anónima</CardTitle>
                <CardDescription>
                    Aquí se listan todas las conversaciones anónimas iniciadas por los estudiantes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {chats.length > 0 ? (
                    <div className="space-y-3">
                        {chats.map(chat => (
                             <Link key={chat.id} href={`/anonymous-chat/${chat.id}?centerId=${centerId}`}>
                                <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 bg-muted">
                                             <Ghost className="h-7 w-7 text-muted-foreground m-auto"/>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">Chat con {chat.studentAlias || `Anónimo`}</h3>
                                            <p className="text-sm text-muted-foreground">{chat.lastMessage || "Sin mensajes nuevos..."}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground"/>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4"/>
                        <p>No hay chats anónimos todavía.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contactar a un Administrador</CardTitle>
            <CardDescription>
              Tu conversación es completamente anónima. Tu identidad nunca será revelada al administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/anonymous-chat/${currentUser?.id}?centerId=${centerId}`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Iniciar / Ver mi Chat Anónimo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
