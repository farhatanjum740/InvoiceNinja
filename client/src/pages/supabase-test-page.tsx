import React from 'react';
import SupabaseApiTestFixed from '@/components/supabase-api-test-fixed';
import { Sidebar } from '@/components/layout/sidebar';
import { Helmet } from 'react-helmet';

export default function SupabaseTestPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Helmet>
        <title>Supabase API Test - InvoiceHub</title>
      </Helmet>
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <SupabaseApiTestFixed />
      </div>
    </div>
  );
}
