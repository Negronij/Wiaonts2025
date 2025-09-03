import * as z from 'zod';

// This schema can be used for a secondary profile completion step if needed
export const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'El nombre es requerido.' }),
  lastName: z.string().min(1, { message: 'El apellido es requerido.' }),
  username: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' }),
});
