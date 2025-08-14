import React, { useState, useEffect } from 'react';
import AppIcon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';
import { validateCompanyInfo, removeCompanyAsset } from '../../../services/companyInfoService';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../../components/AppIcon'; // Added missing import for Icon

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

  // Load saved company info and files from localStorage
  useEffect(() => {
    if (isOpen && user?.id) {
      // Simple: just load from localStorage if available
      const savedCompanyInfo = localStorage.getItem(`company-info-${user.id}`);
      if (savedCompanyInfo) {
        try {
          const parsed = JSON.parse(savedCompanyInfo);
          setCompanyInfo(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Error loading saved company info:', error);
        }
      }
      
      // Load logo from localStorage if available
      const savedLogoInfo = localStorage.getItem(`company-logo-${user.id}`);
      if (savedLogoInfo) {
        try {
          const logoInfo = JSON.parse(savedLogoInfo);
          setCompanyInfo(prev => ({
            ...prev,
            logo: logoInfo
          }));
        } catch (error) {
          console.error('Error loading saved logo info:', error);
        }
      }
      
      // Load signature from localStorage if available
      const savedSignatureInfo = localStorage.getItem(`company-signature-${user.id}`);
      if (savedSignatureInfo) {
        try {
          const signatureInfo = JSON.parse(savedSignatureInfo);
          setCompanyInfo(prev => ({
            ...prev,
            signature: signatureInfo
          }));
        } catch (error) {
          console.error('Error loading saved signature info:', error);
        }
      }
    }
  }, [isOpen, user?.id]);

  const handleInputChange = (field, value) => {
    const updatedInfo = { ...companyInfo, [field]: value };
    setCompanyInfo(updatedInfo);
    
   
    
    // Save to localStorage for draft
    if (user?.id) {
      const storageKey = `company-info-${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedInfo));
      
    }
    
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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Same approach as client signature: convert to base64 immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result // This is the base64 string
        };
        
        
        
        // Update state
        setCompanyInfo(prev => ({ ...prev, logo: logoData }));
        
        // Save to localStorage for draft
        if (user?.id) {
          const storageKey = `company-logo-${user.id}`;
          localStorage.setItem(storageKey, JSON.stringify(logoData));
          
        }
        
        // Notify parent component immediately
        if (onCompanyInfoChange) {
          onCompanyInfoChange({ ...companyInfo, logo: logoData });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Same approach as client signature: convert to base64 immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const signatureData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result // This is the base64 string
        };
        
        
        
        // Update state
        setCompanyInfo(prev => ({ ...prev, signature: signatureData }));
        
        // Save to localStorage for draft
        if (user?.id) {
          const storageKey = `company-signature-${user.id}`;
          localStorage.setItem(storageKey, JSON.stringify(signatureData));
          
        }
        
        // Notify parent component immediately
        if (onCompanyInfoChange) {
          onCompanyInfoChange({ ...companyInfo, signature: signatureData });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyInfo.logo || (companyInfo.logo && companyInfo.logo.previewUrl && companyInfo.logo.previewUrl.startsWith('blob:'))) {
      // If it's a new file (blob) or no logo, just remove from state
      handleInputChange('logo', null);
      // Remove from localStorage
      localStorage.removeItem(`company-logo-${user?.id}`);
      return;
    }

    setIsRemovingLogo(true);
    try {
      const result = await removeCompanyAsset(user?.id, 'logo');
      if (result.success) {
        handleInputChange('logo', null);
        // Remove from localStorage
        localStorage.removeItem(`company-logo-${user?.id}`);
      } else {
        alert(`Erreur lors de la suppression du logo: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Erreur lors de la suppression du logo');
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!companyInfo.signature || (companyInfo.signature && companyInfo.signature.previewUrl && companyInfo.signature.previewUrl.startsWith('blob:'))) {
      // If it's a new file (blob) or no signature, just remove from state
      handleInputChange('signature', null);
      // Remove from localStorage
      localStorage.removeItem(`company-signature-${user?.id}`);
      return;
    }

    setIsRemovingSignature(true);
    try {
      const result = await removeCompanyAsset(user?.id, 'signature');
      if (result.success) {
        handleInputChange('signature', null);
        // Remove from localStorage
        localStorage.removeItem(`company-signature-${user?.id}`);
      } else {
        alert(`Erreur lors de la suppression de la signature: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing signature:', error);
      alert('Erreur lors de la suppression de la signature');
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
      // Save company info to localStorage for draft (NOT to database)
      const companyInfoToSave = {
        name: companyInfo.name,
        vatNumber: companyInfo.vatNumber,
        address: companyInfo.address,
        postalCode: companyInfo.postalCode,
        city: companyInfo.city,
        country: companyInfo.country,
        phone: companyInfo.phone,
        email: companyInfo.email,
        website: companyInfo.website
      };
      
      if (user?.id) {
        localStorage.setItem(`company-info-${user.id}`, JSON.stringify(companyInfoToSave));
        
      }
      
      // Logo and signature are already saved to localStorage when uploaded
      // No need to save them again here
      
      // Notify parent component of the saved data
      onSave(companyInfo);
      onClose();
      
    } catch (error) {
      console.error('Error saving company info to localStorage:', error);
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
            onClick={onClose}
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
            >
              Ajouter un logo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Format recommandé: PNG avec fond transparent, 300x300px max
            </p>
            {companyInfo.logo && (
              <div className="mt-3 relative w-20 h-20 border border-border rounded-lg overflow-hidden">
                {companyInfo.logo.data ? (
                  // Show preview from base64 data
                  <img
                    src={companyInfo.logo.data}
                    alt="Logo entreprise"
                    className="w-full h-full object-contain"
                  />
                ) : companyInfo.logo.publicUrl ? (
                  // Show from database using publicUrl
                  <img
                    src={companyInfo.logo.publicUrl}
                    alt="Logo entreprise"
                    className="w-full h-full object-contain"
                  />
                ) : typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http') ? (
                  // Show from database if available (fallback)
                  <Image
                    src={companyInfo.logo}
                    alt="Logo entreprise"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  // Show placeholder
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-xs text-gray-500">
                      <Icon name="File" size={16} className="mx-auto mb-1" />
                      {companyInfo.logo.name}
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
            >
              Ajouter une signature
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Format recommandé: PNG avec fond transparent, 300x150px max
            </p>
            {companyInfo.signature && (
              <div className="mt-3 relative w-32 h-16 border border-border rounded-lg overflow-hidden">
                {companyInfo.signature.data ? (
                  // Show preview from base64 data
                  <img
                    src={companyInfo.signature.data}
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                ) : companyInfo.signature.publicUrl ? (
                  // Show from database using publicUrl
                  <img
                    src={companyInfo.signature.publicUrl}
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                ) : typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('http') ? (
                  // Show from database if available (fallback)
                  <Image
                    src={companyInfo.signature}
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  // Show placeholder
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-xs text-gray-500">
                      <Icon name="File" size={16} className="mx-auto mb-1" />
                      {companyInfo.signature.name}
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
