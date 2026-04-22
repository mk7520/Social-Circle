import { db } from "./db";
import { eq, desc, and, or, sql, ilike, ne, inArray, asc } from "drizzle-orm";
import {
  users, posts, comments, likes, commentLikes, bookmarks, follows, blocks,
  messages, notifications, videos, videoLikes,
  type User, type Post, type Comment, type Like, type Bookmark, type Follow,
  type Message, type Notification, type Video, type VideoLike,
  type PostWithRelations, type MessageWithUsers, type NotificationWithActor,
  type VideoWithRelations, type ConversationPreview, type UserProfile, type CommentWithAuthor,
} from "@shared/schema";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Posts
  getAllPosts(currentUserId?: string): Promise<PostWithRelations[]>;
  getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined>;
  getUserPosts(authorId: string, currentUserId?: string): Promise<PostWithRelations[]>;
  getPostsByHashtag(tag: string, currentUserId?: string): Promise<PostWithRelations[]>;
  createPost(post: Omit<Post, "id" | "createdAt" | "pinned">): Promise<Post>;
  deletePost(id: number, userId: string): Promise<boolean>;
  togglePinPost(id: number, userId: string): Promise<boolean>;
  toggleLike(postId: number, userId: string): Promise<boolean>;
  toggleBookmark(postId: number, userId: string): Promise<boolean>;
  getBookmarkedPosts(userId: string): Promise<PostWithRelations[]>;

  // Comments
  createComment(c: Omit<Comment, "id" | "createdAt">): Promise<CommentWithAuthor>;
  toggleCommentLike(commentId: number, userId: string): Promise<boolean>;
  deleteComment(id: number, userId: string): Promise<boolean>;

  // Users / Profiles
  listUsers(excludeId?: string, search?: string): Promise<User[]>;
  getProfile(userId: string, currentUserId?: string): Promise<UserProfile | undefined>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;

  // Follow
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;

  // Block
  toggleBlock(blockerId: string, blockedId: string): Promise<boolean>;
  getBlocked(userId: string): Promise<User[]>;

  // Messages
  getConversations(userId: string): Promise<ConversationPreview[]>;
  getMessagesBetween(userA: string, userB: string): Promise<MessageWithUsers[]>;
  sendMessage(msg: Omit<Message, "id" | "createdAt" | "read">): Promise<MessageWithUsers>;
  markMessagesRead(userId: string, otherId: string): Promise<void>;
  setMessageReaction(messageId: number, userId: string, reaction: string | null): Promise<void>;

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

  // Helper: enrich post + comments with hasLiked/likeCount/hasBookmarked
  private async enrichPosts(rawPosts: any[], currentUserId?: string): Promise<PostWithRelations[]> {
    if (!rawPosts.length) return [];
    const postIds = rawPosts.map(p => p.id);
    const commentIds = rawPosts.flatMap(p => (p.comments ?? []).map((c: any) => c.id));

    const myBookmarks = currentUserId
      ? await db.select().from(bookmarks).where(and(eq(bookmarks.userId, currentUserId), inArray(bookmarks.postId, postIds)))
      : [];
    const bookmarkedSet = new Set(myBookmarks.map(b => b.postId));

    const allCommentLikes = commentIds.length
      ? await db.select().from(commentLikes).where(inArray(commentLikes.commentId, commentIds))
      : [];
    const cLikeCount: Record<number, number> = {};
    const cMyLike: Record<number, boolean> = {};
    for (const cl of allCommentLikes) {
      cLikeCount[cl.commentId] = (cLikeCount[cl.commentId] ?? 0) + 1;
      if (currentUserId && cl.userId === currentUserId) cMyLike[cl.commentId] = true;
    }

    return rawPosts.map(p => ({
      ...p,
      likeCount: p.likes.length,
      hasLiked: currentUserId ? p.likes.some((l: Like) => l.authorId === currentUserId) : false,
      hasBookmarked: bookmarkedSet.has(p.id),
      comments: (p.comments ?? []).map((c: any) => ({
        ...c,
        likeCount: cLikeCount[c.id] ?? 0,
        hasLiked: !!cMyLike[c.id],
      })),
    })) as PostWithRelations[];
  }

  async getAllPosts(currentUserId?: string): Promise<PostWithRelations[]> {
    const blockedIds = currentUserId ? (await this.getBlocked(currentUserId)).map(b => b.id) : [];
    const results = await db.query.posts.findMany({
      orderBy: [desc(posts.pinned), desc(posts.createdAt)],
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [asc(comments.createdAt)] },
        likes: true,
      },
    });
    const filtered = results.filter(p => !blockedIds.includes(p.authorId));
    return this.enrichPosts(filtered, currentUserId);
  }

  async getPost(id: number, currentUserId?: string): Promise<PostWithRelations | undefined> {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [asc(comments.createdAt)] },
        likes: true,
      },
    });
    if (!post) return undefined;
    const [enriched] = await this.enrichPosts([post], currentUserId);
    return enriched;
  }

  async getUserPosts(authorId: string, currentUserId?: string): Promise<PostWithRelations[]> {
    const results = await db.query.posts.findMany({
      where: eq(posts.authorId, authorId),
      orderBy: [desc(posts.pinned), desc(posts.createdAt)],
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [asc(comments.createdAt)] },
        likes: true,
      },
    });
    return this.enrichPosts(results, currentUserId);
  }

  async getPostsByHashtag(tag: string, currentUserId?: string): Promise<PostWithRelations[]> {
    const results = await db.query.posts.findMany({
      where: ilike(posts.content, `%#${tag}%`),
      orderBy: [desc(posts.createdAt)],
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [asc(comments.createdAt)] },
        likes: true,
      },
    });
    return this.enrichPosts(results, currentUserId);
  }

  async createPost(postData: Omit<Post, "id" | "createdAt" | "pinned">): Promise<Post> {
    const [post] = await db.insert(posts).values(postData).returning();
    // Mention notifications
    const mentions = Array.from(new Set(Array.from(postData.content.matchAll(/@([a-zA-Z0-9_.]+)/g)).map(m => m[1])));
    if (mentions.length) {
      const mentionedUsers = await db.select().from(users).where(inArray(users.username, mentions));
      for (const u of mentionedUsers) {
        if (u.id !== postData.authorId) {
          await this.createNotification({
            userId: u.id, actorId: postData.authorId,
            type: "mention", postId: post.id, message: "mentioned you in a post",
          });
        }
      }
    }
    return post;
  }

  async deletePost(id: number, userId: string): Promise<boolean> {
    const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!post || post.authorId !== userId) return false;
    await db.delete(likes).where(eq(likes.postId, id));
    await db.delete(bookmarks).where(eq(bookmarks.postId, id));
    const postComments = await db.select().from(comments).where(eq(comments.postId, id));
    if (postComments.length) {
      await db.delete(commentLikes).where(inArray(commentLikes.commentId, postComments.map(c => c.id)));
      await db.delete(comments).where(eq(comments.postId, id));
    }
    await db.delete(notifications).where(eq(notifications.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
    return true;
  }

  async togglePinPost(id: number, userId: string): Promise<boolean> {
    const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!post || post.authorId !== userId) return false;
    await db.update(posts).set({ pinned: !post.pinned }).where(eq(posts.id, id));
    return !post.pinned;
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
    const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
    if (post && post.authorId !== userId) {
      await this.createNotification({
        userId: post.authorId, actorId: userId,
        type: "like", postId, message: "liked your post",
      });
    }
    return true;
  }

  async toggleBookmark(postId: number, userId: string): Promise<boolean> {
    const existing = await db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)),
    });
    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return false;
    }
    await db.insert(bookmarks).values({ postId, userId });
    return true;
  }

  async getBookmarkedPosts(userId: string): Promise<PostWithRelations[]> {
    const myBm = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
    if (!myBm.length) return [];
    const ids = myBm.map(b => b.postId);
    const results = await db.query.posts.findMany({
      where: inArray(posts.id, ids),
      with: {
        author: true,
        comments: { with: { author: true }, orderBy: [asc(comments.createdAt)] },
        likes: true,
      },
    });
    // Preserve bookmark order
    const order = new Map(ids.map((id, i) => [id, i]));
    results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return this.enrichPosts(results, userId);
  }

  // ===== Comments =====
  async createComment(commentData: Omit<Comment, "id" | "createdAt">): Promise<CommentWithAuthor> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    const author = await this.getUser(comment.authorId);
    if (!author) throw new Error("Author not found");

    const post = await db.query.posts.findFirst({ where: eq(posts.id, commentData.postId) });
    if (post && post.authorId !== commentData.authorId) {
      await this.createNotification({
        userId: post.authorId, actorId: commentData.authorId,
        type: "comment", postId: commentData.postId, message: "commented on your post",
      });
    }
    // Mentions in comment
    const mentions = Array.from(new Set(Array.from(commentData.content.matchAll(/@([a-zA-Z0-9_.]+)/g)).map(m => m[1])));
    if (mentions.length) {
      const mentionedUsers = await db.select().from(users).where(inArray(users.username, mentions));
      for (const u of mentionedUsers) {
        if (u.id !== commentData.authorId) {
          await this.createNotification({
            userId: u.id, actorId: commentData.authorId,
            type: "mention", postId: commentData.postId, message: "mentioned you in a comment",
          });
        }
      }
    }
    // Reply notification
    if (commentData.parentId) {
      const parent = await db.query.comments.findFirst({ where: eq(comments.id, commentData.parentId) });
      if (parent && parent.authorId !== commentData.authorId) {
        await this.createNotification({
          userId: parent.authorId, actorId: commentData.authorId,
          type: "comment", postId: commentData.postId, message: "replied to your comment",
        });
      }
    }
    return { ...comment, author, likeCount: 0, hasLiked: false };
  }

  async toggleCommentLike(commentId: number, userId: string): Promise<boolean> {
    const existing = await db.query.commentLikes.findFirst({
      where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
    });
    if (existing) {
      await db.delete(commentLikes).where(eq(commentLikes.id, existing.id));
      return false;
    }
    await db.insert(commentLikes).values({ commentId, userId });
    const comment = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
    if (comment && comment.authorId !== userId) {
      await this.createNotification({
        userId: comment.authorId, actorId: userId,
        type: "comment_like", postId: comment.postId, message: "liked your comment",
      });
    }
    return true;
  }

  async deleteComment(id: number, userId: string): Promise<boolean> {
    const c = await db.query.comments.findFirst({ where: eq(comments.id, id) });
    if (!c || c.authorId !== userId) return false;
    await db.delete(commentLikes).where(eq(commentLikes.commentId, id));
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // ===== Users =====
  async listUsers(excludeId?: string, search?: string): Promise<User[]> {
    const conditions = [];
    if (excludeId) conditions.push(ne(users.id, excludeId));
    if (search) {
      const s = `%${search}%`;
      conditions.push(or(
        ilike(users.username, s),
        ilike(users.firstName, s),
        ilike(users.lastName, s),
        ilike(users.email, s),
      )!);
    }
    const q = conditions.length
      ? db.select().from(users).where(and(...conditions))
      : db.select().from(users);
    return await q;
  }

  async getProfile(userId: string, currentUserId?: string): Promise<UserProfile | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const [postCountRow] = await db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.authorId, userId));
    const [followerCountRow] = await db.select({ count: sql<number>`count(*)::int` }).from(follows)
      .where(and(eq(follows.followingId, userId), eq(follows.status, "accepted")));
    const [followingCountRow] = await db.select({ count: sql<number>`count(*)::int` }).from(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
    let isFollowing = false, isFollowedBy = false;
    if (currentUserId && currentUserId !== userId) {
      const f1 = await db.query.follows.findFirst({
        where: and(eq(follows.followerId, currentUserId), eq(follows.followingId, userId)),
      });
      isFollowing = !!f1 && f1.status === "accepted";
      const f2 = await db.query.follows.findFirst({
        where: and(eq(follows.followerId, userId), eq(follows.followingId, currentUserId)),
      });
      isFollowedBy = !!f2 && f2.status === "accepted";
    }
    return {
      ...user,
      postCount: postCountRow?.count ?? 0,
      followerCount: followerCountRow?.count ?? 0,
      followingCount: followingCountRow?.count ?? 0,
      isFollowing,
      isFollowedBy,
    };
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const cleanData: any = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(users).set(cleanData).where(eq(users.id, userId)).returning();
    return updated;
  }

  // ===== Follow =====
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    const existing = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
    });
    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      return false;
    }
    const target = await this.getUser(followingId);
    const status = target?.isPrivate ? "pending" : "accepted";
    await db.insert(follows).values({ followerId, followingId, status });
    await this.createNotification({
      userId: followingId, actorId: followerId,
      type: "follow", postId: null,
      message: status === "pending" ? "requested to follow you" : "started following you",
    });
    return true;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const rows = await db.query.follows.findMany({
      where: and(eq(follows.followingId, userId), eq(follows.status, "accepted")),
      with: { follower: true },
      orderBy: [desc(follows.createdAt)],
    });
    return rows.map(r => (r as any).follower);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const rows = await db.query.follows.findMany({
      where: and(eq(follows.followerId, userId), eq(follows.status, "accepted")),
      with: { following: true },
      orderBy: [desc(follows.createdAt)],
    });
    return rows.map(r => (r as any).following);
  }

  // ===== Blocks =====
  async toggleBlock(blockerId: string, blockedId: string): Promise<boolean> {
    if (blockerId === blockedId) return false;
    const existing = await db.query.blocks.findFirst({
      where: and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)),
    });
    if (existing) {
      await db.delete(blocks).where(eq(blocks.id, existing.id));
      return false;
    }
    await db.insert(blocks).values({ blockerId, blockedId });
    // Remove follow if any
    await db.delete(follows).where(or(
      and(eq(follows.followerId, blockerId), eq(follows.followingId, blockedId)),
      and(eq(follows.followerId, blockedId), eq(follows.followingId, blockerId)),
    ));
    return true;
  }

  async getBlocked(userId: string): Promise<User[]> {
    const rows = await db.select().from(blocks).where(eq(blocks.blockerId, userId));
    if (!rows.length) return [];
    const u = await db.select().from(users).where(inArray(users.id, rows.map(r => r.blockedId)));
    return u;
  }

  // ===== Messages =====
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
      const conv = map.get(otherId)!;
      if (m.receiverId === userId && !m.read) conv.unreadCount++;
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

  async sendMessage(data: Omit<Message, "id" | "createdAt" | "read">): Promise<MessageWithUsers> {
    const [m] = await db.insert(messages).values({ ...data, read: false }).returning();
    const sender = await this.getUser(m.senderId);
    const receiver = await this.getUser(m.receiverId);
    if (!sender || !receiver) throw new Error("User not found");
    if (data.senderId !== data.receiverId) {
      await this.createNotification({
        userId: data.receiverId, actorId: data.senderId,
        type: "message", postId: null, message: "sent you a message",
      });
    }
    return { ...m, sender, receiver };
  }

  async markMessagesRead(userId: string, otherId: string): Promise<void> {
    await db.update(messages).set({ read: true })
      .where(and(eq(messages.receiverId, userId), eq(messages.senderId, otherId), eq(messages.read, false)));
  }

  async setMessageReaction(messageId: number, userId: string, reaction: string | null): Promise<void> {
    const m = await db.query.messages.findFirst({ where: eq(messages.id, messageId) });
    if (!m || (m.senderId !== userId && m.receiverId !== userId)) return;
    await db.update(messages).set({ reaction }).where(eq(messages.id, messageId));
  }

  // ===== Notifications =====
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

  // ===== Videos =====
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
    const v = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
    if (v && v.authorId !== userId) {
      await this.createNotification({
        userId: v.authorId, actorId: userId, type: "like",
        postId: null, message: "liked your reel",
      });
    }
    return true;
  }
}

export const storage = new DatabaseStorage();
