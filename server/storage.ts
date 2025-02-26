import { User, Post, Comment, Like, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Post operations
  createPost(userId: number, content: string, imageUrl?: string): Promise<Post>;
  getPosts(): Promise<(Post & { user: User })[]>;
  getPost(id: number): Promise<(Post & { user: User }) | undefined>;
  
  // Social interactions
  createComment(userId: number, postId: number, content: string): Promise<Comment>;
  getComments(postId: number): Promise<(Comment & { user: User })[]>;
  toggleLike(userId: number, postId: number): Promise<boolean>;
  getLikes(postId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, profilePic: null, bio: null };
    this.users.set(id, user);
    return user;
  }

  async createPost(userId: number, content: string, imageUrl?: string): Promise<Post> {
    const id = this.currentId++;
    const post: Post = {
      id,
      userId,
      content,
      imageUrl: imageUrl || null,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getPosts(): Promise<(Post & { user: User })[]> {
    return Array.from(this.posts.values())
      .map((post) => ({
        ...post,
        user: this.users.get(post.userId)!,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPost(id: number): Promise<(Post & { user: User }) | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    return {
      ...post,
      user: this.users.get(post.userId)!,
    };
  }

  async createComment(userId: number, postId: number, content: string): Promise<Comment> {
    const id = this.currentId++;
    const comment: Comment = {
      id,
      userId,
      postId,
      content,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getComments(postId: number): Promise<(Comment & { user: User })[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.postId === postId)
      .map((comment) => ({
        ...comment,
        user: this.users.get(comment.userId)!,
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async toggleLike(userId: number, postId: number): Promise<boolean> {
    const existingLike = Array.from(this.likes.values()).find(
      (like) => like.userId === userId && like.postId === postId,
    );

    if (existingLike) {
      this.likes.delete(existingLike.id);
      return false;
    }

    const id = this.currentId++;
    this.likes.set(id, { id, userId, postId });
    return true;
  }

  async getLikes(postId: number): Promise<number> {
    return Array.from(this.likes.values()).filter(
      (like) => like.postId === postId,
    ).length;
  }
}

export const storage = new MemStorage();
