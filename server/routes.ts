import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ===== Posts =====
  app.get("/api/posts", async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    res.json(await storage.getAllPosts(userId));
  });

  app.get("/api/posts/:id", async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const post = await storage.getPost(Number(req.params.id), userId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        content: z.string().min(1),
        imageUrl: z.string().url().optional().nullable(),
      }).parse(req.body);
      const userId = (req.user as any).claims.sub;
      const post = await storage.createPost({
        content: input.content,
        imageUrl: input.imageUrl ?? null,
        authorId: userId,
      });
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    await storage.toggleLike(Number(req.params.id), userId);
    res.json({ success: true });
  });

  app.post("/api/posts/:id/unlike", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    await storage.toggleLike(Number(req.params.id), userId);
    res.json({ success: true });
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const input = z.object({ content: z.string().min(1) }).parse(req.body);
      const userId = (req.user as any).claims.sub;
      const comment = await storage.createComment({
        content: input.content,
        postId: Number(req.params.id),
        authorId: userId,
      });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // ===== Users =====
  app.get("/api/users", async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    res.json(await storage.listUsers(userId));
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // ===== Messages =====
  app.get("/api/conversations", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    res.json(await storage.getConversations(userId));
  });

  app.get("/api/messages/:otherId", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    res.json(await storage.getMessagesBetween(userId, req.params.otherId));
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        receiverId: z.string().min(1),
        content: z.string().min(1),
      }).parse(req.body);
      const userId = (req.user as any).claims.sub;
      const m = await storage.sendMessage({
        senderId: userId,
        receiverId: input.receiverId,
        content: input.content,
      });
      res.status(201).json(m);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // ===== Notifications =====
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    res.json(await storage.getNotifications(userId));
  });

  app.post("/api/notifications/read", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    await storage.markNotificationsRead(userId);
    res.json({ success: true });
  });

  // ===== Videos =====
  app.get("/api/videos", async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    res.json(await storage.getAllVideos(userId));
  });

  app.post("/api/videos", requireAuth, async (req, res) => {
    try {
      const input = z.object({
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional().nullable(),
        caption: z.string().min(1),
      }).parse(req.body);
      const userId = (req.user as any).claims.sub;
      const v = await storage.createVideo({
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl ?? null,
        caption: input.caption,
        authorId: userId,
      });
      res.status(201).json(v);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post("/api/videos/:id/like", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    await storage.toggleVideoLike(Number(req.params.id), userId);
    res.json({ success: true });
  });

  return httpServer;
}
