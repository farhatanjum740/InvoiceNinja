import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { uploadFile, listFiles, deleteFile, getPublicUrl, listBuckets } from '@/lib/storage-api';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { Loader2, Upload, FileText, Trash2, RefreshCw } from 'lucide-react';

interface FileObject {
  name: string;
  id: string;
  path: string;
  url?: string;
}

export function StorageApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [buckets, setBuckets] = useState<string[]>([]);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [selectedBucket, setSelectedBucket] = useState(STORAGE_BUCKETS.COMPANY_LOGOS);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List all available buckets
  const handleListBuckets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const bucketList = await listBuckets();
      setBuckets(bucketList.map(bucket => bucket.name));
    } catch (err: any) {
      setError(`Failed to list buckets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List files in the selected bucket
  const handleListFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fileList = await listFiles(selectedBucket);
      
      // Enhance the list with URLs
      const enhancedFiles = await Promise.all(
        fileList.map(async (file) => {
          try {
            const url = await getPublicUrl(selectedBucket, file.name);
            return { ...file, url };
          } catch {
            return file;
          }
        })
      );
      
      setFiles(enhancedFiles);
    } catch (err: any) {
      setError(`Failed to list files: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsLoading(true);
    setError(null);
    setUploadedFileUrl(null);
    
    try {
      // Upload the file to the selected bucket with a test prefix
      const result = await uploadFile(selectedBucket, file, 'test');
      setUploadedFileUrl(result.url);
      
      // Refresh the file list
      await handleListFiles();
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedBucket, handleListFiles]);

  // Handle file deletion
  const handleDeleteFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await deleteFile(selectedBucket, filePath);
      if (success) {
        // Refresh the file list
        await handleListFiles();
      } else {
        setError('Delete operation failed');
      }
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket, handleListFiles]);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Storage API Test</CardTitle>
        <CardDescription>
          Test the server-side API proxy for Supabase Storage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* Bucket selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Storage Buckets</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleListBuckets}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              List Buckets
            </Button>
            
            <select 
              className="border rounded px-2 py-1 flex-1"
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              disabled={isLoading}
            >
              {buckets.length > 0 ? (
                buckets.map(bucket => (
                  <option key={bucket} value={bucket}>{bucket}</option>
                ))
              ) : (
                <option value={selectedBucket}>{selectedBucket}</option>
              )}
            </select>
          </div>
        </div>
        
        <Separator />
        
        {/* File upload */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Upload Test</h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Select File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </div>
          
          {uploadedFileUrl && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Uploaded File:</p>
              <div className="bg-secondary/20 p-2 rounded text-xs break-all">
                <a href={uploadedFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {uploadedFileUrl}
                </a>
              </div>
              {uploadedFileUrl.toLowerCase().endsWith('.jpg') || 
               uploadedFileUrl.toLowerCase().endsWith('.jpeg') || 
               uploadedFileUrl.toLowerCase().endsWith('.png') || 
               uploadedFileUrl.toLowerCase().endsWith('.gif') || 
               uploadedFileUrl.toLowerCase().endsWith('.webp') ? (
                <div className="mt-2">
                  <img 
                    src={uploadedFileUrl} 
                    alt="Uploaded preview" 
                    className="max-h-32 max-w-full rounded border" 
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* File listing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Files in Bucket</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleListFiles}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            {files.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-secondary/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id || file.path}>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="truncate max-w-[200px] block">{file.path}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          {file.url && (
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.path)}
                            className="text-destructive hover:text-destructive/80"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No files found in this bucket. Upload a file to see it here.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
