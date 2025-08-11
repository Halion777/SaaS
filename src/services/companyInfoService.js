import { supabase } from './supabaseClient';
import { uploadFile, deleteFile, getPublicUrl } from './storageService';

/**
 * Service for managing company information with database storage
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

    // Handle logo upload if it's a new file
    let logoPath = companyInfo.logo;
    let logoFilename = null;
    let logoSize = null;
    let logoMimeType = null;

    if (companyInfo.logo && (companyInfo.logo instanceof File || (typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('blob:')))) {
      try {
        // It's a new file, upload it
        const logoFile = companyInfo.logo instanceof File ? companyInfo.logo : await fetch(companyInfo.logo).then(r => r.blob());
        const logoFileName = companyInfo.logo instanceof File ? companyInfo.logo.name : 'logo.png';
        
        const { data: logoUploadData, error: logoError, filePath: logoFilePath } = await uploadFile(
          logoFile, 
          'company-assets', 
          `${userId}/logos`
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
    }

    // Handle signature upload if it's a new file
    let signaturePath = companyInfo.signature;
    let signatureFilename = null;
    let signatureSize = null;
    let signatureMimeType = null;

    if (companyInfo.signature && (companyInfo.signature instanceof File || (typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('blob:')))) {
      try {
        // It's a new file, upload it
        const signatureFile = companyInfo.signature instanceof File ? companyInfo.signature : await fetch(companyInfo.signature).then(r => r.blob());
        const signatureFileName = companyInfo.signature instanceof File ? companyInfo.signature.name : 'signature.png';
        
        const { data: signatureUploadData, error: signatureError, filePath: signatureFilePath } = await uploadFile(
          signatureFile, 
          'company-assets', 
          `${userId}/signatures`
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
    }

    // Check if company profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    const companyData = {
      user_id: userId,
      company_name: companyInfo.name || '',
      vat_number: companyInfo.vatNumber || '',
      address: companyInfo.address || '',
      postal_code: companyInfo.postalCode || '',
      city: companyInfo.city || '',
      state: companyInfo.state || '', // Add missing state field
      country: companyInfo.country || '',
      phone: companyInfo.phone || '',
      email: companyInfo.email || '',
      website: companyInfo.website || '',
      logo_path: logoPath,
      logo_filename: logoFilename,
      logo_size: logoSize,
      logo_mime_type: logoMimeType,
      signature_path: signaturePath,
      signature_filename: signatureFilename,
      signature_size: signatureSize,
      signature_mime_type: signatureMimeType,
      is_default: true,
      updated_at: new Date().toISOString()
    };

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

    // Return the saved data with public URLs for files
    const savedData = {
      ...companyInfo,
      id: result.data.id,
      logo: logoPath ? getPublicUrl('company-assets', logoPath) : null,
      signature: signaturePath ? getPublicUrl('company-assets', signaturePath) : null
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

    // Convert database format to frontend format
    return {
      name: data.company_name,
      vatNumber: data.vat_number,
      address: data.address,
      postalCode: data.postal_code,
      city: data.city,
      country: data.country,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logo: data.logo_path ? getPublicUrl('company-assets', data.logo_path) : null,
      signature: data.signature_path ? getPublicUrl('company-assets', data.signature_path) : null
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
      await deleteFile('company-assets', assetPath);
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