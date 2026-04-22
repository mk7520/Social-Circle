import { useParams, Redirect, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToggleFollow } from "@/hooks/use-social";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import type { User } from "@shared/models/auth";

export default function FollowList({ kind }: { kind: "followers" | "following" }) {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const followMutation = useToggleFollow();
  const { data, isLoading } = useQuery<User[]>({
    queryKey: [`/api/users/${id}/${kind}`],
    queryFn: async () => {
      const r = await fetch(`/api/users/${id}/${kind}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!id,
  });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
          <Link href={`/profile/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back-profile"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold capitalize" data-testid="text-list-title">{kind}</h1>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />)}</div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center" data-testid="empty-list">No {kind} yet.</p>
        ) : (
          <ul className="space-y-1">
            {data.map(u => (
              <li key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60" data-testid={`item-${u.id}`}>
                <Link href={`/profile/${u.id}`}>
                  <Avatar className="w-12 h-12 cursor-pointer">
                    <AvatarImage src={u.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-secondary">{userInitial(u)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.id}`}>
                    <p className="font-semibold text-sm truncate cursor-pointer hover:underline">{userHandle(u)}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{displayName(u)}</p>
                </div>
                {u.id !== user.id && (
                  <Button size="sm" onClick={() => followMutation.mutate(u.id)} className="rounded-lg font-semibold" data-testid={`button-follow-${u.id}`}>Follow</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

function FullLoader() {
  return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
}
