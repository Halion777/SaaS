import { supabase } from './supabaseClient';
import { uploadFile, deleteFile, getPublicUrl, getSignedUrl } from './storageService';

/**
 * Service for managing company information with database storage
 * 
 * IMPORTANT: This service enforces a ONE-TO-ONE relationship:
 * - One user = One company profile
 * - One user = One logo file
 * - One user = One signature file
 * 
 * When updating assets, old files are automatically deleted to maintain this policy.
 */

/**
 * Save company information to database
 * @param {Object} companyInfo - Company information object
 * @param {string} userId - User ID for user-specific storage
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const saveCompanyInfo = async (companyInfo, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (!companyInfo) {
      return { success: false, error: 'Company information is required' };
    }

    // Debug: Log what's being received
    console.log('saveCompanyInfo called with:', { companyInfo, userId });

    // Fetch existing profile up front (needed for cleanup decisions)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    // Handle logo upload if it's a new file
    let logoPath = companyInfo.logo;
    let logoFilename = null;
    let logoSize = null;
    let logoMimeType = null;

    if (companyInfo.logo && (companyInfo.logo instanceof File || (typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('blob:')))) {
      try {
        // Check if user already has a logo and delete the old one first
        if (existingProfile && existingProfile.logo_path) {
          await deleteFile('company-assets', existingProfile.logo_path);
        }

        // It's a new file, upload it
        const logoFile = companyInfo.logo instanceof File ? companyInfo.logo : await fetch(companyInfo.logo).then(r => r.blob());
        const logoFileName = companyInfo.logo instanceof File ? companyInfo.logo.name : 'logo.png';
        
        const { data: logoUploadData, error: logoError, filePath: logoFilePath } = await uploadFile(
          logoFile, 
          'company-assets', 
          `${userId}/logos` // Keep one active logo; old is deleted above
        );

        if (logoError) {
          return { success: false, error: `Logo upload failed: ${logoError.message}` };
        }

        logoPath = logoFilePath;
        logoFilename = logoFileName;
        logoSize = logoFile.size;
        logoMimeType = logoFile.type;
      } catch (uploadError) {
        console.error('Logo upload error:', uploadError);
        return { success: false, error: `Logo upload failed: ${uploadError.message}` };
      }
    } else if (companyInfo.logo && typeof companyInfo.logo === 'object' && companyInfo.logo.path) {
      // Keep existing provided path
      logoPath = companyInfo.logo.path;
      logoFilename = companyInfo.logo.filename || null;
      logoSize = companyInfo.logo.size || null;
      logoMimeType = companyInfo.logo.mimeType || null;
    } else if (!companyInfo.logo && existingProfile?.logo_path) {
      // No change; keep DB value
      logoPath = existingProfile.logo_path;
      logoFilename = existingProfile.logo_filename;
      logoSize = existingProfile.logo_size;
      logoMimeType = existingProfile.logo_mime_type;
    }

    // Handle signature upload if it's a new file
    let signaturePath = companyInfo.signature;
    let signatureFilename = null;
    let signatureSize = null;
    let signatureMimeType = null;

    if (companyInfo.signature && (companyInfo.signature instanceof File || (typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('blob:')))) {
      try {
        // Check if user already has a signature and delete the old one first
        if (existingProfile && existingProfile.signature_path) {
          await deleteFile('company-assets', existingProfile.signature_path);
        }

        // It's a new file, upload it
        const signatureFile = companyInfo.signature instanceof File ? companyInfo.signature : await fetch(companyInfo.signature).then(r => r.blob());
        const signatureFileName = companyInfo.signature instanceof File ? companyInfo.signature.name : 'signature.png';
        
        const { data: signatureUploadData, error: signatureError, filePath: signatureFilePath } = await uploadFile(
          signatureFile, 
          'company-assets', 
          `${userId}/signatures` // Keep one active signature; old is deleted above
        );

        if (signatureError) {
          return { success: false, error: `Signature upload failed: ${signatureError.message}` };
        }

        signaturePath = signatureFilePath;
        signatureFilename = signatureFileName;
        signatureSize = signatureFile.size;
        signatureMimeType = signatureFile.type;
      } catch (uploadError) {
        console.error('Signature upload error:', uploadError);
        return { success: false, error: `Signature upload failed: ${uploadError.message}` };
      }
    } else if (companyInfo.signature && typeof companyInfo.signature === 'object' && companyInfo.signature.path) {
      // Keep existing provided path
      signaturePath = companyInfo.signature.path;
      signatureFilename = companyInfo.signature.filename || null;
      signatureSize = companyInfo.signature.size || null;
      signatureMimeType = companyInfo.signature.mimeType || null;
    } else if (!companyInfo.signature && existingProfile?.signature_path) {
      // No change; keep DB value
      signaturePath = existingProfile.signature_path;
      signatureFilename = existingProfile.signature_filename;
      signatureSize = existingProfile.signature_size;
      signatureMimeType = existingProfile.signature_mime_type;
    }

    // existingProfile is already fetched above

    const companyData = {
      user_id: userId,
      company_name: companyInfo.name || '',
      vat_number: companyInfo.vatNumber || '',
      address: companyInfo.address || '',
      postal_code: companyInfo.postalCode || '',
      city: companyInfo.city || '',
      state: companyInfo.state || '',
      country: companyInfo.country || '',
      phone: companyInfo.phone || '',
      email: companyInfo.email || '',
      website: companyInfo.website || '',
      logo_path: logoPath || existingProfile?.logo_path || null,
      logo_filename: logoFilename,
      logo_size: logoSize,
      logo_mime_type: logoMimeType,
      signature_path: signaturePath || existingProfile?.signature_path || null,
      signature_filename: signatureFilename,
      signature_size: signatureSize,
      signature_mime_type: signatureMimeType,
      is_default: true,
      updated_at: new Date().toISOString()
    };

    // Debug: Log the data being saved
    console.log('Saving company data to database:', companyData);

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('company_profiles')
        .update(companyData)
        .eq('id', existingProfile.id)
        .select()
        .single();
    } else {
      // Create new profile
      companyData.created_at = new Date().toISOString();
      result = await supabase
        .from('company_profiles')
        .insert(companyData)
        .select()
        .single();
    }

    if (result.error) {
      return { success: false, error: `Database operation failed: ${result.error.message}` };
    }

    // Return the saved data with signed URLs for files (private bucket access)
    const savedData = {
      ...companyInfo,
      id: result.data.id,
      logo: logoPath ? { 
        path: logoPath,
        filename: logoFilename,
        size: logoSize,
        mimeType: logoMimeType,
        publicUrl: (await getSignedUrl('company-assets', logoPath)).data || null
      } : null,
      signature: signaturePath ? { 
        path: signaturePath,
        filename: signatureFilename,
        size: signatureSize,
        mimeType: signatureMimeType,
        publicUrl: (await getSignedUrl('company-assets', signaturePath)).data || null
      } : null
    };

    return { success: true, data: savedData };
  } catch (error) {
    console.error('Error saving company info:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

/**
 * Load company information from database
 * @param {string} userId - User ID for user-specific storage
 * @returns {Promise<Object|null>} Company information or null if not found
 */
