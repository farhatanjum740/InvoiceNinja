import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("Checking products and invoice_items tables directly...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Checking products table...");
    const productsResult = await pool.query('SELECT * FROM products');
    console.log(`Found ${productsResult.rows.length} products:`);
    console.table(productsResult.rows);
    
    console.log("\nChecking invoice_items table...");
    const itemsResult = await pool.query('SELECT * FROM invoice_items');
    console.log(`Found ${itemsResult.rows.length} invoice items:`);
    console.table(itemsResult.rows);
    
    console.log("\nChecking foreign key constraint...");
    const constraintResult = await pool.query(`
      SELECT conname, conrelid::regclass, confrelid::regclass
      FROM pg_constraint
      WHERE contype = 'f' AND confrelid = 'products'::regclass::oid
    `);
    console.log("Foreign key constraints referencing products table:");
    console.table(constraintResult.rows);
    
    // Check for broken references
    console.log("\nChecking for invoice items with non-existent product_id...");
    const brokenRefsResult = await pool.query(`
      SELECT i.id, i.invoice_id, i.product_id
      FROM invoice_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.product_id IS NOT NULL AND p.id IS NULL
    `);
    
    if (brokenRefsResult.rows.length > 0) {
      console.log("Found invoice items with invalid product references:");
      console.table(brokenRefsResult.rows);
      
      // Fix broken references by setting product_id to NULL
      console.log("\nFixing broken references by setting product_id to NULL...");
      const fixResult = await pool.query(`
        UPDATE invoice_items
        SET product_id = NULL
        WHERE product_id IN (
          SELECT i.product_id
          FROM invoice_items i
          LEFT JOIN products p ON i.product_id = p.id
          WHERE i.product_id IS NOT NULL AND p.id IS NULL
        )
        RETURNING id, invoice_id, product_id
      `);
      
      console.log(`Fixed ${fixResult.rows.length} broken references:`);
      console.table(fixResult.rows);
    } else {
      console.log("No broken references found.");
    }
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});