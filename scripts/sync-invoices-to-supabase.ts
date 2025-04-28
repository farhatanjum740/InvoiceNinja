import { db, supabase } from '../server/db';
import { invoices, invoiceItems } from '@shared/schema';

// This script will sync all invoices and invoice items from PostgreSQL to Supabase
async function syncInvoicesToSupabase() {
  console.log("Starting sync of invoices and invoice items from PostgreSQL to Supabase...");
  
  try {
    // Fetch all invoices from PostgreSQL
    console.log("Fetching invoices from PostgreSQL...");
    const pgInvoices = await db.select().from(invoices);
    console.log(`Found ${pgInvoices.length} invoices in PostgreSQL.`);
    
    if (pgInvoices.length === 0) {
      console.log("No invoices to sync.");
      return;
    }
    
    // Transform invoices to snake_case format for Supabase based on actual schema
    const supabaseInvoices = pgInvoices.map(invoice => ({
      id: invoice.id,
      user_id: invoice.userId,
      customer_id: invoice.customerId,
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate,
      due_date: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      subtotal: invoice.subtotal,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      total: invoice.total,
      terms_and_conditions: invoice.termsAndConditions,
      template_id: invoice.templateId,
      color_theme: invoice.colorTheme
    }));
    
    // Insert or update (upsert) invoices into Supabase
    console.log("Syncing invoices to Supabase...");
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .upsert(supabaseInvoices, { onConflict: 'id' });
      
    if (invoiceError) {
      console.error("Error syncing invoices:", invoiceError);
      return;
    }
    
    console.log(`✅ Successfully synced ${pgInvoices.length} invoices to Supabase.`);
    
    // Now handle invoice items
    // First, get all invoice items from PostgreSQL
    console.log("Fetching invoice items from PostgreSQL...");
    const pgInvoiceItems = await db.select().from(invoiceItems);
    console.log(`Found ${pgInvoiceItems.length} invoice items in PostgreSQL.`);
    
    if (pgInvoiceItems.length === 0) {
      console.log("No invoice items to sync.");
      return;
    }
    
    // Transform invoice items to snake_case format for Supabase based on actual schema
    const supabaseInvoiceItems = pgInvoiceItems.map(item => ({
      id: item.id,
      invoice_id: item.invoiceId,
      product_id: item.productId,
      description: item.description,
      hsn_code: item.hsnCode,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      gst_rate: item.gstRate
    }));
    
    // Insert or update (upsert) invoice items into Supabase
    console.log("Syncing invoice items to Supabase...");
    const { data: itemData, error: itemError } = await supabase
      .from('invoice_items')
      .upsert(supabaseInvoiceItems, { onConflict: 'id' });
      
    if (itemError) {
      console.error("Error syncing invoice items:", itemError);
      return;
    }
    
    console.log(`✅ Successfully synced ${pgInvoiceItems.length} invoice items to Supabase.`);
    
    // Verify Supabase invoices
    console.log("Verifying invoices in Supabase...");
    const { data: supabaseInvoiceResult, error: verifyInvoiceError } = await supabase
      .from('invoices')
      .select('*');
      
    if (verifyInvoiceError) {
      console.error("Error verifying invoices:", verifyInvoiceError);
      return;
    }
    
    // Verify Supabase invoice items
    console.log("Verifying invoice items in Supabase...");
    const { data: supabaseItemResult, error: verifyItemError } = await supabase
      .from('invoice_items')
      .select('*');
      
    if (verifyItemError) {
      console.error("Error verifying invoice items:", verifyItemError);
      return;
    }
    
    console.log(`Found ${supabaseInvoiceResult.length} invoices in Supabase after sync.`);
    console.log(`Found ${supabaseItemResult.length} invoice items in Supabase after sync.`);
    
    // Check if we have the same number of invoices and items
    if (supabaseInvoiceResult.length !== pgInvoices.length) {
      console.warn(`Warning: Invoice count mismatch. PostgreSQL: ${pgInvoices.length}, Supabase: ${supabaseInvoiceResult.length}`);
    } else {
      console.log("✅ Invoice counts match between PostgreSQL and Supabase!");
    }
    
    if (supabaseItemResult.length !== pgInvoiceItems.length) {
      console.warn(`Warning: Invoice item count mismatch. PostgreSQL: ${pgInvoiceItems.length}, Supabase: ${supabaseItemResult.length}`);
    } else {
      console.log("✅ Invoice item counts match between PostgreSQL and Supabase!");
    }
    
    // Display a few invoices as sample
    if (supabaseInvoiceResult.length > 0) {
      console.log("\nSample invoices in Supabase:");
      supabaseInvoiceResult.slice(0, 3).forEach(invoice => {
        console.log(`ID: ${invoice.id}, User ID: ${invoice.user_id}, Invoice #: ${invoice.invoice_number}, Total: ${invoice.total}`);
      });
    }
    
  } catch (error) {
    console.error("Error during sync:", error);
  }
}

// Run the sync
syncInvoicesToSupabase()
  .catch(console.error)
  .finally(() => {
    // Exit after a short delay
    setTimeout(() => process.exit(0), 1000);
  });