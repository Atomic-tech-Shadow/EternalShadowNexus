import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Posts
  app.get("/api/posts", async (req, res) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const recommended = req.query.recommended === "true";

    // Si on demande des recommandations, on filtre en fonction de la catégorie
    // et on ajoute un tri par popularité (likes)
    if (recommended) {
      const posts = await storage.getRecommendedPosts(categoryId);
      return res.json(posts);
    }

    const posts = await storage.getPosts(categoryId);
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const post = await storage.createPost(
      req.user!.id,
      req.body.content,
      req.body.categoryId,
      req.body.imageUrl,
      req.body.isProject,
    );

    // Award experience for creating a post
    await storage.updateUserExperience(req.user!.id, 50);

    res.json(post);
  });

  // Comments
  app.post("/api/posts/:postId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.createComment(
      req.user!.id,
      parseInt(req.params.postId),
      req.body.content,
    );

    // Award experience for commenting
    await storage.updateUserExperience(req.user!.id, 10);

    res.json(comment);
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.postId));
    res.json(comments);
  });

  // Likes
  app.post("/api/posts/:postId/likes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const liked = await storage.toggleLike(
      req.user!.id,
      parseInt(req.params.postId),
    );

    if (liked) {
      // Award experience for liking
      await storage.updateUserExperience(req.user!.id, 5);
    }

    res.json({ liked });
  });

  app.get("/api/posts/:postId/likes", async (req, res) => {
    const count = await storage.getLikes(parseInt(req.params.postId));
    res.json({ count });
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    const groups = await storage.getGroups();
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const group = await storage.createGroup(
      req.body.name,
      req.body.description,
      req.body.imageUrl,
      req.body.isPrivate,
    );
    res.json(group);
  });

  app.post("/api/groups/:groupId/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.joinGroup(req.user!.id, parseInt(req.params.groupId));
    res.sendStatus(200);
  });

  app.post("/api/groups/:groupId/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.leaveGroup(req.user!.id, parseInt(req.params.groupId));
    res.sendStatus(200);
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Badges
  app.get("/api/badges", async (req, res) => {
    const badges = await storage.getBadges();
    res.json(badges);
  });

  app.get("/api/users/:userId/badges", async (req, res) => {
    const badges = await storage.getUserBadges(parseInt(req.params.userId));
    res.json(badges);
  });

  const httpServer = createServer(app);
  return httpServer;
}