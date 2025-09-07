
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const newsTeamSchema = z.object({
  lead: z.string({ required_error: "Debe seleccionar un encargado." }),
  topicSelection1: z.string({ required_error: "Seleccione un miembro." }),
  topicSelection2: z.string({ required_error: "Seleccione un miembro." }),
  verification1: z.string({ required_error: "Seleccione un miembro." }),
  verification2: z.string({ required_error: "Seleccione un miembro." }),
  writing1: z.string({ required_error: "Seleccione un miembro." }),
  writing2: z.string({ required_error: "Seleccione un miembro." }),
  editing1: z.string({ required_error: "Seleccione un miembro." }),
  editing2: z.string({ required_error: "Seleccione un miembro." }),
  ethics1: z.string({ required_error: "Seleccione un miembro." }),
  ethics2: z.string({ required_error: "Seleccione un miembro." }),
}).refine(data => {
    const values = Object.values(data);
    return new Set(values).size === values.length;
}, {
    message: "Cada miembro solo puede ser asignado a un rol.",
    path: ["lead"], // Show error message on the first field
});

export type NewsTeam = z.infer<typeof newsTeamSchema>;
type Member = { uid: string; name: string; };

interface NewsTeamManagementProps {
    centerId: string;
    allMembers: Member[];
    currentTeam: NewsTeam | null;
}

const steps = [
    { id: 'topicSelection', label: 'Selección de Tema', fields: ['topicSelection1', 'topicSelection2'] },
    { id: 'verification', label: 'Verificación', fields: ['verification1', 'verification2'] },
    { id: 'writing', label: 'Redacción', fields: ['writing1', 'writing2'] },
    { id: 'editing', label: 'Edición', fields: ['editing1', 'editing2'] },
    { id: 'ethics', label: 'Revisión Ética/Contexto', fields: ['ethics1', 'ethics2'] },
] as const;


export function NewsTeamManagement({ centerId, allMembers, currentTeam }: NewsTeamManagementProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<NewsTeam>({
        resolver: zodResolver(newsTeamSchema),
        defaultValues: currentTeam || {},
    });

    useEffect(() => {
        form.reset(currentTeam || {});
    }, [currentTeam, form]);

    const watchedValues = form.watch();

    const onSubmit = async (values: NewsTeam) => {
        setIsLoading(true);
        try {
            const configRef = doc(db, 'student_centers', centerId, 'news', 'config');
            await setDoc(configRef, values);
            toast({
                title: "Equipo del Noticiero Guardado",
                description: "La configuración del equipo ha sido actualizada.",
            });
        } catch (error) {
            console.error("Error saving news team:", error);
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración del equipo.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5"/>Configuración del Equipo del Noticiero</CardTitle>
                <CardDescription>
                    Designa al encargado y a los 10 miembros del equipo que participarán en el proceso de creación de noticias. Cada persona solo puede ocupar un puesto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* News Lead Selector */}
                        <FormField
                            control={form.control}
                            name="lead"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-lg">Encargado del Noticiero</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar encargado..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {allMembers.map(member => (
                                                <SelectItem key={member.uid} value={member.uid} disabled={Object.values(watchedValues).includes(member.uid) && watchedValues.lead !== member.uid}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Team Members Selectors */}
                        <div className="space-y-4">
                             {steps.map(step => (
                                <div key={step.id}>
                                    <h4 className="font-semibold mb-2">{step.label}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {step.fields.map((fieldName) => (
                                            <FormField
                                                key={fieldName}
                                                control={form.control}
                                                name={fieldName as keyof NewsTeam}
                                                render={({ field }) => (
                                                    <FormItem>
                                                         <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Seleccionar miembro..." /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {allMembers.map(member => (
                                                                    <SelectItem key={member.uid} value={member.uid} disabled={Object.values(watchedValues).includes(member.uid) && field.value !== member.uid}>
                                                                        {member.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                             ))}
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Equipo
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
