import { createClient } from '@supabase/supabase-js';

// Dynamically fetch Supabase configuration from server
async function fetchSupabaseConfig() {
  try {
    // Set a timeout for the fetch to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('/api/env', { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Supabase configuration');
    }
    
    const data = await response.json();
    return {
      url: data.VITE_SUPABASE_URL,
      key: data.VITE_SUPABASE_KEY
    };
  } catch (error) {
    console.error('Error fetching Supabase configuration, using fallback:', error);
    
    // Fallback to environment variables if server fetch fails
    return {
      url: import.meta.env.VITE_SUPABASE_URL as string,
      key: import.meta.env.VITE_SUPABASE_KEY as string
    };
  }
}

// Initialize with empty values first, will be updated after config is fetched
let supabaseUrl = '';
let supabaseKey = '';

// Create the client with default config initially
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);

// Update the Supabase client with proper configuration
// This is called immediately and the promise is handled
(async () => {
  try {
    const config = await fetchSupabaseConfig();
    supabaseUrl = config.url;
    supabaseKey = config.key;
    
    // Update the Supabase client if we have valid config
    if (supabaseUrl && supabaseKey) {
      Object.assign(supabase, createClient(supabaseUrl, supabaseKey));
      console.log('Supabase client initialized successfully');
    } else {
      console.error('Missing Supabase configuration. Authentication and storage features may not work.');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
})();

// Storage bucket names
export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  INVOICE_ATTACHMENTS: 'invoice-attachments'
};

// Utility for initializing storage buckets - simplified to avoid security policy errors
export async function initializeStorage() {
  console.log("Initializing Supabase storage...");
  
  // The bucket creation operations are admin-only operations that should be done on the backend
  // or during project setup with a service role key. For now, we'll just log the information
  // and assume buckets have been created during initial setup.
  
  console.log("Assuming storage buckets already exist on Supabase");
  console.log("Using buckets:", Object.values(STORAGE_BUCKETS));
  
  // If you want to create buckets, use Supabase Dashboard or a migration script with admin privileges
}

// Import the StorageAPI for server-side storage operations
import { uploadFile as apiUploadFile, deleteFile as apiDeleteFile } from '@/lib/storage-api';

// Utility for uploading files - now using the server API instead of direct Supabase calls
export async function uploadFile(
  bucket: string,
  file: File,
  path: string = ''
): Promise<{ path: string; url: string } | null> {
  try {
    // Generate a unique file name prefix to avoid collisions
    const timestamp = new Date().getTime();
    const filePathPrefix = path ? `${path}/${timestamp}` : `${timestamp}`;
    
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    if (filePathPrefix) {
      formData.append('path', filePathPrefix);
    }
    
    // Use our server-side storage API for upload
    const result = await apiUploadFile(bucket, formData);
    
    return {
      path: result.path,
      url: result.url
    };
  } catch (error) {
    console.error("Error in uploadFile:", error);
    return null;
  }
}

// Utility for deleting files - now using the server API instead of direct Supabase calls
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    return await apiDeleteFile(bucket, path);
  } catch (error) {
    console.error("Error in deleteFile:", error);
    return false;
  }
}

// Initialize storage only when explicitly called from providers.tsx