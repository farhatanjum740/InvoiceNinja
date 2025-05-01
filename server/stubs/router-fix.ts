import express from 'express';
import path from 'path';
import fs from 'fs';

// This is a helper that ensures all routes are properly routed to index.html
// for client-side routing to work even on direct URL access
export function createRouterFixMiddleware(app: express.Express) {
  // Define a catch-all route handler for specific client-side patterns
  const clientSidePatterns = [
    '/dashboard*',
    '/invoices*',  // This will match /invoices, /invoices/create, /invoices/edit/123, etc.
    '/customers*',
    '/products*',
    '/company*',
    '/reports*',
    '/auth*',
    '/settings*'
  ];
  
  // Always add a debug handler to check routing
  app.get('/router-debug', (req, res) => {
    res.json({
      message: 'Router debug endpoint active',
      environment: process.env.NODE_ENV,
      patterns: clientSidePatterns,
      note: `Router fix is active for ${process.env.NODE_ENV} environment`
    });
  });
  
  // We need to handle client-side routes in both development and production
  // Vite has issues with direct navigation to nested routes
  
  console.log(`Setting up client-side routing handlers for ${process.env.NODE_ENV} environment`);
  
  // Create a catch-all handler that checks if the URL matches any of our patterns
  app.get('*', (req, res, next) => {
    const requestPath = req.originalUrl;
    
    // Skip API routes
    if (requestPath.startsWith('/api/')) {
      return next();
    }
    
    // Check if this path matches any of our client patterns
    const isClientRoute = clientSidePatterns.some(pattern => {
      const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
      return regex.test(requestPath);
    });
    
    if (isClientRoute) {
      console.log(`Handling client-side route: ${requestPath}`);
      
      if (process.env.NODE_ENV === 'production') {
        // In production, serve the index.html file from the dist directory
        const distPath = path.resolve(process.cwd(), 'dist', 'public');
        return res.sendFile(path.resolve(distPath, 'index.html'));
      } else {
        // In development, let Vite's middleware handle this
        console.log('Letting Vite handle the client-side route in development mode');
        return next();
      }
    }
    
    // Not a known client route, proceed to next handler
    next();
  });

  // Debug route to test that our server is responding properly
  app.get('/server-status', (req, res) => {
    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV,
      serverTime: new Date().toISOString(),
      message: 'Server is operational and responding to requests',
      clientPatterns: clientSidePatterns
    });
  });

  return app;
}
