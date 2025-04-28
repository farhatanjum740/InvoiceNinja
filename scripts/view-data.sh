#!/bin/bash

# Check if table name is provided
if [ -z "$1" ]; then
  echo "Usage: bash scripts/view-data.sh [tableName]"
  echo "Available tables: users, companies, customers, products, invoices, invoice_items"
  exit 1
fi

# Create a temporary TS file
cat > scripts/temp-query.ts << EOL
import { db } from "../server/db";

async function main() {
  try {
    const result = await db.execute(\`SELECT * FROM ${1}\`);
    console.log(JSON.stringify(result.rows, null, 2));
    console.log(\`\nTotal ${1} found: \${result.rows.length}\`);
  } catch (error) {
    console.error(\`Error querying table ${1}:\`, error);
  } finally {
    process.exit(0);
  }
}

main();
EOL

# Run the temporary file
tsx scripts/temp-query.ts

# Clean up
rm scripts/temp-query.ts