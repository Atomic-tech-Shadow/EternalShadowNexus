import { NavBar } from "@/components/nav-bar";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import type { Post, User, Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HomePage() {
  const { data: posts, isLoading: postsLoading } = useQuery<(Post & { user: User })[]>({
    queryKey: ["/api/posts"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        {/* Filtres */}
        <div className="flex gap-4 mb-8">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CreatePost />

        {/* Posts */}
        <div className="space-y-6 mt-8">
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </div>
            ))
          ) : posts?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun post pour le moment</p>
              <p className="text-sm">Soyez le premier à partager quelque chose !</p>
            </div>
          ) : (
            posts?.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  );
}