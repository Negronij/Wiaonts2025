"use client";


"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Wand2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { optimizePost } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type PostData = {
  postTitle: string;
  postContent: string;
};

type OptimizationResult = {
  optimizedTitle: string;
  optimizedContent: string;
};

interface CreatePostProps {
  currentUser: { 
    id: string; 
    name: string; 
    avatarUrl: string; 
    role: string;
    studentCenterId?: string;
  };
  triggerButton?: React.ReactNode;
}

export function CreatePost({ currentUser, triggerButton }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<PostData>();
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  const postTitle = watch("postTitle");
  const postContent = watch("postContent");

  const handleOptimize = async () => {
    if (!postTitle || !postContent) {
      toast({
        title: "Contenido requerido",
        description: "Por favor, escribe un título y contenido para optimizar.",
        variant: "destructive",
      });
      return;
    }
    setIsOptimizing(true);
    setOptimizationResult(null);
    const result = await optimizePost({ postTitle, postContent });
    setIsOptimizing(false);
    if (result.success && result.data) {
      setOptimizationResult(result.data);
      toast({
        title: "¡Optimización Completa!",
        description: "Revisa las sugerencias de la IA.",
      });
    } else {
      toast({
        title: "Error de Optimización",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const applyOptimization = () => {
    if (optimizationResult) {
      setValue("postTitle", optimizationResult.optimizedTitle);
      setValue("postContent", optimizationResult.optimizedContent);
      setOptimizationResult(null);
      toast({
        title: "Sugerencias aplicadas",
        description: "El contenido de tu publicación ha sido actualizado.",
      });
    }
  };

  const onSubmit = async (data: PostData) => {
    if (!currentUser.studentCenterId) {
       toast({
            title: "Error de Publicación",
            description: "No estás asociado a ningún centro de estudiantes.",
            variant: "destructive"
        });
        return;
    }
    
    try {
      await addDoc(collection(db, "posts"), {
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        studentCenterId: currentUser.studentCenterId,
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Publicación Creada",
        description: "Tu publicación ha sido creada con éxito.",
      });
      reset();
      setOptimizationResult(null);
      setIsOpen(false);
    } catch (error) {
        console.error("Error creating post: ", error);
        toast({
            title: "Error al publicar",
            description: "No se pudo crear la publicación. Inténtalo de nuevo.",
            variant: "destructive"
        });
    }
  };

  const Trigger = triggerButton ? (
    <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
    ) : (
    <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2"/>
        Crear Publicación
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            reset();
            setOptimizationResult(null);
        }
    }}>
      <DialogTrigger asChild>
        {Trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nueva Publicación</DialogTitle>
          <DialogDescription>
            Escribe los detalles de tu publicación. Puedes usar la IA para optimizar el contenido.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-hidden">
            <form id="create-post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="postTitle">Título</Label>
                <Input id="postTitle" {...register("postTitle")} placeholder="Título de la publicación" />
              </div>
              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="postContent">Contenido</Label>
                <Textarea
                  id="postContent"
                  {...register("postContent")}
                  placeholder="Escribe tu publicación aquí..."
                  className="flex-1 resize-none"
                />
              </div>
            </form>

            <div className="space-y-4 rounded-lg bg-muted/50 p-4 flex flex-col overflow-y-hidden">
                <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full flex-shrink-0">
                    {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isOptimizing ? 'Optimizando...' : 'Optimizar con IA'}
                </Button>
                <div className="flex-1 min-h-0">
                    {isOptimizing && (
                         <div className="flex items-center justify-center h-full">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    )}
                    {optimizationResult && (
                        <Alert className="h-full flex flex-col">
                          <Sparkles className="h-4 w-4" />
                          <AlertTitle>Sugerencias de la IA</AlertTitle>
                          <AlertDescription className="flex-1 flex flex-col overflow-y-hidden mt-2">
                            <ScrollArea className="flex-1 pr-4 -mr-4">
                                <div>
                                    <h4 className="font-semibold mt-2">Título Sugerido:</h4>
                                    <p className="text-sm">{optimizationResult.optimizedTitle}</p>
                                </div>
                                <Separator className="my-4"/>
                                <div>
                                    <h4 className="font-semibold">Contenido Sugerido:</h4>
                                    <p className="text-sm whitespace-pre-line">{optimizationResult.optimizedContent}</p>
                                </div>
                            </ScrollArea>
                            <div className="flex gap-2 pt-4 flex-shrink-0">
                                <Button size="sm" onClick={applyOptimization}>Aplicar</Button>
                                <Button size="sm" variant="outline" onClick={() => setOptimizationResult(null)}>Descartar</Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                    )}
                     {!isOptimizing && !optimizationResult && (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                            <p>Usa la IA para mejorar tus publicaciones y aumentar el alcance entre los estudiantes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4 mt-auto">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="create-post-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
