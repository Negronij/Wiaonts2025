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
import { CalendarIcon, PlusCircle, Loader2 } from 'lucide-react';
import { format } from "date-fns"
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const proposalSchema = z.object({
  title: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  tentativeDate: z.date({ required_error: "Por favor, selecciona una fecha aproximada." }),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface CreateProposalDialogProps {
    centerId: string;
}

export function CreateProposalDialog({ centerId }: CreateProposalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProposalFormData>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            title: '',
            description: '',
        }
    });

    const handleSubmit = async (values: ProposalFormData) => {
        setIsLoading(true);
        // Firebase logic to create proposal will go here
        console.log({ centerId, values });
        await new Promise(res => setTimeout(res, 1000));
        toast({ title: 'Propuesta Enviada', description: 'Tu evento propuesto ahora está visible para que la comunidad vote.' });
        setIsLoading(false);
        setIsOpen(false);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Proponer Evento
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Proponer un Nuevo Evento</DialogTitle>
                    <DialogDescription>
                        Comparte tu idea con la comunidad para que puedan votar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input placeholder="Ej: Torneo de fútbol intercursos" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Breve Descripción</FormLabel><FormControl><Textarea placeholder="Describe la idea principal del evento..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tentativeDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Tentativa</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? (format(field.value, "PPP")) : (<span>Seleccionar fecha</span>)}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                         )} />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar Propuesta</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
