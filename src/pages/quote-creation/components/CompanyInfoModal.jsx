import React, { useState, useEffect } from 'react';
import AppIcon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { validateCompanyInfo, removeCompanyAsset } from '../../../services/companyInfoService';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../../components/AppIcon';
import { uploadFile, deleteFile, getPublicUrl } from '../../../services/storageService';

const CompanyInfoModal = ({ isOpen, onClose, onSave, onCompanyInfoChange, initialData = {} }) => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    vatNumber: '',
    address: '',
    postalCode: '',
    city: '',
    state: 'Bruxelles-Capitale',
    country: 'Belgique',
    phone: '',
    email: '',
    website: '',
    logo: null,
    signature: null,
    ...initialData
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [isRemovingSignature, setIsRemovingSignature] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCompanyInfo(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Detect and resolve data conflicts between database and localStorage
  const resolveDataConflicts = () => {
    if (!user?.id) return;
    
    try {
      // Check for logo conflicts
      const localLogoInfo = localStorage.getItem(`company-logo-${user.id}`);
      if (localLogoInfo && companyInfo.logo && typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http')) {
        // Database has real logo, localStorage has placeholder - remove localStorage
        localStorage.removeItem(`company-logo-${user.id}`);
        
      }
      
      // Check for signature conflicts
      const localSignatureInfo = localStorage.getItem(`company-signature-${user.id}`);
      if (localSignatureInfo && companyInfo.signature && typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('http')) {
        // Database has real signature, localStorage has placeholder - remove localStorage
        localStorage.removeItem(`company-signature-${user.id}`);
        
      }
      
      // Check for company info conflicts
      const localCompanyInfo = localStorage.getItem(`company-info-${user.id}`);
      if (localCompanyInfo && companyInfo.name && companyInfo.email) {
        try {
          const parsed = JSON.parse(localCompanyInfo);
          // If database has more complete info, update localStorage
          if (companyInfo.name && companyInfo.email && (!parsed.name || !parsed.email)) {
            const companyInfoToSave = {
              name: companyInfo.name,
              vatNumber: companyInfo.vatNumber,
              address: companyInfo.address,
              postalCode: companyInfo.postalCode,
              city: companyInfo.city,
              state: companyInfo.state,
              country: companyInfo.country,
              phone: companyInfo.phone,
              email: companyInfo.email,
              website: companyInfo.website
            };
            localStorage.setItem(`company-info-${user.id}`, JSON.stringify(companyInfoToSave));
            
          }
        } catch (error) {
          console.error('Error parsing localStorage company info:', error);
        }
      }
    } catch (error) {
      console.error('Error resolving data conflicts:', error);
    }
  };

  // Load company info from database only
  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!user?.id) return;

      try {
        // Load company info from database only (no localStorage fallback)
        const { loadCompanyInfo } = await import('../../../services/companyInfoService');
        const companyData = await loadCompanyInfo(user.id);

        if (companyData) {
          // Use database data directly

          // Generate public URLs for any images that only have paths (from database)
          if (companyData.logo?.path && !companyData.logo?.url) {
            try {
              // Get public URL for logo (bucket is now public)
              const logoUrl = getPublicUrl('company-assets', companyData.logo.path);
              companyData.logo.url = logoUrl;
            } catch (error) {
              // If we can't get public URL, remove the logo to avoid display errors
              companyData.logo = null;
            }
          }

          if (companyData.signature?.path && !companyData.signature?.url) {
            try {
              // Get public URL for signature (bucket is now public)
              const signatureUrl = getPublicUrl('company-assets', companyData.signature.path);
              companyData.signature.url = signatureUrl;
            } catch (error) {
              // If we can't get public URL, remove the signature to avoid display errors
              companyData.signature = null;
            }
          }

          setCompanyInfo(companyData);
        } else {
          // No database data - set empty state
          setCompanyInfo({
            name: '',
            vatNumber: '',
            address: '',
            postalCode: '',
            city: '',
            state: '',
            country: '',
            phone: '',
            email: '',
            website: '',
            logo: null,
            signature: null
          });
        }
      } catch (error) {
        console.error('Error loading company info from database:', error);
        // Set empty state on error
        setCompanyInfo({
          name: '',
          vatNumber: '',
          address: '',
          postalCode: '',
          city: '',
          state: '',
          country: '',
          phone: '',
          email: '',
          website: '',
          logo: null,
          signature: null
        });
      } finally {
        // Always set loading to false when done
        setIsLoading(false);
      }
    };

    // Run every time the modal opens (when isOpen changes)
    if (isOpen) {
      loadCompanyInfo();
    }
  }, [user?.id, isOpen]); // Run when user.id OR modal opens/closes

  const handleInputChange = (field, value) => {
    const updatedInfo = { ...companyInfo, [field]: value };
    setCompanyInfo(updatedInfo);
    
    // Notify parent component immediately
    if (onCompanyInfoChange) {
      onCompanyInfoChange(updatedInfo);
    }
  };

  const handleCompanyInfoSave = (info) => {
    setCompanyInfo(info);
    
    // Sync localStorage with database data to prevent inconsistencies
    if (user?.id) {
      try {
        // Update company info in localStorage
        const companyInfoToSave = {
          name: info.name,
          vatNumber: info.vatNumber,
          address: info.address,
          postalCode: info.postalCode,
          city: info.city,
          state: info.state,
          country: info.country,
          phone: info.phone,
          email: info.email,
          website: info.website
        };
        localStorage.setItem(`company-info-${user.id}`, JSON.stringify(companyInfoToSave));
        
        // If we have real logo/signature URLs from database, remove localStorage placeholders
        if (info.logo && typeof info.logo === 'string' && info.logo.startsWith('http')) {
          localStorage.removeItem(`company-logo-${user.id}`);
        }
        if (info.signature && typeof info.signature === 'string' && info.signature.startsWith('http')) {
          localStorage.removeItem(`company-signature-${user.id}`);
        }
      } catch (error) {
        console.error('Error syncing localStorage with database data:', error);
      }
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingLogo(true);
      try {
        // Delete old logo file from storage if it exists
        if (companyInfo.logo?.path) {
          try {
            const { error: deleteError } = await deleteFile('company-assets', companyInfo.logo.path);
            if (deleteError) {
              console.warn('Warning: Could not delete old logo file:', deleteError);
              // Continue with upload even if deletion fails
            }
          } catch (deleteError) {
            console.warn('Warning: Could not delete old logo file:', deleteError);
            // Continue with upload even if deletion fails
          }
        }

        // Upload to company-assets bucket in logos folder
        const { data, error, filePath } = await uploadFile(file, 'company-assets', `${user?.id}/logos`);
        
        if (error) {
          alert(`Erreur lors de l'upload du logo: ${error.message || error}`);
          return;
        }

        if (filePath) {
          // Get public URL for the uploaded file (bucket is now public)
          const logoUrl = getPublicUrl('company-assets', filePath);
          
          if (logoUrl) {
            setCompanyInfo(prev => ({
              ...prev,
              logo: {
                path: filePath,
                name: file.name,
                size: file.size,
                type: file.type,
                url: logoUrl
              }
            }));
            

            
            // Notify parent component immediately with updated state
            if (onCompanyInfoChange) {
              onCompanyInfoChange(companyInfo);
            }
          }
        }
      } catch (error) {
        alert('Erreur lors de l\'upload du logo');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingSignature(true);
      try {
        // Delete old signature file from storage if it exists
        if (companyInfo.signature?.path) {
          try {
            const { error: deleteError } = await deleteFile('company-assets', companyInfo.signature.path);
            if (deleteError) {
              console.warn('Warning: Could not delete old signature file:', deleteError);
              // Continue with upload even if deletion fails
            }
          } catch (deleteError) {
            console.warn('Warning: Could not delete old signature file:', deleteError);
            // Continue with upload even if deletion fails
          }
        }

        // Upload to company-assets bucket in signatures folder
        const { data, error, filePath } = await uploadFile(file, 'company-assets', `${user?.id}/signatures`);
        
        if (error) {
          alert(`Erreur lors de l'upload de la signature: ${error.message || error}`);
          return;
        }

        if (filePath) {
          // Get public URL for the uploaded file (bucket is now public)
          const signatureUrl = getPublicUrl('company-assets', filePath);
          
          if (signatureUrl) {
            setCompanyInfo(prev => ({
              ...prev,
              signature: {
                path: filePath,
                name: file.name,
                size: file.size,
                type: file.type,
                url: signatureUrl
              }
            }));
            

            
            // Notify parent component immediately with updated state
            if (onCompanyInfoChange) {
              onCompanyInfoChange(companyInfo);
            }
          }
        }
      } catch (error) {
        alert('Erreur lors de l\'upload de la signature');
      } finally {
        setIsUploadingSignature(false);
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyInfo.logo) {
      return;
    }

    setIsRemovingLogo(true);
    try {
      let success = false;
      
      if (companyInfo.logo.path) {
        // Delete from storage
        const { error } = await deleteFile('company-assets', companyInfo.logo.path);
        success = !error;
        if (error) {
          console.error('Error deleting logo from storage:', error);
          // Still continue with local cleanup even if storage deletion fails
        }
      } else {
        success = true; // No storage path to delete
      }
      
      // Always clear local state and localStorage regardless of storage deletion result
      handleInputChange('logo', null);
      
      // Remove from localStorage
      if (user?.id) {
        localStorage.removeItem(`company-logo-${user.id}`);
      }
      
      // Notify parent component
      if (onCompanyInfoChange) {
        onCompanyInfoChange({ ...companyInfo, logo: null });
      }
      
      // Show success message
      if (success) {
        // Logo was successfully removed
      } else {
        // Logo was removed locally but storage cleanup failed
        console.warn('Logo removed locally but storage cleanup failed');
      }
      
    } catch (error) {
      console.error('Error removing logo:', error);
      // Even if there's an error, try to clear local state
      handleInputChange('logo', null);
      if (user?.id) {
        localStorage.removeItem(`company-logo-${user.id}`);
      }
      if (onCompanyInfoChange) {
        onCompanyInfoChange({ ...companyInfo, logo: null });
      }
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!companyInfo.signature) {
      return;
    }

    setIsRemovingSignature(true);
    try {
      let success = false;
      
      if (companyInfo.signature.path) {
        // Delete from storage
        const { error } = await deleteFile('company-assets', companyInfo.signature.path);
        success = !error;
        if (error) {
          console.error('Error deleting signature from storage:', error);
          // Still continue with local cleanup even if storage deletion fails
        }
      } else {
        success = true; // No storage path to delete
      }
      
      // Always clear local state and localStorage regardless of storage deletion result
      handleInputChange('signature', null);
      
      // Remove from localStorage
      if (user?.id) {
        localStorage.removeItem(`company-signature-${user.id}`);
      }
      
      // Notify parent component
      if (onCompanyInfoChange) {
        onCompanyInfoChange({ ...companyInfo, signature: null });
      }
      
      // Show success message
      if (success) {
        // Signature was successfully removed
      } else {
        // Signature was removed locally but storage cleanup failed
        console.warn('Signature removed locally but storage cleanup failed');
      }
      
    } catch (error) {
      console.error('Error removing signature:', error);
      // Even if there's an error, try to clear local state
      handleInputChange('signature', null);
      if (user?.id) {
        localStorage.removeItem(`company-signature-${user.id}`);
      }
      if (onCompanyInfoChange) {
        onCompanyInfoChange({ ...companyInfo, signature: null });
      }
    } finally {
      setIsRemovingSignature(false);
    }
  };

  const handleSave = async () => {
    // Validate company information
    const validation = validateCompanyInfo(companyInfo);
    if (!validation.isValid) {
      alert('Veuillez corriger les erreurs suivantes:\n' + validation.errors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      // Save company info to database using the service
      const { saveCompanyInfo } = await import('../../../services/companyInfoService');
      const result = await saveCompanyInfo(companyInfo, user.id);
      
      if (result.success) {
        
        // Update local state with the saved data from database
        setCompanyInfo(prev => ({ ...prev, ...result.data }));
        
        // Notify parent component of the saved data
        onSave(companyInfo);
        onClose();
      } else {
        console.error('Failed to save company info to database:', result.error);
        alert(`Erreur lors de la sauvegarde en base de données: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error saving company info:', error);
      alert('Erreur lors de la sauvegarde des informations');
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close modal without saving to localStorage
  const handleClose = () => {
    // Notify parent of changes for draft persistence
    if (onCompanyInfoChange) {
      onCompanyInfoChange(companyInfo);
    }
    onClose();
  };

  // Prevent scroll event from bubbling to background
  const handleScroll = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Informations de l'entreprise</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <AppIcon name="X" size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]" onScroll={handleScroll}>
          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Logo de l'entreprise
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('logo-upload').click()}
              iconName="Image"
              iconPosition="left"
              fullWidth
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? 'Upload en cours...' : 'Ajouter un logo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Format recommandé: PNG avec fond transparent, 300x300px max
            </p>
            {companyInfo.logo && (
              <div className="mt-3 relative w-20 h-20 border border-border rounded-lg overflow-hidden">
                {isLoading ? (
                  // Show loading spinner while data is loading
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : companyInfo.logo.url ? (
                  <img
                    src={companyInfo.logo.url}
                    alt="Logo entreprise"
                    className="w-full h-full object-contain"
                    onLoad={() => {}}
                    onError={async (e) => {
                      // Try to get public URL if the current one fails
                      if (companyInfo.logo.path) {
                        try {
                          // Get public URL for logo (bucket is now public)
                          const logoUrl = getPublicUrl('company-assets', companyInfo.logo.path);
                          if (logoUrl) {
                            // Update the logo URL in state
                            setCompanyInfo(prev => ({
                              ...prev,
                              logo: { ...prev.logo, url: logoUrl }
                            }));
                          }
                        } catch (error) {
                          // If we can't get URL, remove the logo to avoid display errors
                          setCompanyInfo(prev => ({
                            ...prev,
                            logo: null
                          }));
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-xs text-gray-500">
                      <Icon name="File" size={16} className="mx-auto mb-1" />
                      {companyInfo.logo.name || 'Logo'}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleRemoveLogo}
                  disabled={isRemovingLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
                  title="Supprimer le logo"
                >
                  ×
                </button>
                {isRemovingLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l'entreprise *
            </label>
              <Input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom de votre entreprise"
              required
            />
          </div>

          {/* VAT Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Numéro de TVA
            </label>
          <Input
            type="text"
            value={companyInfo.vatNumber}
            onChange={(e) => handleInputChange('vatNumber', e.target.value)}
            placeholder="BE0123456789"
          />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse *
            </label>
          <Input
            type="text"
            value={companyInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 Rue de l'Exemple"
              required
          />
          </div>

          {/* Postal Code and City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Code postal *
              </label>
            <Input
              type="text"
              value={companyInfo.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="1000"
                required
            />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ville *
              </label>
            <Input
              type="text"
              value={companyInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Bruxelles"
                required
            />
            </div>
          </div>

          {/* State/Province */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Province/Région
            </label>
            <Input
              type="text"
              value={companyInfo.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Bruxelles-Capitale"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pays *
            </label>
          <Input
            type="text"
            value={companyInfo.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="Belgique"
              required
          />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone *
            </label>
          <Input
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+32 123 45 67 89"
              required
          />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email *
            </label>
          <Input
            type="email"
            value={companyInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@entreprise.be"
              required
          />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site web
            </label>
          <Input
            type="url"
            value={companyInfo.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="www.entreprise.be"
          />
          </div>

          {/* Company Signature */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Signature électronique
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="hidden"
              id="signature-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('signature-upload').click()}
              iconName="FileText"
              iconPosition="left"
              fullWidth
              disabled={isUploadingSignature}
            >
              {isUploadingSignature ? 'Upload en cours...' : 'Ajouter une signature'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Format recommandé: PNG avec fond transparent, 300x150px max
            </p>
            {companyInfo.signature && (
              <div className="mt-3 relative w-32 h-16 border border-border rounded-lg overflow-hidden">
                {isLoading ? (
                  // Show loading spinner while data is loading
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : companyInfo.signature.url ? (
                  <img
                    src={companyInfo.signature.url}
                    alt="Signature"
                    className="w-full h-full object-contain"
                    onLoad={() => {}}
                    onError={async (e) => {
                      // Try to get public URL if the current one fails
                      if (companyInfo.signature.path) {
                        try {
                          // Get public URL for signature (bucket is now public)
                          const signatureUrl = getPublicUrl('company-assets', companyInfo.signature.path);
                          if (signatureUrl) {
                            // Update the signature URL in state
                            setCompanyInfo(prev => ({
                              ...prev,
                              signature: { ...prev.signature, url: signatureUrl }
                            }));
                          }
                        } catch (error) {
                          // If we can't get URL, remove the signature to avoid display errors
                          setCompanyInfo(prev => ({
                            ...prev,
                            signature: null
                          }));
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-xs text-gray-500">
                      <Icon name="File" size={16} className="mx-auto mb-1" />
                      {companyInfo.signature.name || 'Signature'}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleRemoveSignature}
                  disabled={isRemovingSignature}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
                  title="Supprimer la signature"
                >
                  ×
                </button>
                {isRemovingSignature && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            onClick={handleSave}
            iconName="Save"
            iconPosition="left"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            disabled={isSaving}
          >
            {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder les informations'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal; 
