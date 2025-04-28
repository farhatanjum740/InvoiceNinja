import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// For Supabase, we're using the postgres connection string
const postgresUrl = process.env.SUPABASE_POSTGRES_URL || process.env.DATABASE_URL;

// Validate connection string
if (!postgresUrl) {
  throw new Error(
    "SUPABASE_POSTGRES_URL must be set. Check your Supabase project settings for the connection string."
  );
}

// Create postgres client
export const client = postgres(postgresUrl);

// Create drizzle client
export const db = drizzle(client, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Run a simple query to check connection
    const result = await client`SELECT 1 as connected`;
    return result?.[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}