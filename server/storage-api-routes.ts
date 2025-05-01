import { Request, Response, Router } from 'express';
import { supabase } from './db';
import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = Router();

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// List all available storage buckets
router.get('/buckets', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json(data);
  } catch (error: any) {
    console.error('Unexpected error listing buckets:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

// List files in a bucket
router.get('/list/:bucket', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bucket } = req.params;
    const path = req.query.path as string || '';
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    
    if (error) {
      console.error(`Error listing files in bucket ${bucket}:`, error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error listing files:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get public URL for a file
router.get('/public-url/:bucket/:filePath(*)', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bucket, filePath } = req.params;
    
    // Create a public URL for the file
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    return res.json({ publicUrl: data.publicUrl });
  } catch (error: any) {
    console.error('Error getting public URL:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Upload a file to a bucket
router.post('/upload/:bucket', ensureAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { bucket } = req.params;
    const filePath = req.body.path || '';
    const file = req.file;
    
    // Generate a unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${fileExt}`;
    const fullPath = filePath ? `${filePath}/${fileName}` : fileName;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    
    if (error) {
      console.error(`Error uploading file to bucket ${bucket}:`, error);
      return res.status(500).json({ error: error.message });
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    
    return res.status(201).json({ path: fullPath, url: urlData.publicUrl });
  } catch (error: any) {
    console.error('Unexpected error uploading file:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Delete a file from a bucket
router.delete('/delete/:bucket/:filePath(*)', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bucket, filePath } = req.params;
    
    // Delete the file from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from bucket ${bucket}:`, error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error deleting file:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
