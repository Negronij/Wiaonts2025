// add-use-client-all.js
import fs from "fs";
import path from "path";

const rootDir = path.join(process.cwd(), "src"); // Carpeta src/

// Hooks o imports que requieren use client
const clientIndicators = [
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useContext",
  "useReducer",
  "useSearchParams",
  "usePathname",
  "useRouter",
  "useParams",
  "react-hook-form",
  "lucide-react",
  "framer-motion",
  "react-day-picker"
];

function processFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  // Si ya tiene "use client", no hacemos nada
  if (code.startsWith('"use client";') || code.startsWith("'use client';")) return;

  // Detectamos si contiene alguna palabra clave
  const needsClient = clientIndicators.some(indicator => code.includes(indicator));

  if (needsClient) {
    const newCode = `"use client";\n\n${code}`;
    fs.writeFileSync(filePath, newCode, "utf8");
    console.log(`✔ Agregado "use client" en: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      processFile(fullPath);
    }
  }
}

// Ejecutamos
walkDir(rootDir);
console.log("✅ Proceso completado.");
