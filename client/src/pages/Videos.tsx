import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Plus, Loader2, Play, Music2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { VideoWithRelations } from "@shared/schema";

export default function Videos() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: videos, isLoading } = useQuery<VideoWithRelations[]>({ queryKey: ["/api/videos"] });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout noRightRail>
      <div className="bg-black text-white min-h-screen">
        <div className="max-w-md mx-auto pt-4 pb-20 md:py-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h1 className="text-xl font-bold" data-testid="text-page-title">Reels</h1>
            <UploadButton />
          </div>

          {isLoading ? (
            <div className="h-[80vh] mx-4 rounded-xl bg-white/5 animate-pulse" />
          ) : !videos || videos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="snap-y snap-mandatory overflow-y-auto h-[calc(100vh-7.5rem)] md:h-[calc(100vh-5rem)] scrollbar-hide rounded-xl">
              {videos.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function VideoCard({ video }: { video: VideoWithRelations }) {
  const queryClient = useQueryClient();
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.play().then(() => setPlaying(true)).catch(() => {});
      } else {
        el.pause(); setPlaying(false);
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const like = useMutation({
    mutationFn: () => apiRequest("POST", `/api/videos/${video.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/videos"] }),
  });

  const togglePlay = () => {
    const el = ref.current; if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  };

  return (
    <div className="snap-start relative h-[calc(100vh-7.5rem)] md:h-[calc(100vh-5rem)] mx-2 mb-2 rounded-xl overflow-hidden bg-neutral-950" data-testid={`video-${video.id}`}>
      <video
        ref={ref}
        src={video.videoUrl}
        poster={video.thumbnailUrl || undefined}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
      />

      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-20 h-20 text-white/80 fill-white/80" />
        </button>
      )}

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white">
        <span className="font-bold text-lg drop-shadow">Reels</span>
        <button onClick={() => setMuted(m => !m)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center" data-testid={`button-mute-${video.id}`}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/profile/${video.authorId}`}>
            <Avatar className="w-9 h-9 border-2 border-white cursor-pointer">
              <AvatarImage src={video.author.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitial(video.author)}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/profile/${video.authorId}`}>
            <span className="font-semibold drop-shadow cursor-pointer" data-testid={`text-video-author-${video.id}`}>
              {userHandle(video.author)}
            </span>
          </Link>
          <Button size="sm" variant="outline" className="rounded-lg h-7 px-3 text-xs border-white/80 text-white hover:bg-white hover:text-black bg-transparent" data-testid={`button-follow-${video.id}`}>
            Follow
          </Button>
        </div>
        <p className="text-sm leading-relaxed line-clamp-2 mb-2 drop-shadow" data-testid={`text-caption-${video.id}`}>{video.caption}</p>
        <div className="flex items-center gap-2 text-xs">
          <Music2 className="w-3 h-3" />
          <span className="truncate">Original audio · {displayName(video.author)}</span>
        </div>
      </div>

      {/* Right rail */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5 text-white">
        <RailButton onClick={() => like.mutate()} testId={`button-like-video-${video.id}`}>
          <Heart className={cn("w-7 h-7 drop-shadow", video.hasLiked && "fill-rose-500 text-rose-500")} strokeWidth={video.hasLiked ? 0 : 2} />
          <span className="text-xs font-semibold drop-shadow">{video.likeCount}</span>
        </RailButton>
        <RailButton testId={`button-comment-video-${video.id}`}>
          <MessageCircle className="w-7 h-7 drop-shadow -scale-x-100" strokeWidth={2} />
          <span className="text-xs font-semibold drop-shadow">0</span>
        </RailButton>
        <RailButton testId={`button-share-video-${video.id}`}>
          <Send className="w-7 h-7 drop-shadow" strokeWidth={2} />
        </RailButton>
        <RailButton testId={`button-bookmark-video-${video.id}`} onClick={() => setBookmarked(b => !b)}>
          <Bookmark className={cn("w-7 h-7 drop-shadow", bookmarked && "fill-white")} strokeWidth={2} />
        </RailButton>
        <RailButton testId={`button-more-video-${video.id}`}>
          <MoreHorizontal className="w-7 h-7 drop-shadow" strokeWidth={2} />
        </RailButton>
        <Link href={`/profile/${video.authorId}`}>
          <div className="w-7 h-7 rounded border-2 border-white overflow-hidden">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={video.author.profileImageUrl || undefined} />
              <AvatarFallback className="rounded-none text-[10px] bg-primary">{userInitial(video.author)}</AvatarFallback>
            </Avatar>
          </div>
        </Link>
      </div>
    </div>
  );
}

function RailButton({ children, onClick, testId }: { children: React.ReactNode; onClick?: () => void; testId?: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1" data-testid={testId}>
      {children}
    </button>
  );
}

function UploadButton() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/videos", { videoUrl, caption, thumbnailUrl: thumbnailUrl || undefined });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setVideoUrl(""); setCaption(""); setThumbnailUrl(""); setOpen(false);
      toast({ title: "Posted", description: "Your reel is live." });
    },
    onError: () => toast({ title: "Failed", description: "Could not upload video.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1 h-8" data-testid="button-upload-video">
          <Plus className="w-4 h-4" /> New reel
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader><DialogTitle>Create new reel</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (videoUrl && caption) create.mutate(); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Video URL (mp4)</label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." required data-testid="input-video-url" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Thumbnail URL (optional)</label>
            <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." data-testid="input-thumbnail-url" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Caption</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." required data-testid="input-caption" />
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full rounded-lg" data-testid="button-submit-video">
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share reel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="mx-4 rounded-xl border border-dashed border-white/20 p-12 text-center" data-testid="empty-videos">
      <Play className="w-12 h-12 mx-auto text-white/30 mb-4" />
      <p className="font-medium">No reels yet</p>
      <p className="text-sm text-white/60 mt-1">Be the first to post a short video.</p>
    </div>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
