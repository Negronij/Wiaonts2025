"use client";


"use client";

import { useEffect, useState } from 'react';
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { LibraryItem } from '@/app/(app)/library/page';
import { useToast } from '@/hooks/use-toast';

const libraryItemSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  stock: z.coerce.number().min(0, { message: 'El stock no puede ser negativo.' }).int(),
});

interface EditLibraryItemDialogProps {
  item: LibraryItem;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditLibraryItemDialog({ item, onUpdateItem, onOpenChange }: EditLibraryItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof libraryItemSchema>>({
    resolver: zodResolver(libraryItemSchema),
    defaultValues: item,
  });

  useEffect(() => {
    form.reset(item);
  }, [item, form]);

  const handleSubmit = async (values: z.infer<typeof libraryItemSchema>) => {
    setIsSubmitting(true);
    try {
        await onUpdateItem({ ...item, ...values });
    } catch (error) {
        toast({ title: "Error", description: "No se pudo actualizar el artículo.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Artículo</DialogTitle>
          <DialogDescription>
            Modifica los detalles del artículo.
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
                    <Input {...field} />
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
                      <Input type="number" step="0.01" {...field} />
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
                    <FormLabel>Stock Actual</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
