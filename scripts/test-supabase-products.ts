import { createClient } from '@supabase/supabase-js';

async function testSupabaseListProducts() {
  // Check for environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
  }

  // Initialize Supabase client
  console.log('Initializing Supabase client...');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    // Test listing products from Supabase
    console.log('Listing products from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Error listing products:', error);
      process.exit(1);
    }

    // Display results
    console.log(`Found ${data.length} products:`);
    data.forEach((product: any) => {
      console.log(`ID: ${product.id}, User ID: ${product.user_id}, Name: ${product.name}`);
    });

  } catch (error) {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  }
}

testSupabaseListProducts().catch(console.error);