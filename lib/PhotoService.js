import { supabase } from './supabase';
import { AuthService } from './AuthService';
import * as FileSystem from 'expo-file-system';

export class PhotoService {
  static BUCKET_NAME = 'site-media';

  // Test Supabase connection and bucket access
  static async testSupabaseConnection() {
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets, bucketsError);
      
      // Test bucket access
      const { data: files, error: listError } = await supabase.storage
        .from('site-media')
        .list('', { limit: 1 });
      console.log('Bucket access test:', files, listError);
      
      // Test authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current authenticated user:', user?.id);
      
      return { success: true, buckets, files, user };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error };
    }
  }

  // Upload with retry logic and exponential backoff
  static async uploadWithRetry(uri, filename, contentType, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${retries} for file: ${filename}`);

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        // Decode base64 to ArrayBuffer using reliable method
        const arrayBuffer = PhotoService.base64ToArrayBuffer(base64);

        const { data, error } = await supabase.storage
          .from(PhotoService.BUCKET_NAME)
          .upload(filename, arrayBuffer, {
            contentType: contentType,
            upsert: false
          });

        if (error) {
          console.error(`Attempt ${attempt} failed with error:`, error);
          if (attempt === retries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = 1000 * attempt;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.log(`Upload successful on attempt ${attempt}:`, data);
        return data;
        
      } catch (networkError) {
        console.error(`Network error on attempt ${attempt}:`, networkError);
        if (attempt === retries) {
          throw networkError;
        }
        
        // Wait before retry (longer for network errors)
        const waitTime = 2000 * attempt;
        console.log(`Network error - waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new Error('Upload failed after all retry attempts');
  }

  static base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Upload a photo to Supabase storage and save metadata
   * @param {Object} photo - Photo object with uri, fileName, etc.
   * @param {string} siteId - Site ID to associate with the photo
   * @returns {Promise<Object>} Upload result with photo metadata
   */
  static async uploadPhoto(photo, siteId) {
    try {
      // Test connection first
      await PhotoService.testSupabaseConnection();
      
      console.log('Starting photo upload for siteId:', siteId);
      console.log('Photo object:', { uri: photo.uri, fileName: photo.fileName, type: photo.type });
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to upload photos');
      }
      console.log('Current user authenticated:', currentUser.id);

      // Debug authentication state
      const debugAuth = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Auth debug:', {
          user: user?.id,
          role: user?.role,
          isAuthenticated: !!user,
          authRole: user ? 'authenticated' : 'anonymous'
        });
        if (error) console.error('Auth debug error:', error);
      };
      await debugAuth();
      
      // Log Supabase configuration
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Supabase Key length:', supabase.supabaseKey?.length);

      // Generate unique filename following the expected path structure: site_id/yyyy/mm/user_id/filename
      const timestamp = Date.now();
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const extension = photo.fileName?.split('.').pop() || 'jpg';
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${siteId}/${year}/${month}/${currentUser.id}/${timestamp}-${randomId}.${extension}`;
      console.log('Generated filename:', fileName);

      // Check file size using FileSystem
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${fileInfo.size} bytes (max: ${MAX_FILE_SIZE})`);
      }
      console.log('File size check passed:', fileInfo.size);
      
      // Upload to Supabase storage with retry logic
      console.log('Uploading to Supabase storage bucket:', this.BUCKET_NAME);
      console.log('Upload options:', { contentType: photo.type || 'image/jpeg', upsert: false });
      
      const uploadData = await PhotoService.uploadWithRetry(photo.uri, fileName, photo.type || 'image/jpeg');
      
      if (!uploadData) {
        throw new Error('Upload failed after all retry attempts');
      }
      console.log('Storage upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      // Save photo metadata to database
      const photoMetadata = {
        site_id: siteId,
        user_id: currentUser.id,
        file_name: fileName,
        original_name: photo.fileName || 'captured-photo',
        file_size: fileInfo.size,
        mime_type: photo.type || 'image/jpeg',
        storage_path: uploadData.path,
        public_url: urlData.publicUrl,
        width: photo.width || null,
        height: photo.height || null,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('site_photos')
        .insert(photoMetadata)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to clean up uploaded file
        try {
          await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file after database error:', cleanupError);
        }
        throw dbError;
      }

      return {
        success: true,
        photo: dbData,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple photos in batch
   * @param {Array} photos - Array of photo objects
   * @param {string} siteId - Site ID to associate with photos
   * @param {Function} onProgress - Callback for upload progress (uploaded, total)
   * @returns {Promise<Object>} Batch upload results
   */
  static async uploadPhotos(photos, siteId, onProgress = null) {
    const results = {
      successful: [],
      failed: [],
      total: photos.length
    };

    for (let i = 0; i < photos.length; i++) {
      try {
        const result = await this.uploadPhoto(photos[i], siteId);
        results.successful.push(result);
        
        if (onProgress) {
          onProgress(i + 1, photos.length);
        }
      } catch (error) {
        results.failed.push({
          photo: photos[i],
          error: error.message
        });
        
        if (onProgress) {
          onProgress(i + 1, photos.length);
        }
      }
    }

    return results;
  }

  /**
   * Get photos for a specific site
   * @param {string} siteId - Site ID
   * @returns {Promise<Array>} Array of photo records
   */
  static async getPhotos(siteId) {
    try {
      const { data, error } = await supabase
        .from('site_photos')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  }
  static async getPhotosForSite(siteId) {
    try {
      const { data, error } = await supabase
        .from('site_photos')
        .select(`
          *,
          sites!inner(name, address),
          profiles!inner(username, full_name)
        `)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching site photos:', error);
      throw new Error(`Failed to load photos: ${error.message}`);
    }
  }

  /**
   * Delete a photo and its storage file
   * @param {string} photoId - Photo record ID
   * @returns {Promise<boolean>} Success status
   */
  static async deletePhoto(photoId) {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to delete photos');
      }

      // Get photo metadata first
      const { data: photo, error: fetchError } = await supabase
        .from('site_photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;
      if (!photo) throw new Error('Photo not found');

      // Check if user owns the photo or is admin
      const userProfile = await AuthService.getProfile(currentUser.id);
      if (photo.user_id !== currentUser.id && userProfile.role !== 'admin') {
        throw new Error('Not authorized to delete this photo');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([photo.storage_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('site_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('Photo deletion error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}