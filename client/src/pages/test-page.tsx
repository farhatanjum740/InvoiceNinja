import React from 'react';
import { Helmet } from 'react-helmet';

export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <Helmet>
        <title>Simple Test Page</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">This is a Simple Test Page</h1>
      <p className="mb-4">If you can see this page, routing is working correctly.</p>
    </div>
  );
}
