
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimalLogo } from '@/components/icons/animal-logo';
import { Globe, Search, MessageSquare, Loader2, Filter } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type Center = {
  id: string;
  centerName: string;
  animal: any;
  color: string;
  location: string;
};

type Chat = {
    id: string;
    participants: {
        [centerId: string]: {
            centerName: string;
            animal: any;
            color: string;
        }
    };
    lastMessage?: { text: string; timestamp: any };
}

type CurrentUser = {
  uid: string;
  centerId: string;
  centerLocation: string;
}

export default function InterCenterChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCenterId = searchParams.get('centerId');

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByLocation, setFilterByLocation] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user && initialCenterId) {
        const centerDocRef = doc(db, 'student_centers', initialCenterId);
        const centerDoc = await getDoc(centerDocRef);
        if (centerDoc.exists()) {
             setCurrentUser({
                uid: user.uid,
                centerId: initialCenterId,
                centerLocation: centerDoc.data().location,
            });
        }
      } else {
        router.push('/welcome');
      }
    });
    return () => unsubscribeAuth();
  }, [initialCenterId, router]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch all centers except the current user's
    const centersQuery = query(collection(db, 'student_centers'), where('__name__', '!=', currentUser.centerId));
    const unsubscribeCenters = onSnapshot(centersQuery, (snapshot) => {
      const centersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Center));
      setAllCenters(centersData);
    });

    // Fetch chats the current user is part of
    const chatsQuery = query(
        collection(db, 'inter_center_chats'),
        orderBy('lastMessage.timestamp', 'desc')
    );
    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat))
            .filter(chat => chat.participants && chat.participants[currentUser.centerId]);
        setChats(chatsData);
        setIsLoading(false);
    });

    return () => {
        unsubscribeCenters();
        unsubscribeChats();
    }
  }, [currentUser]);

  const handleStartChat = async (targetCenter: Center) => {
    if (!currentUser) return;

    // Create a consistent chat ID
    const chatId = [currentUser.centerId, targetCenter.id].sort().join('_');
    router.push(`/inter-center-chat/${chatId}?centerId=${currentUser.centerId}`);
  };

  const filteredCenters = useMemo(() => {
    let centers = allCenters;
    if (searchTerm) {
        centers = centers.filter(c => c.centerName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterByLocation && currentUser) {
        centers = centers.filter(c => c.location.toLowerCase() === currentUser.centerLocation.toLowerCase());
    }
    return centers;
  }, [allCenters, searchTerm, filterByLocation, currentUser]);
  
  const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  const otherParticipant = (chat: Chat) => {
    if(!currentUser) return null;
    const otherId = Object.keys(chat.participants).find(id => id !== currentUser.centerId);
    return otherId ? chat.participants[otherId] : null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Globe className="w-8 h-8" />
          Comunicación Inter-Centro
        </h1>
        <p className="text-muted-foreground">Conéctate y colabora con otros centros de estudiantes.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Chats</CardTitle>
                </CardHeader>
                <CardContent>
                    {chats.length > 0 ? (
                        <div className="space-y-3">
                            {chats.map(chat => {
                                const participant = otherParticipant(chat);
                                if (!participant) return null;
                                return (
                                <Link key={chat.id} href={`/inter-center-chat/${chat.id}?centerId=${currentUser?.centerId}`}>
                                    <div className="p-3 border rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors">
                                        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor: participant.color}}>
                                            <AnimalLogo animal={participant.animal} className="w-6 h-6 text-white"/>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{participant.centerName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{chat.lastMessage?.text || "Sin mensajes..."}</p>
                                        </div>
                                         <p className="text-xs text-muted-foreground self-start">{formatDate(chat.lastMessage?.timestamp)}</p>
                                    </div>
                                </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No has iniciado ninguna conversación.</p>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Buscar Otros Centros</CardTitle>
                    <CardDescription>Encuentra otros centros para iniciar una conversación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input 
                                placeholder="Buscar por nombre..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant={filterByLocation ? "default" : "outline"} onClick={() => setFilterByLocation(!filterByLocation)}>
                            <Filter className="mr-2 h-4 w-4"/>
                            Misma Ubicación
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {filteredCenters.map(center => (
                            <div key={center.id} className="p-3 border rounded-lg flex items-center justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor: center.color}}>
                                        <AnimalLogo animal={center.animal} className="w-6 h-6 text-white"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{center.centerName}</p>
                                        <p className="text-xs text-muted-foreground">{center.location}</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleStartChat(center)}>
                                    <MessageSquare className="mr-2 h-4 w-4"/>
                                    Chatear
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
