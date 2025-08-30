import { nextPlugin } from "@genkit-ai/next";
import { ai } from "@/ai/genkit";
import "@/ai/flows/optimize-student-center-post";

let plugin: ReturnType<typeof nextPlugin> | null = null;

function getPlugin() {
  if (!plugin) {
    // Solo se inicializa en runtime
    plugin = nextPlugin(ai);
  }
  return plugin;
}

export const GET = async (req: Request) => {
  const { GET } = getPlugin();
  return GET(req);
};

export const POST = async (req: Request) => {
  const { POST } = getPlugin();
  return POST(req);
};
