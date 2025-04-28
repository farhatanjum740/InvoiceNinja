# Supabase Setup Guide for Invoice Management System

This guide will help you set up the necessary tables and structures in Supabase for your Invoice Management System.

## Table Structures

### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Companies Table
```sql
CREATE TABLE companies (
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
);
```

### 3. Customers Table
```sql
CREATE TABLE customers (
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
);
```

### 4. Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  unit TEXT,
  rate DECIMAL(10,2) NOT NULL,
  gst_rate INTEGER NOT NULL
);
```

### 5. Invoices Table
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  invoice_number TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
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
);
```

### 6. Invoice Items Table
```sql
CREATE TABLE invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  gst_rate INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL
);
```

### 7. Create Indexes for Better Performance
```sql
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
```

## How to Set Up Tables in Supabase

1. Log in to your Supabase account at [https://app.supabase.io/](https://app.supabase.io/)
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the SQL code for each table
6. Run the query

You can also use the provided scripts:
- `scripts/create-supabase-tables.ts`: Checks if tables exist in Supabase
- `scripts/migrate-to-supabase.ts`: Migrates data from your current database to Supabase

## Setting Up Row-Level Security (RLS)

For proper security, set up Row-Level Security (RLS) policies for your tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policies for companies
CREATE POLICY "Users can manage their own companies" ON companies
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for customers
CREATE POLICY "Users can manage their own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for products
CREATE POLICY "Users can manage their own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for invoices
CREATE POLICY "Users can manage their own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for invoice items
CREATE POLICY "Users can manage their own invoice items" ON invoice_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM invoices WHERE id = invoice_id
    )
  );
```

## Updating Your App to Use Supabase

After setting up your tables, you'll need to update your application to use Supabase instead of the current database. The key files to modify are:

1. `server/db.ts`: Update to use Supabase
2. `server/storage.ts`: Update to use Supabase for data storage

## Supabase Storage Setup

For file storage (company logos, etc.), set up the following buckets in Supabase Storage:

1. `company-logos`: For storing company logos
2. `invoice-attachments`: For storing invoice attachments

Example RLS policies for storage:

```sql
-- For company logos
CREATE POLICY "Users can upload their own company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For invoice attachments
CREATE POLICY "Users can upload their own invoice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```