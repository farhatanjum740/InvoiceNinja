import { sql } from 'drizzle-orm';
import { db, client, supabase } from '../server/db';

// This script checks if required tables exist and creates them if not
async function ensureTables() {
  console.log("Checking and ensuring all required tables exist...");
  
  try {
    // First check if tables exist using Drizzle
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as users_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'companies'
      ) as companies_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'customers'
      ) as customers_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      ) as products_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
      ) as invoices_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoice_items'
      ) as invoice_items_exists
    `);
    
    console.log("Table existence check:", result);
    
    // If any table is missing, create all tables to ensure consistency
    if (!result[0] || 
        !result[0].users_exists || 
        !result[0].companies_exists ||
        !result[0].customers_exists ||
        !result[0].products_exists ||
        !result[0].invoices_exists ||
        !result[0].invoice_items_exists) {
      
      console.log("Some tables are missing. Creating all tables...");
      
      // Create users table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log("✅ Created users table");
      
      // Create companies table
      await db.execute(sql`
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
        )
      `);
      console.log("✅ Created companies table");
      
      // Create customers table
      await db.execute(sql`
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
        )
      `);
      console.log("✅ Created customers table");
      
      // Create products table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          description TEXT,
          hsn_code TEXT,
          unit TEXT,
          rate DECIMAL(10,2) NOT NULL,
          gst_rate INTEGER NOT NULL
        )
      `);
      console.log("✅ Created products table");
      
      // Create invoices table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          invoice_number TEXT NOT NULL,
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          invoice_date TIMESTAMPTZ DEFAULT NOW(),
          due_date TIMESTAMPTZ,
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
        )
      `);
      console.log("✅ Created invoices table");
      
      // Create invoice_items table
      await db.execute(sql`
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
        )
      `);
      console.log("✅ Created invoice_items table");
    } else {
      console.log("✅ All required tables already exist");
    }
  } catch (error) {
    console.error("❌ Error ensuring tables:", error);
  }
}

// Run the table check and creation
ensureTables()
  .catch(console.error)
  .finally(() => {
    // Close database connection
    setTimeout(() => {
      client.end();
      process.exit(0);
    }, 1000);
  });