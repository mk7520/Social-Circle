import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Plus, Loader2, Play, Video as VideoIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { displayName, userInitial } from "@/lib/user-utils";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithRelations } from "@shared/schema";

export default function Videos() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: videos, isLoading } = useQuery<VideoWithRelations[]>({ queryKey: ["/api/videos"] });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <main className="max-w-md mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2" data-testid="text-page-title">
            <VideoIcon className="w-6 h-6 text-primary" /> Shorts
          </h1>
          <UploadButton />
        </div>

        {isLoading ? (
          <div className="h-[80vh] rounded-3xl bg-white/5 animate-pulse" />
        ) : !videos || videos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="snap-y snap-mandatory overflow-y-auto h-[calc(100vh-9rem)] rounded-3xl space-y-4 hide-scrollbar">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </main>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}

function VideoCard({ video }: { video: VideoWithRelations }) {
  const queryClient = useQueryClient();
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

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
    <div className="snap-start relative h-[calc(100vh-9rem)] rounded-3xl overflow-hidden bg-neutral-900" data-testid={`video-${video.id}`}>
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
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
        data-testid={`button-mute-${video.id}`}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
        <Link href={`/profile/${video.authorId}`}>
          <div className="flex items-center gap-3 mb-3 cursor-pointer">
            <Avatar className="w-9 h-9 border-2 border-white">
              <AvatarImage src={video.author.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitial(video.author)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-white drop-shadow" data-testid={`text-video-author-${video.id}`}>
              {displayName(video.author)}
            </span>
          </div>
        </Link>
        <p className="text-sm text-white/90 leading-relaxed line-clamp-3" data-testid={`text-caption-${video.id}`}>
          {video.caption}
        </p>
      </div>

      {/* Right rail actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <button onClick={() => like.mutate()} className="flex flex-col items-center gap-1" data-testid={`button-like-video-${video.id}`}>
          <div className={`w-12 h-12 rounded-full backdrop-blur flex items-center justify-center transition-all ${video.hasLiked ? "bg-rose-500" : "bg-black/40"}`}>
            <Heart className={`w-6 h-6 ${video.hasLiked ? "fill-white text-white" : "text-white"}`} />
          </div>
          <span className="text-xs font-semibold drop-shadow">{video.likeCount}</span>
        </button>
        <button className="flex flex-col items-center gap-1" data-testid={`button-comment-video-${video.id}`}>
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold drop-shadow">0</span>
        </button>
        <button className="flex flex-col items-center gap-1" data-testid={`button-share-video-${video.id}`}>
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold drop-shadow">Share</span>
        </button>
      </div>
    </div>
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
      const res = await apiRequest("POST", "/api/videos", {
        videoUrl, caption,
        thumbnailUrl: thumbnailUrl || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setVideoUrl(""); setCaption(""); setThumbnailUrl(""); setOpen(false);
      toast({ title: "Video posted", description: "Your short is live!" });
    },
    onError: () => toast({ title: "Failed", description: "Could not upload video.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1" data-testid="button-upload-video">
          <Plus className="w-4 h-4" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Post a short video</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (videoUrl && caption) create.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Video URL (mp4)</label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." required data-testid="input-video-url" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Thumbnail URL (optional)</label>
            <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." data-testid="input-thumbnail-url" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Caption</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Describe your video..." required data-testid="input-caption" />
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full rounded-full" data-testid="button-submit-video">
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center" data-testid="empty-videos">
      <VideoIcon className="w-12 h-12 mx-auto text-white/30 mb-4" />
      <p className="font-medium">No shorts yet</p>
      <p className="text-sm text-white/60 mt-1">Be the first to post.</p>
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
