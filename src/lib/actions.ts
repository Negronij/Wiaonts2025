
"use server";

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, setDoc, collection, addDoc, serverTimestamp, runTransaction, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, WriteBatch } from "firebase/firestore";

type ActionResponse = {
    success: boolean;
    message: string;
    centerId?: string;
    data?: any;
};

type Role = 'Propietario' | 'Admin Plus' | 'Admin' | 'Alumno';
type RoleKey = 'owner' | 'adminPlus' | 'admin' | 'student';

const roleToKey: Record<Role, RoleKey> = {
    'Propietario': 'owner',
    'Admin Plus': 'adminPlus',
    'Admin': 'admin',
    'Alumno': 'student',
};

const keyToRole: Record<RoleKey, Role> = {
    'owner': 'Propietario',
    'adminPlus': 'Admin Plus',
    'admin': 'Admin',
    'student': 'Alumno',
};

export async function updateUserRole(params: {
    centerId: string,
    currentUserId: string,
    targetUserId: string,
    currentRole: Role,
    newRole: Role
}): Promise<ActionResponse> {
    const { centerId, currentUserId, targetUserId, currentRole, newRole } = params;
    try {
        const centerRef = doc(db, "student_centers", centerId);

        await runTransaction(db, async (transaction) => {
            const centerDoc = await transaction.get(centerRef);
            if (!centerDoc.exists()) {
                throw new Error("El centro de estudiantes no existe.");
            }
            
            const centerData = centerDoc.data();
            const roles = centerData.roles || {};

            if (roles.owner !== currentUserId) {
                 throw new Error("No tienes permisos para realizar esta acción.");
            }

            if (roles.owner === targetUserId) {
                throw new Error("No se puede cambiar el rol del propietario.");
            }

            const currentRoleKey = roleToKey[currentRole];
            const newRoleKey = roleToKey[newRole];

            // Remove from current role list if it's an array
            if (Array.isArray(roles[currentRoleKey])) {
                transaction.update(centerRef, {
                    [`roles.${currentRoleKey}`]: arrayRemove(targetUserId)
                });
            }
            
            // Add to new role list if it's an array
            if (Array.isArray(roles[newRoleKey])) {
                 transaction.update(centerRef, {
                    [`roles.${newRoleKey}`]: arrayUnion(targetUserId)
                });
            } else {
                 // Handle owner case or other non-array roles if necessary
                 // This logic assumes owner is not changed this way
            }
        });

        return { success: true, message: `Rol actualizado a ${newRole} con éxito.` };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, message: error.message || "Ocurrió un error en el servidor." };
    }
}


export async function removeUserFromCenter(params: {
    currentUserId: string,
    targetUserId: string,
    centerId: string,
    targetUserRole: Role
}): Promise<ActionResponse> {
     const { currentUserId, targetUserId, centerId, targetUserRole } = params;
     try {
        const centerRef = doc(db, "student_centers", centerId);
        const targetUserRef = doc(db, "users", targetUserId);

        await runTransaction(db, async (transaction) => {
            const centerDoc = await transaction.get(centerRef);
            if (!centerDoc.exists()) {
                throw new Error("El centro de estudiantes no existe.");
            }
            
            const centerData = centerDoc.data();
            if (centerData.roles?.owner !== currentUserId) {
                throw new Error("No tienes permisos para expulsar usuarios.");
            }
            if(centerData.roles?.owner === targetUserId) {
                throw new Error("No puedes expulsar al propietario.");
            }

            const roleKey = roleToKey[targetUserRole];
            if (Array.isArray(centerData.roles?.[roleKey])) {
                transaction.update(centerRef, {
                    [`roles.${roleKey}`]: arrayRemove(targetUserId)
                });
            }
            
            transaction.update(targetUserRef, {
                studentCenterIds: arrayRemove(centerId)
            });
        });
        
        return { success: true, message: "Usuario expulsado del centro con éxito." };

    } catch (error: any) {
        console.error("Error removing user from center:", error);
        return { success: false, message: error.message || "Ocurrió un error en el servidor." };
    }
}

export async function leaveCenter({ userId, centerId }: { userId: string, centerId: string }): Promise<ActionResponse> {
    try {
        const centerRef = doc(db, "student_centers", centerId);
        const userRef = doc(db, "users", userId);

        await runTransaction(db, async (transaction) => {
            const centerDoc = await transaction.get(centerRef);
            if (!centerDoc.exists()) {
                throw new Error("Este centro de estudiantes ya no existe.");
            }
            const centerData = centerDoc.data();
            const roles = centerData.roles || {};

            if (roles.owner === userId) {
                throw new Error("El propietario no puede abandonar el centro. Primero debe transferir la propiedad o eliminar el centro.");
            }

            // Find user's role and remove them
            let userRemoved = false;
            for (const key in roles) {
                if (Array.isArray(roles[key]) && roles[key].includes(userId)) {
                    transaction.update(centerRef, {
                        [`roles.${key}`]: arrayRemove(userId)
                    });
                    userRemoved = true;
                    break;
                }
            }

            if (!userRemoved) {
                 throw new Error("No se encontró tu membresía en este centro.");
            }

            // Remove center from user's profile
            transaction.update(userRef, {
                studentCenterIds: arrayRemove(centerId)
            });
        });

        return { success: true, message: "Has abandonado el centro de estudiantes." };
    } catch (error: any) {
        console.error("Error leaving center:", error);
        return { success: false, message: error.message || "Ocurrió un error en el servidor." };
    }
}


