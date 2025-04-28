import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import { supabase } from './supabase';

// For direct database access with Drizzle ORM
if (!process.env.SUPABASE_POSTGRES_URL) {
  throw new Error(
    "SUPABASE_POSTGRES_URL must be set. Check your Supabase project settings for the connection string.",
  );
}

// Create a Postgres client
export const client = postgres(process.env.SUPABASE_POSTGRES_URL);

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 AS connected`);
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}