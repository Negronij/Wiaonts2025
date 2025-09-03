import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import EventsPageClient from './EventsPageClient';

export default function EventsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <EventsPageClient />
    </Suspense>
  );
}