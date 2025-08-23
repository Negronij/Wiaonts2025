"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Crear una Cuenta</CardTitle>
        <CardDescription>Únete a Wiaont con tu cuenta de Google en un solo paso.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInButton />
        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="underline text-primary">
            Iniciar sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
