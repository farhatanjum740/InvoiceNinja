// Load environment variables - dotenv not needed in Replit as it's already configured
import { checkDatabaseConnection, supabase } from "../server/db";

// Script to check both PostgreSQL and Supabase connections
async function checkConnections() {
  console.log("Checking database connections...");
  
  // Check PostgreSQL connection
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      console.log("✅ PostgreSQL database connection successful");
    } else {
      console.error("❌ PostgreSQL database connection failed");
    }
  } catch (error) {
    console.error("❌ PostgreSQL database connection error:", error);
  }
  
  // Check Supabase connection with detailed information
  try {
    // Check authentication connection first
    console.log("Checking Supabase authentication...");
    const authResponse = await supabase.auth.getSession();
    if (authResponse.error) {
      console.error("❌ Supabase auth error:", authResponse.error.message);
    } else {
      console.log("✅ Supabase authentication connection successful");
    }
    
    // Check database connection
    console.log("Checking Supabase database access...");
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL?.substring(0, 20) + "...");
    console.log("SUPABASE_KEY provided:", !!process.env.SUPABASE_SERVICE_KEY);
    
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Supabase database error:", error.message);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
    } else {
      console.log("✅ Supabase database connection successful");
      console.log("Data:", data);
    }
  } catch (supabaseError) {
    console.error("❌ Supabase general error:", supabaseError);
  }
}

checkConnections().catch(console.error).finally(() => {
  // Close the DB connection pool
  // This is important as otherwise the script will hang
  setTimeout(() => process.exit(0), 1000);
});