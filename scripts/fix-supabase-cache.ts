import { pool, supabase } from '../server/db';

/**
 * This script directly copies data from the Neon database to Supabase cache.
 * It does this by:
 * 1. Truncating the Supabase RLS tables
 * 2. Re-inserting the data from the direct database connection to Supabase
 * 3. Forcing Supabase to refresh its cache
 */

async function resetAndSyncTable(tableName: string) {
  console.log(`Resetting and syncing table: ${tableName}`);
  
  try {
    // 1. Get all data from the direct database connection
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`Table ${tableName} is empty, nothing to sync.`);
      return;
    }
    
    console.log(`Retrieved ${rows.length} rows from ${tableName}`);
    
    // 2. Delete all data using Supabase API
    console.log(`Removing existing data from Supabase cache for ${tableName}`);
    const { error: deleteError } = await supabase.from(tableName).delete().neq('id', 0);
    
    if (deleteError) {
      console.warn(`Warning: Could not delete existing data from ${tableName}: ${deleteError.message}`);
    }
    
    // 3. Insert the data back using the Supabase API
    console.log(`Inserting ${rows.length} rows into Supabase cache for ${tableName}`);
    
    // Process in chunks to avoid request size limits
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      // Insert the chunk
      const { error: insertError } = await supabase.from(tableName).insert(chunk);
      
      if (insertError) {
        console.error(`Error inserting chunk ${i / chunkSize + 1} into ${tableName}: ${insertError.message}`);
      } else {
        console.log(`Successfully inserted chunk ${i / chunkSize + 1}/${Math.ceil(rows.length / chunkSize)} into ${tableName}`);
      }
    }
    
    console.log(`Completed sync for ${tableName}`);
  } catch (error) {
    console.error(`Error syncing ${tableName}:`, error);
  }
}

async function main() {
  console.log('Starting database sync operation...');
  
  // Create a list of tables to sync in the correct order (respect foreign key constraints)
  const tables = [
    'users',
    'companies',
    'customers',
    'products',
    'invoices',
    'invoice_items'
  ];
  
  try {
    // Sync each table
    for (const table of tables) {
      await resetAndSyncTable(table);
    }
    
    console.log('Sync operation completed successfully');
  } catch (error) {
    console.error('Error during sync operation:', error);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});