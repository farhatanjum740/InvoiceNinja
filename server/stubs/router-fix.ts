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
  
  // In development, we don't need to handle these routes specially
  // as Vite's development server already handles this correctly
  if (process.env.NODE_ENV === 'development') {
    // Add debug handler to check routing in development
    app.get('/router-debug', (req, res) => {
      res.json({
        message: 'Router debug endpoint active',
        environment: 'development',
        patterns: clientSidePatterns,
        note: 'In development, Vite handles all routing automatically'
      });
    });
    
    return app;
  }
  
  // In production, set up handlers for each pattern
  console.log('Setting up production client-side routing handlers');
  
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
      // In production, serve the index.html file
      const distPath = path.resolve(process.cwd(), 'dist', 'public');
      return res.sendFile(path.resolve(distPath, 'index.html'));
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
