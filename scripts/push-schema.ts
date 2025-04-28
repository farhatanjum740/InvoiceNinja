import { client, db } from '../server/db';

// This script will push the schema to the database
async function main() {
  console.log('Pushing schema to database...');
  
  try {
    // Create schema tables in the database
    await db.execute(/* sql */`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        full_name TEXT,
        supabase_id TEXT UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Companies table
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        gstin TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        bank_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        logo TEXT
      );
      
      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        gstin TEXT,
        billing_address TEXT NOT NULL,
        billing_city TEXT NOT NULL,
        billing_state TEXT NOT NULL,
        billing_pincode TEXT NOT NULL,
        shipping_address TEXT,
        shipping_city TEXT,
        shipping_state TEXT,
        shipping_pincode TEXT,
        same_as_shipping BOOLEAN DEFAULT TRUE
      );
      
      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        hsn_code TEXT,
        unit TEXT NOT NULL,
        rate DECIMAL(10, 2) NOT NULL,
        gst_rate INTEGER NOT NULL
      );
      
      -- Invoices table
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        invoice_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'draft',
        subtotal DECIMAL(10, 2) NOT NULL,
        cgst DECIMAL(10, 2),
        sgst DECIMAL(10, 2),
        igst DECIMAL(10, 2),
        total DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        terms_and_conditions TEXT,
        template_id TEXT DEFAULT 'standard',
        color_theme TEXT DEFAULT 'blue'
      );
      
      -- Invoice items table
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        product_id INTEGER REFERENCES products(id),
        description TEXT NOT NULL,
        hsn_code TEXT,
        quantity DECIMAL(10, 2) NOT NULL,
        rate DECIMAL(10, 2) NOT NULL,
        gst_rate INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL
      );
    `);
    
    console.log('Schema push completed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

main();