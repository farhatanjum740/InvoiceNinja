import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Setting up Supabase tables...');

  try {
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (usersError) throw usersError;
    
    // Create companies table
    console.log('Creating companies table...');
    const { error: companiesError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          gstin TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          email TEXT,
          phone TEXT,
          bank_name TEXT,
          account_number TEXT,
          ifsc_code TEXT,
          logo TEXT
        );
      `
    });
    
    if (companiesError) throw companiesError;
    
    // Create customers table
    console.log('Creating customers table...');
    const { error: customersError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          gstin TEXT,
          billing_address TEXT,
          billing_city TEXT,
          billing_state TEXT,
          billing_pincode TEXT,
          shipping_address TEXT,
          shipping_city TEXT,
          shipping_state TEXT,
          shipping_pincode TEXT,
          same_as_shipping BOOLEAN DEFAULT TRUE
        );
      `
    });
    
    if (customersError) throw customersError;
    
    // Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          description TEXT,
          hsn_code TEXT,
          unit TEXT,
          rate DECIMAL(10,2) NOT NULL,
          gst_rate INTEGER NOT NULL
        );
      `
    });
    
    if (productsError) throw productsError;
    
    // Create invoices table
    console.log('Creating invoices table...');
    const { error: invoicesError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          invoice_number TEXT NOT NULL,
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'pending',
          subtotal DECIMAL(10,2) NOT NULL,
          cgst DECIMAL(10,2) NOT NULL,
          sgst DECIMAL(10,2) NOT NULL,
          igst DECIMAL(10,2) NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          notes TEXT,
          terms_and_conditions TEXT,
          template_id TEXT DEFAULT 'standard',
          color_theme TEXT DEFAULT 'blue'
        );
      `
    });
    
    if (invoicesError) throw invoicesError;
    
    // Create invoice_items table
    console.log('Creating invoice_items table...');
    const { error: invoiceItemsError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE TABLE IF NOT EXISTS invoice_items (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          description TEXT NOT NULL,
          hsn_code TEXT,
          quantity DECIMAL(10,2) NOT NULL,
          rate DECIMAL(10,2) NOT NULL,
          gst_rate INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL
        );
      `
    });
    
    if (invoiceItemsError) throw invoiceItemsError;
    
    // Add indexes for better performance
    console.log('Creating indexes...');
    const { error: indexesError } = await supabase.rpc('pgclient_query', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
        CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
        CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
      `
    });
    
    if (indexesError) throw indexesError;

    console.log('Successfully created all tables in Supabase!');
    
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
  }
}

main();