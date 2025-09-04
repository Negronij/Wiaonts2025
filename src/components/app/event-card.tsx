"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trophy, Users, Shield, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type Event = {
  id: string;
  title: string;
  prize: string;
  registrationOpen: Date;
  registrationClose: Date;
  startDate: Date;
  endDate: Date;
  eventType: 'recreativo' | 'clasificatorio';
  modality: 'individual' | 'equipos' | 'cursos' | 'general';
  teamOptions?: {
    teamType?: 'mismo_curso' | 'mixto';
  };
  costValue?: number;
  costCurrency?: string;
};

interface EventCardProps {
  event: Event;
}

const InfoLine = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
    </div>
);

const formatDateRange = (start: Date, end: Date) => {
    const formattedStart = format(start, "d 'de' LLL", { locale: es });
    const formattedEnd = format(end, "d 'de' LLL", { locale: es });
    return `${formattedStart} al ${formattedEnd}`;
}

export function EventCard({ event }: EventCardProps) {

    const getModalityText = () => {
        if (event.modality === 'individual') return 'Individual';
        if (event.modality === 'cursos') return 'Por Cursos';
        if (event.modality === 'general') return 'Tabla General';
        if (event.modality === 'equipos') {
            if (event.teamOptions?.teamType === 'mismo_curso') return 'Equipos (Mismo Curso)';
            if (event.teamOptions?.teamType === 'mixto') return 'Equipos (Mixtos)';
            return 'Equipos';
        }
        return 'No especificado';
    }

    const now = new Date();
    const isRegistrationOpen = now >= event.registrationOpen && now <= event.registrationClose;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="capitalize">{event.eventType}</Badge>
                    <Badge variant="outline">{getModalityText()}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow">
                <InfoLine icon={Trophy} label="Premio" value={event.prize} />
                <InfoLine icon={Calendar} label="Duración" value={formatDateRange(event.startDate, event.endDate)} />
                <InfoLine icon={Clock} label="Inscripción" value={formatDateRange(event.registrationOpen, event.registrationClose)} />
                {event.costValue && event.costValue > 0 && (
                    <InfoLine icon={Tag} label="Costo" value={`${event.costValue} ${event.costCurrency}`} />
                )}
            </CardContent>
            <CardFooter>
                 <Button className="w-full" disabled={!isRegistrationOpen}>
                    {isRegistrationOpen ? 'Inscribirse' : 'Inscripciones Cerradas'}
                 </Button>
            </CardFooter>
        </Card>
    );
}
