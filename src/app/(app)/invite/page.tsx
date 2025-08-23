"use client";


"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserProfile = {
  role?: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
  studentCenterIds?: string[];
};

type InvitationCodes = {
  student: string;
  admin: string;
};

export default function InvitePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [codes, setCodes] = useState<InvitationCodes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && centerId) {
        // Fetch user profile to determine role within the current center
        const centerDocRef = doc(db, "student_centers", centerId);
        const centerDoc = await getDoc(centerDocRef);
        if (centerDoc.exists()) {
            const centerData = centerDoc.data();
            const roles = centerData.roles || {};
            let role: UserProfile['role'] = 'Alumno';
            if (roles.owner === firebaseUser.uid) role = 'Propietario';
            else if (roles.adminPlus?.includes(firebaseUser.uid)) role = 'Admin Plus';
            else if (roles.admin?.includes(firebaseUser.uid)) role = 'Admin';
            setUserProfile({ role });
        }


        // Fetch invitation codes
        const codesRef = collection(db, 'student_centers', centerId, 'invitation_codes');
        const codesSnapshot = await getDocs(codesRef);
        const fetchedCodes: Partial<InvitationCodes> = {};
        codesSnapshot.forEach(doc => {
            if (doc.id === 'student' || doc.id === 'admin') {
                fetchedCodes[doc.id] = doc.data().code;
            }
        });
        setCodes(fetchedCodes as InvitationCodes);

      } else {
        setUserProfile(null);
        setCodes(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [centerId]);

  const handleCopy = (code: string | undefined) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({
      title: "¡Copiado!",
      description: "El código de invitación se ha copiado al portapapeles.",
    });
  };

  const canViewAdminCode = userProfile?.role === 'Propietario' || userProfile?.role === 'Admin Plus';

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando códigos...</p>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
         <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-bold font-headline">Acceso Denegado</h1>
            <p className="text-muted-foreground mt-2">
                Debes iniciar sesión para ver esta página.
            </p>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Invitar como Alumnos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" size="lg" className="w-full" onClick={() => handleCopy(codes?.student)}>
                        <Copy className="mr-2 h-4 w-4"/>
                        Copiar Código de Alumno
                    </Button>
                </CardContent>
            </Card>

            {canViewAdminCode && (
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>Invitar como Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="lg" className="w-full" onClick={() => handleCopy(codes?.admin)}>
                            <Copy className="mr-2 h-4 w-4"/>
                            Copiar Código de Admin
                        </Button>
                    </CardContent>
                </Card>
            )}
       </div>

       {!canViewAdminCode && (
           <p className="text-center text-muted-foreground">
               Solo los Propietarios y Administradores Plus pueden ver el código de invitación para administradores.
           </p>
       )}
    </div>
  );
}