export const loadCompanyInfo = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error loading company info:', error);
      return null;
    }

    // Convert database format to frontend format with signed URLs for private files
    const logoData = data.logo_path ? {
      path: data.logo_path,
      filename: data.logo_filename,
      size: data.logo_size,
      mimeType: data.logo_mime_type,
      publicUrl: (await getSignedUrl('company-assets', data.logo_path)).data || null
    } : null;

    const signatureData = data.signature_path ? {
      path: data.signature_path,
      filename: data.signature_filename,
      size: data.signature_size,
      mimeType: data.signature_mime_type,
      publicUrl: (await getSignedUrl('company-assets', data.signature_path)).data || null
    } : null;

    return {
      name: data.company_name,
      vatNumber: data.vat_number,
      address: data.address,
      postalCode: data.postal_code,
      city: data.city,
      state: data.state,
      country: data.country,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logo: logoData,
      signature: signatureData
    };
  } catch (error) {
    console.error('Error loading company info:', error);
    return null;
  }
};

/**
 * Remove logo or signature from company profile
 * @param {string} userId - User ID
 * @param {string} type - 'logo' or 'signature'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeCompanyAsset = async (userId, type) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (!['logo', 'signature'].includes(type)) {
      return { success: false, error: 'Invalid asset type. Must be "logo" or "signature"' };
    }

    // Get current company profile
    const { data: profile, error: fetchError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // No rows returned
        return { success: false, error: 'Company profile not found' };
      }
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    // Delete file from storage if it exists
    const assetPath = type === 'logo' ? profile.logo_path : profile.signature_path;
    if (assetPath) {
      // Delete the file from storage
      await deleteFile('company-assets', assetPath);
      
      // Also clean up any other files in the user's asset folder for this type
      // This ensures only one asset file exists per user per type
      const assetFolder = type === 'logo' ? `${userId}/logo` : `${userId}/signature`;
      try {
        // Note: This would require a listFiles function in storageService
        // For now, we just delete the specific file path
      } catch (cleanupError) {
        console.warn(`Warning: Could not clean up additional ${type} files:`, cleanupError);
      }
    }

    // Update database to remove asset references
    const updateData = {
      [`${type}_path`]: null,
      [`${type}_filename`]: null,
      [`${type}_size`]: null,
      [`${type}_mime_type`]: null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('company_profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      return { success: false, error: `Update failed: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error(`Error removing company ${type}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete company profile and associated files
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCompanyInfo = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get company profile to find file paths
    const { data: profile, error: fetchError } = await supabase
      .from('company_profiles')
      .select('logo_path, signature_path')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    // Delete files from storage if they exist
    if (profile) {
      if (profile.logo_path) {
        await deleteFile('company-assets', profile.logo_path);
      }
      if (profile.signature_path) {
        await deleteFile('company-assets', profile.signature_path);
      }
    }

    // Delete company profile from database
    const { error: deleteError } = await supabase
      .from('company_profiles')
      .delete()
      .eq('user_id', userId)
      .eq('is_default', true);

    if (deleteError) {
      return { success: false, error: `Delete failed: ${deleteError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting company info:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current asset status for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: {hasLogo: boolean, hasSignature: boolean}, error?: string}>}
 */
