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
  } catch (error) {
    console.error('Error listing buckets:', error);
    return [];
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
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Get the public URL for a file
 * @param {string} bucket - The bucket name
 * @param {string} filePath - The path to the file
 * @returns {Promise<string>} The public URL
 */
export async function getPublicUrl(bucket: string, filePath: string): Promise<string> {
  try {
    const url = `/api/storage/public-url/${bucket}/${encodeURIComponent(filePath)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get public URL: ${response.statusText}`);
    }
    const data = await response.json();
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
}

/**
 * Upload a file to a bucket
 * @param {string} bucket - The bucket name
 * @param {File} file - The file object from input[type=file]
 * @param {string} path - Optional path prefix
 * @returns {Promise<Object>} Object with path and publicUrl
 */
export async function uploadFile(bucket: string, file: File, path: string = ''): Promise<{path: string; url: string}> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }
    
    // Send the request to our server API
    const response = await fetch(`/api/storage/upload/${bucket}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from a bucket
 * @param {string} bucket - The bucket name
 * @param {string} filePath - The path to the file
 * @returns {Promise<boolean>} True if the file was deleted
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/storage/delete/${bucket}/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Export all functions as a single object for convenience
export const StorageAPI = {
  listBuckets,
  listFiles,
  getPublicUrl,
  uploadFile,
  deleteFile,
};
