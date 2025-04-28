import { supabase } from '../server/db';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon Serverless
neonConfig.webSocketConstructor = ws;

// This script will push the schema updates to the database
async function main() {
  console.log('Starting database schema update...');
  
  // First try Supabase for easier operations
  try {
    // Try to update the getInvoiceItems method in storage.ts to include the 'unit' field
    console.log('Updating storage.ts getInvoiceItems method...');
    await updateInvoiceItemsMapping();
    console.log('Storage mapping updated.');
  } catch (storageError) {
    console.error('Error updating storage mapping:', storageError);
  }
  
  // Then try direct database connection for schema updates
  try {
    console.log('Checking if the invoice_items table has the unit column...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    
    console.log('Connecting to database using DATABASE_URL...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL 
    });
    
    try {
      console.log('Checking if unit column exists...');
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'unit';
      `);
      
      if (result.rows.length === 0) {
        console.log('Unit column does not exist, adding it now...');
        await pool.query(`
          ALTER TABLE invoice_items 
          ADD COLUMN unit TEXT DEFAULT 'Piece' NOT NULL;
        `);
        console.log('Unit column added successfully!');
      } else {
        console.log('Unit column already exists, no changes needed.');
      }
      
      console.log('Schema update completed successfully!');
    } catch (sqlError) {
      console.error('Error executing SQL:', sqlError);
      throw sqlError;
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Error during schema update:', error);
    process.exit(1);
  }
}

// Update storage.ts methods to include 'unit' in getInvoiceItems
async function updateInvoiceItemsMapping() {
  try {
    // First try to get an invoice item to check the structure
    const { data, error } = await supabase.from('invoice_items').select('*').limit(1);
    
    if (error) {
      console.error('Error fetching invoice item:', error);
      return;
    }
    
    // Check if the unit column exists in the data
    const hasUnit = data[0] && 'unit' in data[0];
    console.log(`Invoices items ${hasUnit ? 'have' : 'do not have'} the unit column`);
    
    if (!hasUnit) {
      // Try adding it via raw SQL
      const { error: sqlError } = await supabase.rpc('execute_sql', { 
        sql: `ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Piece' NOT NULL;` 
      });
      
      if (sqlError) {
        console.log('Could not add unit column via RPC:', sqlError);
      } else {
        console.log('Added unit column via RPC');
      }
    }
  } catch (error) {
    console.error('Error in updateInvoiceItemsMapping:', error);
  }
}

main();