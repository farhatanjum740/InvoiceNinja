import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  onChange: (value: string) => void;
  value?: string | null | undefined;
  className?: string;
}

export function ImageUpload({ onChange, value, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Options for image compression
      const options = {
        maxSizeMB: 0.2, // Max file size in MB (reduced to 200KB)
        maxWidthOrHeight: 200, // Max width/height in pixels (reduced to 200px)
        useWebWorker: true,
        initialQuality: 0.7, // Reduce initial quality for better compression
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        onChange(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={inputRef}
      />

      {previewUrl ? (
        <div className="relative mb-4">
          <img
            src={previewUrl}
            alt="Company Logo"
            className="max-w-full max-h-[150px] object-contain rounded-md border border-gray-200"
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="mb-4 border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={triggerFileInput}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload your company logo</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (will be compressed)</p>
        </div>
      )}

      <Button 
        type="button" 
        variant={previewUrl ? "outline" : "default"} 
        onClick={triggerFileInput}
        disabled={isUploading}
        size="sm"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : previewUrl ? (
          "Change Logo"
        ) : (
          "Upload Logo"
        )}
      </Button>
    </div>
  );
}