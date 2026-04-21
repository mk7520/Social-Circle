import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLikePost, useUnlikePost, useAddComment } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { z } from "zod";
import type { api } from "@shared/routes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";

type Post = z.infer<typeof api.posts.list.responses[200]>[0];

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const commentMutation = useAddComment();

  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  const isLiked = post.hasLiked;
  const isPending = likeMutation.isPending || unlikeMutation.isPending;

  const handleLike = () => {
    if (!user) return;
    if (isLiked) unlikeMutation.mutate(post.id);
    else likeMutation.mutate(post.id);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(
      { postId: post.id, content: commentText },
      { onSuccess: () => setCommentText("") }
    );
  };

  const visibleComments = showAllComments ? post.comments : post.comments.slice(0, 2);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: false });

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-card border border-border rounded-xl overflow-hidden mb-6"
      data-testid={`post-${post.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.authorId}`}>
            <div className="ig-ring cursor-pointer">
              <div className="bg-background rounded-full p-[1.5px]">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={post.author.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">{userInitial(post.author)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </Link>
          <div className="flex flex-col leading-tight">
            <Link href={`/profile/${post.authorId}`}>
              <span className="text-sm font-semibold hover:underline cursor-pointer" data-testid={`text-author-${post.id}`}>
                {userHandle(post.author)}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">{displayName(post.author)} · {timeAgo}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full text-foreground/70" data-testid={`button-more-${post.id}`}>
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      {post.imageUrl ? (
        <div className="relative w-full aspect-square bg-secondary/40 overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
            onDoubleClick={handleLike}
            data-testid={`img-post-${post.id}`}
          />
        </div>
      ) : (
        <div className="px-5 pb-3">
          <p className="text-base whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            disabled={isPending || !user}
            className="p-2 hover:opacity-60 transition-opacity"
            data-testid={`button-like-${post.id}`}
          >
            <Heart
              className={cn("w-7 h-7 transition-transform active:scale-90", isLiked && "fill-rose-500 text-rose-500")}
              strokeWidth={isLiked ? 0 : 1.8}
            />
          </button>
          <button className="p-2 hover:opacity-60 transition-opacity" data-testid={`button-comment-${post.id}`}>
            <MessageCircle className="w-7 h-7 -scale-x-100" strokeWidth={1.8} />
          </button>
          <button className="p-2 hover:opacity-60 transition-opacity" data-testid={`button-share-${post.id}`}>
            <Send className="w-7 h-7" strokeWidth={1.8} />
          </button>
        </div>
        <button
          onClick={() => setBookmarked(b => !b)}
          className="p-2 hover:opacity-60 transition-opacity"
          data-testid={`button-bookmark-${post.id}`}
        >
          <Bookmark className={cn("w-7 h-7", bookmarked && "fill-foreground")} strokeWidth={1.8} />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4">
        <p className="text-sm font-semibold" data-testid={`text-likes-${post.id}`}>
          {post.likeCount?.toLocaleString() ?? 0} {post.likeCount === 1 ? "like" : "likes"}
        </p>
      </div>

      {/* Caption (only when there's an image so text isn't duplicated) */}
      {post.imageUrl && post.content && (
        <div className="px-4 mt-1">
          <p className="text-sm">
            <Link href={`/profile/${post.authorId}`}>
              <span className="font-semibold mr-2 cursor-pointer hover:underline">{userHandle(post.author)}</span>
            </Link>
            <span className="whitespace-pre-wrap">{post.content}</span>
          </p>
        </div>
      )}

      {/* Comments preview */}
      {post.comments.length > 0 && (
        <div className="px-4 mt-1">
          {!showAllComments && post.comments.length > 2 && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-sm text-muted-foreground hover:underline"
              data-testid={`button-view-all-${post.id}`}
            >
              View all {post.comments.length} comments
            </button>
          )}
          <div className="space-y-1 mt-1">
            <AnimatePresence initial={false}>
              {visibleComments.map(c => (
                <motion.p
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm"
                  data-testid={`comment-${c.id}`}
                >
                  <Link href={`/profile/${c.authorId}`}>
                    <span className="font-semibold mr-2 cursor-pointer hover:underline">{userHandle(c.author)}</span>
                  </Link>
                  <span>{c.content}</span>
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Time */}
      <div className="px-4 pt-2 pb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{timeAgo} ago</span>
      </div>

      {/* Comment input */}
      {user && (
        <form
          onSubmit={handleComment}
          className="border-t border-border flex items-center px-4 py-2 gap-2"
        >
          <Smile className="w-6 h-6 text-foreground/70 shrink-0" />
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            data-testid={`input-comment-${post.id}`}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || commentMutation.isPending}
            className="text-sm font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid={`button-post-comment-${post.id}`}
          >
            Post
          </button>
        </form>
      )}
    </motion.article>
  );
}
