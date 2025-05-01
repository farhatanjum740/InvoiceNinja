import express from 'express';
import path from 'path';
import fs from 'fs';

// This is a helper that ensures all routes are properly routed to index.html
// for client-side routing to work even on direct URL access
export function createRouterFixMiddleware(app: express.Express) {
  // Standard routes we know should be handled by the client-side router
  const clientRoutes = [
    '/dashboard',
    '/invoices',
    '/invoices/create',
    '/invoices/edit', // Base path for invoice editing
    '/customers',
    '/products',
    '/company',
    '/reports',
    '/auth',
    '/settings'
  ];
  
  // Special handling for dynamic routes with parameters
  app.get('/invoices/edit/:id', (req, res, next) => {
    // In development, let Vite handle it
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // In production, serve the index.html file
    const distPath = path.resolve(process.cwd(), 'dist', 'public');
    res.sendFile(path.resolve(distPath, 'index.html'));
  });

  // Add middleware to handle client routes
  clientRoutes.forEach(route => {
    app.get(`${route}`, (req, res, next) => {
      // In development, let Vite handle it
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      
      // In production, serve the index.html file
      const distPath = path.resolve(process.cwd(), 'dist', 'public');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    
    // Also handle sub-routes
    app.get(`${route}/*`, (req, res, next) => {
      // In development, let Vite handle it
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      
      // In production, serve the index.html file
      const distPath = path.resolve(process.cwd(), 'dist', 'public');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  });

  // Debug route to test that our server is responding properly
  app.get('/server-status', (req, res) => {
    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV,
      serverTime: new Date().toISOString(),
      message: 'Server is operational and responding to requests'
    });
  });

  return app;
}
