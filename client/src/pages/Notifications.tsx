import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Mail, UserPlus, Loader2, Bell, Redo } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { displayName, userInitial } from "@/lib/user-utils";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationWithActor } from "@shared/schema";

const ICONS: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  message: Mail,
  follow: UserPlus,
};
const COLORS: Record<string, string> = {
  like: "bg-rose-100 text-rose-600 dark:bg-rose-950/40",
  comment: "bg-blue-100 text-blue-600 dark:bg-blue-950/40",
  message: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40",
  follow: "bg-purple-100 text-purple-600 dark:bg-purple-950/40",
};

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

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-page-title">
              <Bell className="w-7 h-7 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">Stay up to date with your circle</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border/50" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center border border-dashed border-border" data-testid="empty-notifications">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-medium">You're all caught up</p>
            <p className="text-sm text-muted-foreground mt-1">New activity will show here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(n => {
              const Icon = ICONS[n.type] ?? Bell;
              const color = COLORS[n.type] ?? "bg-muted text-foreground";
              const href = n.type === "message"
                ? `/messages/${n.actorId}`
                : n.postId
                  ? `/`
                  : `/profile/${n.actorId}`;
              return (
                <Link key={n.id} href={href}>
                  <div
                    className={`group flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50 hover-elevate active-elevate-2 cursor-pointer transition-all ${!n.read ? "ring-2 ring-primary/20" : ""}`}
                    data-testid={`notification-${n.id}`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={n.actor.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">{userInitial(n.actor)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-card ${color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{displayName(n.actor)}</span>
                        <span className="text-muted-foreground"> {n.message}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
