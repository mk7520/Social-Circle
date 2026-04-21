import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { NotificationWithActor } from "@shared/schema";

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  useEffect(() => {
    if (data && data.some(n => !n.read)) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  // Group by day
  const groups: { label: string; items: NotificationWithActor[] }[] = [];
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const today: NotificationWithActor[] = [];
  const week: NotificationWithActor[] = [];
  const earlier: NotificationWithActor[] = [];
  (data ?? []).forEach(n => {
    const age = now - new Date(n.createdAt).getTime();
    if (age < day) today.push(n);
    else if (age < 7 * day) week.push(n);
    else earlier.push(n);
  });
  if (today.length) groups.push({ label: "Today", items: today });
  if (week.length) groups.push({ label: "This week", items: week });
  if (earlier.length) groups.push({ label: "Earlier", items: earlier });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-xl font-bold mb-2" data-testid="text-page-title">Notifications</h1>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center" data-testid="empty-notifications">
            <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-light mb-1">Activity On Your Posts</h3>
            <p className="text-sm text-muted-foreground">When someone likes or comments on one of your posts, you'll see it here.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {groups.map(g => (
              <section key={g.label}>
                <h2 className="text-sm font-semibold mb-2 px-1">{g.label}</h2>
                <ul className="space-y-1">
                  {g.items.map(n => {
                    const href = n.type === "message"
                      ? `/messages/${n.actorId}`
                      : `/profile/${n.actorId}`;
                    return (
                      <li key={n.id}>
                        <Link href={href}>
                          <div
                            className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary/50 cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                            data-testid={`notification-${n.id}`}
                          >
                            <Avatar className="w-11 h-11">
                              <AvatarImage src={n.actor.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-secondary text-xs">{userInitial(n.actor)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-semibold">{userHandle(n.actor)}</span>{" "}
                                <span className="text-foreground/80">{n.message}.</span>{" "}
                                <span className="text-muted-foreground text-xs">
                                  {formatDistanceToNow(new Date(n.createdAt))}
                                </span>
                              </p>
                            </div>
                            {n.type !== "message" && (
                              <Button size="sm" variant="secondary" className="rounded-lg font-semibold text-xs h-8" data-testid={`button-followback-${n.id}`}>Follow</Button>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
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
