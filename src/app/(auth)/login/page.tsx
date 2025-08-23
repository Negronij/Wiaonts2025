"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
        <CardDescription>Usa tu cuenta de Google para acceder a Wiaont.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInButton />
        <div className="mt-4 text-center text-sm">
          Al continuar, aceptas nuestros Términos de Servicio.
        </div>
      </CardContent>
    </Card>
  );
}
