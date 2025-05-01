import React from 'react';
import { Helmet } from 'react-helmet';
import SupabaseApiTestFixed from '@/components/supabase-api-test-fixed';

export default function SupabaseTestPageFixed() {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Supabase API Test - InvoiceNinja</title>
      </Helmet>
      
      <SupabaseApiTestFixed />
    </div>
  );
}
