import { supabase } from '../config/supabase'
import { supabaseAdmin } from '../config/supabaseAdmin'
import { API_BASE_URL } from '../config/api'

// Supabase Storage utility functions
export const storageUtils = {
  // Delete file from Supabase Storage
  deleteFile: async (filePath: string, bucket: string = 'uploads') => {
    if (!filePath) return { error: null }
    
    try {
      let cleanPath = filePath;
      
      // Handle full URLs
      if (filePath.includes('supabase.co')) {
        const urlParts = filePath.split('/');
        cleanPath = urlParts[urlParts.length - 1]; // Get the last part (filename)
      }
      // Remove /uploads/ prefix if present
      else if (filePath.startsWith('/uploads/')) {
        cleanPath = filePath.replace('/uploads/', '');
      }
      
      console.log('Storage silme işlemi:')
      console.log('- Original filePath:', filePath)
      console.log('- Clean path:', cleanPath)
      console.log('- Bucket:', bucket)
      
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([cleanPath])
      
      if (error) {
        console.error('Storage silme hatası:', error)
        // Don't throw error, just log it
        return { error }
      }
      
      console.log('Storage silme başarılı!')
      return { error: null }
    } catch (err) {
      console.error('Storage silme hatası:', err)
      return { error: err }
    }
  },

  // Upload file to Supabase Storage
  uploadFile: async (file: File, path: string, bucket: string = 'uploads') => {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (err) {
      console.error('Upload hatası:', err)
      return { data: null, error: err }
    }
  },

  // Get public URL for a file
  getPublicUrl: (path: string, bucket: string = 'uploads') => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  // Extract image URLs from HTML content
  extractImageUrls: (htmlContent: string): string[] => {
    if (!htmlContent) return [];
    
    // Multiple regex patterns to catch different formats
    const patterns = [
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,  // Standard: <img src="...">
      /<img[^>]+src=([^\s>]+)/gi,                // Without quotes: <img src=...>
    ];
    
    const urls: string[] = [];
    
    patterns.forEach(pattern => {
      let match;
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      while ((match = pattern.exec(htmlContent)) !== null) {
        const url = match[1].replace(/^["']|["']$/g, ''); // Remove quotes if any
        if (url && !urls.includes(url)) {
          urls.push(url);
        }
      }
    });
    
    return urls;
  },

  // Extract file paths from image URLs (for storage deletion)
  extractFilePathsFromUrls: (urls: string[]): string[] => {
    return urls
      .map(url => {
        // Remove query params first
        const cleanUrl = url.split('?')[0];
        
        // Handle full Supabase URLs (multiple formats)
        // Format 1: https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/filename.jpg
        if (cleanUrl.includes('supabase.co/storage/v1/object/public/uploads/')) {
          const parts = cleanUrl.split('/uploads/');
          if (parts.length > 1) {
            return parts[1];
          }
        }
        
        // Format 2: https://hyjzyillgvjuuuktfqum.supabase.co/storage/v1/object/public/uploads/filename.jpg
        // Alternative check
        if (cleanUrl.includes('/uploads/')) {
          const parts = cleanUrl.split('/uploads/');
          if (parts.length > 1) {
            return parts[1];
          }
        }
        
        // Handle relative paths
        if (cleanUrl.startsWith('/uploads/')) {
          return cleanUrl.replace('/uploads/', '');
        }
        
        // If it's already just a filename (no path, no http)
        if (!cleanUrl.includes('/') && !cleanUrl.includes('http') && !cleanUrl.includes(':')) {
          return cleanUrl;
        }
        
        console.warn('Could not extract file path from URL:', url);
        return null;
      })
      .filter((path): path is string => path !== null && path.length > 0);
  },

  // Delete unused images from content
  deleteUnusedImages: async (
    oldContent: string,
    newContent: string,
    bucket: string = 'uploads'
  ) => {
    console.log('=== DELETE UNUSED IMAGES START ===');
    console.log('Old content length:', oldContent?.length || 0);
    console.log('New content length:', newContent?.length || 0);
    
    const oldUrls = storageUtils.extractImageUrls(oldContent);
    const newUrls = storageUtils.extractImageUrls(newContent);
    
    console.log('Old URLs found:', oldUrls);
    console.log('New URLs found:', newUrls);
    
    // Find URLs that were in old content but not in new content
    // Normalize URLs for comparison (remove trailing slashes, query params, etc.)
    const normalizeUrl = (url: string) => {
      return url.split('?')[0].replace(/\/$/, '');
    };
    
    const normalizedOldUrls = oldUrls.map(normalizeUrl);
    const normalizedNewUrls = newUrls.map(normalizeUrl);
    
    const unusedUrls = oldUrls.filter((url, index) => {
      const normalized = normalizeUrl(url);
      return !normalizedNewUrls.includes(normalized);
    });
    
    console.log('Unused URLs:', unusedUrls);
    
    if (unusedUrls.length === 0) {
      console.log('No unused images to delete');
      console.log('=== DELETE UNUSED IMAGES END ===');
      return { deleted: 0, errors: [] };
    }
    
    const filePaths = storageUtils.extractFilePathsFromUrls(unusedUrls);
    console.log('File paths to delete:', filePaths);
    
    const errors: any[] = [];
    let deleted = 0;
    
    // Delete each unused image
    for (const filePath of filePaths) {
      console.log(`Attempting to delete: ${filePath}`);
      const { error } = await storageUtils.deleteFile(filePath, bucket);
      if (error) {
        errors.push({ filePath, error });
        console.error(`Failed to delete ${filePath}:`, error);
      } else {
        deleted++;
        console.log(`✓ Successfully deleted: ${filePath}`);
      }
    }
    
    console.log(`Total deleted: ${deleted}, Errors: ${errors.length}`);
    console.log('=== DELETE UNUSED IMAGES END ===');
    
    return { deleted, errors };
  },

  // Upload temp image (to /uploads/temp/)
  uploadTempImage: async (file: File): Promise<{ data: any; error: any; publicUrl?: string }> => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `temp-${timestamp}-${randomStr}.${extension}`;

      // Call API to upload temp image
      const response = await fetch(`${API_BASE_URL}/news/upload-temp-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          fileName: fileName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload temp image');
      }

      const result = await response.json();
      return { 
        data: result.data, 
        error: null, 
        publicUrl: result.publicUrl 
      };
    } catch (err: any) {
      console.error('Temp image upload error:', err);
      return { data: null, error: err };
    }
  },

  // Move temp images to permanent location
  moveTempImagesToPermanent: async (
    content: string, 
    journalId: string | number
  ): Promise<{ updatedContent: string; error: any }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/move-temp-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          journalId: journalId.toString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move temp images');
      }

      const result = await response.json();
      return { 
        updatedContent: result.updatedContent || content, 
        error: null 
      };
    } catch (err: any) {
      console.error('Move temp images error:', err);
      return { updatedContent: content, error: err };
    }
  },

  // Extract temp image paths from content
  extractTempImagePaths: (content: string): string[] => {
    if (!content) return [];
    
    const tempImageRegex = /<img[^>]+src=["']([^"']*\/temp\/[^"']+)["'][^>]*>/gi;
    const tempImages: string[] = [];
    let match;
    
    while ((match = tempImageRegex.exec(content)) !== null) {
      const url = match[1];
      if (url && !tempImages.includes(url)) {
        tempImages.push(url);
      }
    }
    
    return tempImages;
  }
}

