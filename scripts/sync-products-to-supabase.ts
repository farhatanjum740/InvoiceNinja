import { db, supabase } from '../server/db';
import { products } from '@shared/schema';

// This script will sync all products from PostgreSQL to Supabase
// It upserts products to ensure they exist in Supabase with the same IDs as in PostgreSQL
async function syncProductsToSupabase() {
  console.log("Starting sync of products from PostgreSQL to Supabase...");
  
  try {
    // Fetch all products from PostgreSQL
    console.log("Fetching products from PostgreSQL...");
    const pgProducts = await db.select().from(products);
    console.log(`Found ${pgProducts.length} products in PostgreSQL.`);
    
    if (pgProducts.length === 0) {
      console.log("No products to sync.");
      return;
    }
    
    // Transform products to snake_case format for Supabase
    const supabaseProducts = pgProducts.map(product => ({
      id: product.id,
      user_id: product.userId,
      name: product.name,
      description: product.description,
      hsn_code: product.hsnCode,
      unit: product.unit,
      rate: product.rate,
      gst_rate: product.gstRate
    }));
    
    // Insert or update (upsert) products into Supabase
    console.log("Syncing products to Supabase...");
    const { data, error } = await supabase
      .from('products')
      .upsert(supabaseProducts, { onConflict: 'id' });
      
    if (error) {
      console.error("Error syncing products:", error);
      return;
    }
    
    console.log(`✅ Successfully synced ${pgProducts.length} products to Supabase.`);
    
    // Verify Supabase products
    console.log("Verifying products in Supabase...");
    const { data: supabaseResult, error: verifyError } = await supabase
      .from('products')
      .select('*');
      
    if (verifyError) {
      console.error("Error verifying products:", verifyError);
      return;
    }
    
    console.log(`Found ${supabaseResult.length} products in Supabase after sync.`);
    
    // Check if we have the same number of products
    if (supabaseResult.length !== pgProducts.length) {
      console.warn(`Warning: Product count mismatch. PostgreSQL: ${pgProducts.length}, Supabase: ${supabaseResult.length}`);
    } else {
      console.log("✅ Product counts match between PostgreSQL and Supabase!");
    }
    
    // Display a few products as sample
    console.log("\nSample products in Supabase:");
    supabaseResult.slice(0, 3).forEach(product => {
      console.log(`ID: ${product.id}, User ID: ${product.user_id}, Name: ${product.name}`);
    });
    
  } catch (error) {
    console.error("Error during sync:", error);
  }
}

// Run the sync
syncProductsToSupabase()
  .catch(console.error)
  .finally(() => {
    // Exit after a short delay
    setTimeout(() => process.exit(0), 1000);
  });