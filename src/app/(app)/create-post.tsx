
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
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type PostData = {
  postTitle: string;
  postContent: string;
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
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PostData>();
  const { toast } = useToast();

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
      const postsCollectionRef = collection(db, "student_centers", currentUser.studentCenterId, "posts");
      await addDoc(postsCollectionRef, {
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Publicación Creada",
        description: "Tu publicación ha sido creada con éxito.",
      });
      reset();
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
        }
    }}>
      <DialogTrigger asChild>
        {Trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nueva Publicación</DialogTitle>
          <DialogDescription>
            Escribe los detalles de tu publicación.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <form id="create-post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="postTitle">Título</Label>
              <Input id="postTitle" {...register("postTitle")} placeholder="Título de la publicación" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postContent">Contenido</Label>
              <Textarea
                id="postContent"
                {...register("postContent")}
                placeholder="Escribe tu publicación aquí..."
                className="resize-none min-h-[200px]"
              />
            </div>
          </form>
        </ScrollArea>
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
