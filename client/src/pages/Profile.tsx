import { useParams, Redirect, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Grid3x3, Bookmark, Film, MessageCircle, Camera, Link as LinkIcon, MapPin, Heart, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { useState } from "react";
import { useProfile, useToggleFollow } from "@/hooks/use-social";
import type { PostWithRelations } from "@shared/schema";
import { renderRich } from "@/lib/format";

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data: profile, isLoading: pLoading } = useProfile(id);
  const { data: userPosts, isLoading: postsLoading } = useQuery<PostWithRelations[]>({
    queryKey: [`/api/posts/user/${id}`],
    queryFn: async () => {
      const r = await fetch(`/api/posts/user/${id}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!id,
  });
  const followMutation = useToggleFollow();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"posts" | "saved" | "tagged">("posts");

  if (pLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
        </div>
      </Layout>
    );
  }

  const isMe = me?.id === profile.id;
  const allPosts = userPosts ?? [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12 pb-8 border-b border-border">
          <div className="ig-ring shrink-0">
            <div className="bg-background rounded-full p-1">
              <Avatar className="w-24 h-24 md:w-36 md:h-36" data-testid="img-profile-avatar">
                <AvatarImage src={profile.profileImageUrl || undefined} />
                <AvatarFallback className="text-3xl bg-secondary">{userInitial(profile)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-xl font-light" data-testid="text-username">{userHandle(profile)}</h1>
                {profile.verified && <span className="text-primary text-base">✓</span>}
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {isMe ? (
                  <>
                    <Button asChild variant="secondary" size="sm" className="rounded-lg font-semibold" data-testid="button-edit-profile">
                      <Link href="/settings/profile">Edit profile</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="rounded-lg font-semibold" data-testid="button-view-archive">
                      <Link href="/saved">View archive</Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="rounded-lg" data-testid="button-settings">
                      <Link href="/settings"><Settings className="w-5 h-5" /></Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => followMutation.mutate(profile.id)}
                      disabled={followMutation.isPending}
                      variant={profile.isFollowing ? "secondary" : "default"}
                      className="rounded-lg font-semibold"
                      data-testid="button-follow"
                    >
                      {profile.isFollowing ? (<><UserCheck className="w-4 h-4 mr-1" /> Following</>) : (profile.isFollowedBy ? "Follow back" : "Follow")}
                    </Button>
                    <Button onClick={() => navigate(`/messages/${profile.id}`)} variant="secondary" size="sm" className="rounded-lg font-semibold gap-2" data-testid="button-message">
                      <MessageCircle className="w-4 h-4" /> Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center md:justify-start gap-8 text-sm">
              <span data-testid="text-post-count"><strong className="font-semibold">{profile.postCount}</strong> posts</span>
              <Link href={`/profile/${profile.id}/followers`}>
                <span className="cursor-pointer hover:underline" data-testid="text-follower-count"><strong className="font-semibold">{profile.followerCount}</strong> followers</span>
              </Link>
              <Link href={`/profile/${profile.id}/following`}>
                <span className="cursor-pointer hover:underline" data-testid="text-following-count"><strong className="font-semibold">{profile.followingCount}</strong> following</span>
              </Link>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-sm">{displayName(profile)}</p>
              {profile.bio && <p className="text-sm whitespace-pre-wrap" data-testid="text-bio">{renderRich(profile.bio)}</p>}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-muted-foreground">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1" data-testid="link-website">
                    <LinkIcon className="w-3.5 h-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1" data-testid="text-location"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-12 border-b border-border -mt-px">
          {[
            { key: "posts", Icon: Grid3x3, label: "Posts" },
            ...(isMe ? [{ key: "saved" as const, Icon: Bookmark, label: "Saved" }] : []),
            { key: "tagged" as const, Icon: Film, label: "Tagged" },
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

        {tab === "saved" && isMe ? (
          <SavedGrid />
        ) : (
          <div className="mt-1">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-secondary animate-pulse" />)}
              </div>
            ) : tab === "tagged" ? (
              <EmptyState Icon={Film} label="No tagged posts" />
            ) : allPosts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-light mb-2">{isMe ? "Share Photos" : "No Posts Yet"}</h3>
                {isMe && <p className="text-sm text-muted-foreground">When you share photos, they'll appear on your profile.</p>}
              </div>
            ) : (
              <PostGrid posts={allPosts} />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function SavedGrid() {
  const { data, isLoading } = useQuery<PostWithRelations[]>({ queryKey: ["/api/posts/saved"] });
  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!data || data.length === 0) return <EmptyState Icon={Bookmark} label="No saved posts yet" />;
  return <PostGrid posts={data} />;
}

function PostGrid({ posts }: { posts: PostWithRelations[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 mt-1">
      {posts.map(p => (
        <div key={p.id} className="relative aspect-square bg-secondary group cursor-pointer overflow-hidden" data-testid={`grid-post-${p.id}`}>
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
