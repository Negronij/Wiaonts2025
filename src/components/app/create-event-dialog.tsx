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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from "date-fns"
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Switch } from '../ui/switch';

const eventSchema = z.object({
  title: z.string().min(3, { message: 'El título es requerido.' }),
  prize: z.string().min(3, { message: 'La descripción del premio es requerida.' }),
  registrationOpen: z.date({ required_error: "Fecha de apertura requerida." }),
  registrationClose: z.date({ required_error: "Fecha de cierre requerida." }),
  drawDate: z.date().optional(),
  startDate: z.date({ required_error: "Fecha de inicio requerida." }),
  endDate: z.date({ required_error: "Fecha de finalización requerida." }),
  eventType: z.enum(['recreativo', 'clasificatorio']),
  costValue: z.coerce.number().min(0).optional(),
  costCurrency: z.string().optional(),
  modality: z.enum(['cursos', 'general', 'equipos', 'individual']),
  teamOptions: z.object({
      minMembers: z.coerce.number().min(1).optional(),
      maxMembers: z.coerce.number().min(1).optional(),
      teamType: z.enum(['mismo_curso', 'mixto']).optional(),
  }).optional(),
  competitionFormat: z.object({
      type: z.enum(['tabla', 'grupos', 'eliminatoria']),
      idaYVuelta: z.boolean().optional(),
  }).optional(),
}).refine(data => !data.costValue || (data.costValue > 0 && data.costCurrency && data.costCurrency.trim() !== ''), {
    message: "Si hay un costo, la moneda es requerida.",
    path: ["costCurrency"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
    centerId: string;
}

export function CreateEventDialog({ centerId }: CreateEventDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            prize: '',
            eventType: 'recreativo',
            modality: 'individual',
            teamOptions: { minMembers: 2, maxMembers: 5, teamType: 'mismo_curso' },
            competitionFormat: { type: 'tabla', idaYVuelta: false },
            costValue: 0,
            costCurrency: '',
        },
    });

    const eventType = form.watch('eventType');
    const modality = form.watch('modality');
    const competitionType = form.watch('competitionFormat.type');

    const handleSubmit = async (values: EventFormData) => {
        setIsLoading(true);
        try {
            const eventsCollectionRef = collection(db, 'student_centers', centerId, 'events');
            await addDoc(eventsCollectionRef, {
                ...values,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Evento Creado', description: 'El evento ha sido creado con éxito.' });
            setIsLoading(false);
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error creating event:", error);
            toast({ title: 'Error', description: 'No se pudo crear el evento.', variant: 'destructive' });
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Evento Oficial
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription>
                        Completa todos los detalles para configurar un evento oficial.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <ScrollArea className="max-h-[70vh] p-4 -m-4">
                        <div className="space-y-4 p-1">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="prize" render={({ field }) => (
                                <FormItem><FormLabel>Premio</FormLabel><FormControl><Input placeholder="Ej: Trofeo de oro" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="costValue" render={({ field }) => (
                                    <FormItem><FormLabel>Costo (Valor)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="costCurrency" render={({ field }) => (
                                    <FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="Ej: Pesos" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <h4 className="font-semibold pt-2">Calendario</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="registrationOpen" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Apertura Inscripciones</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="registrationClose" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Cierre Inscripciones</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Inicio del Evento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Fin del Evento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="drawDate" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Fecha de Sorteo (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                )} />
                            </div>

                             <h4 className="font-semibold pt-2">Tipo y Modalidad</h4>
                            <FormField control={form.control} name="eventType" render={({ field }) => (
                                <FormItem><FormLabel>Tipo de Evento</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="recreativo" /></FormControl><FormLabel className="font-normal">Recreativo</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="clasificatorio" /></FormControl><FormLabel className="font-normal">Clasificatorio</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="modality" render={({ field }) => (
                                <FormItem><FormLabel>Modalidad</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="individual" /></FormControl><FormLabel className="font-normal">Individual</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="equipos" /></FormControl><FormLabel className="font-normal">Equipos</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cursos" /></FormControl><FormLabel className="font-normal">Por Cursos</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="general" /></FormControl><FormLabel className="font-normal">Tabla General</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                            )} />

                            {modality === 'equipos' && (
                                <div className="pl-4 space-y-4 border-l-2 ml-2">
                                    <FormField control={form.control} name="teamOptions.teamType" render={({ field }) => (
                                    <FormItem><FormLabel>Tipo de Equipo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="mismo_curso" /></FormControl><FormLabel className="font-normal">Solo del mismo curso</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="mixto" /></FormControl><FormLabel className="font-normal">Mixto</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="teamOptions.minMembers" render={({ field }) => (
                                            <FormItem><FormLabel>Min. Integrantes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                         <FormField control={form.control} name="teamOptions.maxMembers" render={({ field }) => (
                                            <FormItem><FormLabel>Max. Integrantes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {['cursos', 'general', 'equipos'].includes(modality) && (
                                <div className="pl-4 space-y-4 border-l-2 ml-2">
                                     <FormField control={form.control} name="competitionFormat.type" render={({ field }) => (
                                        <FormItem><FormLabel>Formato</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="tabla" /></FormControl><FormLabel className="font-normal">Tabla</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="grupos" /></FormControl><FormLabel className="font-normal">Grupos</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="eliminatoria" /></FormControl><FormLabel className="font-normal">Eliminatoria</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )} />
                                     {competitionType !== 'eliminatoria' && (
                                        <FormField control={form.control} name="competitionFormat.idaYVuelta" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Ida y Vuelta</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                        )} />
                                     )}
                                </div>
                            )}

                        </div>
                        </ScrollArea>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Evento</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
