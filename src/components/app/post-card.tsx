
"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy, setDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export type Post = {
  id: string;
  author: { id: string; name: string; avatarUrl: string };
  postTitle: string;
  postContent: string;
  imageUrl?: string;
  createdAt: { seconds: number; nanoseconds: number; } | null;
  aiHint?: string;
};

interface PostCardProps {
  post: Post;
  currentUser: { id: string; name: string; avatarUrl: string; role: "Propietario" | "Admin" | "Alumno" };
}

type Comment = {
    id: string;
    author: { id: string; name: string; avatarUrl: string };
    text: string;
    createdAt: { seconds: number; nanoseconds: number; };
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const userHasLiked = likes.includes(currentUser.id);
  const userHasDisliked = dislikes.includes(currentUser.id);

  // Effect for Likes
  useEffect(() => {
    const likesRef = collection(db, "posts", post.id, "likes");
    const unsubscribe = onSnapshot(likesRef, (snapshot) => {
      setLikes(snapshot.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [post.id]);

  // Effect for Dislikes
  useEffect(() => {
    const dislikesRef = collection(db, "posts", post.id, "dislikes");
    const unsubscribe = onSnapshot(dislikesRef, (snapshot) => {
      setDislikes(snapshot.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [post.id]);

  // Effect for Comments
  useEffect(() => {
    if (showComments) {
        const commentsQuery = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
        });
        return () => unsubscribe();
    }
  }, [post.id, showComments]);


  const handleInteraction = async (type: 'like' | 'dislike') => {
    const postRef = doc(db, "posts", post.id);
    const likeRef = doc(postRef, "likes", currentUser.id);
    const dislikeRef = doc(postRef, "dislikes", currentUser.id);

    if (type === 'like') {
        if (userHasLiked) {
            await deleteDoc(likeRef);
        } else {
            if (userHasDisliked) await deleteDoc(dislikeRef);
            await setDoc(likeRef, { userId: currentUser.id });
        }
    } else { // dislike
        if (userHasDisliked) {
            await deleteDoc(dislikeRef);
        } else {
            if (userHasLiked) await deleteDoc(likeRef);
            await setDoc(dislikeRef, { userId: currentUser.id });
        }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
        await addDoc(collection(db, "posts", post.id, "comments"), {
            author: {
                id: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl
            },
            text: newComment.trim(),
            createdAt: serverTimestamp()
        });
        setNewComment("");
    }
  }
  
  const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | null) => {
    if (!timestamp) return 'Justo ahora';
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true, locale: es });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person face" />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <h2 className="text-xl font-bold font-headline mb-2">{post.postTitle}</h2>
        <p className="text-foreground/80 whitespace-pre-line">
          {post.postContent}
        </p>
        {post.imageUrl && (
          <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={post.imageUrl}
              alt={post.postTitle}
              fill
              className="object-cover"
              data-ai-hint={post.aiHint}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-start">
        <div className="flex gap-2 w-full">
            <Button variant={userHasLiked ? 'default' : 'ghost'} size="sm" onClick={() => handleInteraction('like')}>
                <ThumbsUp className="h-4 w-4 mr-2" />
                {likes.length}
            </Button>
            <Button variant={userHasDisliked ? 'destructive' : 'ghost'} size="sm" onClick={() => handleInteraction('dislike')}>
                <ThumbsDown className="h-4 w-4 mr-2" />
                {dislikes.length}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {comments.length} Comentarios
            </Button>
        </div>

        {showComments && (
            <div className='w-full mt-4 space-y-4'>
                <Separator />
                <form onSubmit={handleAddComment} className='flex items-center gap-2 pt-2'>
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder='Escribe un comentario...'
                        autoComplete='off'
                    />
                    <Button type='submit' size='sm'>Comentar</Button>
                </form>
                <div className='space-y-3 max-h-60 overflow-y-auto pr-2'>
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className='flex items-start gap-3 text-sm'>
                                <Avatar className='h-8 w-8'>
                                    <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} data-ai-hint="person face" />
                                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className='bg-muted p-3 rounded-lg flex-1'>
                                    <div className="flex items-baseline justify-between">
                                        <p className='font-semibold'>{comment.author.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                                    </div>
                                    <p>{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className='text-sm text-center text-muted-foreground py-2'>No hay comentarios todavía. ¡Sé el primero!</p>
                    )}
                </div>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
