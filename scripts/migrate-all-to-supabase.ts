import { supabase, db } from '../server/db';
import { users, products, customers, companies, invoices, invoiceItems } from '@shared/schema';

// This script will migrate all data from PostgreSQL to Supabase in the correct order
async function migrateAllToSupabase() {
  console.log("Starting migration of all data from PostgreSQL to Supabase...");
  
  try {
    // Step 1: Migrate users first (required for foreign key constraints)
    await migrateUsers();
    
    // Step 2: Migrate companies
    await migrateCompanies();
    
    // Step 3: Migrate customers
    await migrateCustomers();
    
    // Step 4: Migrate products
    await migrateProducts();
    
    // Step 5: Migrate invoices
    await migrateInvoices();
    
    // Step 6: Migrate invoice items
    await migrateInvoiceItems();
    
    console.log("✅ Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

async function migrateUsers() {
  console.log("\n--- Migrating Users ---");
  
  // Fetch users from PostgreSQL
  const pgUsers = await db.select().from(users);
  console.log(`Found ${pgUsers.length} users in PostgreSQL.`);
  
  if (pgUsers.length === 0) return;
  
  // Transform users to snake_case format for Supabase
  const supabaseUsers = pgUsers.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    password: user.password,
    name: user.name,
    created_at: user.createdAt
  }));
  
  // Check existing users in Supabase
  const { data: existingUsers, error: fetchError } = await supabase
    .from('users')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing users:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingUsers?.map(u => u.id) || []);
  console.log(`Found ${existingIds.size} existing users in Supabase.`);
  
  // Filter out users that already exist
  const usersToMigrate = supabaseUsers.filter(u => !existingIds.has(u.id));
  console.log(`${usersToMigrate.length} users need to be migrated.`);
  
  if (usersToMigrate.length === 0) {
    console.log("All users are already migrated.");
    return;
  }
  
  // Insert users into Supabase
  const { data, error } = await supabase
    .from('users')
    .insert(usersToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating users:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} users to Supabase.`);
}

async function migrateCompanies() {
  console.log("\n--- Migrating Companies ---");
  
  // Fetch companies from PostgreSQL
  const pgCompanies = await db.select().from(companies);
  console.log(`Found ${pgCompanies.length} companies in PostgreSQL.`);
  
  if (pgCompanies.length === 0) return;
  
  // Transform companies to snake_case format for Supabase
  const supabaseCompanies = pgCompanies.map(company => ({
    id: company.id,
    user_id: company.userId,
    name: company.name,
    gstin: company.gstin,
    address: company.address,
    city: company.city,
    state: company.state,
    pincode: company.pincode,
    email: company.email,
    phone: company.phone,
    bank_name: company.bankName,
    account_number: company.accountNumber,
    ifsc_code: company.ifscCode,
    logo: company.logo
  }));
  
  // Check existing companies in Supabase
  const { data: existingCompanies, error: fetchError } = await supabase
    .from('companies')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing companies:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingCompanies?.map(c => c.id) || []);
  console.log(`Found ${existingIds.size} existing companies in Supabase.`);
  
  // Filter out companies that already exist
  const companiesToMigrate = supabaseCompanies.filter(c => !existingIds.has(c.id));
  console.log(`${companiesToMigrate.length} companies need to be migrated.`);
  
  if (companiesToMigrate.length === 0) {
    console.log("All companies are already migrated.");
    return;
  }
  
  // Insert companies into Supabase
  const { data, error } = await supabase
    .from('companies')
    .insert(companiesToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating companies:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} companies to Supabase.`);
}

async function migrateCustomers() {
  console.log("\n--- Migrating Customers ---");
  
  // Fetch customers from PostgreSQL
  const pgCustomers = await db.select().from(customers);
  console.log(`Found ${pgCustomers.length} customers in PostgreSQL.`);
  
  if (pgCustomers.length === 0) return;
  
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
  
  // Check existing customers in Supabase
  const { data: existingCustomers, error: fetchError } = await supabase
    .from('customers')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing customers:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingCustomers?.map(c => c.id) || []);
  console.log(`Found ${existingIds.size} existing customers in Supabase.`);
  
  // Filter out customers that already exist
  const customersToMigrate = supabaseCustomers.filter(c => !existingIds.has(c.id));
  console.log(`${customersToMigrate.length} customers need to be migrated.`);
  
  if (customersToMigrate.length === 0) {
    console.log("All customers are already migrated.");
    return;
  }
  
  // Insert customers into Supabase
  const { data, error } = await supabase
    .from('customers')
    .insert(customersToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating customers:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} customers to Supabase.`);
}

async function migrateProducts() {
  console.log("\n--- Migrating Products ---");
  
  // Fetch products from PostgreSQL
  const pgProducts = await db.select().from(products);
  console.log(`Found ${pgProducts.length} products in PostgreSQL.`);
  
  if (pgProducts.length === 0) return;
  
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
  
  // Check existing products in Supabase
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing products:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingProducts?.map(p => p.id) || []);
  console.log(`Found ${existingIds.size} existing products in Supabase.`);
  
  // Filter out products that already exist
  const productsToMigrate = supabaseProducts.filter(p => !existingIds.has(p.id));
  console.log(`${productsToMigrate.length} products need to be migrated.`);
  
  if (productsToMigrate.length === 0) {
    console.log("All products are already migrated.");
    return;
  }
  
  // Insert products into Supabase
  const { data, error } = await supabase
    .from('products')
    .insert(productsToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating products:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} products to Supabase.`);
}

