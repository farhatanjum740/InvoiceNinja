import { supabase, db } from '../server/db';
import { products } from '@shared/schema';

// This script will copy all products from the PostgreSQL database to Supabase
async function migrateProductsToSupabase() {
  console.log("Starting migration of products from PostgreSQL to Supabase...");
  
  try {
    // Step 1: Fetch all products from PostgreSQL
    console.log("Fetching products from PostgreSQL...");
    const pgProducts = await db.select().from(products);
    console.log(`Found ${pgProducts.length} products in PostgreSQL.`);
    
    if (pgProducts.length === 0) {
      console.log("No products to migrate.");
      return;
    }
    
    // Step 2: Transform products to snake_case format for Supabase
    const supabaseProducts = pgProducts.map(product => ({
      id: product.id, // Keep the same ID
      user_id: product.userId,
      name: product.name,
      description: product.description,
      hsn_code: product.hsnCode,
      unit: product.unit,
      rate: product.rate,
      gst_rate: product.gstRate
    }));
    
    // Step 3: Check if products already exist in Supabase
    console.log("Checking existing products in Supabase...");
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id');
      
    if (fetchError) {
      console.error("Error checking existing products:", fetchError);
      return;
    }
    
    const existingIds = new Set(existingProducts?.map(p => p.id) || []);
    console.log(`Found ${existingIds.size} existing products in Supabase.`);
    
    // Step 4: Filter out products that already exist in Supabase
    const productsToMigrate = supabaseProducts.filter(p => !existingIds.has(p.id));
    console.log(`${productsToMigrate.length} products need to be migrated.`);
    
    if (productsToMigrate.length === 0) {
      console.log("All products are already migrated.");
      return;
    }
    
    // Step 5: Insert products into Supabase
    console.log("Inserting products into Supabase...");
    const { data, error } = await supabase
      .from('products')
      .insert(productsToMigrate)
      .select();
      
    if (error) {
      console.error("Error migrating products:", error);
      return;
    }
    
    console.log(`✅ Successfully migrated ${data?.length || 0} products to Supabase.`);
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrateProductsToSupabase()
  .catch(console.error)
  .finally(() => {
    // Exit after a short delay
    setTimeout(() => process.exit(0), 1000);
  });