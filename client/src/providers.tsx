import { ReactNode, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { initializeStorage } from "./lib/storage-utils";
import { supabase } from "./lib/supabase";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize Supabase storage buckets
  useEffect(() => {
    // Only initialize in production or when Supabase URL is provided
    if (import.meta.env.PROD || import.meta.env.VITE_SUPABASE_URL) {
      console.log('Initializing Supabase storage...');
      initializeStorage().catch(console.error);
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}