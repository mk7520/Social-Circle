import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Bookmark, Loader2, Heart, MessageCircle } from "lucide-react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { PostWithRelations } from "@shared/schema";

export default function Saved() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts/saved"],
    enabled: !!user,
  });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="border-b border-border pb-6 mb-1">
          <h1 className="text-2xl font-light flex items-center gap-3" data-testid="text-page-title">
            <Bookmark className="w-7 h-7" /> Saved
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Only you can see what you've saved.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-secondary animate-pulse" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center" data-testid="empty-saved">
            <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-light mb-1">Save</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {data.map(p => (
              <div key={p.id} className="relative aspect-square bg-secondary group cursor-pointer overflow-hidden" data-testid={`saved-${p.id}`}>
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
