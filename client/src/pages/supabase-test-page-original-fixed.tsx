import React from 'react';
import { Helmet } from 'react-helmet';
import SupabaseApiTestOriginalFixed from '@/components/supabase-api-test-original-fixed';

export default function SupabaseTestPageOriginalFixed() {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Supabase API Test Original Fixed - InvoiceNinja</title>
      </Helmet>
      
      <SupabaseApiTestOriginalFixed />
    </div>
  );
}
