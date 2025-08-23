"use client";


"use client";

import { useState, useMemo } from 'react';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type PollOption = {
    text: string;
    votes: number;
};

export type Poll = {
    id: string;
    question: string;
    options: PollOption[];
    createdBy: { id: string; name: string };
    createdAt: { seconds: number, nanoseconds: number };
    voters: string[];
};

interface PollCardProps {
    pollData: Poll;
    currentUser: { id: string, role: "Propietario" | "Admin" | "Admin Plus" | "Alumno" };
    centerId: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF6666"];

export function PollCard({ pollData, currentUser, centerId }: PollCardProps) {
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const { toast } = useToast();

    const hasVoted = useMemo(() => pollData.voters?.includes(currentUser.id), [pollData.voters, currentUser.id]);
    const totalVotes = useMemo(() => pollData.options.reduce((acc, option) => acc + option.votes, 0), [pollData.options]);
    const canManage = currentUser.role === 'Propietario' || currentUser.role === 'Admin' || currentUser.role === 'Admin Plus';

    const handleVote = async () => {
        if (selectedOptionIndex === null || hasVoted) return;

        const pollRef = doc(db, 'student_centers', centerId, 'polls', pollData.id);
        
        // Create a new array for the options with the updated vote count
        const newOptions = pollData.options.map((option, index) => {
            if (index === selectedOptionIndex) {
                return { ...option, votes: option.votes + 1 };
            }
            return option;
        });

        try {
            await updateDoc(pollRef, {
                options: newOptions,
                voters: arrayUnion(currentUser.id)
            });
            toast({ title: "¡Voto registrado!", description: "Gracias por participar." });
        } catch (error) {
            console.error("Error voting: ", error);
            toast({ title: "Error", description: "No se pudo registrar tu voto.", variant: "destructive" });
        }
    };
    
    const handleDelete = async () => {
        if (!canManage) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar esta encuesta? Esta acción es irreversible.")) {
            try {
                 const pollRef = doc(db, 'student_centers', centerId, 'polls', pollData.id);
                 await deleteDoc(pollRef);
                 toast({title: "Encuesta eliminada", description: "La encuesta se ha eliminado correctamente."});
            } catch (error) {
                console.error("Error deleting poll: ", error);
                toast({ title: "Error", description: "No se pudo eliminar la encuesta.", variant: "destructive" });
            }
        }
    }

    const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | null) => {
        if (!timestamp) return 'Justo ahora';
        return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
    }

    const chartData = pollData.options.map(option => ({ name: option.text, value: option.votes }));
    
    const showResults = hasVoted || ! (currentUser.role === 'Alumno');

    return (
        <Card className="relative">
             {canManage && (
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleDelete}>
                     <Trash2 className="h-4 w-4 text-destructive" />
                 </Button>
             )}
            <CardHeader>
                <CardTitle>{pollData.question}</CardTitle>
                <CardDescription>
                    Creada por {pollData.createdBy.name} - {formatDate(pollData.createdAt)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                        {!showResults ? (
                            <RadioGroup onValueChange={(value) => setSelectedOptionIndex(Number(value))}>
                                {pollData.options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <RadioGroupItem value={index.toString()} id={`${pollData.id}-${index}`} />
                                        <Label htmlFor={`${pollData.id}-${index}`}>{option.text}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <div className="space-y-2">
                                {pollData.options.map((option, index) => {
                                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                    return (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="font-medium flex-1">{option.text}</span>
                                            <span className="text-muted-foreground">{percentage.toFixed(0)}% ({option.votes})</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                     {showResults && totalVotes > 0 && (
                        <div className="w-full h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                            return (
                                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                     {showResults && totalVotes === 0 && (
                        <div className="flex items-center justify-center text-muted-foreground h-48">
                            <p>Aún no hay votos.</p>
                        </div>
                     )}
                </div>
            </CardContent>
             {currentUser.role === 'Alumno' && (
                <CardFooter>
                    <Button onClick={handleVote} disabled={selectedOptionIndex === null || hasVoted} className="w-full">
                        {hasVoted ? 'Ya has votado' : 'Votar'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
