# Routing Fix Guide for InvoiceHub Production Deployment

This guide addresses common 404 routing issues that might occur when deploying the InvoiceHub application to a production environment, particularly when users try to access pages directly via URL instead of navigating through the application UI.

## Understanding the Problem

The 404 routing issue stems from how single page applications (SPAs) handle routing. When you deploy a SPA:

1. The client-side router (in our case, Wouter) handles navigation within the application
2. If a user refreshes the page or enters a URL directly (like `/dashboard`), the server receives the request
3. The server needs to be configured to return the `index.html` file for all client-side routes
4. Without proper configuration, the server returns a 404 error because it's looking for a physical file at that path

## Fix 1: Server Configuration Changes

### For Nginx

If you're using Nginx as a reverse proxy (recommended), add the following to your server block configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/your/app/dist/public;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Direct to server-rendered test page
    location /direct-supabase-test {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    # For all other routes, return index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### For Apache

If you're using Apache, create a `.htaccess` file in the root of your public directory with the following content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # If an existing asset or directory exists, serve it directly
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # For API and direct test routes, don't rewrite
  RewriteCond %{REQUEST_URI} !^/api/.*
  RewriteCond %{REQUEST_URI} !^/direct-supabase-test
  
  # Otherwise, rewrite to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

## Fix 2: Production Build Process Changes

When building for production, make sure you're not accidentally stripping out routes. Here's the recommended build process:

1. Run `npm run build` to create a production build
2. The build process should generate files in the `dist` directory
3. Copy the entire `dist` directory to your production server
4. Ensure that your server is configured as mentioned above

## Fix 3: Static File Serving Fix

Ensure that the `serveStatic` function in `server/vite.ts` properly serves index.html for client routes:

Replace the existing implementation with:

```typescript
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Add individual route handlers for specific client routes
  const clientRoutes = [
    '/',
    '/dashboard',
    '/invoices',
    '/customers',
    '/products',
    '/company',
    '/reports',
    '/auth',
    '/supabase-test',
    '/supabase-test-fixed',
    '/supabase-test-original-fixed',
    '/storage-test',
    '/test'
  ];

  // Add specific route handlers
  clientRoutes.forEach(route => {
    app.get(route, (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  });

  // catch-all route handler
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
```

## Production Deploy: Steps to Fix Existing Deployment

1. SSH into your server
2. Navigate to your application directory
3. Pull the latest code with the routing fixes
4. Rebuild the application with `npm run build`
5. Update your web server configuration (Nginx/Apache) as described above
6. Restart the Node.js application: `pm2 restart all`
7. Restart your web server: `sudo service nginx restart` (for Nginx)

## Testing the Fix

After deploying these changes, test by directly accessing these URLs in your browser:

1. `https://yourdomain.com/direct-supabase-test` - Should show the server-rendered test page
2. `https://yourdomain.com/test` - Should show the simple test page
3. `https://yourdomain.com/supabase-test-fixed` - Should show the fixed Supabase test page
4. `https://yourdomain.com/dashboard` - Should redirect to login if not authenticated

If any of these still show 404 errors, check your server logs and ensure all configuration steps have been followed.
