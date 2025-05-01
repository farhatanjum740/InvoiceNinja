/**
 * Storage API - Client-side wrapper for server-side storage operations
 * This file replaces direct Supabase storage calls with our server API
 */

/**
 * List all storage buckets
 * @returns {Promise<Array>} Array of bucket objects
 */
export async function listBuckets(): Promise<any[]> {
  try {
    const response = await fetch('/api/storage/buckets');
    if (!response.ok) {
      throw new Error(`Failed to list buckets: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error listing buckets:', error);
    throw error;
  }
}

/**
 * List files in a bucket
 * @param {string} bucket - The bucket name
 * @param {string} path - Optional path prefix
 * @returns {Promise<Array>} Array of file objects
 */
export async function listFiles(bucket: string, path: string = ''): Promise<any[]> {
  try {
    const url = `/api/storage/list/${bucket}${path ? `?path=${encodeURIComponent(path)}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Get public URL for a file
 * @param {string} bucket - The bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Object with publicUrl property
 */
export async function getPublicUrl(bucket: string, filePath: string): Promise<{ publicUrl: string }> {
  try {
    const url = `/api/storage/public-url/${bucket}/${encodeURIComponent(filePath)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get public URL: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error getting public URL:', error);
    throw error;
  }
}

/**
 * Upload a file to a bucket
 * @param {string} bucket - The bucket name
 * @param {FormData} formData - FormData object containing the file to upload
 * @returns {Promise<Object>} Upload result with path and url
 */
export async function uploadFile(bucket: string, formData: FormData): Promise<{ path: string, url: string }> {
  try {
    const response = await fetch(`/api/storage/upload/${bucket}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from a bucket
 * @param {string} bucket - The bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Delete result
 */
export async function deleteFile(bucket: string, filePath: string): Promise<{ success: boolean }> {
  try {
    const url = `/api/storage/delete/${bucket}/${encodeURIComponent(filePath)}`;
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Delete failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
