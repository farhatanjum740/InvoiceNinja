import { StorageApiTest } from '@/components/storage-api-test';

export default function StorageTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Storage API Test</h1>
      <p className="mb-6">
        This page demonstrates the use of our server-side storage API proxy for secure Supabase storage operations.
        Instead of accessing Supabase directly from the client, all storage operations go through our server API,
        which provides better security and permission handling.
      </p>
      
      <StorageApiTest />
      
      <div className="mt-8 p-4 bg-secondary/10 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Implementation Details</h2>
        <p className="mb-2">
          The storage API implementation follows these principles:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>All client-side storage operations use the server API proxy instead of direct Supabase access</li>
          <li>The server uses the Supabase service role key for administrative operations, keeping it secure</li>
          <li>All file paths and bucket names are validated on the server before operations are performed</li>
          <li>Error handling is implemented on both client and server sides</li>
          <li>The API provides consistent response formats across all operations</li>
        </ul>
      </div>
    </div>
  );
}
