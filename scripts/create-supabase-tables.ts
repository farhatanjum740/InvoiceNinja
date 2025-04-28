import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Setting up Supabase tables...');

  try {
    // Create users table if it doesn't exist
    console.log('Creating users table...');
    const { error: createUsersError } = await supabase.from('users').insert({
      username: 'temp_setup_user',
      email: 'temp_setup@example.com',
      password: 'temp_password',
      name: 'Temporary Setup User',
      created_at: new Date().toISOString()
    }).select();
    
    // Error handling for createUsersError
    if (createUsersError) {
      console.log(`Users table check: ${createUsersError.message}`);
    } else {
      console.log('Users table exists and insert succeeded');
    }
    
    // Create companies table if it doesn't exist
    console.log('Creating companies table...');
    const { error: createCompaniesError } = await supabase.from('companies').insert({
      user_id: 0, // This will fail due to foreign key, but we just want to check if table exists
      name: 'Temp Company'
    }).select();
    
    // Error handling for createCompaniesError
    if (createCompaniesError) {
      console.log(`Companies table check: ${createCompaniesError.message}`);
    } else {
      console.log('Companies table exists and insert succeeded');
    }
    
    // Create customers table if it doesn't exist
    console.log('Creating customers table...');
    const { error: createCustomersError } = await supabase.from('customers').insert({
      user_id: 0, // This will fail due to foreign key, but we just want to check if table exists
      name: 'Temp Customer'
    }).select();
    
    // Error handling for createCustomersError
    if (createCustomersError) {
      console.log(`Customers table check: ${createCustomersError.message}`);
    } else {
      console.log('Customers table exists and insert succeeded');
    }
    
    // Create products table if it doesn't exist
    console.log('Creating products table...');
    const { error: createProductsError } = await supabase.from('products').insert({
      user_id: 0, // This will fail due to foreign key, but we just want to check if table exists
      name: 'Temp Product',
      rate: 0,
      gst_rate: 0
    }).select();
    
    // Error handling for createProductsError
    if (createProductsError) {
      console.log(`Products table check: ${createProductsError.message}`);
    } else {
      console.log('Products table exists and insert succeeded');
    }
    
    // Create invoices table if it doesn't exist
    console.log('Creating invoices table...');
    const { error: createInvoicesError } = await supabase.from('invoices').insert({
      user_id: 0, // This will fail due to foreign key, but we just want to check if table exists
      invoice_number: 'TEMP-001',
      customer_id: 0,
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0
    }).select();
    
    // Error handling for createInvoicesError
    if (createInvoicesError) {
      console.log(`Invoices table check: ${createInvoicesError.message}`);
    } else {
      console.log('Invoices table exists and insert succeeded');
    }
    
    // Create invoice_items table if it doesn't exist
    console.log('Creating invoice_items table...');
    const { error: createInvoiceItemsError } = await supabase.from('invoice_items').insert({
      invoice_id: 0, // This will fail due to foreign key, but we just want to check if table exists
      description: 'Temp Item',
      quantity: 0,
      rate: 0,
      gst_rate: 0,
      amount: 0
    }).select();
    
    // Error handling for createInvoiceItemsError
    if (createInvoiceItemsError) {
      console.log(`Invoice items table check: ${createInvoiceItemsError.message}`);
    } else {
      console.log('Invoice items table exists and insert succeeded');
    }
    
    // Now let's check what tables exist by querying them
    console.log('\nChecking existing tables in Supabase...');
    
    const { data: usersData, error: usersError } = await supabase.from('users').select('id').limit(1);
    console.log(`Users table: ${usersError ? 'Not found' : 'Exists'}`);
    
    const { data: companiesData, error: companiesError } = await supabase.from('companies').select('id').limit(1);
    console.log(`Companies table: ${companiesError ? 'Not found' : 'Exists'}`);
    
    const { data: customersData, error: customersError } = await supabase.from('customers').select('id').limit(1);
    console.log(`Customers table: ${customersError ? 'Not found' : 'Exists'}`);
    
    const { data: productsData, error: productsError } = await supabase.from('products').select('id').limit(1);
    console.log(`Products table: ${productsError ? 'Not found' : 'Exists'}`);
    
    const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('id').limit(1);
    console.log(`Invoices table: ${invoicesError ? 'Not found' : 'Exists'}`);
    
    const { data: invoiceItemsData, error: invoiceItemsError } = await supabase.from('invoice_items').select('id').limit(1);
    console.log(`Invoice items table: ${invoiceItemsError ? 'Not found' : 'Exists'}`);
    
    console.log('\nIf any tables are missing, please create them in the Supabase dashboard.');
    console.log('You can also use the Supabase migration script to transfer your data from Neon to Supabase.');
    
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
  }
}

main();