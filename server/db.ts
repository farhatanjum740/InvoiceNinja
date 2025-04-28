import { createClient } from '@supabase/supabase-js';

// Create Supabase client for all operations
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

console.log('Initialized Supabase client');

// Export a function to check Supabase connection
export async function checkDatabaseConnection() {
  try {
    // Check Supabase connection
    const supabaseResult = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    const isConnected = !supabaseResult.error;
    console.log('Supabase connection check:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}