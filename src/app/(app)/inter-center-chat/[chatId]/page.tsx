
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimalLogo } from "@/components/icons/animal-logo";

type Message = {
    id: string;
    author: { centerId: string; userId: string; userName: string; };
    text: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
};

type CurrentUser = {
  uid: string;
  name: string;
  centerId: string;
};

type ChatInfo = {
    id: string;
    participants: {
        [centerId: string]: {
            centerName: string;
            animal: any;
            color: string;
        }
    };
};

export default function InterCenterChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.chatId as string;
  const currentCenterId = searchParams.get('centerId');

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user && currentCenterId) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: user.uid,
            name: `${userData.firstName} ${userData.lastName}`,
            centerId: currentCenterId,
          });
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [currentCenterId, router]);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    const chatDocRef = doc(db, 'inter_center_chats', chatId);
    const unsubscribeMessages = onSnapshot(query(collection(chatDocRef, "messages"), orderBy("createdAt", "asc")), (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        setIsLoading(false);
    });
    
    const unsubscribeChatInfo = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
            setChatInfo({id: doc.id, ...doc.data()} as ChatInfo);
        }
    });

    return () => {
        unsubscribeMessages();
        unsubscribeChatInfo();
    }
  }, [chatId, currentUser]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && chatId) {
        const messagesCollectionRef = collection(db, `inter_center_chats`, chatId, "messages");
        await addDoc(messagesCollectionRef, {
            author: {
                centerId: currentUser.centerId,
                userId: currentUser.uid,
                userName: currentUser.name,
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

  const otherParticipant = chatInfo?.participants && currentUser ? Object.values(chatInfo.participants).find(p => p.centerName !== chatInfo.participants[currentUser.centerId]?.centerName) : null;
  const headerTitle = otherParticipant ? `Chat con ${otherParticipant.centerName}` : "Cargando Chat...";
  
  const getParticipantInfo = (centerId: string) => {
      return chatInfo?.participants[centerId];
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
       <header className="mb-4">
        <Button asChild variant="ghost" className="mb-2">
            <Link href={`/inter-center-chat?centerId=${currentCenterId}`}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Volver
            </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">{headerTitle}</h1>
      </header>
      
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
           {isLoading ? (
               <div className="flex justify-center items-center h-full">
                   <Loader2 className="w-10 h-10 animate-spin text-primary" />
               </div>
           ) : messages.length > 0 ? (
                messages.map((msg) => {
                    const isCurrentUserMessage = msg.author.centerId === currentUser?.centerId;
                    const participantInfo = getParticipantInfo(msg.author.centerId);
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUserMessage ? 'justify-end' : ''}`}>
                             {!isCurrentUserMessage && participantInfo && (
                                <Avatar className="h-8 w-8 rounded-md" style={{backgroundColor: participantInfo.color}}>
                                    <AnimalLogo animal={participantInfo.animal} className="w-5 h-5 m-auto text-white"/>
                                </Avatar>
                             )}
                            <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUserMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                 <div className="flex items-center justify-between gap-4">
                                     <p className="font-semibold text-sm mb-1">{msg.author.userName}</p>
                                     <p className={`text-xs whitespace-nowrap ${isCurrentUserMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatDate(msg.createdAt)}</p>
                                 </div>
                                <p>{msg.text}</p>
                            </div>
                             {isCurrentUserMessage && participantInfo && (
                                 <Avatar className="h-8 w-8 rounded-md" style={{backgroundColor: participantInfo.color}}>
                                    <AnimalLogo animal={participantInfo.animal} className="w-5 h-5 m-auto text-white"/>
                                </Avatar>
                             )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No hay mensajes en este chat todavía.</p>
                    <p>¡Sé el primero en iniciar la conversación!</p>
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
