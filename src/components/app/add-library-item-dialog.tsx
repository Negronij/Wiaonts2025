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
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const libraryItemSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  stock: z.coerce.number().min(0, { message: 'El stock no puede ser negativo.' }).int(),
});

export type LibraryItemData = z.infer<typeof libraryItemSchema>;

interface AddLibraryItemDialogProps {
  onAddItem: (item: LibraryItemData) => Promise<void>;
}

export function AddLibraryItemDialog({ onAddItem }: AddLibraryItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<LibraryItemData>({
    resolver: zodResolver(libraryItemSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
    },
  });

  const handleSubmit = async (values: LibraryItemData) => {
    setIsSubmitting(true);
    try {
        await onAddItem(values);
        form.reset();
        setIsOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "No se pudo añadir el artículo.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Artículo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Artículo</DialogTitle>
          <DialogDescription>
            Completa los detalles del artículo para ponerlo en venta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Artículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cuaderno A4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="Ej: 1500" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock Inicial</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 50" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <span className="animate-spin mr-2">...</span>}
                Añadir Artículo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
