import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
  users, posts, comments, likes, messages, notifications, videos, videoLikes,
  type User, type Post, type Comment, type Like,
  type Message, type Notification, type Video, type VideoLike,
  type PostWithRelations, type MessageWithUsers, type NotificationWithActor,
  type VideoWithRelations, type ConversationPreview,
} from "@shared/schema";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  getAllPosts(currentUserId?: string): Promise<PostWithRelations[]>;
  getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined>;
  createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post>;
  toggleLike(postId: number, userId: string): Promise<boolean>;
  createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment & { author: User }>;
  getComments(postId: number): Promise<(Comment & { author: User })[]>;

  // Users
  listUsers(excludeId?: string): Promise<User[]>;

  // Messages
  getConversations(userId: string): Promise<ConversationPreview[]>;
  getMessagesBetween(userA: string, userB: string): Promise<MessageWithUsers[]>;
  sendMessage(msg: Omit<Message, "id" | "createdAt">): Promise<MessageWithUsers>;

  // Notifications
  getNotifications(userId: string): Promise<NotificationWithActor[]>;
  markNotificationsRead(userId: string): Promise<void>;
  createNotification(n: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification>;

  // Videos
  getAllVideos(currentUserId?: string): Promise<VideoWithRelations[]>;
  createVideo(v: Omit<Video, "id" | "createdAt">): Promise<Video>;
  toggleVideoLike(videoId: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);

  async getAllPosts(currentUserId?: string): Promise<PostWithRelations[]> {
    const results = await db.query.posts.findMany({
      orderBy: [desc(posts.createdAt)],
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [desc(comments.createdAt)] },
        likes: true,
      },
    });
    return results.map(p => ({
      ...p,
      likeCount: p.likes.length,
      hasLiked: currentUserId ? p.likes.some(l => l.authorId === currentUserId) : false,
    })) as PostWithRelations[];
  }

  async getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined> {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [desc(comments.createdAt)] },
        likes: true,
      },
    });
    if (!post) return undefined;
    return {
      ...post,
      likeCount: post.likes.length,
      hasLiked: currentUserId ? post.likes.some(l => l.authorId === currentUserId) : false,
    } as PostWithRelations;
  }

  async createPost(postData: Omit<Post, "id" | "createdAt">): Promise<Post> {
    const [post] = await db.insert(posts).values(postData).returning();
    return post;
  }

  async toggleLike(postId: number, userId: string): Promise<boolean> {
    const existing = await db.query.likes.findFirst({
      where: and(eq(likes.postId, postId), eq(likes.authorId, userId)),
    });
    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      return false;
    }
    await db.insert(likes).values({ postId, authorId: userId });

    // Notification to post author
    const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
    if (post && post.authorId !== userId) {
      await this.createNotification({
        userId: post.authorId,
        actorId: userId,
        type: "like",
        postId,
        message: "liked your post",
      });
    }
    return true;
  }

  async createComment(commentData: Omit<Comment, "id" | "createdAt">): Promise<Comment & { author: User }> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    const author = await this.getUser(comment.authorId);
    if (!author) throw new Error("Author not found");

    const post = await db.query.posts.findFirst({ where: eq(posts.id, commentData.postId) });
    if (post && post.authorId !== commentData.authorId) {
      await this.createNotification({
        userId: post.authorId,
        actorId: commentData.authorId,
        type: "comment",
        postId: commentData.postId,
        message: "commented on your post",
      });
    }
    return { ...comment, author };
  }

  async getComments(postId: number): Promise<(Comment & { author: User })[]> {
    return await db.query.comments.findMany({
      where: eq(comments.postId, postId),
      with: { author: true },
      orderBy: [desc(comments.createdAt)],
    }) as (Comment & { author: User })[];
  }

  async listUsers(excludeId?: string): Promise<User[]> {
    const all = await db.select().from(users);
    return excludeId ? all.filter(u => u.id !== excludeId) : all;
  }

  async getConversations(userId: string): Promise<ConversationPreview[]> {
    const all = await db.query.messages.findMany({
      where: or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
      with: { sender: true, receiver: true },
      orderBy: [desc(messages.createdAt)],
    });
    const map = new Map<string, ConversationPreview>();
    for (const m of all) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      const other = m.senderId === userId ? m.receiver : m.sender;
      if (!map.has(otherId)) {
        map.set(otherId, { user: other, lastMessage: m, unreadCount: 0 });
      }
    }
    return Array.from(map.values());
  }

  async getMessagesBetween(userA: string, userB: string): Promise<MessageWithUsers[]> {
    return await db.query.messages.findMany({
      where: or(
        and(eq(messages.senderId, userA), eq(messages.receiverId, userB)),
        and(eq(messages.senderId, userB), eq(messages.receiverId, userA)),
      ),
      with: { sender: true, receiver: true },
      orderBy: [messages.createdAt],
    }) as MessageWithUsers[];
  }

  async sendMessage(data: Omit<Message, "id" | "createdAt">): Promise<MessageWithUsers> {
    const [m] = await db.insert(messages).values(data).returning();
    const sender = await this.getUser(m.senderId);
    const receiver = await this.getUser(m.receiverId);
    if (!sender || !receiver) throw new Error("User not found");

    if (data.senderId !== data.receiverId) {
      await this.createNotification({
        userId: data.receiverId,
        actorId: data.senderId,
        type: "message",
        postId: null,
        message: "sent you a message",
      });
    }
    return { ...m, sender, receiver };
  }

  async getNotifications(userId: string): Promise<NotificationWithActor[]> {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      with: { actor: true },
      orderBy: [desc(notifications.createdAt)],
    }) as NotificationWithActor[];
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async createNotification(n: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ ...n, read: false }).returning();
    return created;
  }

  async getAllVideos(currentUserId?: string): Promise<VideoWithRelations[]> {
    const results = await db.query.videos.findMany({
      orderBy: [desc(videos.createdAt)],
      with: { author: true, likes: true },
    });
    return results.map(v => ({
      ...v,
      likeCount: v.likes.length,
      hasLiked: currentUserId ? v.likes.some(l => l.authorId === currentUserId) : false,
    })) as VideoWithRelations[];
  }

  async createVideo(v: Omit<Video, "id" | "createdAt">): Promise<Video> {
    const [created] = await db.insert(videos).values(v).returning();
    return created;
  }

  async toggleVideoLike(videoId: number, userId: string): Promise<boolean> {
    const existing = await db.query.videoLikes.findFirst({
      where: and(eq(videoLikes.videoId, videoId), eq(videoLikes.authorId, userId)),
    });
    if (existing) {
      await db.delete(videoLikes).where(eq(videoLikes.id, existing.id));
      return false;
    }
    await db.insert(videoLikes).values({ videoId, authorId: userId });
    return true;
  }
}

export const storage = new DatabaseStorage();
