
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, UsersRound, ChevronRight, Trash2 } from "lucide-react";
import type { Forum } from '@/app/(app)/forum/page';
import { deleteForum } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ForumCardProps {
    forum: Forum;
    centerId: string;
    currentUserId: string;
    onForumDeleted: () => void;
}

export function ForumCard({ forum, centerId, currentUserId, onForumDeleted }: ForumCardProps) {
    const { toast } = useToast();
    const isDefaultForum = forum.type === 'general' || forum.type === 'admins';
    const Icon = isDefaultForum ? UsersRound : Lock;
    const canDelete = forum.type === 'custom' && forum.creatorId === currentUserId;

    const handleDelete = async () => {
        if (!canDelete) return;

        if (window.confirm(`¿Estás seguro de que quieres eliminar el foro "${forum.title}"? Esta acción no se puede deshacer.`)) {
            const result = await deleteForum({ centerId, forumId: forum.id, currentUserId });
            if (result.success) {
                toast({
                    title: "Foro Eliminado",
                    description: result.message,
                });
                onForumDeleted();
            } else {
                toast({
                    title: "Error al eliminar",
                    description: result.message,
                    variant: "destructive",
                });
            }
        }
    }
    
    return (
        <Card className="flex flex-col relative">
            {canDelete && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleDelete}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
            <CardHeader>
                <CardTitle className="flex items-start gap-3 pr-8">
                    <Icon className="w-6 h-6 text-primary mt-1 flex-shrink-0"/>
                    <span className="flex-1">{forum.title}</span>
                </CardTitle>
                <CardDescription>{forum.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground">
                    {forum.members.length} {forum.members.length === 1 ? 'miembro' : 'miembros'}
                 </p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/forum/${forum.id}?centerId=${centerId}`}>
                        Entrar al Chat
                        <ChevronRight className="w-4 h-4 ml-2"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
