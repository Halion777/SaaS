import React, { useState, useEffect } from 'react';
import AppIcon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';
import { saveCompanyInfo, validateCompanyInfo } from '../../../services/companyInfoService';
import { useAuth } from '../../../context/AuthContext';

const CompanyInfoModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    vatNumber: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Belgique',
    phone: '',
    email: '',
    website: '',
    logo: null,
    signature: null,
    ...initialData
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCompanyInfo(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const logoUrl = URL.createObjectURL(file);
      handleInputChange('logo', logoUrl);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const signatureUrl = URL.createObjectURL(file);
      handleInputChange('signature', signatureUrl);
    }
  };

  const handleSave = () => {
    // Validate company information
    const validation = validateCompanyInfo(companyInfo);
    if (!validation.isValid) {
      alert('Veuillez corriger les erreurs suivantes:\n' + validation.errors.join('\n'));
      return;
    }

    // Save to localStorage for persistence
    const result = saveCompanyInfo(companyInfo, user?.id);
    if (result.success) {
      onSave(companyInfo);
      onClose();
    } else {
      alert('Erreur lors de la sauvegarde des informations');
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
              iconName="Upload"
              iconPosition="left"
              fullWidth
            >
              Ajouter un logo
            </Button>
            {companyInfo.logo && (
              <div className="mt-3 w-20 h-20 border border-border rounded-lg overflow-hidden">
                <Image
                  src={companyInfo.logo}
                  alt="Logo entreprise"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l'entreprise *
            </label>
            <div className="relative">
              <Input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom de votre entreprise"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button className="text-muted-foreground hover:text-foreground">
                  <AppIcon name="Eye" size={16} />
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  <AppIcon name="ChevronDown" size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* VAT Number */}
          <Input
            label="Numéro de TVA"
            type="text"
            value={companyInfo.vatNumber}
            onChange={(e) => handleInputChange('vatNumber', e.target.value)}
            placeholder="BE0123456789"
          />

          {/* Address */}
          <Input
            label="Adresse *"
            type="text"
            value={companyInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 Rue de l'Exemple"
          />

          {/* Postal Code and City */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code postal *"
              type="text"
              value={companyInfo.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="1000"
            />
            <Input
              label="Ville *"
              type="text"
              value={companyInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Bruxelles"
            />
          </div>

          {/* Country */}
          <Input
            label="Pays *"
            type="text"
            value={companyInfo.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="Belgique"
          />

          {/* Phone */}
          <Input
            label="Téléphone *"
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+32 123 45 67 89"
          />

          {/* Email */}
          <Input
            label="Email *"
            type="email"
            value={companyInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@entreprise.be"
          />

          {/* Website */}
          <Input
            label="Site web"
            type="url"
            value={companyInfo.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="www.entreprise.be"
          />

          {/* Electronic Signature */}
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
              <div className="mt-3 w-32 h-16 border border-border rounded-lg overflow-hidden">
                <Image
                  src={companyInfo.signature}
                  alt="Signature"
                  className="w-full h-full object-contain"
                />
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
          >
            Sauvegarder les informations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal; 
