// add-use-client.js
import fs from "fs";
import path from "path";

const rootDir = path.join(process.cwd(), "src", "app"); // Carpeta src/app/

// Lista de hooks de cliente que disparan el agregado de "use client"
const clientHooks = [
  "useState",
  "useEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useContext",
  "useSearchParams",
  "useRouter",
  "usePathname"
];

function processFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  // Si ya tiene "use client"; no hacer nada
  if (code.startsWith('"use client";') || code.startsWith("'use client';")) {
    return;
  }

  // Detecta si usa hooks de cliente
  const usesClientHooks = clientHooks.some(hook => code.includes(hook));
  if (usesClientHooks) {
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
    } else if (file.endsWith(".tsx")) {
      processFile(fullPath);
    }
  }
}

// Ejecuta
walkDir(rootDir);
console.log("✅ Proceso completado.");
