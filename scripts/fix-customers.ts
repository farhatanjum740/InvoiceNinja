/**
 * This script is specifically designed to restore customers visibility
 * in Supabase by directly copying all records from the Neon database.
 */

import { pool, supabase } from '../server/db';

async function fixCustomersTable() {
  console.log('Starting customers table fix operation...');
  
  try {
    // 1. Get all customers from the direct database connection
    const result = await pool.query(`SELECT * FROM customers`);
    const customers = result.rows;
    
    if (customers.length === 0) {
      console.log(`Customers table is empty, nothing to fix.`);
      return;
    }
    
    console.log(`Retrieved ${customers.length} customers from direct database connection`);
    
    // 2. Delete all customers using Supabase API (this will remove cache issues)
    console.log(`Removing existing customers from Supabase cache`);
    const { error: deleteError } = await supabase.from('customers').delete().neq('id', 0);
    
    if (deleteError) {
      console.warn(`Warning: Could not delete existing customers: ${deleteError.message}`);
    } else {
      console.log(`Successfully removed existing customers from Supabase cache`);
    }
    
    // 3. Insert the customers back using the Supabase API
    console.log(`Inserting ${customers.length} customers into Supabase cache`);
    
    // Process in chunks to avoid request size limits
    const chunkSize = 50;
    for (let i = 0; i < customers.length; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      
      // Insert the chunk
      const { error: insertError } = await supabase.from('customers').insert(chunk);
      
      if (insertError) {
        console.error(`Error inserting customers chunk ${i / chunkSize + 1}: ${insertError.message}`);
      } else {
        console.log(`Successfully inserted customers chunk ${i / chunkSize + 1}/${Math.ceil(customers.length / chunkSize)}`);
      }
    }
    
    // 4. Verify the count matches
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error(`Error verifying customer count: ${countError.message}`);
    } else {
      console.log(`Verification: Supabase now has ${count} customers, direct DB has ${customers.length}`);
      
      if (count !== customers.length) {
        console.warn(`Warning: Count mismatch between Supabase (${count}) and direct DB (${customers.length})`);
      } else {
        console.log(`Success! Customer counts match.`);
      }
    }
    
    console.log('Customers fix operation completed');
  } catch (error) {
    console.error('Error during customers fix operation:', error);
  } finally {
    await pool.end();
    console.log('Database connections closed');
  }
}

// Run the script
fixCustomersTable().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});