
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user, create a profile document in Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          firstName: user.displayName?.split(' ')[0] || "",
          lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
          username: user.email?.split('@')[0] || `user${Date.now()}`,
          email: user.email,
          avatarUrl: user.photoURL,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "¡Cuenta creada con éxito!",
          description: "Bienvenido a Wiaont. Ahora, configura tu centro.",
        });
      } else {
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión correctamente.",
        });
      }
      
      router.push("/welcome");

    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "No se pudo iniciar sesión con Google. Inténtalo de nuevo.";
      
      // Provide more specific error messages
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "El proceso de inicio de sesión fue cancelado.";
      } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "El dominio de esta aplicación no está autorizado. Por favor, añádelo en la configuración de Firebase Authentication.";
      } else {
          errorMessage = `Error: ${error.message}`;
      }

      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
          fill="currentColor"
        >
          <path d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.2 0 128.5 106.5 17.5 244 17.5c71.5 0 126.5 28.5 168.5 68.5l-63.5 61.5c-20-18-48-36-105-36-83 0-151.5 67.5-151.5 152.5s68.5 152.5 151.5 152.5c94.5 0 130.5-70.5 135-108.5h-135v-81.5h255.5z" />
        </svg>
      )}
      Continuar con Google
    </Button>
  );
}
