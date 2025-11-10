import { supabase } from './supabaseClient';
import { uploadFile, deleteFile, getPublicUrl } from './storageService';

/**
 * Service for managing company information with database storage
 * 
 * IMPORTANT: This service enforces a ONE-TO-ONE relationship:
 * - One user = One company profile
 * - One user = One logo file
 * - One user = One signature file
 * 
 * SECURITY NOTE: We NO LONGER automatically delete old files to prevent
 * unexpected asset loss. Old files are kept as backups and can be
 * manually cleaned up if needed.
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

    // Fetch existing profile up front (needed for cleanup decisions)
    // IMPORTANT: We maintain only ONE row per user in company_profiles table
    const { data: existingProfile, error: fetchError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    // Handle logo upload if it's a new file
    let logoPath = null;
    let logoFilename = null;
    let logoSize = null;
    let logoMimeType = null;

    if (companyInfo.logo) {
      if (companyInfo.logo instanceof File || 
          (typeof companyInfo.logo === 'object' && companyInfo.logo.data)) {
        // New file upload - upload to storage
        const { data, error, filePath } = await uploadFile(
          companyInfo.logo instanceof File ? companyInfo.logo : companyInfo.logo.data,
          'company-assets',
          `${userId}/logos`
        );
        
        if (error) {
          return { success: false, error: `Logo upload failed: ${error.message}` };
        }
        
        logoPath = filePath;
        logoFilename = companyInfo.logo.name || companyInfo.logo.filename || 'company-logo';
        logoSize = companyInfo.logo.size || companyInfo.logo.data?.size || null;
        logoMimeType = companyInfo.logo.type || companyInfo.logo.mimeType || companyInfo.logo.data?.type || null;
        
        // DON'T delete old logo - keep it for backup
        // if (existingProfile?.logo_path) {
        //   try {
        //     await deleteFile('company-assets', existingProfile.logo_path);
        //   } catch (deleteError) {
        //     console.warn('Warning: Could not delete old logo file:', deleteError);
        //   }
        // }
      } else if (typeof companyInfo.logo === 'object' && companyInfo.logo.path) {
        // Handle storage object with path, filename, size, type
        logoPath = companyInfo.logo.path;
        logoFilename = companyInfo.logo.name || companyInfo.logo.filename || null;
        logoSize = companyInfo.logo.size || null;
        logoMimeType = companyInfo.logo.type || companyInfo.logo.mimeType || null;
        
      } else if (typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http')) {
        // Handle direct URL (keep existing)
        logoPath = existingProfile?.logo_path || null;
        logoFilename = existingProfile?.logo_filename || null;
        logoSize = existingProfile?.logo_size || null;
        logoMimeType = existingProfile?.logo_mime_type || null;
      }
    } else if (companyInfo.logo === null) {
      // Logo was explicitly removed - clear database fields but DON'T delete from storage
      logoPath = null;
      logoFilename = null;
      logoSize = null;
      logoMimeType = null;
      
      // DON'T delete old logo file from storage - keep it for backup
      // if (existingProfile?.logo_path) {
      //   try {
      //     await deleteFile('company-assets', existingProfile.logo_path);
      //   } catch (deleteError) {
      //     console.warn('Warning: Could not delete old logo file:', deleteError);
      //   }
      // }
    } else if (existingProfile?.logo_path) {
      // No change; keep existing DB value
      logoPath = existingProfile.logo_path;
      logoFilename = existingProfile.logo_filename;
      logoSize = existingProfile.logo_size;
      logoMimeType = existingProfile.logo_mime_type;
    }

    // Handle signature upload if it's a new file
    let signaturePath = null;
    let signatureFilename = null;
    let signatureSize = null;
    let signatureMimeType = null;

    if (companyInfo.signature) {
      if (companyInfo.signature instanceof File || 
          (typeof companyInfo.signature === 'object' && companyInfo.signature.data)) {
        // New file upload - upload to storage
        const { data, error, filePath } = await uploadFile(
          companyInfo.signature instanceof File ? companyInfo.signature : companyInfo.signature.data,
          'company-assets',
          `${userId}/signatures`
        );
        
        if (error) {
          return { success: false, error: `Signature upload failed: ${error.message}` };
        }
        
        signaturePath = filePath;
        signatureFilename = companyInfo.signature.name || companyInfo.signature.filename || 'company-signature';
        signatureSize = companyInfo.signature.size || companyInfo.signature.data?.size || null;
        signatureMimeType = companyInfo.signature.type || companyInfo.signature.mimeType || companyInfo.signature.data?.type || null;
        
        // DON'T delete old signature - keep it for backup
        // if (existingProfile?.signature_path) {
        //   try {
        //     await deleteFile('company-assets', existingProfile.signature_path);
        //   } catch (deleteError) {
        //     console.warn('Warning: Could not delete old signature file:', deleteError);
        //   }
        // }  
      } else if (typeof companyInfo.signature === 'object' && companyInfo.signature.path) {
        // Handle storage object with path, filename, size, type
        signaturePath = companyInfo.signature.path;
        signatureFilename = companyInfo.signature.name || companyInfo.signature.filename || null;
        signatureSize = companyInfo.signature.size || null;
        signatureMimeType = companyInfo.signature.type || companyInfo.signature.mimeType || null;
        
      } else if (typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('http')) {
        // Handle direct URL (keep existing)
        signaturePath = existingProfile?.signature_path || null;
        signatureFilename = existingProfile?.signature_filename || null;
        signatureSize = existingProfile?.signature_size || null;
        signatureMimeType = existingProfile?.signature_mime_type || null;
      }
    } else if (companyInfo.signature === null) {
      // Signature was explicitly removed - clear database fields but DON'T delete from storage
      signaturePath = null;
      signatureFilename = null;
      signatureSize = null;
      signatureMimeType = null;
      
      // DON'T delete old signature file from storage - keep it for backup
      // if (existingProfile?.signature_path) {
      //   try {
      //     await deleteFile('company-assets', existingProfile.signature_path);
      //   } catch (deleteError) {
      //     console.warn('Warning: Could not delete old signature file:', deleteError);
      //   }
      // }
    } else if (existingProfile?.signature_path) {
      // No change; keep existing DB value
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
      iban: companyInfo.iban || null,
      account_name: companyInfo.accountName || null,
      bank_name: companyInfo.bankName || null,
      logo_path: logoPath || existingProfile?.logo_path || null,
      logo_filename: logoFilename,
      logo_size: logoSize,
      logo_mime_type: logoMimeType,
      signature_path: signaturePath || existingProfile?.signature_path || null,
      signature_filename: signatureFilename,
      signature_size: signatureSize,
      signature_mime_type: signatureMimeType,
      is_default: true, // Always true - we maintain only one row per user
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      // Update existing profile - maintaining ONE row per user
      result = await supabase
        .from('company_profiles')
        .update(companyData)
        .eq('id', existingProfile.id)
        .select()
        .single();
    } else {
      // Create new profile - only happens for first-time users
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

    // Return the saved data with public URLs for files (public bucket access)
    const savedData = {
      ...companyInfo,
      id: result.data.id,
      logo: logoPath ? { 
        path: logoPath,
        name: logoFilename,
        size: logoSize,
        type: logoMimeType,
        url: getPublicUrl('company-assets', logoPath)
      } : null,
      signature: signaturePath ? { 
        path: signaturePath,
        name: signatureFilename,
        size: signatureSize,
        type: signatureMimeType,
        url: getPublicUrl('company-assets', signaturePath)
      } : null
    };

    return { success: true, data: savedData };
  } catch (error) {
    console.error('Error saving company info:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

/**
 * Create a default company profile for a new user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createDefaultCompanyProfile = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const defaultProfile = {
      user_id: userId,
      profile_id: null,
      company_name: 'VOTRE ENTREPRISE',
      logo_path: null,
      logo_filename: null,
      logo_size: null,
      logo_mime_type: null,
      signature_path: null,
      signature_filename: null,
      signature_size: null,
      signature_mime_type: null,
      address: '123 Rue de l\'Exemple',
      city: 'Bruxelles',
      state: 'Bruxelles-Capitale',
      country: 'Belgique',
      postal_code: '1000',
      phone: '+32 123 45 67 89',
      email: 'contact@entreprise.be',
      website: 'www.entreprise.be',
      vat_number: 'BE0123456789',
      iban: null,
      is_default: true
    };

    const { data, error } = await supabase
      .from('company_profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      console.error('Error creating default company profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating default company profile:', error);
    return { success: false, error: error.message };
  }
};

export const loadCompanyInfo = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    // First try to get the default profile
    let { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    // If no default profile found, try to get any profile for this user
    if (error && error.code === 'PGRST116') {
      console.log('No default company profile found, trying to get any profile for user:', userId);
      
      const { data: anyProfile, error: anyProfileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();
      
      if (anyProfileError && anyProfileError.code === 'PGRST116') {
        // No company profile exists for this user at all - create a default one
        console.log('No company profile found for user, creating default profile:', userId);
        
        const { success, data: defaultProfile, error: createError } = await createDefaultCompanyProfile(userId);
        if (success && defaultProfile) {
          data = defaultProfile;
        } else {
          console.error('Failed to create default company profile:', createError);
          return null;
        }
      } else if (anyProfileError) {
        console.error('Error loading any company profile:', anyProfileError);
        return null;
      } else {
        data = anyProfile;
      }
    } else if (error) {
      console.error('Error loading default company profile:', error);
      return null;
    }

    // If we still don't have data, return null
    if (!data) {
      return null;
    }

    // Convert database format to frontend format with public URLs for public files
    const logoData = data.logo_path ? {
      path: data.logo_path,
      name: data.logo_filename,
      size: data.logo_size,
      type: data.logo_mime_type,
      url: getPublicUrl('company-assets', data.logo_path)
    } : null;

    const signatureData = data.signature_path ? {
      path: data.signature_path,
      name: data.signature_filename,
      size: data.signature_size,
      type: data.signature_mime_type,
      url: getPublicUrl('company-assets', data.signature_path)
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
      iban: data.iban || null,
      accountName: data.account_name || null,
      bankName: data.bank_name || null,
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
      .limit(1)
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
    }
    
    // Clear the asset fields in the database
    const updateData = type === 'logo' ? {
      logo_path: null,
      logo_filename: null,
      logo_size: null,
      logo_mime_type: null
    } : {
      signature_path: null,
      signature_filename: null,
      signature_size: null,
      signature_mime_type: null
    };

    const { error: updateError } = await supabase
      .from('company_profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      return { success: false, error: `Failed to update database: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing company asset:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
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
    iban: null,
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