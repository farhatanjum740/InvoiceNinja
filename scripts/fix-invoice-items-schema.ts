import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon Serverless
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Create database pool for direct access
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create Supabase client for all operations
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function fixInvoiceItemsSchema() {
  console.log('Starting invoice_items schema fix operation...');
  
  try {
    // 1. Check if unit column exists
    const columnCheckResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'invoice_items' AND column_name = 'unit';
    `);
    
    if (columnCheckResult.rows.length === 0) {
      console.log('The unit column does not exist in the invoice_items table. Adding it...');
      await pool.query(`
        ALTER TABLE invoice_items 
        ADD COLUMN unit TEXT DEFAULT 'Piece' NOT NULL;
      `);
      console.log('Successfully added unit column to invoice_items table');
    } else {
      console.log('The unit column already exists in the invoice_items table');
    }
    
    // 2. Send a notification to PostgREST to reload the schema
    console.log('Notifying PostgREST to reload schema...');
    try {
      await pool.query("SELECT pg_notify('pgrst', 'reload schema');");
      console.log('Successfully sent PostgREST notification');
    } catch (notifyError) {
      console.error('Failed to send PostgREST notification:', notifyError);
    }
    
    // 3. Update the table comment to force a cache refresh
    const timestamp = new Date().toISOString();
    await pool.query(`
      COMMENT ON TABLE invoice_items IS 'Schema refreshed at ${timestamp}';
    `);
    console.log('Updated table comment to force cache refresh');
    
    // 4. Check if we can now see the column through Supabase
    try {
      console.log('Testing if Supabase can see the unit column...');
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, invoice_id, product_id, description, unit, quantity, rate, amount, gst_rate, hsn_code')
        .limit(1);
      
      if (error) {
        console.error('Supabase still cannot see the unit column:', error);
        
        // Try a more direct cache invalidation approach
        console.log('Using a more aggressive cache invalidation approach...');
        await pool.query(`
          UPDATE invoice_items SET unit = unit WHERE 1=0;
          NOTIFY pgrst, 'reload schema';
        `);
        console.log('Forced schema update with an UPDATE statement');
      } else {
        console.log('Success! Supabase can now see the unit column in invoice_items');
      }
    } catch (testError) {
      console.error('Error testing Supabase schema:', testError);
    }
    
    console.log('Schema fix operation completed');
  } catch (error) {
    console.error('Error during schema fix operation:', error);
  } finally {
    // Close the database connections
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the script
fixInvoiceItemsSchema().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});