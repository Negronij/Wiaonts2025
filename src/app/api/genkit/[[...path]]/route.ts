import { defineNextHandler } from "@genkit-ai/next/server";
import "@/ai/flows/optimize-student-center-post";

export const { GET, POST } = defineNextHandler();
