# Supabase Database Tools

This directory contains scripts to help you work with your Supabase database for the Invoice Management System.

## Available Scripts

### 1. Check Supabase Tables

```bash
tsx scripts/create-supabase-tables.ts
```

This script checks if the required tables exist in your Supabase project. It doesn't create the tables but identifies which ones are missing.

### 2. Create Supabase Tables

```bash
tsx scripts/supabase-create-tables.ts
```

This script creates all the necessary tables in your Supabase project using SQL commands.

### 3. Migrate Data to Supabase

```bash
tsx scripts/migrate-to-supabase.ts
```

This script migrates all your existing data from the Neon PostgreSQL database to your Supabase tables.

## Manual Setup

If you prefer to set up your tables manually in the Supabase dashboard:

1. Go to [https://app.supabase.io/](https://app.supabase.io/) and log in
2. Select your project
3. Navigate to "Table Editor" or "SQL Editor"
4. Create the tables according to the schema in `SUPABASE_SETUP_GUIDE.md`

## Connecting Your App to Supabase

After you've set up your tables in Supabase, you'll need to:

1. Update your application code to use Supabase for database access
2. Create the necessary Supabase storage buckets for file uploads:
   - `company-logos`
   - `invoice-attachments`

See `SUPABASE_SETUP_GUIDE.md` for more detailed instructions.

## Switching Between Databases

Your application is currently configured to use Neon PostgreSQL. To switch to Supabase:

1. Update `server/db.ts` to use Supabase instead of direct PostgreSQL connection
2. Update `server/storage.ts` to use Supabase methods for data access

This will allow your application to work with the Supabase database instead of Neon PostgreSQL.