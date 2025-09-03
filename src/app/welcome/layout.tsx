
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Settings, Building } from 'lucide-react';
import { WionLogo } from '@/components/landing/wion-logo';

function WelcomeBottomNav() {
    const pathname = usePathname();
    const navItems = [
        { href: "/welcome", icon: Home, label: "Inicio" },
        { href: "/profile", icon: User, label: "Perfil" },
        { href: "/ajustes01", icon: Settings, label: "Ajustes" },
        { href: "/negroni-studios", icon: Building, label: "NS" },
    ]
    return (
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
}

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 pb-20">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link href="/" aria-label="Volver a la página de inicio">
              <WionLogo className="h-16 w-16" />
            </Link>
          </div>
          {children}
        </div>
      </div>
      <WelcomeBottomNav />
    </>
  );
}
