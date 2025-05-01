# InvoiceHub Deployment Guide

This guide provides comprehensive instructions for deploying the InvoiceHub application to a production server.

## Prerequisites

- A Virtual Private Server (VPS) or dedicated server running Ubuntu 20.04 or newer
- Node.js 18+ installed
- Nginx web server
- PM2 process manager (`npm install -g pm2`)
- Basic knowledge of Linux command line, Nginx, and Node.js

## 1. Application Setup

### 1.1 Clone and Build the Application

The simplest approach is to build the application locally and then transfer the files to your server:

```bash
# On your local machine
npm run build

# Create a deployment package
tar -czvf invoicehub-deploy.tar.gz dist/ .env.production package.json package-lock.json

# Transfer to your server
scp invoicehub-deploy.tar.gz user@your-server-ip:/path/to/deploy/
```

### 1.2 Server Setup

```bash
# On your server
cd /path/to/deploy
tar -xzvf invoicehub-deploy.tar.gz
npm ci --production  # Install production dependencies only
```

## 2. Environment Configuration

Create a proper `.env` file in your production environment:

```
# Application settings
NODE_ENV=production
SESSION_SECRET=your-strong-session-secret

# Supabase settings
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Database URL for PostgreSQL session store
DATABASE_URL=postgres://username:password@host:port/database

# Frontend environment variables (will be embedded during build)
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key
```

## 3. Database Setup

Our application uses Supabase for the main database and a PostgreSQL connection for session persistence.

### 3.1 Supabase Configuration

Ensure your Supabase project has the correct schema. You don't need to manually create tables as our application handles schema creation and updates.

### 3.2 Database Connection

Verify the `DATABASE_URL` in your `.env` file. This connection is used for session storage.

## 4. Process Management with PM2

Create a PM2 ecosystem file named `ecosystem.config.js` in your deployment directory:

```javascript
module.exports = {
  apps: [{
    name: "invoicehub",
    script: "dist/server/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
    }
  }]
};
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save  # Save the process list for automatic startup
```

## 5. Nginx Configuration

This is a crucial part for resolving routing issues.

### 5.1 Create Nginx Configuration

Create a new config file in `/etc/nginx/sites-available/invoicehub.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Root directory for static files
    root /path/to/deploy/dist/public;
    
    # API proxy - forward all API requests to the Node.js server
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Special server-rendered routes
    location /server-check {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /direct-supabase-test {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static file serving with cache headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }
    
    # CRITICAL: For all other routes, serve index.html
    # This is the key to making client-side routing work
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### 5.2 Enable the Configuration

```bash
ln -s /etc/nginx/sites-available/invoicehub.conf /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl restart nginx
```

## 6. SSL/TLS Configuration

It's highly recommended to secure your site with HTTPS. Use Let's Encrypt:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 7. Troubleshooting Routing Issues

### 7.1 Diagnosing 404 Errors

If you're experiencing 404 errors when directly accessing routes like `/dashboard` or `/invoices`:

1. First, check if server routes are working by accessing `/server-check` in your browser
2. Verify your Nginx configuration has the correct `try_files $uri $uri/ /index.html;` directive
3. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Check application logs: `pm2 logs invoicehub`

### 7.2 Common Solutions

- **Problem**: 404 on direct route access
  - **Solution**: Ensure the Nginx `try_files` directive is correctly set up
  
- **Problem**: API routes return 404
  - **Solution**: Verify the `/api/` location block in Nginx is properly proxying to port 5000
  
- **Problem**: Static assets not loading
  - **Solution**: Check the `root` directive points to the correct `dist/public` directory

## 8. Updating the Application

To update your application:

```bash
# On your local machine
npm run build
tar -czvf invoicehub-deploy.tar.gz dist/ .env.production package.json package-lock.json
scp invoicehub-deploy.tar.gz user@your-server-ip:/path/to/deploy/

# On your server
cd /path/to/deploy
pm2 stop invoicehub
tar -xzvf invoicehub-deploy.tar.gz
npm ci --production
pm2 start ecosystem.config.js
```

## 9. Server Monitoring and Maintenance

Regularly monitor your application:

```bash
pm2 monit  # Monitor application memory and CPU usage
pm2 logs    # View application logs
```

Set up log rotation for Node.js application logs:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 10. Testing Your Deployment

After deployment, test these crucial paths:

1. `/server-check` - Should show the server diagnostic page
2. `/api/user` - Should return 401 if not logged in or user data if logged in
3. `/dashboard` - Should redirect to login page if not authenticated
4. `/auth` - Should show the authentication page
5. Direct access to various routes like `/invoices`, `/customers`, etc.

Thoroughly test the entire application flow, including uploading files, generating invoices, and any other critical functionality.

## Further Assistance

If you continue to experience issues with routing or other aspects of deployment, check the application logs and server configurations thoroughly. The most common causes of routing problems are incorrect Nginx configuration or issues with the build process.
