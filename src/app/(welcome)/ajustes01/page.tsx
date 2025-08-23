"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, MessageSquareWarning, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function AjustesPage() {
  const mailTo = "ng.studiios@gmail.com";

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Ajustes y Soporte</h1>
        <p className="text-muted-foreground">¿Necesitas ayuda o tienes alguna idea? Contáctanos.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary"/>Pedir Ayuda</CardTitle>
          <CardDescription>Si tienes problemas técnicos o dudas sobre cómo usar la aplicación, este es tu lugar.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <Link href={`mailto:${mailTo}?subject=Soporte%20Técnico%20Wiaont`}>
                    Contactar a Soporte
                </Link>
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-destructive"/>Hacer una Queja</CardTitle>
          <CardDescription>Tu opinión es importante. Si algo no te gusta, queremos saberlo para poder mejorar.</CardDescription>
        </CardHeader>
         <CardContent>
            <Button asChild variant="destructive" className="w-full">
                <Link href={`mailto:${mailTo}?subject=Queja%20sobre%20Wiaont`}>
                    Enviar una Queja
                </Link>
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500"/>Sugerir Mejoras</CardTitle>
          <CardDescription>¿Tienes una idea para una nueva función? ¡Nos encantaría escucharla!</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`mailto:${mailTo}?subject=Sugerencia%20para%20Wiaont`}>
                    Proponer Mejora
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
