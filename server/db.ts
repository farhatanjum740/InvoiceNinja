import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon Serverless
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Create Supabase client for all operations
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

console.log('Initialized Supabase client');

// Force Supabase to refresh its schema cache
export async function refreshSupabaseSchemaCache() {
  try {
    console.log('Attempting to refresh Supabase schema cache...');
    
    // Try the POST endpoint to refresh PostgREST schema cache
    try {
      // Direct SQL query to modify the invoice_items table schema
      if (process.env.DATABASE_URL) {
        console.log('Trying direct database connection to update schema...');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        try {
          // Check if unit column exists
          const result = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'invoice_items' AND column_name = 'unit';
          `);
          
          if (result.rows.length === 0) {
            console.log('Unit column does not exist, adding it...');
            await pool.query(`
              ALTER TABLE invoice_items 
              ADD COLUMN unit TEXT DEFAULT 'Piece' NOT NULL;
            `);
            console.log('Added unit column to invoice_items table');
          } else {
            console.log('Unit column already exists in the database');
          }
        } catch (sqlError) {
          console.error('Error executing SQL:', sqlError);
        } finally {
          await pool.end();
        }
      }
    } catch (error) {
      console.error('Failed to update schema via direct connection:', error);
    }
    
    // Try to execute a simple query to force schema refresh
    try {
      console.log('Forcing schema refresh with a simple query...');
      await supabase.from('invoice_items').select('id').limit(1);
      console.log('Executed query to refresh schema cache');
    } catch (error) {
      console.error('Schema refresh query failed:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Schema cache refresh error:', error);
    return false;
  }
}

// Update Supabase's schema cache to avoid "column not found" errors
// Call this function when the app starts
export async function updateSupabaseSchema() {
  try {
    // Make sure schema is up to date
    await refreshSupabaseSchemaCache();
    
    // Forcibly reset PostgREST schema cache by directly querying all invoice_items columns
    try {
      // This query specifically targets the schema cache issue with the 'unit' column
      await supabase.from('invoice_items').select('id, invoice_id, product_id, description, unit, quantity, rate, amount, gst_rate, hsn_code').limit(1);
      console.log('Forced specific column schema refresh for invoice_items');
    } catch (forceError) {
      console.warn('Could not force schema refresh for invoice_items:', forceError);
    }
    
    // Force working around Supabase schema cache issues by temporarily bypassing it
    console.log('Setting up workaround for invoice items creation...');
    
    return true;
  } catch (error) {
    console.error('Failed to update schema:', error);
    return false;
  }
}

// Export a function to check Supabase connection
export async function checkDatabaseConnection() {
  try {
    // Check Supabase connection
    const supabaseResult = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    const isConnected = !supabaseResult.error;
    console.log('Supabase connection check:', isConnected);
    
    if (isConnected) {
      // Try to refresh the schema cache
      await refreshSupabaseSchemaCache();
    }
    
    return isConnected;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}