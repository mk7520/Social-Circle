import { useParams, Redirect, Link } from "wouter";
import { useUser } from "@/hooks/use-users";
import { usePosts } from "@/hooks/use-posts";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Grid3x3, Bookmark, Film, MessageCircle, Camera } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { useState } from "react";

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data: profileUser, isLoading: userLoading } = useUser(id!);
  const { data: allPosts, isLoading: postsLoading } = usePosts();
  const [tab, setTab] = useState<"posts" | "saved" | "tagged">("posts");

  if (userLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
        </div>
      </Layout>
    );
  }

  const userPosts = (allPosts ?? []).filter(p => p.authorId === id);
  const isMe = me?.id === profileUser.id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 pb-8 border-b border-border">
          <div className="ig-ring shrink-0">
            <div className="bg-background rounded-full p-1">
              <Avatar className="w-24 h-24 md:w-36 md:h-36" data-testid="img-profile-avatar">
                <AvatarImage src={profileUser.profileImageUrl || undefined} />
                <AvatarFallback className="text-3xl bg-secondary">{userInitial(profileUser)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <h1 className="text-xl font-light" data-testid="text-username">{userHandle(profileUser)}</h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {isMe ? (
                  <>
                    <Button variant="secondary" size="sm" className="rounded-lg font-semibold" data-testid="button-edit-profile">Edit profile</Button>
                    <Button variant="secondary" size="sm" className="rounded-lg font-semibold" data-testid="button-view-archive">View archive</Button>
                    <Button variant="ghost" size="icon" className="rounded-lg" data-testid="button-settings">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="rounded-lg font-semibold" data-testid="button-follow">Follow</Button>
                    <Link href={`/messages/${profileUser.id}`}>
                      <Button variant="secondary" size="sm" className="rounded-lg font-semibold gap-2" data-testid="button-message">
                        <MessageCircle className="w-4 h-4" /> Message
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center md:justify-start gap-8 text-sm">
              <span><strong className="font-semibold">{userPosts.length}</strong> posts</span>
              <span><strong className="font-semibold">0</strong> followers</span>
              <span><strong className="font-semibold">0</strong> following</span>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-sm">{displayName(profileUser)}</p>
              <p className="text-sm text-muted-foreground">Sharing moments on Socially ✨</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-12 border-b border-border -mt-px">
          {[
            { key: "posts", Icon: Grid3x3, label: "Posts" },
            { key: "saved", Icon: Bookmark, label: "Saved" },
            { key: "tagged", Icon: Film, label: "Tagged" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-2 py-4 text-xs font-semibold uppercase tracking-wider border-t-2 transition-colors ${
                tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${t.key}`}
            >
              <t.Icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-1">
          {postsLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-secondary animate-pulse" />)}
            </div>
          ) : tab !== "posts" ? (
            <EmptyState Icon={tab === "saved" ? Bookmark : Film} label={tab === "saved" ? "No saved posts" : "No tagged posts"} />
          ) : userPosts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-light mb-2">{isMe ? "Share Photos" : "No Posts Yet"}</h3>
              {isMe && <p className="text-sm text-muted-foreground">When you share photos, they'll appear on your profile.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-1">
              {userPosts.map(p => (
                <div key={p.id} className="relative aspect-square bg-secondary group cursor-pointer overflow-hidden" data-testid={`grid-post-${p.id}`}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full p-3 flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
                      <p className="text-xs text-foreground/80 line-clamp-6">{p.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({ Icon, label }: { Icon: any; label: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-light">{label}</h3>
    </div>
  );
}
