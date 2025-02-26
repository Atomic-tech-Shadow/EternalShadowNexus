import { NavBar } from "@/components/nav-bar";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import type { Post, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { data: posts, isLoading } = useQuery<(Post & { user: User })[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <CreatePost />
        <div className="space-y-6 mt-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))
          ) : (
            posts?.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  );
}
