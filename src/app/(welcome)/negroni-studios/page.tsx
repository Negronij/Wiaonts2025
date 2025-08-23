"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AjustesPage() {
  const websiteUrl = "https://ngstudiios.github.io/WP/";

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Negroni Studios</h1>
        <p className="text-muted-foreground">© 2025 Negroni Studios. Todos los derechos reservados.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sobre Nosotros</CardTitle>
          <CardDescription>
            Todos los derechos de esta web, WIAONT, están reservados por Negroni Studios.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <Link href={websiteUrl} target="_blank">
                    Visitar Sitio Web
                    <ExternalLink className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
