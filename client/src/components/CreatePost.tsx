import { useState } from "react";
import { useCreatePost } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { userInitial } from "@/lib/user-utils";

export function CreatePost() {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const createPost = useCreatePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPost.mutate(
      { content, imageUrl: imageUrl || undefined },
      {
        onSuccess: () => {
          setContent("");
          setImageUrl("");
          setShowImageInput(false);
          toast({
            title: "Post created",
            description: "Your thoughts have been shared with the world.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create post. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!user) return null;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 mb-8">
      <div className="flex gap-4">
        <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {userInitial(user)}
          </AvatarFallback>
        </Avatar>
        
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="relative">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-none bg-secondary/50 focus:bg-background focus:ring-2 ring-primary/20 rounded-xl transition-all p-4 text-base placeholder:text-muted-foreground/70"
            />
          </div>

          <AnimatePresence>
            {showImageInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Enter image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-secondary/30 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowImageInput(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageInput(!showImageInput)}
                className={showImageInput ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}
              >
                <Image className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={createPost.isPending || !content.trim()}
              className="rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {createPost.isPending ? "Posting..." : (
                <>
                  Post <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
