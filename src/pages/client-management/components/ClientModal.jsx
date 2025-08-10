import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ClientModal = ({ client, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'particulier',
    isActive: true,
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    contactPerson: '',
    companySize: '',
    regNumber: '',
    preferences: [],
    peppolId: '',
    enablePeppol: false
  });

  const typeOptions = [
    { value: 'particulier', label: 'Particulier' },
    { value: 'professionnel', label: 'Professionnel' }
  ];

  const companySizeOptions = [
    { value: 'TPE', label: 'TPE (1-9 salariés)' },
    { value: 'PME', label: 'PME (10-249 salariés)' },
    { value: 'ETI', label: 'ETI (250-4999 salariés)' },
    { value: 'GE', label: 'Grande Entreprise (5000+ salariés)' }
  ];

  const countryOptions = [
    { value: 'BE', label: 'Belgique' },
    { value: 'FR', label: 'France' },
    { value: 'CH', label: 'Suisse' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'CA', label: 'Canada' },
    { value: 'US', label: 'États-Unis' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'IT', label: 'Italie' },
    { value: 'ES', label: 'Espagne' },
    { value: 'NL', label: 'Pays-Bas' },
    { value: 'GB', label: 'Royaume-Uni' },
    { value: 'OTHER', label: 'Autre' }
  ];

  const preferenceOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'sms', label: 'SMS' },
    { value: 'mail', label: 'Courrier' }
  ];

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        type: client.type || 'particulier',
        isActive: client.isActive !== undefined ? client.isActive : true,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        postalCode: client.postalCode || '',
        contactPerson: client.contactPerson || '',
        companySize: client.companySize || '',
        regNumber: client.regNumber || '',
        preferences: client.preferences || [],
        peppolId: client.peppolId || '',
        enablePeppol: client.enablePeppol || false
      });
    }
  }, [client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceToggle = (preference) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const validatePeppolId = (peppolId) => {
    // Basic Peppol ID validation: [Country Code]:[Identifier]
    const peppolRegex = /^[0-9]{4}:[A-Z0-9]+$/;
    return peppolRegex.test(peppolId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate Peppol ID if enabled
    if (formData.enablePeppol && formData.peppolId.trim()) {
      if (!validatePeppolId(formData.peppolId.trim())) {
        alert('Le format du Peppol ID n\'est pas valide. Utilisez le format: 0208:123456789');
        return;
      }
    }
    
    onSave(formData);
  };

  const isFormValid = formData.name && formData.email && formData.phone && 
    (!formData.enablePeppol || (formData.enablePeppol && formData.peppolId.trim()));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden"
      >
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {client ? 'Modifier le Client' : 'Nouveau Client'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              iconName="X"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Type de client *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleChange('type', option.value)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.type === option.value
                        ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon 
                        name={formData.type === option.value ? 'CheckCircle' : 'Circle'} 
                        size={16} 
                        color={formData.type === option.value ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} 
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Selection - Only show when editing existing client */}
            {client && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Statut du client *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleChange('isActive', true)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.isActive === true
                        ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon 
                        name={formData.isActive === true ? 'CheckCircle' : 'Circle'} 
                        size={16} 
                        color={formData.isActive === true ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} 
                      />
                      <span className="text-sm font-medium">Actif</span>
                    </div>
                  </div>
                  <div
                    onClick={() => handleChange('isActive', false)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.isActive === false
                        ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon 
                        name={formData.isActive === false ? 'CheckCircle' : 'Circle'} 
                        size={16} 
                        color={formData.isActive === false ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} 
                    />
                    <span className="text-sm font-medium">Inactif</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Client Form */}
            {formData.type === 'particulier' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    type="text"
                    placeholder="Nom et prénom"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="04 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Adresse"
                    type="text"
                    placeholder="Adresse complète"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Professional Client Form */}
            {formData.type === 'professionnel' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Raison sociale"
                    type="text"
                    placeholder="Nom de l'entreprise"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="04 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Adresse"
                    type="text"
                    placeholder="Adresse complète"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                {/* Location fields - moved here after telephone and address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ville"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Bruxelles"
                  />
                  
                  <Select
                    label="Pays"
                    options={countryOptions}
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Sélectionner le pays"
                  />
                  
                  <Input
                    label="Code postal"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="1000"
                  />
                </div>

                {/* Professional-specific fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations professionnelles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Personne de contact"
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                      placeholder="Nom de la personne de contact"
                    />
                    
                    <Select
                      label="Taille de l'entreprise"
                      options={companySizeOptions}
                      value={formData.companySize}
                      onChange={(e) => handleChange('companySize', e.target.value)}
                      placeholder="Sélectionner la taille"
                    />
                    
                    <Input
                      label="Numéro d'enregistrement"
                      type="text"
                      value={formData.regNumber}
                      onChange={(e) => handleChange('regNumber', e.target.value)}
                      placeholder="Numéro de TVA ou d'enregistrement"
                    />
                  </div>
                </div>
                
                {/* PEPPOL Configuration - only for professional clients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Configuration PEPPOL</h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePeppol"
                      checked={formData.enablePeppol}
                      onChange={(e) => handleChange('enablePeppol', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="enablePeppol" className="text-sm font-medium text-foreground">
                      Activer PEPPOL pour ce client
                    </label>
                  </div>
                  
                  {formData.enablePeppol && (
                    <Input
                      label="Peppol ID du client"
                      type="text"
                      value={formData.peppolId}
                      onChange={(e) => handleChange('peppolId', e.target.value)}
                      placeholder="Format: 0000:IDENTIFIANT"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Communication Preferences */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Préférences de communication
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {preferenceOptions.map((preference) => (
                  <div key={preference.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={preference.value}
                      checked={formData.preferences.includes(preference.value)}
                      onChange={(e) => handlePreferenceToggle(preference.value)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor={preference.value} className="text-sm text-foreground">
                      {preference.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
              >
                {client ? 'Mettre à jour' : 'Créer le client'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientModal;