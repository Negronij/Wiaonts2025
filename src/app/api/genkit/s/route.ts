import { nextPlugin } from "@genkit-ai/next";
import { ai } from "@/ai/genkit";
import "@/ai/flows/optimize-student-center-post";

export const { GET, POST } = nextPlugin(ai);
