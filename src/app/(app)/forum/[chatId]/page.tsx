
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, getDocs, where } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type Message = {
    id: string;
    author: { id: string; name: string; avatarUrl: string; };
    text: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
};

type CurrentUser = {
    id: string;
    name: string;
    avatarUrl: string;
};

// Simplified version of default forums for this page
const getDefaultForumTitle = (chatId: string) => {
    const defaultTitles: { [key: string]: string } = {
        general: "Chat General",
        admins: "Chat de Admins",
    };
    return defaultTitles[chatId];
};


export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.chatId as string;
  const centerId = searchParams.get('centerId');

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [chatTitle, setChatTitle] = useState("Cargando...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then(userDoc => {
             if (userDoc.exists()) {
                const userData = userDoc.data();
                setCurrentUser({
                    id: user.uid,
                    name: `${userData.firstName} ${userData.lastName}`,
                    avatarUrl: userData.avatarUrl || "",
                });
             }
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!centerId || !chatId) return;

    // Fetch chat title
    const fetchTitle = async () => {
        const defaultTitle = getDefaultForumTitle(chatId);
        if (defaultTitle) {
            setChatTitle(defaultTitle);
        } else {
            // It's a custom forum, fetch from DB
            const forumRef = doc(db, 'student_centers', centerId, 'forums', chatId);
            const forumDoc = await getDoc(forumRef);
            if (forumDoc.exists()) {
                setChatTitle(forumDoc.data().title);
            } else {
                setChatTitle("Chat Desconocido");
            }
        }
    };
    fetchTitle();
    
    // Set up real-time listener for messages
    const isDefault = ["general", "admins"].includes(chatId);
    const messagesCollectionPath = isDefault 
        ? `student_centers/${centerId}/default_forums/${chatId}/messages`
        : `student_centers/${centerId}/forums/${chatId}/messages`;
        
    const messagesQuery = query(collection(db, messagesCollectionPath), orderBy("createdAt", "asc"));
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        setMessages(msgs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
    });

    return () => unsubscribeMessages();

  }, [chatId, centerId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && centerId) {
        const isDefault = ["general", "admins"].includes(chatId);
        const messagesCollectionPath = isDefault
            ? `student_centers/${centerId}/default_forums/${chatId}/messages`
            : `student_centers/${centerId}/forums/${chatId}/messages`;
            
        await addDoc(collection(db, messagesCollectionPath), {
            author: {
                id: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
            },
            text: newMessage.trim(),
            createdAt: serverTimestamp(),
        });
        setNewMessage("");
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
       <header className="mb-4">
        <Button asChild variant="ghost" className="mb-2">
            <Link href={`/forum?centerId=${centerId}`}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Volver al Foro
            </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">{chatTitle}</h1>
      </header>
      
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
           {isLoading ? (
               <div className="flex justify-center items-center h-full">
                   <Loader2 className="w-10 h-10 animate-spin text-primary" />
               </div>
           ) : messages.length > 0 ? (
                messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === currentUser?.id ? 'justify-end' : ''}`}>
                         {msg.author.id !== currentUser?.id && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.author.avatarUrl} data-ai-hint="person face" />
                                <AvatarFallback>{msg.author.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                         )}
                        <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.author.id === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                             <div className="flex justify-between items-baseline gap-4">
                                {msg.author.id !== currentUser?.id && <p className="font-semibold text-sm mb-1">{msg.author.name}</p>}
                                <p className={`text-xs ${msg.author.id === currentUser?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatDate(msg.createdAt)}</p>
                             </div>
                            <p>{msg.text}</p>
                        </div>
                        {msg.author.id === currentUser?.id && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.avatarUrl} data-ai-hint="user avatar" />
                                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No hay mensajes en este chat todavía.</p>
                    <p>¡Sé el primero en enviar uno!</p>
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
              disabled={!currentUser}
            />
            <Button type="submit" size="icon" disabled={!currentUser || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
