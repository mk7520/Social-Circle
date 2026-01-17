import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";
import {
  users, posts, comments, likes,
  type User, type Post, type Comment, type Like,
  type PostWithRelations
} from "@shared/schema";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Posts
  getAllPosts(currentUserId?: string): Promise<PostWithRelations[]>;
  getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined>;
  createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post>;
  
  // Likes
  toggleLike(postId: number, userId: string): Promise<boolean>; // Returns true if liked, false if unliked
  
  // Comments
  createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment & { author: User }>;
  getComments(postId: number): Promise<(Comment & { author: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // Inherit auth methods
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);

  async getAllPosts(currentUserId?: string): Promise<PostWithRelations[]> {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
    
    // In a real app we'd do a more complex join, but for MVP we can enrich in memory or use drizzle's query builder
    // Using Drizzle Query Builder (Relational API) is cleaner if configured, but let's stick to explicit queries for clarity if schema relations aren't perfect
    
    // Let's use the relational query API which is powerful
    const results = await db.query.posts.findMany({
      orderBy: [desc(posts.createdAt)],
      with: {
        author: true,
        comments: {
          with: { author: true },
          orderBy: [desc(comments.createdAt)]
        },
        likes: true,
      }
    });

    return results.map(post => ({
      ...post,
      likeCount: post.likes.length,
      hasLiked: currentUserId ? post.likes.some(l => l.authorId === currentUserId) : false,
      // Drizzle returns the relations, we just need to ensure types align
    })) as PostWithRelations[];
  }

  async getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined> {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: {
          with: { author: true },
          orderBy: [desc(comments.createdAt)]
        },
        likes: true,
      }
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
    const existingLike = await db.query.likes.findFirst({
      where: and(eq(likes.postId, postId), eq(likes.authorId, userId)),
    });

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      return false;
    } else {
      await db.insert(likes).values({ postId, authorId: userId });
      return true;
    }
  }

  async createComment(commentData: Omit<Comment, "id" | "createdAt">): Promise<Comment & { author: User }> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    
    // Fetch author details to return
    const author = await this.getUser(comment.authorId);
    if (!author) throw new Error("Author not found");

    return { ...comment, author };
  }

  async getComments(postId: number): Promise<(Comment & { author: User })[]> {
    return await db.query.comments.findMany({
      where: eq(comments.postId, postId),
      with: { author: true },
      orderBy: [desc(comments.createdAt)]
    }) as (Comment & { author: User })[];
  }
}

export const storage = new DatabaseStorage();
