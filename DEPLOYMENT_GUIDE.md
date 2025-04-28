# Deployment Guide: Invoice App with Supabase + Hostinger

This guide will help you deploy your invoice management application using Supabase for backend services and Hostinger for web hosting.

## Prerequisites

- A Supabase account and project created at [supabase.com](https://supabase.com)
- A Hostinger account with Node.js hosting plan
- Your invoice app codebase ready for deployment

## Step 1: Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and API keys from the Dashboard -> Settings -> API section

2. **Set Up Database Schema**:
   - Connect to your Supabase database using the PostgreSQL connection string
   - Run migrations to set up your database schema:
     ```bash
     SUPABASE_POSTGRES_URL=postgres://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres npm run db:push
     ```

3. **Configure Authentication**:
   - In the Supabase dashboard, go to Authentication -> Settings
   - Ensure Email authentication is enabled
   - Set up any other auth providers if needed

4. **Create Storage Buckets**:
   - Go to Storage in your Supabase dashboard
   - Create two buckets:
     1. `company-logos` - For storing company logos
     2. `invoice-attachments` - For storing invoice attachments
   - Set the appropriate security policies for each bucket

## Step 2: Build Your Application

1. **Update Environment Variables**:
   - Create `.env` file at the project root with your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project-ref.supabase.co
     SUPABASE_KEY=your-anon-key
     SUPABASE_SERVICE_KEY=your-service-role-key
     SUPABASE_POSTGRES_URL=postgres://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
     SESSION_SECRET=your-random-secret-string
     ```

2. **Create Client-Side Environment Variables**:
   - Create `client/.env` file with:
     ```
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_KEY=your-anon-key
     ```

3. **Build Your Application**:
   ```bash
   # Build the client
   cd client
   npm run build

   # Build the server
   cd ..
   npm run build
   ```

## Step 3: Deploy to Hostinger

1. **Create a Node.js Hosting Account on Hostinger**:
   - Sign in to Hostinger
   - Purchase a Node.js compatible hosting plan
   - Create a new website or use an existing one

2. **Access Your Hosting via SSH**:
   - Get SSH credentials from Hostinger control panel
   - Connect using a terminal or SSH client:
     ```bash
     ssh u123456789@your-hostinger-server.com
     ```

3. **Upload Your Application**:
   - Create a directory for your application:
     ```bash
     mkdir -p ~/public_html/invoice-app
     cd ~/public_html/invoice-app
     ```

   - Upload your built application (using SFTP or Git):
     ```bash
     # If using Git
     git clone https://your-repository-url.git .
     
     # If using SFTP, upload the following directories:
     # - dist/ (compiled server code)
     # - client/dist/ (compiled client code)
     # - node_modules/ (dependencies)
     # - server/ (server source code, if needed)
     # - package.json
     ```

4. **Set Environment Variables**:
   - Create `.env` file on the server with your production environment variables
   - Make sure it includes all the Supabase credentials

5. **Install Dependencies**:
   ```bash
   npm install --production
   ```

6. **Set Up Process Manager (PM2)**:
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start your application
   pm2 start dist/server/index.js --name invoice-app
   
   # Set up PM2 to start on server reboot
   pm2 startup
   pm2 save
   ```

7. **Configure Domain in Hostinger**:
   - Go to Hostinger control panel
   - Set up your domain to point to your Node.js application
   - Configure Nginx as a reverse proxy to your Node.js app

8. **Set Up HTTPS with Let's Encrypt**:
   - In Hostinger control panel, navigate to SSL/TLS certificates
   - Request a Let's Encrypt certificate for your domain
   - Activate the certificate for your website

## Step 4: Test Your Deployment

1. **Visit your domain** to verify that your application is running correctly.
2. **Test the authentication system** by registering and logging in.
3. **Test file uploads** for company logos to confirm Supabase Storage is working.
4. **Create and manage invoices** to test the complete workflow.

## Troubleshooting

- **Connection Issues**:
  - Check your Supabase connection strings and API keys.
  - Ensure your IP is allowed in Supabase's IP restriction settings.

- **Database Errors**:
  - Review database logs in the Supabase dashboard.
  - Check for schema version mismatches between your code and database.

- **Application Errors**:
  - Check PM2 logs: `pm2 logs invoice-app`
  - Check Node.js application logs in Hostinger's panel.

- **CORS Issues**:
  - Add your domain to the allowed origins in Supabase Authentication settings.

## Maintenance

- **Database Updates**:
  - When making schema changes, run migrations again.

- **Application Updates**:
  ```bash
  # Pull latest code
  git pull
  
  # Build frontend and backend
  npm run build
  cd client && npm run build && cd ..
  
  # Restart the application
  pm2 restart invoice-app
  ```

- **Backup Strategy**:
  - Set up regular database backups in Supabase.
  - Back up file storage periodically.
  - Export important data as CSV/JSON for additional security.

## Security Best Practices

- Keep your service key secure and never expose it client-side.
- Regularly update your dependencies for security patches.
- Set up proper Row Level Security (RLS) in Supabase for proper data isolation.
- Use strong passwords and enable MFA for your Supabase and Hostinger accounts.