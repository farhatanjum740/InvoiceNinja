import { pool, supabase } from '../server/db';
import { fileURLToPath } from 'url';

// Tables to synchronize with Supabase
const TABLES = [
  'users',
  'companies',
  'customers',
  'products',
  'invoices',
  'invoice_items'
];

// Function to sync a specific table
async function syncTable(tableName: string) {
  console.log(`Syncing table: ${tableName}`);
  
  try {
    // 1. Add a comment to the table to trigger a schema change
    await pool.query(`
      COMMENT ON TABLE ${tableName} IS 'Refreshed on ${new Date().toISOString()}';
    `);
    
    // 2. Notify PostgREST to reload schema
    await pool.query("SELECT pg_notify('pgrst', 'reload schema');");
    
    // 3. Force Supabase to refresh by making a query
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(50);
      
    if (error) {
      console.error(`Error querying ${tableName}:`, error);
    } else {
      console.log(`Successfully queried ${tableName} via Supabase`);
    }
    
    console.log(`Completed sync for ${tableName}`);
  } catch (error) {
    console.error(`Error syncing ${tableName}:`, error);
  }
}

// Main function to sync all tables
async function syncAllTables() {
  console.log('Starting Supabase cache synchronization...');
  
  try {
    // First, trigger a global schema reload
    await pool.query("SELECT pg_notify('pgrst', 'reload schema');");
    console.log('Sent global schema reload notification');
    
    // Then sync each table individually
    for (const table of TABLES) {
      await syncTable(table);
    }
    
    console.log('Supabase cache synchronization completed successfully');
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the sync if this file is run directly
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  syncAllTables().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { syncAllTables };