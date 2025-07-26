/**
 * Service for managing company information
 */

/**
 * Save company information to localStorage
 * @param {Object} companyInfo - Company information object
 */
export const saveCompanyInfo = (companyInfo) => {
  try {
    localStorage.setItem('company-info', JSON.stringify(companyInfo));
    return { success: true };
  } catch (error) {
    console.error('Error saving company info:', error);
    return { success: false, error };
  }
};

/**
 * Load company information from localStorage
 * @returns {Object|null} Company information or null if not found
 */
export const loadCompanyInfo = () => {
  try {
    const savedInfo = localStorage.getItem('company-info');
    return savedInfo ? JSON.parse(savedInfo) : null;
  } catch (error) {
    console.error('Error loading company info:', error);
    return null;
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