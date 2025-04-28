import { supabase } from '../server/db';

// This script will check if products are properly synced in Supabase
async function checkSupabaseProducts() {
  console.log("Checking products in Supabase...");
  
  try {
    // Query products from Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    if (error) {
      console.error("Error fetching products from Supabase:", error);
      return;
    }
    
    console.log(`Found ${data.length} products in Supabase:`);
    
    // Display the products
    data.forEach(product => {
      console.log(`ID: ${product.id}, User ID: ${product.user_id}, Name: ${product.name}`);
    });
  } catch (error) {
    console.error("Error during check:", error);
  }
}

// Run the check
checkSupabaseProducts()
  .catch(console.error)
  .finally(() => {
    setTimeout(() => process.exit(0), 1000);
  });