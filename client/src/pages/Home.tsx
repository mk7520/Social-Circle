import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Stories } from "@/components/Stories";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { Redirect, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import type { User } from "@shared/models/auth";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: posts, isLoading: postsLoading, isError } = usePosts();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"], enabled: !!user });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  const suggestions = (users ?? []).filter(u => u.id !== user.id).slice(0, 5);

  return (
    <Layout>
      <div className="max-w-[935px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-12">
        {/* Feed */}
        <div className="max-w-[470px] w-full mx-auto lg:mx-0">
          <Stories />
          <CreatePost />

          {postsLoading ? (
            <div className="space-y-6">
              {[1,2].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-secondary animate-pulse" />
                    <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                  </div>
                  <div className="aspect-square bg-secondary animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-1/3 bg-secondary rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-secondary rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <p className="text-destructive font-medium">Failed to load posts.</p>
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed text-muted-foreground">
              <p className="text-lg font-semibold text-foreground">Welcome to Socially</p>
              <p className="text-sm mt-2">Share your first post to get started.</p>
            </div>
          ) : (
            posts?.map(post => <PostCard key={post.id} post={post} />)
          )}
        </div>

        {/* Right Rail (Desktop) */}
        <aside className="hidden lg:block sticky top-6 self-start">
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="w-14 h-14 cursor-pointer">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary">{userInitial(user)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.id}`}>
                <p className="font-semibold text-sm cursor-pointer hover:underline" data-testid="text-rail-username">{userHandle(user)}</p>
              </Link>
              <p className="text-sm text-muted-foreground truncate">{displayName(user)}</p>
            </div>
            <button className="text-xs font-semibold text-primary hover:text-foreground" data-testid="button-rail-switch">Switch</button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">Suggested for you</p>
            <button className="text-xs font-semibold">See All</button>
          </div>

          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No suggestions yet.</p>
            ) : suggestions.map(u => (
              <div key={u.id} className="flex items-center gap-3" data-testid={`suggestion-${u.id}`}>
                <Link href={`/profile/${u.id}`}>
                  <Avatar className="w-9 h-9 cursor-pointer">
                    <AvatarImage src={u.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-secondary text-xs">{userInitial(u)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.id}`}>
                    <p className="text-sm font-semibold cursor-pointer hover:underline truncate">{userHandle(u)}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">Suggested for you</p>
                </div>
                <button className="text-xs font-semibold text-primary hover:text-foreground" data-testid={`button-follow-${u.id}`}>Follow</button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 mt-8 leading-relaxed">
            About · Help · Press · API · Jobs · Privacy · Terms<br />
            © {new Date().getFullYear()} Socially
          </p>
        </aside>
      </div>
    </Layout>
  );
}
