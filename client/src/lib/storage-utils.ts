import { supabase } from './supabase';

// Define storage bucket names
export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  INVOICE_ATTACHMENTS: 'invoice-attachments'
};

/**
 * Initialize storage buckets if they don't exist
 */
export async function initializeStorage() {
  try {
    // Create company logos bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check if company logos bucket exists
    if (!buckets?.find(bucket => bucket.name === STORAGE_BUCKETS.COMPANY_LOGOS)) {
      console.log('Creating company logos bucket...');
      await supabase.storage.createBucket(STORAGE_BUCKETS.COMPANY_LOGOS, {
        public: true, // Make it publicly accessible
        fileSizeLimit: 1024 * 1024 // 1MB limit
      });
    }
    
    // Check if invoice attachments bucket exists
    if (!buckets?.find(bucket => bucket.name === STORAGE_BUCKETS.INVOICE_ATTACHMENTS)) {
      console.log('Creating invoice attachments bucket...');
      await supabase.storage.createBucket(STORAGE_BUCKETS.INVOICE_ATTACHMENTS, {
        public: false, // Keep it private
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return false;
  }
}

/**
 * Upload a file to Supabase Storage
 * @param bucket Bucket name
 * @param file File to upload
 * @param path Path within the bucket (optional)
 * @returns URL of the uploaded file
 */
export async function uploadFile(bucket: string, file: File, path?: string): Promise<string | null> {
  try {
    // Generate a unique file name using timestamp and original name
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = path 
      ? `${path}/${timestamp}-${file.name}` 
      : `${timestamp}-${file.name}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket Bucket name
 * @param path File path to delete
 * @returns Success status
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Helper to extract file path from a Supabase Storage URL
 * @param url The full Supabase Storage URL
 * @param bucket The bucket name
 * @returns The file path within the bucket
 */
export function getPathFromUrl(url: string, bucket: string): string | null {
  try {
    // Extract the path from the URL
    // Format: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const regex = new RegExp(`/storage/v1/object/public/${bucket}/(.+)`);
    const match = url.match(regex);
    
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
}