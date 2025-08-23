"use client";


"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import type { Forum } from '@/app/(app)/forum/page';

const forumSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  description: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres.' }),
  type: z.enum(['general', 'admins', 'custom'], { required_error: 'Debes seleccionar un tipo de foro.' }),
  memberIds: z.array(z.string()).optional(),
});

export type ForumData = z.infer<typeof forumSchema>;
type Member = { 
    uid: string; 
    name: string; 
    course: string;
    role: 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
};

interface CreateForumDialogProps {
  onCreateForum: (data: ForumData) => void;
  allMembers: Member[];
  existingForums: Forum[];
}

export function CreateForumDialog({ onCreateForum, allMembers, existingForums }: CreateForumDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasGeneralForum = existingForums.some(f => f.type === 'general');
  const hasAdminsForum = existingForums.some(f => f.type === 'admins');

  const form = useForm<ForumData>({
    resolver: zodResolver(forumSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'custom',
      memberIds: [],
    },
  });

  const forumType = form.watch('type');

  const handleSubmit = (values: ForumData) => {
    // Override title and description for default forums
    if (values.type === 'general') {
        values.title = "Chat General";
        values.description = "Un espacio para que todos los miembros del centro hablen.";
    } else if (values.type === 'admins') {
        values.title = "Chat de Admins";
        values.description = "Comunicación interna solo para el equipo administrativo.";
    }
    onCreateForum(values);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Foro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Foro</DialogTitle>
          <DialogDescription>
            Configura una nueva sala de chat para la comunidad.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Foro</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== 'custom') {
                              form.setValue('memberIds', []);
                          }
                      }}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-2 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="general" disabled={hasGeneralForum}/></FormControl>
                        <FormLabel className="font-normal">General {hasGeneralForum && <span className="text-xs text-muted-foreground">(Ya existe)</span>}</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="admins" disabled={hasAdminsForum} /></FormControl>
                        <FormLabel className="font-normal">Grupo Administrativo {hasAdminsForum && <span className="text-xs text-muted-foreground">(Ya existe)</span>}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="custom" /></FormControl>
                        <FormLabel className="font-normal">Foro Personalizado</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {forumType === 'custom' && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Foro</FormLabel>
                      <FormControl><Input placeholder="Ej: Ideas para el evento de fin de año" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción Corta</FormLabel>
                      <FormControl><Textarea placeholder="Describe el propósito de este foro..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                          <FormLabel>Invitar Miembros</FormLabel>
                          <p className="text-sm text-muted-foreground">Selecciona los miembros que podrán acceder a este foro privado.</p>
                      </div>
                      <ScrollArea className="h-48 w-full rounded-md border p-4">
                        {allMembers.length > 0 ? allMembers.map((member) => (
                          <FormField
                            key={member.uid}
                            control={form.control}
                            name="memberIds"
                            render={({ field }) => (
                              <FormItem key={member.uid} className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                                <FormControl>
                                  <Checkbox
                                      checked={field.value?.includes(member.uid)}
                                      onCheckedChange={(checked) => {
                                      return checked
                                          ? field.onChange([...(field.value || []), member.uid])
                                          : field.onChange(
                                              field.value?.filter(
                                              (value) => value !== member.uid
                                              )
                                          )
                                      }}
                                  />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">
                                      {member.name} <span className="text-xs text-muted-foreground">({member.role})</span>
                                  </FormLabel>
                              </FormItem>
                            )}
                          />
                        )) : (
                            <p className="text-sm text-muted-foreground text-center">No hay otros miembros en el centro para invitar.</p>
                        )}
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Foro</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
