-- Migration helper file for moving data from Neon PostgreSQL to Supabase
-- After creating the tables in Supabase, you can use these commands to export data
-- from your Neon database and then import it into Supabase

-- 1. Export data from Neon (run these in your Neon query tool):

-- Export users
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;

-- Export companies
COPY (SELECT * FROM companies) TO '/tmp/companies.csv' WITH CSV HEADER;

-- Export customers
COPY (SELECT * FROM customers) TO '/tmp/customers.csv' WITH CSV HEADER;

-- Export products
COPY (SELECT * FROM products) TO '/tmp/products.csv' WITH CSV HEADER;

-- Export invoices
COPY (SELECT * FROM invoices) TO '/tmp/invoices.csv' WITH CSV HEADER;

-- Export invoice_items
COPY (SELECT * FROM invoice_items) TO '/tmp/invoice_items.csv' WITH CSV HEADER;

-- 2. Import data to Supabase (run these in your Supabase SQL editor):

-- Import users
-- First prepare the sequence to match your data
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
-- Then copy your data from CSV (you'll need to upload the CSV first)
COPY users FROM '/tmp/users.csv' CSV HEADER;

-- Import companies
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies), true);
COPY companies FROM '/tmp/companies.csv' CSV HEADER;

-- Import customers
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers), true);
COPY customers FROM '/tmp/customers.csv' CSV HEADER;

-- Import products
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true);
COPY products FROM '/tmp/products.csv' CSV HEADER;

-- Import invoices
SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices), true);
COPY invoices FROM '/tmp/invoices.csv' CSV HEADER;

-- Import invoice_items
SELECT setval('invoice_items_id_seq', (SELECT MAX(id) FROM invoice_items), true);
COPY invoice_items FROM '/tmp/invoice_items.csv' CSV HEADER;

-- Note: You may need to temporarily disable foreign key constraints during import:
-- ALTER TABLE companies DISABLE TRIGGER ALL;
-- ALTER TABLE customers DISABLE TRIGGER ALL;
-- ALTER TABLE products DISABLE TRIGGER ALL;
-- ALTER TABLE invoices DISABLE TRIGGER ALL;
-- ALTER TABLE invoice_items DISABLE TRIGGER ALL;

-- After import, re-enable constraints:
-- ALTER TABLE companies ENABLE TRIGGER ALL;
-- ALTER TABLE customers ENABLE TRIGGER ALL;
-- ALTER TABLE products ENABLE TRIGGER ALL;
-- ALTER TABLE invoices ENABLE TRIGGER ALL;
-- ALTER TABLE invoice_items ENABLE TRIGGER ALL;