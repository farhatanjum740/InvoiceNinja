import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import * as schema from '@shared/schema';

// Create Supabase client for auth and storage
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

console.log('Initialized Supabase client');

// For database operations, we still use postgres.js with drizzle
export let client: ReturnType<typeof postgres>;

try {
  // Use individual connection parameters for Supabase
  // This avoids issues with special characters in the URL
  if (process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
    client = postgres({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to PostgreSQL database using connection parameters');
  }
  // Try DATABASE_URL as fallback
  else if (process.env.DATABASE_URL) {
    // Ensure the URL is properly encoded
    const url = new URL(process.env.DATABASE_URL);
    client = postgres(url.toString(), {
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to PostgreSQL database using DATABASE_URL');
  }
  // Fallback for development only
  else {
    console.warn('No database connection details provided, using mock client');
    // Create a placeholder client for when database isn't available
    // We need to cast to any to avoid TypeScript errors
    client = postgres({
      host: 'localhost',
      database: 'postgres',
      username: 'postgres',
      password: 'postgres',
      onnotice: () => {} // Suppress notice messages
    });
  }
} catch (error) {
  console.error('Error connecting to database:', error);
  // Create a placeholder client that won't actually connect
  client = postgres({
    host: 'localhost',
    database: 'postgres',
    username: 'postgres',
    password: 'postgres',
    onnotice: () => {} // Suppress notice messages
  });
}

// Create drizzle client
export const db = drizzle(client, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Try a simple query through Drizzle to verify connection
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log('Database connection successful');
    
    // Check Supabase connection separately
    try {
      const supabaseResult = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
      console.log('Supabase connection check:', !supabaseResult.error);
    } catch (supabaseError) {
      console.error('Supabase connection error (non-fatal):', supabaseError);
    }
    
    return result.length > 0;
  } catch (error) {
    console.error('Database connection check error:', error);
    return false;
  }
}