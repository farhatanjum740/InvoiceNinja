import { createClient } from '@supabase/supabase-js';
import { db } from '../server/db';
import * as schema from '../shared/schema';

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Helper function to convert object keys from camelCase to snake_case
function convertKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = obj[key];
    }
  }
  
  return result;
}

async function main() {
  console.log('Starting data migration to Supabase...');
  
  try {
    // Fetch all data from current database
    console.log('Fetching users...');
    const users = await db.select().from(schema.users);
    
    console.log('Fetching companies...');
    const companies = await db.select().from(schema.companies);
    
    console.log('Fetching customers...');
    const customers = await db.select().from(schema.customers);
    
    console.log('Fetching products...');
    const products = await db.select().from(schema.products);
    
    console.log('Fetching invoices...');
    const invoices = await db.select().from(schema.invoices);
    
    console.log('Fetching invoice items...');
    const invoiceItems = await db.select().from(schema.invoiceItems);
    
    // Migrate users
    console.log(`Migrating ${users.length} users to Supabase...`);
    for (const user of users) {
      const userData = convertKeysToSnakeCase(user);
      
      // Fix created_at field name
      if (userData.created_at === undefined && userData.createdat) {
        userData.created_at = userData.createdat;
        delete userData.createdat;
      }
      
      const { error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating user ${user.id}: ${error.message}`);
    }
    
    // Migrate companies
    console.log(`Migrating ${companies.length} companies to Supabase...`);
    for (const company of companies) {
      const { error } = await supabase
        .from('companies')
        .upsert(convertKeysToSnakeCase(company), { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating company ${company.id}: ${error.message}`);
    }
    
    // Migrate customers
    console.log(`Migrating ${customers.length} customers to Supabase...`);
    for (const customer of customers) {
      const { error } = await supabase
        .from('customers')
        .upsert(convertKeysToSnakeCase(customer), { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating customer ${customer.id}: ${error.message}`);
    }
    
    // Migrate products
    console.log(`Migrating ${products.length} products to Supabase...`);
    for (const product of products) {
      const { error } = await supabase
        .from('products')
        .upsert(convertKeysToSnakeCase(product), { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating product ${product.id}: ${error.message}`);
    }
    
    // Migrate invoices
    console.log(`Migrating ${invoices.length} invoices to Supabase...`);
    for (const invoice of invoices) {
      const { error } = await supabase
        .from('invoices')
        .upsert(convertKeysToSnakeCase(invoice), { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating invoice ${invoice.id}: ${error.message}`);
    }
    
    // Migrate invoice items
    console.log(`Migrating ${invoiceItems.length} invoice items to Supabase...`);
    for (const item of invoiceItems) {
      const { error } = await supabase
        .from('invoice_items')
        .upsert(convertKeysToSnakeCase(item), { onConflict: 'id' });
      
      if (error) throw new Error(`Error migrating invoice item ${item.id}: ${error.message}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

main();