"use client";


"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  MessageSquare,
  Vote,
  Trophy,
  BarChart3,
  LucideIcon,
  Gift,
  BookMarked,
  ShieldQuestion,
  Globe,
  Loader2,
  Store
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Functionality = {
  href: string;
  label: string;
  Icon: LucideIcon;
  status?: "active" | "coming-soon";
  roles?: ('Propietario' | 'Admin Plus' | 'Admin' | 'Alumno')[];
};

const functionalities: Functionality[] = [
  { href: "/community", label: "Comunidad", Icon: Users, status: "active" },
  { href: "/events", label: "Eventos", Icon: Calendar, status: "coming-soon" },
  { href: "/forum", label: "Foro", Icon: MessageSquare, status: "active" },
  { href: "/polls", label: "Encuestas", Icon: Vote, status: "active" },
  { href: "/course-competition", label: "Competencia", Icon: Trophy, status: "active" },
  { href: "/finances", label: "Finanzas", Icon: BarChart3, status: "active" },
  { href: "/library", label: "Tienda", Icon: Store, status: "active" },
  { href: "/anonymous-chat", label: "Chat Anónimo", Icon: ShieldQuestion, status: "active" },
  { href: "/inter-center-chat", label: "Comunicación Inter-Centro", Icon: Globe, status: "active", roles: ['Propietario'] },
  { href: "/donations", label: "Donaciones", Icon: Gift, status: "coming-soon" },
];

const FunctionalityCard = ({
  func,
  centerId,
}: {
  func: Functionality;
  centerId: string | null;
}) => {
  const isComingSoon = func.status === "coming-soon";

  const cardContent = (
    <div className="flex items-center gap-4 relative w-full">
      <func.Icon className="h-8 w-8 text-primary" />
      <span className="text-lg font-semibold">{func.label}</span>
      {isComingSoon && (
        <Badge variant="secondary" className="absolute top-2 right-2">Próximamente</Badge>
      )}
    </div>
  );
  
  if (isComingSoon) {
      return (
         <Button
            asChild
            variant="outline"
            disabled
            className={cn("h-24 w-full justify-start p-4 text-left", {
                "opacity-50 cursor-not-allowed": isComingSoon,
            })}
        >
            <div>{cardContent}</div>
        </Button>
      )
  }

  return (
    <Button
      asChild
      variant="outline"
      className="h-24 w-full justify-start p-4 text-left transition-transform hover:scale-105 hover:bg-accent/50"
    >
      <Link href={`${func.href}?centerId=${centerId || ''}`}>
        {cardContent}
      </Link>
    </Button>
  )
};

export default function FunctionalityPage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role || 'Alumno');
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const visibleFunctionalities = functionalities.filter(func => 
    !func.roles || (currentUserRole && func.roles.includes(currentUserRole as any))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleFunctionalities.map((func) => (
          <FunctionalityCard key={func.href} func={func} centerId={centerId}/>
        ))}
      </div>
    </div>
  );
}
