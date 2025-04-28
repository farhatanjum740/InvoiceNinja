import { supabase } from './supabase';
import express, { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { z } from 'zod';
import { storage } from './storage';
import { db } from './db';
import { users, type User as SelectUser } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend the Express session to include user ID
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Extended schemas for registration and login
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export async function setupAuth(app: Express) {
  // Session setup
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Middleware to check if the user is authenticated via session
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      try {
        // Get user from our database
        const user = await storage.getUser(req.session.userId);
        if (user) {
          (req as any).user = user;
        }
      } catch (error) {
        console.error("Error retrieving user:", error);
      }
    }
    next();
  });

  // Register endpoint using Supabase Auth + our own user table
  app.post("/api/register", async (req, res) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user exists in our database
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email exists in our database
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            username: validatedData.username
          }
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        return res.status(400).json({ message: "Failed to create user" });
      }
      
      // Create user in our database
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: `supabase:${authData.user.id}`, // Store Supabase user ID as password
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login endpoint using Supabase Auth
  app.post("/api/login", async (req, res) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Get user from our database by username
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Get user's email from our database
      const userEmail = user.email;
      
      // Attempt to sign in with Supabase using email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: validatedData.password
      });
      
      if (authError) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data
      res.status(200).json(user);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Also sign out from Supabase
      supabase.auth.signOut().catch(console.error);
      
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!(req as any).user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json((req as any).user);
  });
}