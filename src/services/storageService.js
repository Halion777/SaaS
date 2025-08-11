import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase storage
 * @param {File} file - File to upload
 * @param {string} bucket - Storage bucket name ('quotes-attachments', 'client-files', 'profile-images')
 * @param {string} [folder] - Optional folder path within bucket
 * @returns {Promise<{data, error, filePath}>} Upload result with file path
 */
export async function uploadFile(file, bucket, folder = '') {
  try {
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    return { data, error, filePath };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { error };
  }
}

/**
 * Download a file from Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @returns {Promise<{data, error}>} Download result
 */
export async function downloadFile(bucket, filePath) {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .download(filePath);
    
    return { data, error };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { error };
  }
}

/**
 * Get a public URL for a file (only works for public buckets)
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @returns {string} Public URL for file
 */
export function getPublicUrl(bucket, filePath) {
  const { data } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Get a signed URL for a private file (authenticated access)
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<{data: string, error: string}>} Signed URL or error
 */
export async function getSignedUrl(bucket, filePath, expiresIn = 3600) {
  try {
    if (!filePath) {
      return { error: 'File path is required' };
    }

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return { error: error.message };
    }

    return { data: data.signedUrl };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return { error: error.message };
  }
}

/**
 * List files in a bucket or folder
 * @param {string} bucket - Storage bucket name
 * @param {string} [folder] - Optional folder path within bucket
 * @returns {Promise<{data, error}>} List of files
 */
export async function listFiles(bucket, folder = '') {
  try {
    const options = {};
    if (folder) options.prefix = folder;
    
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(folder, options);
    
    return { data, error };
  } catch (error) {
    console.error('Error listing files:', error);
    return { error };
  }
}

/**
 * Delete a file from storage
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @returns {Promise<{data, error}>} Delete result
 */
export async function deleteFile(bucket, filePath) {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .remove([filePath]);
    
    return { data, error };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { error };
  }
}

/**
 * Update file record in database
 * @param {string} fileId - File ID in database
 * @param {Object} fileData - Updated file data
 * @returns {Promise<{data, error}>} Update result
 */
export async function updateFileRecord(fileId, fileData) {
  try {
    const { data, error } = await supabase
      .from('files')
      .update(fileData)
      .eq('id', fileId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating file record:', error);
    return { error };
  }
}

/**
 * Create a file record in the database
 * @param {Object} fileData - File data to store in database
 * @returns {Promise<{data, error}>} Create result
 */
export async function createFileRecord(fileData) {
  try {
    const { data, error } = await supabase
      .from('files')
      .insert(fileData)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error creating file record:', error);
    return { error };
  }
}

/**
 * Upload file with record creation
 * @param {File} file - File to upload
 * @param {string} bucket - Storage bucket name
 * @param {Object} metadata - File metadata (quote_id, invoice_id, etc.)
 * @returns {Promise<{data, error, url}>} Upload result with public URL
 */
export async function uploadFileWithRecord(file, bucket, metadata) {
  try {
    // First upload the file to storage
    const { data: uploadData, error: uploadError, filePath } = await uploadFile(file, bucket, metadata.folder);
    
    if (uploadError) return { error: uploadError };
    
    // Then create a record in the files table
    const fileRecord = {
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      ...metadata
    };
    
    const { data: recordData, error: recordError } = await createFileRecord(fileRecord);
    
    if (recordError) {
      // If record creation fails, try to delete the uploaded file
      await deleteFile(bucket, filePath);
      return { error: recordError };
    }
    
    // Get public URL for the file
    const url = getPublicUrl(bucket, filePath);
    
    return { data: recordData, url };
  } catch (error) {
    console.error('Error in file upload workflow:', error);
    return { error };
  }
} 