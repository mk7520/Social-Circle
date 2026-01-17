import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLikePost, useUnlikePost, useAddComment } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { z } from "zod";
import type { api } from "@shared/routes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Post = z.infer<typeof api.posts.list.responses[200]>[0];

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const commentMutation = useAddComment();
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isLiked = post.hasLiked;
  const isPending = likeMutation.isPending || unlikeMutation.isPending;

  const handleLike = () => {
    if (!user) return; // Should probably redirect to login or show toast
    if (isLiked) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    commentMutation.mutate(
      { postId: post.id, content: commentText },
      {
        onSuccess: () => {
          setCommentText("");
        }
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300"
    >
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.authorId}`}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={post.author.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {post.author.firstName?.[0] || post.author.username[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.authorId}`}>
              <span className="font-semibold text-foreground hover:underline cursor-pointer block leading-tight">
                {post.author.firstName} {post.author.lastName}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">
              @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[15px]">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-2 relative bg-secondary/20">
          {/* Descriptive comment for dynamic image */}
          {/* Dynamic image from user post */}
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-border/40 mt-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isPending || !user}
            className={cn(
              "gap-2 rounded-full px-3 transition-colors",
              isLiked ? "text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            )}
          >
            <Heart className={cn("w-5 h-5 transition-transform", isLiked && "fill-current scale-110")} />
            <span className="font-medium">{post.likeCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 rounded-full px-3 text-muted-foreground hover:text-primary hover:bg-primary/5"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.comments.length}</span>
          </Button>
        </div>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-secondary/30 border-t border-border/40"
          >
            <div className="p-5 space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-sm">
                  <Link href={`/profile/${comment.authorId}`}>
                    <Avatar className="w-8 h-8 border border-border cursor-pointer mt-1">
                      <AvatarImage src={comment.author.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {comment.author.firstName?.[0] || comment.author.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="bg-background rounded-2xl p-3 shadow-sm border border-border/50 flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <Link href={`/profile/${comment.authorId}`}>
                        <span className="font-semibold text-xs hover:underline cursor-pointer">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-foreground/80">{comment.content}</p>
                  </div>
                </div>
              ))}

              {post.comments.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm italic">
                  No comments yet. Be the first!
                </div>
              )}

              {user && (
                <form onSubmit={handleComment} className="flex gap-3 mt-4 pt-2">
                  <Avatar className="w-8 h-8 border border-border mt-1">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user.firstName?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[40px] h-[40px] py-2 resize-none rounded-2xl bg-background border-border/80 focus:ring-primary/20"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
