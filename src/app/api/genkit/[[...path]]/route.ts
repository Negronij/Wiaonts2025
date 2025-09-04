// src/app/api/genkit/[[...path]]/route.ts
import { handler as genkitHandler } from "@genkit-ai/next";
import "@/ai/flows/optimize-student-center-post";

// Exportar los métodos HTTP que necesites
export const GET = genkitHandler.GET;
export const POST = genkitHandler.POST;
