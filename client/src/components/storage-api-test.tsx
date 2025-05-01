import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { listBuckets, listFiles, getPublicUrl, uploadFile, deleteFile } from '@/lib/storage-api';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { Upload, RefreshCw, Folder, FileText, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react';

interface FileObject {
  name: string;
  id: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  size?: number;
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
    if (!selectedBucket) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileList = await listFiles(selectedBucket);
      setFiles(fileList);
    } catch (err: any) {
      setError(`Failed to list files: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket]);

  // Upload a file to the selected bucket
  const handleUploadFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBucket) return;
    
    setIsLoading(true);
    setError(null);
    setUploadedFileUrl(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadFile(selectedBucket, formData);
      
      if (result?.url) {
        setUploadedFileUrl(result.url);
        await handleListFiles(); // Refresh file list
      }
    } catch (err: any) {
      setError(`Failed to upload file: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedBucket, handleListFiles]);

  // Delete a file from the bucket
  const handleDeleteFile = useCallback(async (fileName: string) => {
    if (!selectedBucket) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteFile(selectedBucket, fileName);
      await handleListFiles(); // Refresh file list
    } catch (err: any) {
      setError(`Failed to delete file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket, handleListFiles]);

  // Get public URL for a file
  const handleGetPublicUrl = useCallback(async (fileName: string) => {
    if (!selectedBucket) return;
    
    try {
      const { publicUrl } = await getPublicUrl(selectedBucket, fileName);
      window.open(publicUrl, '_blank');
    } catch (err: any) {
      setError(`Failed to get public URL: ${err.message}`);
    }
  }, [selectedBucket]);

  // Load buckets on component mount
  useEffect(() => {
    handleListBuckets();
  }, [handleListBuckets]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <Tabs defaultValue="buckets">
        <TabsList>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buckets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Buckets</CardTitle>
              <CardDescription>List available storage buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button 
                  onClick={handleListBuckets}
                  disabled={isLoading}
                  className="mr-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Buckets
                </Button>
              </div>
              
              {buckets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buckets.map((bucket) => (
                    <Card key={bucket} className="flex items-center p-4">
                      <Folder className="h-5 w-5 mr-2 text-primary" />
                      <span className="flex-1">{bucket}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBucket(bucket);
                          handleListFiles();
                        }}
                      >
                        Browse
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading ? 'Loading buckets...' : 'No buckets found'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Files in {selectedBucket}</CardTitle>
              <CardDescription>Browse and manage files in the selected bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button 
                  onClick={handleListFiles}
                  disabled={isLoading || !selectedBucket}
                  className="mr-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Files
                </Button>
              </div>
              
              {selectedBucket ? (
                files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-xs text-gray-500">
                              {file.size ? `${Math.round(file.size / 1024)} KB` : 'Size unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGetPublicUrl(file.name)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteFile(file.name)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {isLoading ? 'Loading files...' : 'No files found in this bucket'}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Please select a bucket first
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Upload a new file to the selected bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bucket-select">Selected Bucket</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-base py-2 px-4">
                      <Folder className="h-4 w-4 mr-2" />
                      {selectedBucket || 'No bucket selected'}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="file-upload">Choose File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadFile}
                    disabled={isLoading || !selectedBucket}
                    className="mt-1"
                  />
                </div>
                
                {uploadedFileUrl && (
                  <div className="mt-4">
                    <Label>Uploaded File URL</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        value={uploadedFileUrl}
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(uploadedFileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setUploadedFileUrl(null)} disabled={!uploadedFileUrl}>
                Reset
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !selectedBucket}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload File
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
