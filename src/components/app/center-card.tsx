
import Link from 'next/link';
import { AnimalLogo, type Animal } from '@/components/icons/animal-logo';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface CenterCardProps {
    name: string;
    animal: Animal;
    color: string;
    href: string;
}

export function CenterCard({ name, animal, color, href }: CenterCardProps) {
    return (
        <Link 
            href={href} 
            className={cn(
                buttonVariants({ variant: 'outline' }),
                "h-auto w-full justify-between p-4 text-left transition-transform hover:scale-[1.02]"
            )}
            style={{ 
                backgroundColor: `${color}20` /* 20 is hex for 12.5% opacity */, 
                borderColor: color 
            }}
        >
            <div className="flex items-center gap-4">
                <div 
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color }}
                >
                    <AnimalLogo animal={animal} className="h-8 w-8 text-white" />
                </div>
                <p className="font-semibold">{name}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
    );
}
