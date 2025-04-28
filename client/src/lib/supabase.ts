import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the anon key for client-side operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export types from Supabase
export type SupabaseClient = typeof supabase;