
// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview An AI-powered tool that provides suggestions regarding optimal wording and structure for admin posts.
 *
 * - optimizePost - A function that handles the post optimization process.
 * - OptimizePostInput - The input type for the optimizePost function.
 * - OptimizePostOutput - The return type for the optimizePost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePostInputSchema = z.object({
  postTitle: z
    .string()
    .describe('The title of the student center post.'),
  postContent: z
    .string()
    .describe('The content of the student center post.'),
});
export type OptimizePostInput = z.infer<typeof OptimizePostInputSchema>;

const OptimizePostOutputSchema = z.object({
  optimizedTitle: z
    .string()
    .describe('The optimized title of the student center post.'),
  optimizedContent: z
    .string()
    .describe('The optimized content of the student center post, with suggestions for increasing student engagement and understanding.'),
});
export type OptimizePostOutput = z.infer<typeof OptimizePostOutputSchema>;

export async function optimizePost(input: OptimizePostInput): Promise<OptimizePostOutput> {
  return optimizePostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePostPrompt',
  input: {schema: OptimizePostInputSchema},
  output: {schema: OptimizePostOutputSchema},
  prompt: `Eres un asistente de IA diseñado para ayudar a los administradores de centros de estudiantes a optimizar sus publicaciones para obtener la máxima participación y comprensión.

  Dado el siguiente título y contenido de la publicación, proporciona una versión optimizada en español con sugerencias para mejorar la claridad, la concisión y el atractivo para los estudiantes.

  Título: {{{postTitle}}}
  Contenido: {{{postContent}}}

  Enfócate en:
  - Usar un lenguaje claro y conciso.
  - Estructurar el contenido para facilitar la lectura (por ejemplo, encabezados, viñetas).
  - Sugerir elementos atractivos (por ejemplo, preguntas, llamadas a la acción).
  - Asegurarte de que el tono sea apropiado para una audiencia estudiantil.

  Devuelve únicamente el título y el contenido optimizados. No incluyas los prefijos "Título Optimizado:" o "Contenido Optimizado:" en tu respuesta.`,
});

const optimizePostFlow = ai.defineFlow(
  {
    name: 'optimizePostFlow',
    inputSchema: OptimizePostInputSchema,
    outputSchema: OptimizePostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
