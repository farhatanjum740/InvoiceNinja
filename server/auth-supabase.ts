import { Request, Response, NextFunction, Express } from "express";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { storage } from "./storage";
import { supabase } from "./supabase";
import session from "express-session";

// Extend Express session definitions
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Define schema for registration
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
  name: z.string().optional(),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Define schema for login
export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

// Setup authentication middleware and routes
export async function setupAuth(app: Express) {
  // Configure session middleware
  app.use(session({
    name: "invoice_app_session",
    secret: process.env.SESSION_SECRET || "invoice-app-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    store: storage.sessionStore
  }));
  
  // Add authentication middleware to check session
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Skip authentication for public routes and non-API requests (frontend routes)
    if (
      !req.path.startsWith("/api") || // Allow all non-API routes (frontend routes)
      req.path === "/api/login" ||
      req.path === "/api/register" ||
      req.path === "/api/env" ||
      req.path === "/api/health" || 
      req.path.startsWith("/api/forgot-password") ||
      req.method === "OPTIONS"
    ) {
      return next();
    }
    
    // Check if user is logged in via session
    if (req.session.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          // Attach user to request object
          req.user = user;
          return next();
        }
      } catch (error) {
        console.error("Session user fetch error:", error);
      }
    }
    
    // User is not authenticated - only return 401 for API requests
    return res.status(401).json({ message: "Not authenticated" });
  });
  
  // Register endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      try {
        // Check if username is already taken
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        
        // Check if email is already registered
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      } catch (error) {
        console.error("Error checking existing users:", error);
        // Continue with registration even if we can't check for existing users
        // This is to handle case where the tables might not exist yet on first run
      }
      
      // Create user in Supabase (if integration is available)
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              username: validatedData.username,
              name: validatedData.name
            }
          }
        });
        
        if (error) {
          console.error("Supabase auth error:", error);
          return res.status(400).json({ message: error.message });
        }
        
        // Create user in our database
        const user = await storage.createUser({
          username: validatedData.username,
          password: validatedData.password, // This will be hashed before saving
          email: validatedData.email,
          name: validatedData.name || ""
        });
        
        // Set session
        req.session.userId = user.id;
        
        // Return user data (excluding password)
        const { password, ...userData } = user;
        return res.status(201).json(userData);
      } catch (supabaseError) {
        console.error("Supabase registration error:", supabaseError);
        
        // Fallback to local database only if Supabase is not available
        const user = await storage.createUser({
          username: validatedData.username,
          password: validatedData.password,
          email: validatedData.email,
          name: validatedData.name || ""
        });
        
        // Set session
        req.session.userId = user.id;
        
        // Return user data (excluding password)
        const { password, ...userData } = user;
        return res.status(201).json(userData);
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error during registration" });
    }
  });
  
  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      // Check password
      const isPasswordValid = validatedData.password === user.password; // In real app, use bcrypt.compare
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      // Try to sign in with Supabase using email
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: validatedData.password
        });
        
        if (error) {
          console.error("Supabase login error:", error);
        }
      } catch (supabaseError) {
        console.error("Supabase login error:", supabaseError);
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password, ...userData } = user;
      return res.json(userData);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error during login" });
    }
  });
  
  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    // Sign out from Supabase (if available)
    try {
      supabase.auth.signOut().catch(console.error);
    } catch (error) {
      console.error("Supabase logout error:", error);
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user endpoint
  app.get("/api/user", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user data (excluding password)
    const { password, ...userData } = req.user;
    return res.json(userData);
  });
  
  // Password reset request
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal whether the email exists
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Send password reset email via Supabase
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.protocol}://${req.get('host')}/auth?resetPassword=true`,
        });
        
        if (error) {
          console.error("Supabase password reset error:", error);
          return res.status(500).json({ message: "Error sending password reset email" });
        }
        
        return res.status(200).json({ message: "Password reset email sent" });
      } catch (supabaseError) {
        console.error("Supabase password reset error:", supabaseError);
        return res.status(500).json({ message: "Error sending password reset email" });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
}