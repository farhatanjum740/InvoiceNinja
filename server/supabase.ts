import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Key is missing. Check your environment variables.');
}

// Create Supabase client with service role for admin access
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false, // We're using a service key which doesn't expire
      persistSession: false    // We don't need to persist session as the server restarts
    }
  }
);

// Export the type for use in other files
export type SupabaseClient = typeof supabase;