import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase credentials in environment variables");
    return;
  }
  
  // Create a fresh Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    // Test authentication
    console.log("Testing Supabase auth...");
    const authResponse = await supabase.auth.getSession();
    console.log("Auth response:", authResponse.error ? "Error" : "Success");
    
    // Test database with simple query
    console.log("Testing Supabase database with a simple query...");
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error("Database query error:", error.message);
    } else {
      console.log("Database query successful. Record count:", data?.length || 0);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testSupabaseConnection().catch(console.error).finally(() => {
  // Exit after a short delay to ensure all promises resolve
  setTimeout(() => process.exit(0), 1000);
});