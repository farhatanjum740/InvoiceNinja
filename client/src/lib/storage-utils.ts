import { supabase } from './supabase';

// File storage buckets
export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  INVOICE_ATTACHMENTS: 'invoice-attachments',
};

/**
 * Initialize storage buckets if they don't exist
 */
export async function initializeStorage() {
  try {
    // Check and create company logos bucket
    const { data: logosBucket, error: logosError } = await supabase.storage.getBucket(STORAGE_BUCKETS.COMPANY_LOGOS);
    if (!logosBucket && logosError) {
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKETS.COMPANY_LOGOS, {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
      });
      
      if (error) {
        console.error('Error creating company logos bucket:', error);
      }
    }
    
    // Check and create invoice attachments bucket
    const { data: attachmentsBucket, error: attachmentsError } = await supabase.storage.getBucket(STORAGE_BUCKETS.INVOICE_ATTACHMENTS);
    if (!attachmentsBucket && attachmentsError) {
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKETS.INVOICE_ATTACHMENTS, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
      });
      
      if (error) {
        console.error('Error creating invoice attachments bucket:', error);
      }
    }
    
    console.log('Supabase storage buckets initialized');
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
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
    const filePath = path 
      ? `${path}/${file.name}` 
      : `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
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
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
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
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const bucketIndex = pathSegments.findIndex(segment => segment === bucket);
    
    if (bucketIndex === -1) return null;
    
    // Return the path after the bucket name
    return pathSegments.slice(bucketIndex + 1).join('/');
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
}