export async function deleteForum({ centerId, forumId, currentUserId }: { centerId: string, forumId: string, currentUserId: string }): Promise<ActionResponse> {
    try {
        const forumRef = doc(db, 'student_centers', centerId, 'forums', forumId);
        const forumDoc = await getDoc(forumRef);

        if (!forumDoc.exists()) {
            return { success: false, message: "El foro no existe." };
        }

        const forumData = forumDoc.data();
        if (forumData.creatorId !== currentUserId) {
            return { success: false, message: "No tienes permisos para eliminar este foro." };
        }
        
        await deleteDoc(forumRef);
        
        return { success: true, message: "El foro ha sido eliminado." };
    } catch (error) {
        console.error("Error deleting forum:", error);
        return { success: false, message: "Ocurrió un error en el servidor al intentar eliminar el foro." };
    }
}


interface UpdateCoursePointsParams {
    centerId: string;
    updatedCourses: { [courseName: string]: number };
    reason: string;
    userId: string;
}

export async function updateCoursePoints({ centerId, updatedCourses, reason, userId }: UpdateCoursePointsParams): Promise<ActionResponse> {
    try {
        const userDocRef = doc(db, "users", userId);
        const centerRef = doc(db, "student_centers", centerId);
        
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const centerDoc = await transaction.get(centerRef);

            if (!userDoc.exists()) throw new Error("Usuario no encontrado.");
            if (!centerDoc.exists()) throw new Error("Centro no encontrado.");
            
            const userData = userDoc.data();
            const centerData = centerDoc.data();
            const userName = `${userData.firstName} ${userData.lastName}`;
            const roles = centerData.roles || {};

            const isOwner = roles.owner === userId;
            const isAdmin = roles.admin?.includes(userId);

            if (!isOwner && !isAdmin) {
                throw new Error("No tienes permisos para actualizar los puntos.");
            }

            const competitionDocRef = doc(db, 'student_centers', centerId, 'competition', 'course_points');
            const historyCollectionRef = collection(db, 'student_centers', centerId, 'competition', 'course_points', 'history');

            transaction.set(competitionDocRef, { courses: updatedCourses }, { merge: true });

            const historyDocRef = doc(historyCollectionRef);
            transaction.set(historyDocRef, {
                reason,
                modifiedBy: userName,
                timestamp: serverTimestamp(),
            });
        });

        return { success: true, message: "Puntos actualizados y cambio registrado en el historial." };

    } catch (error: any) {
        console.error("Error updating course points:", error);
        return { success: false, message: error.message || "Ocurrió un error en el servidor." };
    }
}

interface JoinCenterParams {
    userId: string;
    inviteCode: string;
    firstName: string;
    lastName: string;
    dni: string;
    course: string;
}

export async function joinCenterWithCode(params: JoinCenterParams): Promise<ActionResponse> {
    const { userId, inviteCode, firstName, lastName, dni, course } = params;
    
    try {
        const centersRef = collection(db, 'student_centers');
        const centersSnapshot = await getDocs(centersRef);
        let targetCenterId: string | null = null;
        let role: 'Admin' | 'Alumno' | null = null;
        let centerData: any = null;

        for (const centerDoc of centersSnapshot.docs) {
            const codeQuery = query(collection(db, `student_centers/${centerDoc.id}/invitation_codes`), where('code', '==', inviteCode));
            const codeSnapshot = await getDocs(codeQuery);

            if (!codeSnapshot.empty) {
                targetCenterId = centerDoc.id;
                centerData = centerDoc.data();
                role = codeSnapshot.docs[0].data().role; // Should be 'Admin' or 'Alumno'
                break;
            }
        }
        
        if (!targetCenterId || !role || !centerData) {
            return { success: false, message: "El código de invitación es inválido o ha expirado." };
        }

        const userRef = doc(db, "users", userId);
        const centerRef = doc(db, "student_centers", targetCenterId);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                 throw new Error("El usuario no existe. Por favor, regístrate primero.");
            }
            
            const userData = userDoc.data();
            if (userData.studentCenterIds && userData.studentCenterIds.includes(targetCenterId)) {
                throw new Error("Ya eres miembro de este centro de estudiantes.");
            }

            // Update user document
            transaction.update(userRef, {
                firstName,
                lastName,
                dni,
                course,
                studentCenterIds: arrayUnion(targetCenterId)
            });

            // Update center document with new member's role
            const roleKey = role === 'Admin' ? 'roles.admin' : 'roles.student';
            transaction.update(centerRef, {
                [roleKey]: arrayUnion(userId)
            });
        });

        // After successfully joining, send notifications
        const notificationBatch = writeBatch(db);
        const adminsToNotify = [
            centerData.roles.owner,
            ...(centerData.roles.adminPlus || [])
        ].filter(id => id); // Filter out any undefined/null ids

        const uniqueAdminIds = [...new Set(adminsToNotify)];

        for (const adminId of uniqueAdminIds) {
            const notificationRef = doc(collection(db, `users/${adminId}/notifications`));
            notificationBatch.set(notificationRef, {
                title: "Nuevo Miembro",
                message: `${firstName} ${lastName} se ha unido a ${centerData.centerName}.`,
                read: false,
                createdAt: serverTimestamp(),
                link: `/community?centerId=${targetCenterId}`
            });
        }
        await notificationBatch.commit();


        return { success: true, message: `Te has unido a ${centerData.centerName} como ${role}.`, centerId: targetCenterId };

    } catch (error: any) {
        console.error("Error joining center:", error);
        return { success: false, message: error.message || "Ocurrió un error inesperado al intentar unirse al centro." };
    }
}


