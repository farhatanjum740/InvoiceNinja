import { db } from "../server/db";

async function main() {
  const tableName = process.argv[2];
  
  if (!tableName) {
    console.log("Usage: npm run view-data [tableName]");
    console.log("Available tables: users, companies, customers, products, invoices, invoice_items");
    process.exit(1);
  }
  
  try {
    const result = await db.execute(`SELECT * FROM ${tableName}`);
    console.log(JSON.stringify(result.rows, null, 2));
    console.log(`\nTotal ${tableName} found: ${result.rows.length}`);
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error);
  } finally {
    process.exit(0);
  }
}

main();