import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  pinned: boolean("pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"), // for threaded replies
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: text("author_id").notNull(),
});

export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  userId: text("user_id").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id").notNull(),
  followingId: text("following_id").notNull(),
  status: text("status").default("accepted").notNull(), // accepted | pending
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: text("blocker_id").notNull(),
  blockedId: text("blocked_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  reaction: text("reaction"), // emoji
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  actorId: text("actor_id").notNull(),
  type: text("type").notNull(), // like | comment | message | follow | mention | comment_like
  postId: integer("post_id"),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  authorId: text("author_id").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption").notNull(),
  audioName: text("audio_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoLikes = pgTable("video_likes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  authorId: text("author_id").notNull(),
});

// === Relations ===
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  likes: many(commentLikes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  author: one(users, { fields: [likes.authorId], references: [users.id] }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, { fields: [commentLikes.commentId], references: [comments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  post: one(posts, { fields: [bookmarks.postId], references: [posts.id] }),
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id] }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  author: one(users, { fields: [videos.authorId], references: [users.id] }),
  likes: many(videoLikes),
}));

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
  video: one(videos, { fields: [videoLikes.videoId], references: [videos.id] }),
  author: one(users, { fields: [videoLikes.authorId], references: [users.id] }),
}));

// === Insert schemas ===
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, pinned: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, read: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const updateProfileSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, _ and . only").optional(),
  firstName: z.string().max(50).optional().nullable(),
  lastName: z.string().max(50).optional().nullable(),
  bio: z.string().max(150).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  location: z.string().max(100).optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isPrivate: z.boolean().optional(),
  hideLikes: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["en", "ar"]).optional(),
});

// === Types ===
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type CommentLike = typeof commentLikes.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type VideoLike = typeof videoLikes.$inferSelect;

export type CommentWithAuthor = Comment & {
  author: typeof users.$inferSelect;
  likeCount?: number;
  hasLiked?: boolean;
};

export type PostWithRelations = Post & {
  author: typeof users.$inferSelect;
  comments: CommentWithAuthor[];
  likes: Like[];
  hasLiked?: boolean;
  likeCount?: number;
  hasBookmarked?: boolean;
};

export type MessageWithUsers = Message & {
  sender: typeof users.$inferSelect;
  receiver: typeof users.$inferSelect;
};

export type NotificationWithActor = Notification & {
  actor: typeof users.$inferSelect;
};

export type VideoWithRelations = Video & {
  author: typeof users.$inferSelect;
  likes: VideoLike[];
  likeCount: number;
  hasLiked: boolean;
};

export type ConversationPreview = {
  user: typeof users.$inferSelect;
  lastMessage: Message;
  unreadCount: number;
};

export type UserProfile = typeof users.$inferSelect & {
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
};
