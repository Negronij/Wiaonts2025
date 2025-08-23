"use client";


"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Ghost, Loader2, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type Message = {
    id: string;
    author: {
        id: string;
        name: string;
        avatarUrl?: string;
        isAnonymous: boolean;
    };
    text: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
};

type CurrentUser = {
    id: string;
    name: string;
    avatarUrl: string;
    role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

type ChatInfo = {
    studentAlias: string;
    adminName: string;
};

export default function AnonymousChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.chatId as string; // This will be the student's UID
  const centerId = searchParams.get('centerId');

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdminView = currentUser?.role === 'Propietario' || currentUser?.role === 'Admin Plus' || currentUser?.role === 'Admin';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            name: `${userData.firstName} ${userData.lastName}`,
            avatarUrl: userData.avatarUrl || '',
            role: userData.role || 'Alumno',
          });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!centerId || !chatId || !currentUser) return;
    
    const chatDocRef = doc(db, `student_centers/${centerId}/anonymous_chats`, chatId);

    const setupChat = async () => {
        let chatDoc = await getDoc(chatDocRef);
        
        // If chat doesn't exist and the current user is a student opening their own chat, create it.
        if (!chatDoc.exists() && currentUser.id === chatId && !isAdminView) {
            const centerDocRef = doc(db, "student_centers", centerId);
            const centerDoc = await getDoc(centerDocRef);
            const centerData = centerDoc.data();
            const totalChats = (centerData?.anonymousChatCounter || 0) + 1;
            
            const newChatData = {
                studentUid: currentUser.id,
                studentAlias: `Anónimo #${totalChats}`,
                adminName: "Administración", // Placeholder name
                createdAt: serverTimestamp(),
                lastMessage: "Chat iniciado.",
            };

            await setDoc(chatDocRef, newChatData);
            if (centerDoc.exists()) {
                await updateDoc(centerDocRef, { anonymousChatCounter: totalChats });
            }
            
            chatDoc = await getDoc(chatDocRef); // Re-fetch the doc
        }

        if (chatDoc.exists()) {
            setChatInfo(chatDoc.data() as ChatInfo);
        } else if (currentUser.id !== chatId) {
            // Admin is viewing a chat that somehow doesn't exist.
            console.error("Admin trying to access a non-existent chat.");
            setIsLoading(false);
            return;
        }
        
        const messagesQuery = query(collection(chatDocRef, "messages"), orderBy("createdAt", "asc"));
        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setIsLoading(false);
        });

        return () => unsubscribeMessages();
    }

    setupChat();

  }, [chatId, centerId, currentUser, isAdminView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && centerId) {
        const chatDocRef = doc(db, `student_centers/${centerId}/anonymous_chats`, chatId);
        const messagesCollectionRef = collection(chatDocRef, "messages");
        const trimmedMessage = newMessage.trim();

        await addDoc(messagesCollectionRef, {
            author: {
                id: currentUser.id,
                name: isAdminView ? currentUser.name : 'Anónimo',
                avatarUrl: isAdminView ? currentUser.avatarUrl : '',
                isAnonymous: !isAdminView
            },
            text: trimmedMessage,
            createdAt: serverTimestamp(),
        });

        // Update last message for preview
        await updateDoc(chatDocRef, {
            lastMessage: trimmedMessage
        });

        setNewMessage("");
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
  }

  const getHeaderTitle = () => {
      if (!chatInfo) return "Cargando...";
      if (isAdminView) {
          return `Chat con ${chatInfo?.studentAlias || 'Anónimo'}`;
      }
      return `Chat con ${chatInfo?.adminName || 'Administración'}`;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
       <header className="mb-4">
        <Button asChild variant="ghost" className="mb-2">
            <Link href={`/anonymous-chat?centerId=${centerId}`}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Volver
            </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">{getHeaderTitle()}</h1>
      </header>
      
      {!isAdminView && (
        <Alert className="mb-4 bg-primary/10 border-primary/20">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <AlertTitle>Estás en un chat anónimo</AlertTitle>
            <AlertDescription>
              Tu identidad está protegida. El administrador no sabrá quién eres. Sé respetuoso.
            </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
           {isLoading ? (
               <div className="flex justify-center items-center h-full">
                   <Loader2 className="w-10 h-10 animate-spin text-primary" />
               </div>
           ) : messages.length > 0 ? (
                messages.map((msg) => {
                    const isCurrentUserMessage = msg.author.id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUserMessage ? 'justify-end' : ''}`}>
                             {!isCurrentUserMessage && (
                                <Avatar className="h-8 w-8">
                                    {msg.author.isAnonymous ? (
                                         <AvatarFallback><Ghost className="h-5 w-5 text-muted-foreground"/></AvatarFallback>
                                    ) : (
                                        <>
                                            <AvatarImage src={msg.author.avatarUrl} data-ai-hint="person face" />
                                            <AvatarFallback>{msg.author.name?.charAt(0)}</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                             )}
                            <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUserMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                 <div className="flex justify-between items-baseline gap-4">
                                     {!msg.author.isAnonymous && <p className="font-semibold text-sm mb-1">{msg.author.name}</p>}
                                     <p className={`text-xs whitespace-nowrap ${isCurrentUserMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatDate(msg.createdAt)}</p>
                                 </div>
                                <p>{msg.text}</p>
                            </div>
                            {isCurrentUserMessage && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentUser?.avatarUrl} data-ai-hint="user avatar" />
                                    <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No hay mensajes en este chat todavía.</p>
                    <p>{isAdminView ? "Cuando el usuario escriba, verás el mensaje aquí." : "Tu mensaje será anónimo."}</p>
                </div>
            )}
            <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
              disabled={!currentUser || isLoading}
            />
            <Button type="submit" size="icon" disabled={!currentUser || !newMessage.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
