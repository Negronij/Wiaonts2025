// src/app/api/genkit/[[...path]]/route.ts
import { handler as genkitHandler } from "@genkit-ai/next";
import "@/ai/flows/optimize-student-center-post";

// Exportar los métodos HTTP que necesites
export async function GET(req: Request) {
  // lógica para manejar GET
}

export async function POST(req: Request) {
  // lógica para manejar POST
}
