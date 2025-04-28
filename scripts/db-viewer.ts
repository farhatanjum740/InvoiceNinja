import { db } from "../server/db";

async function main() {
  const tableName = process.argv[2];
  
  if (!tableName) {
    console.log("Usage: tsx scripts/db-viewer.ts [tableName]");
    console.log("Available tables: users, companies, customers, products, invoices, invoice_items");
    process.exit(1);
  }
  
  try {
    console.log(`Fetching data from table: ${tableName}`);
    const result = await db.query(`SELECT * FROM ${tableName}`);
    
    if (result && Array.isArray(result)) {
      console.log(JSON.stringify(result, null, 2));
      console.log(`\nTotal ${tableName} found: ${result.length}`);
    } else {
      console.log("No data found or result format unexpected");
      console.log("Result:", result);
    }
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error);
  } finally {
    process.exit(0);
  }
}

main();