export const getAssetStatus = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('logo_path, signature_path')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { success: true, data: { hasLogo: false, hasSignature: false } };
      }
      return { success: false, error: `Database error: ${error.message}` };
    }

    return {
      success: true,
      data: {
        hasLogo: !!profile.logo_path,
        hasSignature: !!profile.signature_path
      }
    };
  } catch (error) {
    console.error('Error getting asset status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get default company information
 * @returns {Object} Default company information
 */
export const getDefaultCompanyInfo = () => {
  return {
    name: 'VOTRE ENTREPRISE',
    vatNumber: 'BE0123456789',
    address: '123 Rue de l\'Exemple',
    postalCode: '1000',
    city: 'Bruxelles',
    country: 'Belgique',
    phone: '+32 123 45 67 89',
    email: 'contact@entreprise.be',
    website: 'www.entreprise.be',
    logo: null,
    signature: null
  };
};

/**
 * Validate company information
 * @param {Object} companyInfo - Company information to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateCompanyInfo = (companyInfo) => {
  const errors = [];
  
  if (!companyInfo.name?.trim()) {
    errors.push('Le nom de l\'entreprise est requis');
  }
  
  if (!companyInfo.address?.trim()) {
    errors.push('L\'adresse est requise');
  }
  
  if (!companyInfo.postalCode?.trim()) {
    errors.push('Le code postal est requis');
  }
  
  if (!companyInfo.city?.trim()) {
    errors.push('La ville est requise');
  }
  
  if (!companyInfo.country?.trim()) {
    errors.push('Le pays est requis');
  }
  
  if (!companyInfo.phone?.trim()) {
    errors.push('Le téléphone est requis');
  }
  
  if (!companyInfo.email?.trim()) {
    errors.push('L\'email est requis');
  }
  
  // Basic email validation
  if (companyInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyInfo.email)) {
    errors.push('L\'email n\'est pas valide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 