import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import FunctionalityPageClient from './FunctionalityPageClient';

export default function FunctionalityPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FunctionalityPageClient />
    </Suspense>
  );
}
