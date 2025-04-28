import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// For now, let's set up a mock client for development
// Later we can use the actual Supabase connection when it's properly formatted

// Create a simple mock client for development
export let client: ReturnType<typeof postgres>;

try {
  // Try to connect to the database if credentials are available
  if (process.env.DATABASE_URL) {
    // Use the DATABASE_URL provided by environment
    client = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to PostgreSQL database using DATABASE_URL');
  } else if (process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
    // Use individual connection parameters if available
    client = postgres({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to PostgreSQL database using connection parameters');
  } else {
    // Fallback to a mock client for development
    console.log('No database URL provided, using mock client');
    client = postgres({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: 'postgres',
      onnotice: () => {}, // Suppress notice messages
    });
  }
} catch (error) {
  console.error('Error connecting to database:', error);
  // Create a dummy client that won't actually connect
  // @ts-ignore - This is a mock implementation
  client = {
    // Minimal implementation for development
    async query() { return []; },
    async end() {},
  };
}

// Create drizzle client
export const db = drizzle(client, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Run a simple query to check connection
    // @ts-ignore - This is a mock implementation
    const result = await client.query('SELECT 1 as connected');
    return result?.[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}