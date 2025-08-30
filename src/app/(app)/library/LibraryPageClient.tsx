"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Store, Trash2, Edit, Loader2 } from "lucide-react";
import { AddLibraryItemDialog, LibraryItemData } from "@/components/app/add-library-item-dialog";
import { EditLibraryItemDialog } from "@/components/app/edit-library-item-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export type LibraryItem = LibraryItemData & {
  id: string;
};

type CurrentUser = {
    id: string;
    role: "Propietario" | "Admin" | "Admin Plus" | "Alumno";
};

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const { toast } = useToast();
  
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
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

        const itemsQuery = collection(db, 'student_centers', centerId, 'library_items');
        const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
          const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryItem));
          setItems(itemsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching library items: ", error);
          setIsLoading(false);
        });
        
        return () => unsubscribeItems();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [centerId]);

  const handleAddItem = async (newItem: LibraryItemData) => {
    if (!centerId) return;
    try {
        const itemsCollectionRef = collection(db, 'student_centers', centerId, 'library_items');
        await addDoc(itemsCollectionRef, { ...newItem, createdAt: serverTimestamp() });
        toast({ title: "Artículo añadido", description: "El nuevo artículo está disponible en la tienda." });
    } catch (error) {
        console.error("Error adding item:", error);
        toast({ title: "Error", description: "No se pudo añadir el artículo.", variant: "destructive" });
    }
  };

  const handleUpdateItem = async (updatedItem: LibraryItem) => {
    if (!centerId) return;
    try {
        const itemRef = doc(db, 'student_centers', centerId, 'library_items', updatedItem.id);
        await updateDoc(itemRef, { ...updatedItem });
        setEditingItem(null);
        toast({ title: "Artículo actualizado", description: "Los cambios se guardaron correctamente." });
    } catch (error) {
        console.error("Error updating item:", error);
        toast({ title: "Error", description: "No se pudo actualizar el artículo.", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!centerId || !window.confirm("¿Estás seguro de que quieres eliminar este artículo?")) return;
    try {
        const itemRef = doc(db, 'student_centers', centerId, 'library_items', itemId);
        await deleteDoc(itemRef);
        toast({ title: "Artículo eliminado", description: "El artículo ha sido eliminado de la tienda." });
    } catch (error) {
        console.error("Error deleting item:", error);
        toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
    }
  };

  const getStockVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary";
    return "default";
  }

  const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Propietario';

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 animate-spin text-primary"/>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Store className="w-8 h-8" />
            Tienda del Centro
          </h1>
          <p className="text-muted-foreground">Artículos en venta y gestión de stock.</p>
        </div>
        {isManager && <AddLibraryItemDialog onAddItem={handleAddItem} />}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Artículos</CardTitle>
          <CardDescription>
            {isManager 
                ? "Gestiona el stock y los precios de los artículos disponibles."
                : "Estos son los artículos disponibles para comprar en el centro."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  {isManager && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>${item.price.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={getStockVariant(item.stock)}>
                            {item.stock > 0 ? `${item.stock} unidades` : 'Agotado'}
                        </Badge>
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold">No hay artículos en venta</h3>
              <p className="text-muted-foreground mt-2">
                {isManager
                  ? "Añade el primer artículo para empezar a vender."
                  : "Vuelve más tarde para ver los artículos disponibles."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {editingItem && isManager && (
        <EditLibraryItemDialog
          item={editingItem}
          onUpdateItem={handleUpdateItem}
          onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
        />
      )}
    </div>
  );
}