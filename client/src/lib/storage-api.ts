/**
 * Storage API - Client-side wrapper for server-side storage operations
 * This file replaces direct Supabase storage calls with our server API
 */

/**
 * List all storage buckets
 * @returns {Promise<Array>} Array of bucket objects
 */
export async function listBuckets(): Promise<any[]> {
  const response = await fetch('/api/storage/buckets');
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to list buckets');
  }
  
  return await response.json();
}

/**
 * List files in a bucket
 * @param {string} bucket - The bucket name
 * @param {string} path - Optional path prefix
 * @returns {Promise<Array>} Array of file objects
 */
export async function listFiles(bucket: string, path: string = ''): Promise<any[]> {
  const url = `/api/storage/${bucket}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `Failed to list files in ${bucket}`);
  }
  
  return await response.json();
}

/**
 * Get the public URL for a file
 * @param {string} bucket - The bucket name
 * @param {string} filePath - The path to the file
 * @returns {Promise<string>} The public URL
 */
export async function getPublicUrl(bucket: string, filePath: string): Promise<string> {
  const url = `/api/storage/${bucket}/public-url?path=${encodeURIComponent(filePath)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `Failed to get public URL for ${filePath}`);
  }
  
  const data = await response.json();
  return data.publicUrl;
}

/**
 * Upload a file to a bucket
 * @param {string} bucket - The bucket name
 * @param {File} file - The file object from input[type=file]
 * @param {string} path - Optional path prefix
 * @returns {Promise<Object>} Object with path and publicUrl
 */
export async function uploadFile(bucket: string, file: File, path: string = ''): Promise<{path: string; url: string}> {
  const formData = new FormData();
  formData.append('file', file);
  if (path) {
    formData.append('path', path);
  }
  
  const response = await fetch(`/api/storage/${bucket}/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `Failed to upload file to ${bucket}`);
  }
  
  const result = await response.json();
  return {
    path: result.path,
    url: result.publicUrl
  };
}

/**
 * Delete a file from a bucket
 * @param {string} bucket - The bucket name
 * @param {string} filePath - The path to the file
 * @returns {Promise<boolean>} True if the file was deleted
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  const url = `/api/storage/${bucket}/files?path=${encodeURIComponent(filePath)}`;
  const response = await fetch(url, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `Failed to delete file ${filePath}`);
  }
  
  return true;
}

// Export all functions as a named object for convenience
export const StorageAPI = {
  listBuckets,
  listFiles,
  getPublicUrl,
  uploadFile,
  deleteFile
};
