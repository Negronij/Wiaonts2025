
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Minus, Plus, Save, History, Loader2, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { updateCoursePoints } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type CoursePoints = {
  [courseName: string]: number;
};

type Modification = {
  id: string;
  reason: string;
  modifiedBy: string;
  timestamp: { seconds: number; nanoseconds: number };
};

type UserProfile = {
  id: string;
  role: 'Propietario' | 'Admin' | 'Alumno';
};

export default function CourseCompetitionPage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const { toast } = useToast();

  const [courses, setCourses] = useState<CoursePoints>({});
  const [initialCourses, setInitialCourses] = useState<CoursePoints>({});
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modificationReason, setModificationReason] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user && centerId) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({ id: user.uid, role: userData.role || "Alumno" });

          // Listener for competition data
          const competitionDocRef = doc(db, 'student_centers', centerId, 'competition', 'course_points');
          const unsubscribeCompetition = onSnapshot(competitionDocRef, (competitionDoc) => {
            if (competitionDoc.exists()) {
              const data = competitionDoc.data();
              setCourses(data.courses || {});
              setInitialCourses(data.courses || {});
            } else {
              // If document doesn't exist, initialize from center courses
              const centerDocRef = doc(db, 'student_centers', centerId);
              getDoc(centerDocRef).then(centerDoc => {
                if (centerDoc.exists()) {
                    const centerData = centerDoc.data();
                    const initialPoints = (centerData.courses || []).reduce((acc: CoursePoints, courseName: string) => {
                        acc[courseName] = 0;
                        return acc;
                    }, {});
                    setCourses(initialPoints);
                    setInitialCourses(initialPoints);
                }
              });
            }
            setIsLoading(false);
          });

          // Listener for history
          const historyCollectionRef = collection(db, 'student_centers', centerId, 'competition', 'course_points', 'history');
          const historyQuery = query(historyCollectionRef, orderBy('timestamp', 'desc'));
          const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
            setModifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Modification)));
          });

          return () => {
            unsubscribeCompetition();
            unsubscribeHistory();
          };
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [centerId]);

  const handlePointChange = (courseName: string, delta: number) => {
    setCourses(prevCourses => ({
      ...prevCourses,
      [courseName]: Math.max(0, (prevCourses[courseName] || 0) + delta)
    }));
  };

  const handleSaveChanges = async () => {
    if (!centerId || !currentUser) return;
    if (!modificationReason.trim()) {
        toast({ title: "Razón requerida", description: "Debes explicar el motivo del cambio de puntos.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const result = await updateCoursePoints({
      centerId,
      updatedCourses: courses,
      reason: modificationReason,
      userId: currentUser.id
    });
    
    setIsSaving(false);
    setIsAlertOpen(false);
    setModificationReason("");

    toast({
      title: result.success ? "Puntos Actualizados" : "Error al Guardar",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setInitialCourses(courses);
    }
  };

  const hasChanges = useMemo(() => {
    return JSON.stringify(courses) !== JSON.stringify(initialCourses);
  }, [courses, initialCourses]);

  const sortedCourses = useMemo(() => {
    return Object.entries(courses).sort(([, pointsA], [, pointsB]) => pointsB - pointsA);
  }, [courses]);

  const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Propietario';

  const getTrophyColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-yellow-700";
    return "text-muted-foreground";
  };
  
  const formatDate = useCallback((timestamp: { seconds: number; nanoseconds: number; } | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
  }, []);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 animate-spin text-primary"/>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            Competencia de Cursos
          </h1>
          <p className="text-muted-foreground">Tabla de posiciones y puntos de los cursos.</p>
        </div>
        {isManager && hasChanges && (
          <Button onClick={() => setIsAlertOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tabla de Posiciones</CardTitle>
            <CardDescription>
              {isManager 
                  ? "Suma o resta puntos para actualizar la tabla."
                  : "Estos son los puntajes actuales de la competencia."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedCourses.length > 0 ? (
              <div className="space-y-4">
                {sortedCourses.map(([name, points], index) => (
                  <div key={name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3 w-16">
                      <Trophy className={`w-6 h-6 ${getTrophyColor(index)}`} />
                      <span className="font-bold text-lg">{index + 1}°</span>
                    </div>
                    <p className="font-semibold flex-1 text-lg">{name}</p>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-xl w-16 text-center">{points}</span>
                      {isManager && (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" onClick={() => handlePointChange(name, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => handlePointChange(name, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-xl font-semibold">No hay cursos configurados</h3>
                <p className="text-muted-foreground mt-2">
                  No se han encontrado cursos en este centro de estudiantes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/>Historial de Cambios</CardTitle>
                 <CardDescription>Últimas modificaciones de puntajes.</CardDescription>
            </CardHeader>
            <CardContent>
                {modifications.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {modifications.map(mod => (
                            <div key={mod.id} className="text-sm border-l-2 pl-3">
                                <p className="font-semibold">{mod.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                    Por {mod.modifiedBy} - {formatDate(mod.timestamp)}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <ListChecks className="mx-auto h-8 w-8 mb-2"/>
                        <p>No hay modificaciones todavía.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Guardado de Puntos</AlertDialogTitle>
                    <AlertDialogDescription>
                        Para mantener la transparencia, por favor, describe brevemente el motivo de esta actualización de puntos. (Ej: "Ganadores de la jornada solidaria").
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Input 
                        placeholder="Razón de la modificación..."
                        value={modificationReason}
                        onChange={(e) => setModificationReason(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSaveChanges} disabled={!modificationReason.trim() || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Guardar y Notificar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
