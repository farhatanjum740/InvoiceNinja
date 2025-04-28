import * as dotenv from "dotenv";
dotenv.config();
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
  
  // Check Supabase connection
  try {
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Supabase connection error:", error.message);
    } else {
      console.log("✅ Supabase connection successful");
    }
  } catch (supabaseError) {
    console.error("❌ Supabase connection error:", supabaseError);
  }
}

checkConnections().catch(console.error).finally(() => {
  // Close the DB connection pool
  // This is important as otherwise the script will hang
  setTimeout(() => process.exit(0), 1000);
});