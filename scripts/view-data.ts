import { db } from "../server/db";
import * as schema from "../shared/schema";

async function main() {
  const tableName = process.argv[2];
  
  if (!tableName) {
    console.log("Usage: tsx scripts/view-data.ts [tableName]");
    console.log("Available tables: users, companies, customers, products, invoices, invoice_items");
    process.exit(1);
  }
  
  try {
    console.log(`Fetching data from table: ${tableName}`);
    
    // Map table name to the actual table object
    const tableMap: Record<string, any> = {
      users: schema.users,
      companies: schema.companies,
      customers: schema.customers,
      products: schema.products,
      invoices: schema.invoices,
      invoice_items: schema.invoiceItems
    };
    
    const table = tableMap[tableName];
    
    if (!table) {
      console.error(`Unknown table: ${tableName}`);
      console.log("Available tables: users, companies, customers, products, invoices, invoice_items");
      process.exit(1);
    }
    
    // Use Drizzle's select method for the table
    const results = await db.select().from(table);
    
    if (results && results.length > 0) {
      console.log(JSON.stringify(results, null, 2));
      console.log(`\nTotal ${tableName} found: ${results.length}`);
    } else {
      console.log(`No records found in table: ${tableName}`);
    }
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error);
  } finally {
    process.exit(0);
  }
}

main();