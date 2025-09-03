import Link from 'next/link';
import { WionLogo } from '@/components/landing/wion-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="Volver a la página de inicio">
            <WionLogo className="h-16 w-16" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
