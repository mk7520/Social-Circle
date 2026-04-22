import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";
import { updateProfileSchema } from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

const userId = (req: any) => (req.user as any)?.claims?.sub as string | undefined;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ===== Posts =====
  app.get("/api/posts", async (req, res) => {
    res.json(await storage.getAllPosts(userId(req)));
  });

  app.get("/api/posts/saved", requireAuth, async (req, res) => {
    res.json(await storage.getBookmarkedPosts(userId(req)!));
  });

  app.get("/api/posts/tag/:tag", async (req, res) => {
    res.json(await storage.getPostsByHashtag(req.params.tag, userId(req)));
  });

  app.get("/api/posts/user/:authorId", async (req, res) => {
    res.json(await storage.getUserPosts(req.params.authorId, userId(req)));
  });

  app.get("/api/posts/:id", async (req, res) => {
    const post = await storage.getPost(Number(req.params.id), userId(req));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        content: z.string().min(1),
        imageUrl: z.string().url().optional().nullable(),
      }).parse(req.body);
      const post = await storage.createPost({
        content: input.content, imageUrl: input.imageUrl ?? null, authorId: userId(req)!,
      });
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    const ok = await storage.deletePost(Number(req.params.id), userId(req)!);
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    res.json({ success: true });
  });

  app.post("/api/posts/:id/pin", requireAuth, async (req, res) => {
    const pinned = await storage.togglePinPost(Number(req.params.id), userId(req)!);
    res.json({ pinned });
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    await storage.toggleLike(Number(req.params.id), userId(req)!);
    res.json({ success: true });
  });

  app.post("/api/posts/:id/unlike", requireAuth, async (req, res) => {
    await storage.toggleLike(Number(req.params.id), userId(req)!);
    res.json({ success: true });
  });

  app.post("/api/posts/:id/bookmark", requireAuth, async (req, res) => {
    const bookmarked = await storage.toggleBookmark(Number(req.params.id), userId(req)!);
    res.json({ bookmarked });
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        content: z.string().min(1),
        parentId: z.number().optional().nullable(),
      }).parse(req.body);
      const c = await storage.createComment({
        content: input.content,
        postId: Number(req.params.id),
        authorId: userId(req)!,
        parentId: input.parentId ?? null,
      });
      res.status(201).json(c);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post("/api/comments/:id/like", requireAuth, async (req, res) => {
    await storage.toggleCommentLike(Number(req.params.id), userId(req)!);
    res.json({ success: true });
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    const ok = await storage.deleteComment(Number(req.params.id), userId(req)!);
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    res.json({ success: true });
  });

  // ===== Users / Profiles =====
  app.get("/api/users", async (req, res) => {
    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await storage.listUsers(userId(req), search));
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/profile/:id", async (req, res) => {
    const profile = await storage.getProfile(req.params.id, userId(req));
    if (!profile) return res.status(404).json({ message: "Not found" });
    res.json(profile);
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const input = updateProfileSchema.parse(req.body);
      // normalize empty strings to null
      const data: any = { ...input };
      ["website", "profileImageUrl", "bio", "location", "firstName", "lastName"].forEach(k => {
        if (data[k] === "") data[k] = null;
      });
      const updated = await storage.updateProfile(userId(req)!, data);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      const msg = (err as any)?.message || "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return res.status(400).json({ message: "Username already taken" });
      }
      throw err;
    }
  });

  // ===== Follow =====
  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    const following = await storage.toggleFollow(userId(req)!, req.params.id);
    res.json({ following });
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    res.json(await storage.getFollowers(req.params.id));
  });

  app.get("/api/users/:id/following", async (req, res) => {
    res.json(await storage.getFollowing(req.params.id));
  });

  // ===== Blocks =====
  app.post("/api/users/:id/block", requireAuth, async (req, res) => {
    const blocked = await storage.toggleBlock(userId(req)!, req.params.id);
    res.json({ blocked });
  });

  app.get("/api/blocks", requireAuth, async (req, res) => {
    res.json(await storage.getBlocked(userId(req)!));
  });

  // ===== Messages =====
  app.get("/api/conversations", requireAuth, async (req, res) => {
    res.json(await storage.getConversations(userId(req)!));
  });

  app.get("/api/messages/:otherId", requireAuth, async (req, res) => {
    const me = userId(req)!;
    const list = await storage.getMessagesBetween(me, req.params.otherId);
    storage.markMessagesRead(me, req.params.otherId).catch(() => {});
    res.json(list);
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        receiverId: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().url().optional().nullable(),
      }).parse(req.body);
      const m = await storage.sendMessage({
        senderId: userId(req)!,
        receiverId: input.receiverId,
        content: input.content,
        imageUrl: input.imageUrl ?? null,
        reaction: null,
      });
      res.status(201).json(m);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post("/api/messages/:id/react", requireAuth, async (req, res) => {
    const input = z.object({ reaction: z.string().nullable() }).parse(req.body);
    await storage.setMessageReaction(Number(req.params.id), userId(req)!, input.reaction);
    res.json({ success: true });
  });

  // ===== Notifications =====
  app.get("/api/notifications", requireAuth, async (req, res) => {
    res.json(await storage.getNotifications(userId(req)!));
  });

  app.post("/api/notifications/read", requireAuth, async (req, res) => {
    await storage.markNotificationsRead(userId(req)!);
    res.json({ success: true });
  });

  // ===== Videos =====
  app.get("/api/videos", async (req, res) => {
    res.json(await storage.getAllVideos(userId(req)));
  });

  app.post("/api/videos", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional().nullable(),
        caption: z.string().min(1),
        audioName: z.string().optional().nullable(),
      }).parse(req.body);
      const v = await storage.createVideo({
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl ?? null,
        caption: input.caption,
        audioName: input.audioName ?? null,
        authorId: userId(req)!,
      });
      res.status(201).json(v);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post("/api/videos/:id/like", requireAuth, async (req, res) => {
    await storage.toggleVideoLike(Number(req.params.id), userId(req)!);
    res.json({ success: true });
  });

  return httpServer;
}
