
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { PostCard, Post } from "../post-card";
import { Skeleton } from "@/components/ui/skeleton";

type CurrentUser = {
  id: string;
  name: string;
  avatarUrl: string;
  role: "Propietario" | "Admin" | "Admin Plus" | "Alumno";
};

function PostSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  );
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const centerId = searchParams.get('centerId');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
           const userData = userDoc.data();
            setCurrentUser({
                id: user.uid,
                name: `${userData.firstName} ${userData.lastName}`,
                avatarUrl: userData.avatarUrl || "",
                role: userData.role || "Alumno",
            });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (centerId) {
      setLoading(true);
      const postsQuery = query(
        collection(db, "student_centers", centerId, "posts"),
        orderBy("createdAt", "desc")
      );

      const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));
        setPosts(postsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching posts:", error);
        setLoading(false);
      });

      return () => unsubscribePosts();
    } else {
        setLoading(false);
    }
  }, [centerId]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
      {posts.length > 0 ? (
        posts.map(post => 
          currentUser && <PostCard key={post.id} post={post} centerId={centerId!} currentUser={currentUser} />
        )
      ) : (
        <div className="text-center text-muted-foreground py-20">
            <h3 className="text-xl font-semibold">No hay publicaciones todavía</h3>
            {currentUser?.role !== 'Alumno' ? (
                <p className="mt-2">¡Sé el primero en crear una publicación en este centro!</p>
            ) : (
                 <p className="mt-2">Pronto habrá nuevas publicaciones.</p>
            )}
        </div>
      )}
    </div>
  );
}
