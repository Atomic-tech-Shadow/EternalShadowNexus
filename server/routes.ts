import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/posts", async (req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const post = await storage.createPost(
      req.user!.id,
      req.body.content,
      req.body.imageUrl,
    );
    res.json(post);
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.createComment(
      req.user!.id,
      parseInt(req.params.postId),
      req.body.content,
    );
    res.json(comment);
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.postId));
    res.json(comments);
  });

  app.post("/api/posts/:postId/likes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const liked = await storage.toggleLike(
      req.user!.id,
      parseInt(req.params.postId),
    );
    res.json({ liked });
  });

  app.get("/api/posts/:postId/likes", async (req, res) => {
    const count = await storage.getLikes(parseInt(req.params.postId));
    res.json({ count });
  });

  const httpServer = createServer(app);
  return httpServer;
}
