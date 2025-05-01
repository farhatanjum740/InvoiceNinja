import imageCompression from 'browser-image-compression';
import { STORAGE_BUCKETS } from './supabase';
import { uploadFile, deleteFile, getPublicUrl } from './storage-api';

// Maximum file size for images in MB
const MAX_FILE_SIZE_MB = 1;

/**
 * Options for image compression
 */
const compressionOptions = {
  maxSizeMB: MAX_FILE_SIZE_MB,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

/**
 * Compress an image file before upload
 * @param file The image file to compress
 * @returns A Promise that resolves to the compressed file
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      return file; // Return original file if not an image
    }
    
    // Compress the image
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Create a new File object from the compressed blob
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Return original file on error
  }
}

/**
 * Upload a company logo to Supabase storage via server API
 * @param file The logo file to upload
 * @param userId The ID of the user/company
 * @returns A Promise that resolves to the logo URL or null on error
 */
export async function uploadCompanyLogo(file: File, userId: number): Promise<string | null> {
  try {
    // Compress the image first
    const compressedFile = await compressImage(file);
    
    // Upload to Supabase via server API
    const result = await uploadFile(
      STORAGE_BUCKETS.COMPANY_LOGOS,
      compressedFile,
      `company-${userId}`
    );
    
    return result?.url || null;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return null;
  }
}

/**
 * Upload an invoice attachment to Supabase storage via server API
 * @param file The attachment file to upload
 * @param invoiceId The ID of the invoice
 * @returns A Promise that resolves to the attachment URL or null on error
 */
export async function uploadInvoiceAttachment(file: File, invoiceId: number): Promise<string | null> {
  try {
    // Compress the image if it's an image file
    const preparedFile = file.type.startsWith('image/') 
      ? await compressImage(file)
      : file;
    
    // Upload to Supabase via server API
    const result = await uploadFile(
      STORAGE_BUCKETS.INVOICE_ATTACHMENTS,
      preparedFile,
      `invoice-${invoiceId}`
    );
    
    return result?.url || null;
  } catch (error) {
    console.error('Error uploading invoice attachment:', error);
    return null;
  }
}

/**
 * Check if a file is within the size limit
 * @param file The file to check
 * @param maxSizeMB Maximum file size in MB
 * @returns True if the file is within the limit, false otherwise
 */
export function isFileSizeValid(file: File, maxSizeMB: number = MAX_FILE_SIZE_MB): boolean {
  const fileSizeInMB = file.size / (1024 * 1024);
  return fileSizeInMB <= maxSizeMB;
}

/**
 * Convert a data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns A Blob representing the data
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert a data URL to a File object
 * @param dataUrl The data URL to convert
 * @param filename The name for the file
 * @returns A File object representing the data
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const blob = dataURLtoBlob(dataUrl);
  return new File([blob], filename, { type: blob.type });
}

/**
 * Extract file path from a Supabase Storage URL
 * @param url The full Supabase storage URL
 * @param bucket The bucket name to verify
 * @returns The file path within the bucket or null if URL format doesn't match
 */
export function getPathFromUrl(url: string, bucket: string): string | null {
  try {
    if (!url) return null;
    
    // URL pattern for Supabase storage
    // e.g. https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const storagePathRegex = new RegExp(`storage\\/v1\\/object\\/public\\/${bucket}\\/(.+)`);
    const match = url.match(storagePathRegex);
    
    if (!match || match.length < 2) return null;
    
    // Return the path part
    return match[1];
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
}