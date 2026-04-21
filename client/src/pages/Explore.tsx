import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Compass, ImageIcon } from "lucide-react";
import { Redirect, Link } from "wouter";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import type { User } from "@shared/models/auth";
import type { z } from "zod";
import type { api } from "@shared/routes";

type Post = z.infer<typeof api.posts.list.responses[200]>[0];

export default function Explore() {
  const { user, isLoading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const { data: posts, isLoading } = useQuery<Post[]>({ queryKey: ["/api/posts"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  const filteredUsers = (users ?? [])
    .filter(u => u.id !== user.id)
    .filter(u => !q || displayName(u).toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));

  const filteredPosts = (posts ?? []).filter(p => !q || p.content.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="relative mb-6 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="pl-10 h-11 rounded-xl bg-secondary/50 border-transparent"
            data-testid="input-explore-search"
          />
        </div>

        {q && filteredUsers.length > 0 && (
          <section className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Accounts</h3>
            <div className="space-y-1">
              {filteredUsers.slice(0, 5).map(u => (
                <Link key={u.id} href={`/profile/${u.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 cursor-pointer" data-testid={`explore-user-${u.id}`}>
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-secondary">{userInitial(u)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{userHandle(u)}</p>
                      <p className="text-xs text-muted-foreground">{displayName(u)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center">
            <Compass className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-medium">{q ? "No results" : "Discover posts"}</p>
            <p className="text-sm text-muted-foreground">Posts from across the community will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {filteredPosts.map((p, i) => (
              <Link key={p.id} href={`/profile/${p.authorId}`}>
                <div
                  className={`relative bg-secondary group cursor-pointer overflow-hidden ${
                    i % 7 === 3 ? "aspect-[1/2] row-span-2" : "aspect-square"
                  }`}
                  data-testid={`explore-post-${p.id}`}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full p-3 flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
                      <p className="text-xs text-foreground/80 line-clamp-6">{p.content}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
