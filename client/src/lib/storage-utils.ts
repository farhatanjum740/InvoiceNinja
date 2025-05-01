/**
 * Storage utility functions
 */

/**
 * Extract the path from a Supabase storage URL
 * Handles both signed and public URLs
 * 
 * @param {string} url - The full Supabase storage URL
 * @returns {string} The file path relative to the bucket
 */
export function getPathFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Check if it's a Supabase storage URL
    if (!urlObj.pathname.includes('/storage/v1/object/public/') && 
        !urlObj.pathname.includes('/storage/v1/object/sign/')) {
      console.warn('Not a Supabase storage URL:', url);
      return '';
    }
    
    // Split the pathname
    const parts = urlObj.pathname.split('/');
    
    // Find the bucket index
    let bucketIndex = parts.indexOf('public');
    if (bucketIndex === -1) {
      bucketIndex = parts.indexOf('sign');
    }
    
    if (bucketIndex === -1 || bucketIndex + 2 >= parts.length) {
      console.warn('Could not parse bucket from URL:', url);
      return '';
    }
    
    // Get everything after the bucket name
    const pathParts = parts.slice(bucketIndex + 2);
    return pathParts.join('/');
    
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return '';
  }
}

/**
 * Get the bucket name from a Supabase storage URL
 * 
 * @param {string} url - The full Supabase storage URL
 * @returns {string} The bucket name
 */
export function getBucketFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Check if it's a Supabase storage URL
    if (!urlObj.pathname.includes('/storage/v1/object/public/') && 
        !urlObj.pathname.includes('/storage/v1/object/sign/')) {
      console.warn('Not a Supabase storage URL:', url);
      return '';
    }
    
    // Split the pathname
    const parts = urlObj.pathname.split('/');
    
    // Find the bucket index
    let bucketIndex = parts.indexOf('public');
    if (bucketIndex === -1) {
      bucketIndex = parts.indexOf('sign');
    }
    
    if (bucketIndex === -1 || bucketIndex + 1 >= parts.length) {
      console.warn('Could not parse bucket from URL:', url);
      return '';
    }
    
    // Return the bucket name
    return parts[bucketIndex + 1];
    
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return '';
  }
}

/**
 * Format file size for display
 * 
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate a unique filename to prevent collisions
 * 
 * @param {string} originalName - The original file name
 * @returns {string} A unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = originalName.includes('.') 
    ? originalName.split('.').pop() 
    : '';
  
  const baseName = originalName.includes('.') 
    ? originalName.substring(0, originalName.lastIndexOf('.')) 
    : originalName;
  
  return `${baseName}_${timestamp}_${random}${ext ? `.${ext}` : ''}`;
}