async function migrateInvoices() {
  console.log("\n--- Migrating Invoices ---");
  
  // Fetch invoices from PostgreSQL
  const pgInvoices = await db.select().from(invoices);
  console.log(`Found ${pgInvoices.length} invoices in PostgreSQL.`);
  
  if (pgInvoices.length === 0) return;
  
  // Transform invoices to snake_case format for Supabase
  const supabaseInvoices = pgInvoices.map(invoice => ({
    id: invoice.id,
    user_id: invoice.userId,
    invoice_number: invoice.invoiceNumber,
    customer_id: invoice.customerId,
    invoice_date: invoice.invoiceDate,
    due_date: invoice.dueDate,
    status: invoice.status,
    subtotal: invoice.subtotal,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    total: invoice.total,
    notes: invoice.notes,
    terms_and_conditions: invoice.termsAndConditions,
    template_id: invoice.templateId,
    color_theme: invoice.colorTheme
  }));
  
  // Check existing invoices in Supabase
  const { data: existingInvoices, error: fetchError } = await supabase
    .from('invoices')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing invoices:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingInvoices?.map(i => i.id) || []);
  console.log(`Found ${existingIds.size} existing invoices in Supabase.`);
  
  // Filter out invoices that already exist
  const invoicesToMigrate = supabaseInvoices.filter(i => !existingIds.has(i.id));
  console.log(`${invoicesToMigrate.length} invoices need to be migrated.`);
  
  if (invoicesToMigrate.length === 0) {
    console.log("All invoices are already migrated.");
    return;
  }
  
  // Insert invoices into Supabase
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoicesToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating invoices:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} invoices to Supabase.`);
}

async function migrateInvoiceItems() {
  console.log("\n--- Migrating Invoice Items ---");
  
  // Fetch invoice items from PostgreSQL
  const pgInvoiceItems = await db.select().from(invoiceItems);
  console.log(`Found ${pgInvoiceItems.length} invoice items in PostgreSQL.`);
  
  if (pgInvoiceItems.length === 0) return;
  
  // Transform invoice items to snake_case format for Supabase
  const supabaseInvoiceItems = pgInvoiceItems.map(item => ({
    id: item.id,
    invoice_id: item.invoiceId,
    product_id: item.productId,
    description: item.description,
    hsn_code: item.hsnCode,
    quantity: item.quantity,
    rate: item.rate,
    gst_rate: item.gstRate,
    amount: item.amount
  }));
  
  // Check existing invoice items in Supabase
  const { data: existingItems, error: fetchError } = await supabase
    .from('invoice_items')
    .select('id');
    
  if (fetchError) {
    console.error("Error checking existing invoice items:", fetchError);
    return;
  }
  
  const existingIds = new Set(existingItems?.map(i => i.id) || []);
  console.log(`Found ${existingIds.size} existing invoice items in Supabase.`);
  
  // Filter out invoice items that already exist
  const itemsToMigrate = supabaseInvoiceItems.filter(i => !existingIds.has(i.id));
  console.log(`${itemsToMigrate.length} invoice items need to be migrated.`);
  
  if (itemsToMigrate.length === 0) {
    console.log("All invoice items are already migrated.");
    return;
  }
  
  // Insert invoice items into Supabase
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(itemsToMigrate)
    .select();
    
  if (error) {
    console.error("Error migrating invoice items:", error);
    return;
  }
  
  console.log(`✅ Successfully migrated ${data?.length || 0} invoice items to Supabase.`);
}

// Run the migration
migrateAllToSupabase()
  .catch(console.error)
  .finally(() => {
    // Exit after a short delay
    setTimeout(() => process.exit(0), 1000);
  });