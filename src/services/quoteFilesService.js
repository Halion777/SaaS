import { supabase } from './supabaseClient';
import { uploadFile, deleteFile, getPublicUrl } from './storageService';

/**
 * Service for managing quote files, signatures, and attachments
 */

/**
 * Upload a file to quote-files bucket
 * @param {File} file - File to upload
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID
 * @param {string} profileId - User Profile ID for foreign key constraint
 * @param {string} fileCategory - Category of file (attachment, logo, signature, etc.)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadQuoteFile = async (file, quoteId, userId, profileId = null, fileCategory = 'attachment') => {
  try {
    if (!file || !quoteId || !userId) {
      return { success: false, error: 'File, quote ID, and user ID are required' };
    }

    // Upload file to quote-files bucket
    const { data: uploadData, error: uploadError, filePath } = await uploadFile(
      file,
      'quote-files',
      `${quoteId}/${fileCategory}`
    );

    if (uploadError) {
      return { success: false, error: `File upload failed: ${uploadError.message}` };
    }

    // Create file record in database
    const fileRecord = {
      quote_id: quoteId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type, // Correct column name: mime_type not file_type
      file_category: fileCategory,
      uploaded_by: profileId // Use profile ID for foreign key constraint
    };

    const { data: dbData, error: dbError } = await supabase
      .from('quote_files')
      .insert(fileRecord)
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await deleteFile('quote-files', filePath);
      return { success: false, error: `Database record creation failed: ${dbError.message}` };
    }

    return {
      success: true,
      data: {
        ...dbData,
        publicUrl: getPublicUrl('quote-files', filePath)
      }
    };
  } catch (error) {
    console.error('Error uploading quote file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload a signature to signatures bucket
 * @param {File} file - Signature file to upload
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID
 * @param {string} signatureType - Type of signature (client, company)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadQuoteSignature = async (file, quoteId, userId, signatureType = 'client') => {
  try {
    if (!file || !quoteId || !userId) {
      return { success: false, error: 'File, quote ID, and user ID are required' };
    }

    // Upload signature to signatures bucket
    const { data: uploadData, error: uploadError, filePath } = await uploadFile(
      file,
      'signatures',
      `${quoteId}/${signatureType}`
    );

    if (uploadError) {
      return { success: false, error: `Signature upload failed: ${uploadError.message}` };
    }

    // Create signature record in database
    const signatureRecord = {
      quote_id: quoteId,
      signer_name: signatureType === 'client' ? 'Client' : 'Company',
      signer_email: null,
      signature_file_path: filePath,
      signature_filename: file.name,
      signature_size: file.size,
      signature_mime_type: file.type,
      signature_mode: 'upload',
      signature_type: signatureType
    };

    const { data: dbData, error: dbError } = await supabase
      .from('quote_signatures')
      .insert(signatureRecord)
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await deleteFile('signatures', filePath);
      return { success: false, error: `Database record creation failed: ${dbError.message}` };
    }

    return {
      success: true,
      data: {
        ...dbData,
        publicUrl: getPublicUrl('signatures', filePath)
      }
    };
  } catch (error) {
    console.error('Error uploading quote signature:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all files for a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getQuoteFiles = async (quoteId) => {
  try {
    if (!quoteId) {
      return { success: false, error: 'Quote ID is required' };
    }

    const { data, error } = await supabase
      .from('quote_files')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Database query failed: ${error.message}` };
    }

    // Add public URLs to each file
    const filesWithUrls = data.map(file => ({
      ...file,
      publicUrl: getPublicUrl('quote-files', file.file_path)
    }));

    return { success: true, data: filesWithUrls };
  } catch (error) {
    console.error('Error getting quote files:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get signatures for a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getQuoteSignatures = async (quoteId) => {
  try {
    if (!quoteId) {
      return { success: false, error: 'Quote ID is required' };
    }

    const { data, error } = await supabase
      .from('quote_signatures')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Database query failed: ${error.message}` };
    }

    // Add public URLs to each signature
    const signaturesWithUrls = data.map(signature => ({
      ...signature,
      publicUrl: signature.signature_file_path ? getPublicUrl('signatures', signature.signature_file_path) : null
    }));

    return { success: true, data: signaturesWithUrls };
  } catch (error) {
    console.error('Error getting quote signatures:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a quote file
 * @param {string} fileId - File ID
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuoteFile = async (fileId, quoteId) => {
  try {
    if (!fileId || !quoteId) {
      return { success: false, error: 'File ID and quote ID are required' };
    }

    // Get file record to find file path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('quote_files')
      .select('file_path')
      .eq('id', fileId)
      .eq('quote_id', quoteId)
      .single();

    if (fetchError) {
      return { success: false, error: `File not found: ${fetchError.message}` };
    }

    // Delete file from storage
    if (fileRecord.file_path) {
      await deleteFile('quote-files', fileRecord.file_path);
    }

    // Delete file record from database
    const { error: deleteError } = await supabase
      .from('quote_files')
      .delete()
      .eq('id', fileId)
      .eq('quote_id', quoteId);

    if (deleteError) {
      return { success: false, error: `Database deletion failed: ${deleteError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting quote file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a quote signature
 * @param {string} signatureId - Signature ID
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuoteSignature = async (signatureId, quoteId) => {
  try {
    if (!signatureId || !quoteId) {
      return { success: false, error: 'Signature ID and quote ID are required' };
    }

    // Get signature record to find file path
    const { data: signatureRecord, error: fetchError } = await supabase
      .from('quote_signatures')
      .select('signature_file_path')
      .eq('id', signatureId)
      .eq('quote_id', quoteId)
      .single();

    if (fetchError) {
      return { success: false, error: `Signature not found: ${fetchError.message}` };
    }

    // Delete file from storage
    if (signatureRecord.signature_file_path) {
      await deleteFile('signatures', signatureRecord.signature_file_path);
    }

    // Delete signature record from database
    const { error: deleteError } = await supabase
      .from('quote_signatures')
      .delete()
      .eq('id', signatureId)
      .eq('quote_id', quoteId);

    if (deleteError) {
      return { success: false, error: `Database deletion failed: ${deleteError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting quote signature:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update signature metadata (e.g., signer name, email, comment)
 * @param {string} signatureId - Signature ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateQuoteSignature = async (signatureId, updates) => {
  try {
    if (!signatureId) {
      return { success: false, error: 'Signature ID is required' };
    }

    const { data, error } = await supabase
      .from('quote_signatures')
      .update(updates)
      .eq('id', signatureId)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Update failed: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating quote signature:', error);
    return { success: false, error: error.message };
  }
};
