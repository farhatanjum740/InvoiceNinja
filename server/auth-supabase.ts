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
    supabaseSession?: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
    };
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
  
  // Add authentication middleware to check session and Supabase token
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
          // If we have a Supabase session stored, verify it's still valid
          if (req.session.supabaseSession) {
            try {
              // Use the stored session to validate with Supabase
              const { data, error } = await supabase.auth.setSession({
                access_token: req.session.supabaseSession.access_token,
                refresh_token: req.session.supabaseSession.refresh_token,
              });
              
              if (error || !data.session) {
                console.warn("Supabase session expired or invalid:", error);
                // Session is invalid, clear it from our session
                delete req.session.supabaseSession;
                // But still allow access if our session is valid
              }
            } catch (supabaseError) {
              console.error("Supabase session check error:", supabaseError);
              // Continue with our own session as fallback
            }
          }
          
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
  
  // Register endpoint - using Supabase primarily
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      try {
        // Check if username is already taken in our PostgreSQL database
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        
        // Check if email is already registered in our PostgreSQL database
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      } catch (error) {
        console.error("Error checking existing users:", error);
        // Continue with registration even if we can't check for existing users
        // This is to handle case where the tables might not exist yet on first run
      }
      
      // Create user in Supabase first
      const { data: authData, error: supabaseError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            username: validatedData.username,
            name: validatedData.name || ""
          }
        }
      });
      
      if (supabaseError) {
        console.error("Supabase auth error:", supabaseError);
        return res.status(400).json({ message: supabaseError.message });
      }
      
      if (!authData.user) {
        return res.status(400).json({ message: "Failed to create user account" });
      }
      
      // Now create the user in PostgreSQL for app-specific data
      try {
        const user = await storage.createUser({
          username: validatedData.username,
          password: validatedData.password, // This will be hashed before saving
          email: validatedData.email,
          name: validatedData.name || ""
        });
        
        // Set session with user ID
        req.session.userId = user.id;
        
        // Store Supabase session in express session
        if (authData.session) {
          req.session.supabaseSession = authData.session;
        }
        
        // Return user data (excluding password)
        const { password, ...userData } = user;
        return res.status(201).json(userData);
      } catch (dbError) {
        console.error("Database error during user creation:", dbError);
        
        // If PostgreSQL fails, try to delete the Supabase user
        try {
          // We can't delete users with regular API key, but we can mark for future cleanup
          console.warn("User created in Supabase but failed in PostgreSQL. Will need manual cleanup.");
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
        
        return res.status(500).json({ message: "Failed to complete registration" });
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
  
  // Login endpoint - using Supabase exclusively
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // First, try to find user by username to get their email
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      // Sign in with Supabase using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: validatedData.password
      });
      
      if (authError) {
        console.error("Supabase login error:", authError);
        return res.status(400).json({ message: "Invalid username or password" });
      }
      
      if (!authData.user) {
        return res.status(400).json({ message: "Authentication failed" });
      }
      
      // Set session with user ID from PostgreSQL/Drizzle (for API calls)
      req.session.userId = user.id;
      
      // Also store Supabase session (for future direct Supabase client calls)
      req.session.supabaseSession = authData.session;
      
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