export async function getCenterCoursesByCode(inviteCode: string): Promise<ActionResponse> {
    if (!inviteCode.trim()) {
        return { success: false, message: "El código no puede estar vacío." };
    }

    try {
        const centersRef = collection(db, 'student_centers');
        const centersSnapshot = await getDocs(centersRef);

        for (const centerDoc of centersSnapshot.docs) {
            const codeQuery = query(collection(db, `student_centers/${centerDoc.id}/invitation_codes`), where('code', '==', inviteCode));
            const codeSnapshot = await getDocs(codeQuery);

            if (!codeSnapshot.empty) {
                const centerData = centerDoc.data();
                return {
                    success: true,
                    message: "Centro encontrado.",
                    data: {
                        name: centerData.centerName,
                        courses: centerData.courses || [],
                        country: centerData.locationDetails?.country,
                    }
                };
            }
        }

        return { success: false, message: "Código de invitación inválido." };

    } catch (error) {
        console.error("Error verifying invite code:", error);
        return { success: false, message: "Ocurrió un error en el servidor al verificar el código." };
    }
}


// LIBRARY/STORE ACTIONS

export type Reservation = {
    id: string;
    userId: string;
    userName: string;
    itemId: string;
    itemName: string;
    quantity: number;
    status: 'Reservado' | 'Vendido' | 'Cancelado';
    reservedAt: any;
    pickupDeadline: any;
}

export async function createReservation(
    centerId: string,
    userId: string,
    userName: string,
    item: { id: string, name: string },
    quantity: number,
    pickupHours: number
): Promise<ActionResponse> {
    try {
        await runTransaction(db, async (transaction) => {
            const itemRef = doc(db, 'student_centers', centerId, 'library_items', item.id);
            const itemDoc = await transaction.get(itemRef);

            if (!itemDoc.exists()) {
                throw new Error("El artículo ya no existe.");
            }

            const itemData = itemDoc.data();
            if (!itemData.isReservable) {
                throw new Error("Este artículo no se puede reservar.");
            }
            if (itemData.stock < quantity) {
                throw new Error("No hay suficiente stock para esta reserva.");
            }

            const newStock = itemData.stock - quantity;
            transaction.update(itemRef, { stock: newStock });

            const reservationRef = doc(collection(db, 'student_centers', centerId, 'reservations'));
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + pickupHours);
            
            transaction.set(reservationRef, {
                userId,
                userName,
                itemId: item.id,
                itemName: item.name,
                quantity,
                status: 'Reservado',
                reservedAt: serverTimestamp(),
                pickupDeadline: deadline,
            });
        });

        return { success: true, message: "Reserva creada con éxito." };
    } catch (error: any) {
        console.error("Error creating reservation:", error);
        return { success: false, message: error.message || "No se pudo crear la reserva." };
    }
}


export async function fulfillReservation(centerId: string, reservationId: string): Promise<ActionResponse> {
    try {
        const reservationRef = doc(db, 'student_centers', centerId, 'reservations', reservationId);
        await updateDoc(reservationRef, { status: 'Vendido' });
        return { success: true, message: "La reserva ha sido marcada como vendida." };
    } catch (error) {
        console.error("Error fulfilling reservation:", error);
        return { success: false, message: "No se pudo actualizar la reserva." };
    }
}


export async function cancelReservation(centerId: string, reservation: Reservation): Promise<ActionResponse> {
     try {
        await runTransaction(db, async (transaction) => {
            const reservationRef = doc(db, 'student_centers', centerId, 'reservations', reservation.id);
            const itemRef = doc(db, 'student_centers', centerId, 'library_items', reservation.itemId);

            const itemDoc = await transaction.get(itemRef);
            if (itemDoc.exists()) {
                const newStock = (itemDoc.data().stock || 0) + reservation.quantity;
                transaction.update(itemRef, { stock: newStock });
            }

            transaction.update(reservationRef, { status: 'Cancelado' });
        });
        return { success: true, message: "Reserva cancelada. El stock ha sido restaurado." };
    } catch (error: any) {
        console.error("Error cancelling reservation:", error);
        return { success: false, message: "No se pudo cancelar la reserva." };
    }
}
