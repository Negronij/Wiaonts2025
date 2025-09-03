"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, onSnapshot, doc, getDoc, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BarChart3, Loader2 } from "lucide-react";
import { CreateMovementDialog } from "@/components/app/create-movement-dialog";

type Movement = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  createdAt: { seconds: number; nanoseconds: number };
};

type CurrentUser = {
    id: string;
    role: "Propietario" | "Admin" | "Admin Plus" | "Alumno";
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

export default function FinancesPage() {
    const searchParams = useSearchParams();
    const centerId = searchParams.get('centerId');

    const [movements, setMovements] = useState<Movement[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user && centerId) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setCurrentUser({ id: user.uid, role: userDoc.data().role || 'Alumno' });
                }

                const movementsQuery = query(collection(db, 'student_centers', centerId, 'movements'), orderBy('createdAt', 'desc'));
                const unsubscribeMovements = onSnapshot(movementsQuery, (snapshot) => {
                    const movementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
                    setMovements(movementsData);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching movements: ", error);
                    setIsLoading(false);
                });
                
                return () => unsubscribeMovements();
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [centerId]);

    const incomeData = movements.filter(m => m.type === 'income');
    const expensesData = movements.filter(m => m.type === 'expense');

    const totalIncome = incomeData.reduce((acc, item) => acc + item.amount, 0);
    const totalExpenses = expensesData.reduce((acc, item) => acc + item.amount, 0);
    const balance = totalIncome - totalExpenses;

    const chartDataIncome = incomeData.map(item => ({ name: item.description, value: item.amount }));
    const chartDataExpenses = expensesData.map(item => ({ name: item.description, value: item.amount }));
    
    const canAddMovement = currentUser?.role === 'Admin' || currentUser?.role === 'Propietario' || currentUser?.role === 'Admin Plus';

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <BarChart3 className="w-8 h-8"/>
                        Finanzas del Centro
                    </h1>
                    <p className="text-muted-foreground">Transparencia de ingresos y gastos.</p>
                </div>
                 {canAddMovement && centerId && (
                     <CreateMovementDialog centerId={centerId} />
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Balance General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Ingresos Totales</span>
                            <span className="font-bold text-green-600">${totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Gastos Totales</span>
                            <span className="font-bold text-red-600">${totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold">Saldo</span>
                            <span className={`font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>${balance.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
           
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6 items-center">
                        {incomeData.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {incomeData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.description}</TableCell>
                                                    <TableCell className="text-right">${item.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                                    <PieChart>
                                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={chartDataIncome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                            {chartDataIncome.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </>
                        ) : (
                            <div className="md:col-span-2 text-center py-12 text-muted-foreground">
                                <p>No hay ingresos registrados todavía.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6 items-center">
                       {expensesData.length > 0 ? (
                           <>
                            <div className="overflow-x-auto">
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expensesData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.description}</TableCell>
                                                <TableCell className="text-right">${item.amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                           </div>
                            <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={chartDataExpenses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                        {chartDataExpenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                           </>
                       ) : (
                            <div className="md:col-span-2 text-center py-12 text-muted-foreground">
                                <p>No hay gastos registrados todavía.</p>
                            </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}