import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";

// Define the types we need for auth
type User = SelectUser;

interface RegisterData extends InsertUser {
  confirmPassword: string;
}

type LoginData = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  forgotPasswordMutation: UseMutationResult<{ message: string }, Error, { email: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Fetch the current user
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Subscribe to Supabase auth changes
  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Supabase auth event:", event);
        
        if (event === 'SIGNED_IN') {
          // User signed in via Supabase, refresh our user data
          refetch();
        } else if (event === 'SIGNED_OUT') {
          // User signed out via Supabase, clear our user data
          queryClient.setQueryData(["/api/user"], null);
        }
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
      // Redirect to dashboard after login
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name || user.username}!`,
      });
      // Redirect to dashboard after registration
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation - also sign out from Supabase
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // First, call our server API to clear the session
      await apiRequest("POST", "/api/logout");
      
      // Also sign out from Supabase on the client side
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Supabase client-side signout error:", error);
        // Continue even if Supabase logout fails
      }
    },
    onSuccess: () => {
      // Clear user data from the React Query cache
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/forgot-password", { email });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset email sent",
        description: data.message || "If this email exists, you will receive reset instructions",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const value = {
    user: user ?? null,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
    forgotPasswordMutation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
