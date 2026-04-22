import { useParams, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Hash, Loader2, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { PostWithRelations } from "@shared/schema";

export default function Tag() {
  const { tag } = useParams<{ tag: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts/tag", tag],
    queryFn: async () => {
      const r = await fetch(`/api/posts/tag/${encodeURIComponent(tag)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!tag,
  });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  const total = data?.length ?? 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-center gap-5 pb-8 border-b border-border">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Hash className="w-10 h-10 md:w-14 md:h-14 text-foreground/70" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-light" data-testid="text-tag-title">#{tag}</h1>
            <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">{total}</strong> posts</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-secondary animate-pulse" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground" data-testid="empty-tag">
            <Hash className="w-12 h-12 mx-auto opacity-40 mb-4" />
            <p>No posts with #{tag} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {data.map(p => (
              <div key={p.id} className="relative aspect-square bg-secondary group cursor-pointer overflow-hidden" data-testid={`tag-post-${p.id}`}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full p-3 flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
                    <p className="text-xs text-foreground/80 line-clamp-6">{p.content}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 text-white">
                  <span className="flex items-center gap-1 font-semibold"><Heart className="w-4 h-4 fill-white" /> {p.likeCount ?? 0}</span>
                  <span className="flex items-center gap-1 font-semibold"><MessageCircle className="w-4 h-4 fill-white" /> {p.comments.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FullLoader() {
  return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
}
