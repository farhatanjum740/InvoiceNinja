import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  INVOICE_ATTACHMENTS: 'invoice-attachments'
};

// Utility for initializing storage buckets
export async function initializeStorage() {
  console.log("Initializing Supabase storage...");
  
  try {
    // Check if buckets exist first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      if (listError.message.includes("row-level security policy")) {
        console.warn("Storage bucket initialization requires admin privileges. This should be done on the server side or using a service role key.");
        return;
      }
    }
    
    const existingBuckets = new Set(buckets?.map(b => b.name) || []);
    
    // Create company logos bucket if it doesn't exist
    if (!existingBuckets.has(STORAGE_BUCKETS.COMPANY_LOGOS)) {
      console.log("Creating company logos bucket...");
      try {
        const { error: logoBucketError } = await supabase.storage.createBucket(
          STORAGE_BUCKETS.COMPANY_LOGOS,
          { public: true }
        );
        
        if (logoBucketError) {
          console.warn("Could not create company logos bucket:", logoBucketError);
        }
      } catch (err) {
        console.warn("Exception creating company logos bucket:", err);
      }
    }
    
    // Create invoice attachments bucket if it doesn't exist
    if (!existingBuckets.has(STORAGE_BUCKETS.INVOICE_ATTACHMENTS)) {
      console.log("Creating invoice attachments bucket...");
      try {
        const { error: attachmentBucketError } = await supabase.storage.createBucket(
          STORAGE_BUCKETS.INVOICE_ATTACHMENTS,
          { public: true }
        );
        
        if (attachmentBucketError) {
          console.warn("Could not create invoice attachments bucket:", attachmentBucketError);
        }
      } catch (err) {
        console.warn("Exception creating invoice attachments bucket:", err);
      }
    }
  } catch (error) {
    console.warn("Error initializing storage:", error);
  }
}

// Utility for uploading files
export async function uploadFile(
  bucket: string,
  file: File,
  path: string = ''
): Promise<{ path: string; url: string } | null> {
  try {
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${path}${path ? '/' : ''}${timestamp}-${file.name.substring(0, 20)}.${fileExtension}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error("Error in uploadFile:", error);
    return null;
  }
}

// Utility for deleting files
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error("Error deleting file:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteFile:", error);
    return false;
  }
}

// Call initialization on import
initializeStorage();