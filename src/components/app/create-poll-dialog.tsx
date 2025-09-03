
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CreatePollDialogProps {
    centerId: string;
    createdBy: { id: string; name: string };
}

export function CreatePollDialog({ centerId, createdBy }: CreatePollDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsLoading(true);

        try {
            const pollsCollectionRef = collection(db, 'student_centers', centerId, 'polls');
            await addDoc(pollsCollectionRef, {
                question,
                options: options.map(opt => ({ text: opt.trim(), votes: 0 })),
                createdBy,
                createdAt: serverTimestamp(),
                voters: [], // Initialize list of voters
            });

            toast({
                title: 'Encuesta Creada',
                description: 'La encuesta está lista para recibir votos.',
            });
            
            // Reset form and close dialog
            setQuestion('');
            setOptions(['', '']);
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating poll: ", error);
            toast({
                title: 'Error',
                description: 'No se pudo crear la encuesta. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isFormValid = question.trim() !== '' && options.every(opt => opt.trim() !== '') && options.length >= 2;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Encuesta
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nueva Encuesta</DialogTitle>
                    <DialogDescription>
                        Plantea una pregunta y define las opciones para que los miembros voten.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="question">Pregunta de la Encuesta</Label>
                        <Input 
                            id="question" 
                            placeholder="Ej: ¿Qué actividad prefieren?" 
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Opciones de Respuesta</Label>
                        {options.map((option, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <Input 
                                    placeholder={`Opción ${index + 1}`} 
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRemoveOption(index)}
                                    disabled={options.length <= 2}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Opción
                    </Button>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={!isFormValid || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Encuesta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
