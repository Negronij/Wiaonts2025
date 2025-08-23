"use client";


"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Zap, Send, LogOut, User, Plus, Bell } from "lucide-react";
import { AnimalLogo } from "@/components/icons/animal-logo";
import { WionLogo } from "@/components/landing/wion-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { CreatePost } from "./create-post";

type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  studentCenterIds?: string[];
};

type CenterInfo = {
  id: string;
  centerName: string;
  animal: any;
  color: string;
  roles: {
    owner: string;
    adminPlus: string[];
    admin: string[];
    student: string[];
  };
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (centerId && user) {
        setLoading(true);
        const centerDocRef = doc(db, "student_centers", centerId);
        const centerDoc = await getDoc(centerDocRef);
        if (centerDoc.exists()) {
          const centerData = { id: centerDoc.id, ...centerDoc.data() } as CenterInfo;
          setCenterInfo(centerData);

          // Determine user role for this center
          if (centerData.roles.owner === user.uid) {
            setCurrentUserRole('Propietario');
          } else if (centerData.roles.adminPlus?.includes(user.uid)) {
            setCurrentUserRole('Admin Plus');
          } else if (centerData.roles.admin?.includes(user.uid)) {
            setCurrentUserRole('Admin');
          } else {
            setCurrentUserRole('Alumno');
          }

        } else {
          setCenterInfo(null);
          setCurrentUserRole(null);
        }
        setLoading(false);
      }
    };
    fetchCenterInfo();
  }, [centerId, user]);
  
  const currentUserForPost = user && currentUserRole ? {
    id: user.uid,
    name: `${user.firstName} ${user.lastName}`,
    avatarUrl: user.avatarUrl || '',
    role: currentUserRole,
    studentCenterId: centerId || undefined
  } : null;

  const canCreatePost = currentUserForPost?.role === 'Propietario' || currentUserForPost?.role === 'Admin' || currentUserForPost?.role === 'Admin Plus';

  const navLinkWithCenterId = (path: string) => {
    return centerId ? `${path}?centerId=${centerId}` : path;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Dynamic Header */}
      <header
        className="flex items-center p-3 text-white shadow-md"
        style={{ backgroundColor: centerInfo?.color || '#333' }}
      >
        {centerInfo && <AnimalLogo animal={centerInfo.animal} className="w-7 h-7" />}
        <h1 className="text-lg font-bold ml-3">{centerInfo?.centerName || 'Cargando...'}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
        {/* Floating Action Button */}
        {pathname.endsWith('/home') && currentUserForPost && canCreatePost && (
            <CreatePost
              currentUser={currentUserForPost}
              triggerButton={
                <Button
                  size="icon"
                  className="rounded-full w-14 h-14 absolute bottom-24 right-6 shadow-lg"
                  style={{ backgroundColor: centerInfo?.color || '#333' }}
                >
                  <Plus className="w-8 h-8" />
                </Button>
              }
            />
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="flex items-center justify-between p-2 bg-card border-t">
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.avatarUrl} data-ai-hint="user avatar" />
            <AvatarFallback>
              {user ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}` : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground hidden sm:inline">{user ? `${user.firstName}` : 'Usuario'}</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link href={navLinkWithCenterId('/home')} className={pathname.includes('/home') ? 'text-primary' : 'text-muted-foreground'}>
            <Home className="w-6 h-6" />
          </Link>
          <Link href={navLinkWithCenterId('/functionality')} className={pathname.includes('/functionality') ? 'text-primary' : 'text-muted-foreground'}>
            <Zap className="w-6 h-6" />
          </Link>
          <Link href={navLinkWithCenterId('/notifications')} className={pathname.includes('/notifications') ? 'text-primary' : 'text-muted-foreground'}>
            <Bell className="w-6 h-6" />
          </Link>
          <Link href={navLinkWithCenterId('/invite')} className={pathname.includes('/invite') ? 'text-primary' : 'text-muted-foreground'}>
            <Send className="w-6 h-6" />
          </Link>
           <Link href="/welcome" className="text-muted-foreground">
            <LogOut className="w-6 h-6" />
          </Link>
        </nav>

        <div className="flex items-center gap-2">
            <WionLogo className="w-5 h-5"/>
            <span className="text-sm font-semibold hidden sm:inline">Negroni Studios</span>
        </div>
      </footer>
    </div>
  );
}
