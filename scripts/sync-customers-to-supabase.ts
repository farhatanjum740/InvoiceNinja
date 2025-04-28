import { db, supabase } from '../server/db';
import { customers } from '@shared/schema';

// This script will sync all customers from PostgreSQL to Supabase
// It upserts customers to ensure they exist in Supabase with the same IDs as in PostgreSQL
async function syncCustomersToSupabase() {
  console.log("Starting sync of customers from PostgreSQL to Supabase...");
  
  try {
    // Fetch all customers from PostgreSQL
    console.log("Fetching customers from PostgreSQL...");
    const pgCustomers = await db.select().from(customers);
    console.log(`Found ${pgCustomers.length} customers in PostgreSQL.`);
    
    if (pgCustomers.length === 0) {
      console.log("No customers to sync.");
      return;
    }
    
    // Transform customers to snake_case format for Supabase
    const supabaseCustomers = pgCustomers.map(customer => ({
      id: customer.id,
      user_id: customer.userId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gstin: customer.gstin,
      billing_address: customer.billingAddress,
      billing_city: customer.billingCity,
      billing_state: customer.billingState,
      billing_pincode: customer.billingPincode,
      shipping_address: customer.shippingAddress,
      shipping_city: customer.shippingCity,
      shipping_state: customer.shippingState,
      shipping_pincode: customer.shippingPincode,
      same_as_shipping: customer.sameAsShipping
    }));
    
    // Insert or update (upsert) customers into Supabase
    console.log("Syncing customers to Supabase...");
    const { data, error } = await supabase
      .from('customers')
      .upsert(supabaseCustomers, { onConflict: 'id' });
      
    if (error) {
      console.error("Error syncing customers:", error);
      return;
    }
    
    console.log(`✅ Successfully synced ${pgCustomers.length} customers to Supabase.`);
    
    // Verify Supabase customers
    console.log("Verifying customers in Supabase...");
    const { data: supabaseResult, error: verifyError } = await supabase
      .from('customers')
      .select('*');
      
    if (verifyError) {
      console.error("Error verifying customers:", verifyError);
      return;
    }
    
    console.log(`Found ${supabaseResult.length} customers in Supabase after sync.`);
    
    // Check if we have the same number of customers
    if (supabaseResult.length !== pgCustomers.length) {
      console.warn(`Warning: Customer count mismatch. PostgreSQL: ${pgCustomers.length}, Supabase: ${supabaseResult.length}`);
    } else {
      console.log("✅ Customer counts match between PostgreSQL and Supabase!");
    }
    
    // Display a few customers as sample
    console.log("\nSample customers in Supabase:");
    supabaseResult.slice(0, 3).forEach(customer => {
      console.log(`ID: ${customer.id}, User ID: ${customer.user_id}, Name: ${customer.name}`);
    });
    
  } catch (error) {
    console.error("Error during sync:", error);
  }
}

// Run the sync
syncCustomersToSupabase()
  .catch(console.error)
  .finally(() => {
    // Exit after a short delay
    setTimeout(() => process.exit(0), 1000);
  });