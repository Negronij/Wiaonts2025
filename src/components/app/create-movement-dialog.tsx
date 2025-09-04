
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const movementSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Debes seleccionar un tipo.' }),
  description: z.string().min(3, { message: 'La descripción debe tener al menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo.' }),
});

export type MovementFormData = z.infer<typeof movementSchema>;

interface CreateMovementDialogProps {
    centerId: string;
}

export function CreateMovementDialog({ centerId }: CreateMovementDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<MovementFormData>({
        resolver: zodResolver(movementSchema),
        defaultValues: {
            type: 'income',
            description: '',
        },
    });

    const handleSubmit = async (values: MovementFormData) => {
        setIsLoading(true);
        try {
            const movementsCollectionRef = collection(db, 'student_centers', centerId, 'movements');
            await addDoc(movementsCollectionRef, {
                ...values,
                createdAt: serverTimestamp()
            });
            toast({
                title: 'Movimiento Registrado',
                description: 'El nuevo movimiento se ha guardado correctamente.',
            });
            form.reset();
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating movement:", error);
            toast({
                title: "Error al registrar",
                description: "No se pudo guardar el movimiento. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Movimiento
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Movimiento</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo ingreso o gasto para el centro de estudiantes.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Tipo de Movimiento</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="income" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Ingreso</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="expense" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Gasto</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Venta de rifas" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ej: 5000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Añadir Movimiento
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
