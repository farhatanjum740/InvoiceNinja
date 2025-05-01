import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { STORAGE_BUCKETS } from "@/lib/supabase";
import { getPathFromUrl } from "@/lib/storage-utils";
import { uploadFile as apiUploadFile, deleteFile as apiDeleteFile } from "@/lib/storage-api";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  maxSizeKB?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
  className?: string;
  buttonText?: string;
  showPreview?: boolean;
  userId?: number;
}

export function ImageUploadSupabase({
  value,
  onChange,
  maxSizeKB = 200,
  maxWidthPx = 300,
  maxHeightPx = 300,
  className = "",
  buttonText = "Upload Logo",
  showPreview = true,
  userId,
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const { toast } = useToast();

  useEffect(() => {
    if (value !== previewUrl) {
      setPreviewUrl(value || null);
    }
  }, [value]);

  // Function to compress image using browser-image-compression library
  const compressImage = async (file: File): Promise<File> => {
    try {
      // Dynamically import the compression library
      const imageCompression = await import("browser-image-compression");
      
      // Compression options
      const options = {
        maxSizeMB: maxSizeKB / 1024, // Convert KB to MB
        maxWidthOrHeight: Math.max(maxWidthPx, maxHeightPx),
        useWebWorker: true,
      };
      
      // Compress the image
      const compressedFile = await imageCompression.default(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      return file; // Return original file if compression fails
    }
  };

  // Function to handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size before compression
    if (file.size > maxSizeKB * 1024 * 2) { // Allow 2x max size before compression
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeKB} KB. Your file is ${Math.round(file.size / 1024)} KB.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Check size after compression
      if (compressedFile.size > maxSizeKB * 1024) {
        toast({
          title: "File still too large after compression",
          description: `Please try with a smaller image. Maximum size is ${maxSizeKB} KB.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Generate path based on user ID if available
      const path = userId ? `user_${userId}` : undefined;
      
      // Delete previous file if it exists
      if (previewUrl) {
        const filePath = getPathFromUrl(previewUrl, STORAGE_BUCKETS.COMPANY_LOGOS);
        if (filePath) {
          // Use API-based delete instead of direct Supabase call
          await apiDeleteFile(STORAGE_BUCKETS.COMPANY_LOGOS, filePath);
        }
      }
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', compressedFile);
      if (path) {
        formData.append('path', path);
      }
      
      // Upload to Supabase via our server API
      const result = await apiUploadFile(STORAGE_BUCKETS.COMPANY_LOGOS, formData);
      const fileUrl = result?.url;
      
      if (fileUrl) {
        setPreviewUrl(fileUrl);
        onChange(fileUrl);
        toast({
          title: "Logo uploaded",
          description: "Your logo has been uploaded successfully.",
        });
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      
      // Reset the input value so the same file can be uploaded again if needed
      event.target.value = "";
    }
  }, [maxSizeKB, maxWidthPx, maxHeightPx, toast, onChange, previewUrl, userId]);

  // Function to handle removing the image
  const handleRemoveImage = useCallback(async () => {
    if (!previewUrl) return;
    
    setIsLoading(true);
    
    try {
      // Delete from Supabase Storage using our server API
      const filePath = getPathFromUrl(previewUrl, STORAGE_BUCKETS.COMPANY_LOGOS);
      if (filePath) {
        await apiDeleteFile(STORAGE_BUCKETS.COMPANY_LOGOS, filePath);
      }
      
      setPreviewUrl(null);
      onChange("");
      toast({
        title: "Logo removed",
        description: "Your logo has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "There was a problem removing your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [previewUrl, onChange, toast]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {showPreview && previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="max-w-full max-h-48 object-contain rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 rounded-full -mt-2 -mr-2"
            onClick={handleRemoveImage}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={previewUrl ? "outline" : "default"}
          onClick={() => document.getElementById("logo-upload")?.click()}
          disabled={isLoading}
          className="relative"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? "Change Logo" : buttonText}
            </>
          )}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveImage}
            disabled={isLoading}
          >
            Remove
          </Button>
        )}
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isLoading}
        />
      </div>
      
      <p className="text-xs text-gray-500">
        Max file size: {maxSizeKB} KB. Recommended dimensions: {maxWidthPx}x{maxHeightPx}px.
      </p>
    </div>
  );
}