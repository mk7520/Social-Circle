import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile,
  Trash2, Pin, Ban, Link as LinkIcon, Pencil,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLikePost, useUnlikePost, useAddComment } from "@/hooks/use-posts";
import { useToggleBookmark, useToggleCommentLike, useDeletePost, useTogglePin, useToggleBlock } from "@/hooks/use-social";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { renderRich } from "@/lib/format";
import type { PostWithRelations } from "@shared/schema";

interface PostCardProps {
  post: PostWithRelations;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const commentMutation = useAddComment();
  const bookmarkMutation = useToggleBookmark();
  const commentLikeMutation = useToggleCommentLike();
  const deletePost = useDeletePost();
  const togglePin = useTogglePin();
  const toggleBlock = useToggleBlock();

  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);

  const isLiked = post.hasLiked;
  const isBookmarked = !!post.hasBookmarked;
  const isMine = user?.id === post.authorId;
  const isPending = likeMutation.isPending || unlikeMutation.isPending;

  const handleLike = () => {
    if (!user) return;
    if (isLiked) unlikeMutation.mutate(post.id);
    else likeMutation.mutate(post.id);
  };

  const handleDoubleTap = () => {
    if (!user) return;
    if (!isLiked) likeMutation.mutate(post.id);
    setDoubleTapHeart(true);
    setTimeout(() => setDoubleTapHeart(false), 700);
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

  const showLikeCount = !post.author.hideLikes || isMine;

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
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/profile/${post.authorId}`}>
            <div className="ig-ring cursor-pointer shrink-0">
              <div className="bg-background rounded-full p-[1.5px]">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={post.author.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">{userInitial(post.author)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </Link>
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <Link href={`/profile/${post.authorId}`}>
                <span className="text-sm font-semibold hover:underline cursor-pointer truncate" data-testid={`text-author-${post.id}`}>
                  {userHandle(post.author)}
                </span>
              </Link>
              {post.author.verified && <span className="text-primary text-xs">✓</span>}
              {post.pinned && <Pin className="w-3 h-3 text-muted-foreground" />}
            </div>
            <span className="text-xs text-muted-foreground truncate">{displayName(post.author)} · {timeAgo}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-foreground/70 shrink-0" data-testid={`button-more-${post.id}`}>
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                toast({ title: "Link copied" });
              }}
              data-testid={`menu-copy-link-${post.id}`}
            >
              <LinkIcon className="w-4 h-4 mr-2" /> Copy link
            </DropdownMenuItem>
            {isMine ? (
              <>
                <DropdownMenuItem onClick={() => togglePin.mutate(post.id)} data-testid={`menu-pin-${post.id}`}>
                  <Pin className="w-4 h-4 mr-2" /> {post.pinned ? "Unpin from profile" : "Pin to profile"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm("Delete this post?")) deletePost.mutate(post.id);
                  }}
                  className="text-destructive focus:text-destructive"
                  data-testid={`menu-delete-${post.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={() => toggleBlock.mutate(post.authorId)}
                className="text-destructive focus:text-destructive"
                data-testid={`menu-block-${post.id}`}
              >
                <Ban className="w-4 h-4 mr-2" /> Block @{userHandle(post.author)}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      {post.imageUrl ? (
        <div className="relative w-full aspect-square bg-secondary/40 overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
            onDoubleClick={handleDoubleTap}
            data-testid={`img-post-${post.id}`}
          />
          <AnimatePresence>
            {doubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-32 h-32 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="px-5 pb-3">
          <p className="text-base whitespace-pre-wrap leading-relaxed">{renderRich(post.content)}</p>
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
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
              toast({ title: "Link copied" });
            }}
            className="p-2 hover:opacity-60 transition-opacity"
            data-testid={`button-share-${post.id}`}
          >
            <Send className="w-7 h-7" strokeWidth={1.8} />
          </button>
        </div>
        <button
          onClick={() => bookmarkMutation.mutate(post.id)}
          disabled={!user}
          className="p-2 hover:opacity-60 transition-opacity"
          data-testid={`button-bookmark-${post.id}`}
        >
          <Bookmark className={cn("w-7 h-7", isBookmarked && "fill-foreground")} strokeWidth={1.8} />
        </button>
      </div>

      {/* Likes count */}
      {showLikeCount && (
        <div className="px-4">
          <p className="text-sm font-semibold" data-testid={`text-likes-${post.id}`}>
            {(post.likeCount ?? 0).toLocaleString()} {post.likeCount === 1 ? "like" : "likes"}
          </p>
        </div>
      )}

      {/* Caption */}
      {post.imageUrl && post.content && (
        <div className="px-4 mt-1">
          <p className="text-sm">
            <Link href={`/profile/${post.authorId}`}>
              <span className="font-semibold mr-2 cursor-pointer hover:underline">{userHandle(post.author)}</span>
            </Link>
            <span className="whitespace-pre-wrap">{renderRich(post.content)}</span>
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
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start justify-between gap-2"
                  data-testid={`comment-${c.id}`}
                >
                  <p className="text-sm flex-1 min-w-0">
                    <Link href={`/profile/${c.authorId}`}>
                      <span className="font-semibold mr-2 cursor-pointer hover:underline">{userHandle(c.author)}</span>
                    </Link>
                    <span>{renderRich(c.content)}</span>
                    {(c.likeCount ?? 0) > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">{c.likeCount} {c.likeCount === 1 ? "like" : "likes"}</span>
                    )}
                  </p>
                  <button
                    onClick={() => commentLikeMutation.mutate(c.id)}
                    className="p-1 shrink-0 hover:opacity-60"
                    data-testid={`button-like-comment-${c.id}`}
                  >
                    <Heart className={cn("w-3 h-3", c.hasLiked && "fill-rose-500 text-rose-500")} strokeWidth={c.hasLiked ? 0 : 2} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="px-4 pt-2 pb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{timeAgo} ago</span>
      </div>

      {user && (
        <form onSubmit={handleComment} className="border-t border-border flex items-center px-4 py-2 gap-2">
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
