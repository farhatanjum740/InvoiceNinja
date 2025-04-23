import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { Helmet } from 'react-helmet';
import LandingPageNew from '@/pages/landing-page-new';
import './index.css';

// Simple landing page app for testing
function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-container">
          <Helmet>
            <title>InvoiceGenius - GST Invoicing for Indian Businesses</title>
            <meta name="description" content="Create professional GST-compliant invoices quickly and easily with InvoiceGenius. Manage customers, products, and payments all in one place." />
            {/* Google AdSense script */}
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script>
          </Helmet>
          <LandingPageNew />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);