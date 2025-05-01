# Supabase Setup Guide for InvoiceHub

This guide will help you set up and configure your Supabase project for use with InvoiceHub. Supabase is used as the primary database and storage solution for the application.

## 1. Creating a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project by clicking "New Project"
3. Enter a name for your project (e.g., "InvoiceHub")
4. Choose a strong database password and save it securely
5. Select a region closest to your users (for better performance)
6. Click "Create new project"

## 2. Getting API Keys

After your project is created, you'll need to get the API keys from the Supabase dashboard:

1. Go to the project dashboard
2. Navigate to "Project Settings" → "API"
3. You'll find two key types:
   - **anon/public** key: Used for client-side requests with limited permissions
   - **service_role** key: Used for server-side operations with full access

Add these keys to your environment variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

## 3. Storage Buckets Setup

InvoiceHub uses Supabase Storage for file uploads. You need to create the following storage buckets:

1. Go to "Storage" in the Supabase dashboard
2. Create two buckets:
   - `company-logos`: For company logo uploads
   - `invoice-attachments`: For files attached to invoices

For each bucket, set the following permissions:

### Company Logos Bucket
1. Go to "Policies" tab for the bucket
2. Create policy for INSERT:
   - Name: "Allow authenticated users to upload company logos"
   - Policy definition: `(auth.role() = 'authenticated')`
3. Create policy for SELECT:
   - Name: "Allow anyone to view company logos"
   - Policy definition: `true`

### Invoice Attachments Bucket
1. Go to "Policies" tab for the bucket
2. Create policy for INSERT:
   - Name: "Allow authenticated users to upload attachments"
   - Policy definition: `(auth.role() = 'authenticated')`
3. Create policy for SELECT:
   - Name: "Allow authenticated users to view attachments"
   - Policy definition: `(auth.role() = 'authenticated')`

## 4. Database Schema

The application will automatically create and update the database schema. However, it's good to know the tables that will be created:

- `users`: User accounts
- `company`: Company profiles
- `customers`: Customer database
- `products`: Product catalog
- `invoices`: Invoice data
- `invoice_items`: Line items for invoices
- `settings`: User preferences and settings

## 5. Configuration for Indian GST

For Indian GST requirements, the following fields are included in the schema:

- Products table includes `hsn_code`, `cgst_rate`, `sgst_rate`, and `igst_rate` fields
- Invoices determine the appropriate tax (CGST+SGST or IGST) based on shipping state comparison
- Company table includes fields for GSTIN and other tax identifiers

## 6. Testing Your Configuration

To test if your Supabase setup is working correctly:

1. Run the application locally
2. Navigate to `/server-check` to verify the server is running
3. Navigate to `/direct-supabase-test` to test direct Supabase API connectivity
4. Try to create a user account through the registration form
5. Upload a test company logo to verify storage is working

## 7. Security Considerations

- Never expose your `service_role` key in client-side code
- All Supabase operations from the frontend should use the `/api/supabase/*` proxy endpoints
- Direct Supabase client operations should only use the anon key
- Regularly rotate your API keys for additional security

## 8. Troubleshooting

### Connection Issues

If you experience connection issues with Supabase:

1. Check that the environment variables are set correctly
2. Verify that your Supabase project is active and not in maintenance mode
3. Check that you're not hitting any rate limits
4. Try using the `/server-check` and `/direct-supabase-test` routes to diagnose issues

### Permission Errors

If you see permission errors when accessing data:

1. Check your Row Level Security (RLS) policies
2. Verify that the user is authenticated if the operation requires authentication
3. Make sure you're using the server-side proxy for operations that require elevated permissions

## 9. Production Considerations

For production deployments:

1. Use a dedicated Supabase project (separate from development)
2. Set up database backups (available in Supabase Pro plans)
3. Consider upgrading to a paid plan for better performance and support
4. Monitor your database and storage usage to avoid hitting limits

## Further Support

If you need additional assistance with Supabase setup, refer to the [official Supabase documentation](https://supabase.com/docs) or contact their support team.