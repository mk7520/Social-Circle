import { useState } from "react";
import { useCreatePost } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { userInitial, userHandle } from "@/lib/user-utils";
import { useLocation } from "wouter";

interface CreatePostProps {
  /** Render as a full-page composer (Instagram-style) */
  fullPage?: boolean;
  onDone?: () => void;
}

export function CreatePost({ fullPage = false, onDone }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const [, navigate] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost.mutate(
      { content, imageUrl: imageUrl || undefined },
      {
        onSuccess: () => {
          setContent(""); setImageUrl("");
          toast({ title: "Shared", description: "Your post is now in the feed." });
          onDone?.();
          if (fullPage) navigate("/");
        },
        onError: () => toast({ title: "Error", description: "Failed to share post.", variant: "destructive" }),
      }
    );
  };

  if (!user) return null;

  if (fullPage) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Create new post</h1>
          <Button
            onClick={handleSubmit}
            disabled={createPost.isPending || !content.trim()}
            variant="ghost"
            className="text-primary font-bold hover:text-primary/80"
            data-testid="button-share-post"
          >
            {createPost.isPending ? "Sharing..." : "Share"}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 bg-card border border-border rounded-2xl overflow-hidden">
          {/* Preview */}
          <div className="aspect-square bg-secondary/50 flex items-center justify-center relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Paste an image URL to preview</p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-xs">{userInitial(user)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{userHandle(user)}</span>
            </div>

            <Textarea
              placeholder="Write a caption..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[140px] resize-none border-none bg-transparent focus-visible:ring-0 px-0 text-base"
              data-testid="input-caption"
            />

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Image URL (optional)</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 rounded-xl"
                data-testid="input-image-url"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline compact composer (used in feed)
  const [showImageInput, setShowImageInput] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-secondary">{userInitial(user)}</AvatarFallback>
          </Avatar>
          <Textarea
            placeholder={`What's on your mind, ${userHandle(user)}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none border-none bg-secondary/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30"
            data-testid="input-quick-post"
          />
        </div>

        <AnimatePresence>
          {showImageInput && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative">
              <Input
                placeholder="Image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-xl"
                data-testid="input-quick-image"
              />
              <button type="button" onClick={() => { setShowImageInput(false); setImageUrl(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowImageInput(s => !s)} className={showImageInput ? "text-primary" : "text-foreground/70"} data-testid="button-toggle-image">
            <ImageIcon className="w-5 h-5 mr-2" />
            Photo
          </Button>
          <Button type="submit" disabled={createPost.isPending || !content.trim()} className="rounded-full font-semibold" data-testid="button-share">
            {createPost.isPending ? "Sharing..." : "Share"}
          </Button>
        </div>
      </form>
    </div>
  );
}
