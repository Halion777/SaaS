import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';
import { getPeppolVATSchemeId } from '../../../utils/peppolSchemes';

const ClientModal = ({ client, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
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
    enablePeppol: false,
    languagePreference: 'fr'
  });

  const typeOptions = [
    { value: 'particulier', label: t('clientManagement.types.individual') },
    { value: 'professionnel', label: t('clientManagement.types.professional') }
  ];

  const companySizeOptions = [
    { value: 'TPE', label: t('clientManagement.companySizes.TPE') },
    { value: 'PME', label: t('clientManagement.companySizes.PME') },
    { value: 'ETI', label: t('clientManagement.companySizes.ETI') },
    { value: 'GE', label: t('clientManagement.companySizes.GE') }
  ];

  const countryOptions = [
    { value: 'BE', label: t('clientManagement.countries.BE') },
    { value: 'FR', label: t('clientManagement.countries.FR') },
    { value: 'CH', label: t('clientManagement.countries.CH') },
    { value: 'LU', label: t('clientManagement.countries.LU') },
    { value: 'CA', label: t('clientManagement.countries.CA') },
    { value: 'US', label: t('clientManagement.countries.US') },
    { value: 'DE', label: t('clientManagement.countries.DE') },
    { value: 'IT', label: t('clientManagement.countries.IT') },
    { value: 'ES', label: t('clientManagement.countries.ES') },
    { value: 'NL', label: t('clientManagement.countries.NL') },
    { value: 'GB', label: t('clientManagement.countries.GB') },
    { value: 'OTHER', label: t('clientManagement.countries.OTHER') }
  ];

  const preferenceOptions = [
    { value: 'email', label: t('clientManagement.preferences.email') },
    { value: 'phone', label: t('clientManagement.preferences.phone') },
    { value: 'sms', label: t('clientManagement.preferences.sms') },
    { value: 'mail', label: t('clientManagement.preferences.mail') }
  ];

  useEffect(() => {
    if (client) {
      // Split name into firstName and lastName for individual clients
      let firstName = '';
      let lastName = '';
      if (client.name && client.type === 'particulier') {
        const nameParts = client.name.trim().split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }
      
      setFormData({
        name: client.name || '',
        firstName: firstName,
        lastName: lastName,
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
        enablePeppol: client.enablePeppol || false,
        languagePreference: client.languagePreference || client.language_preference || 'fr'
      });
    }
  }, [client]);

  // Helper function to extract country code from VAT number
  const extractCountryFromVAT = (vatNumber) => {
    if (!vatNumber || vatNumber.length < 2) return null;
    // Check if VAT number starts with country code (e.g., BE123456789)
    const firstTwo = vatNumber.substring(0, 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(firstTwo)) {
      return firstTwo;
    }
    return null;
  };

  // Helper function to clean VAT number (remove country prefix and non-alphanumeric)
  const cleanVATNumber = (vatNumber) => {
    if (!vatNumber) return '';
    // Remove country prefix if present
    let cleaned = vatNumber.replace(/^[A-Z]{2}/i, '');
    // Remove all non-alphanumeric characters
    cleaned = cleaned.replace(/[^A-Z0-9]/gi, '');
    return cleaned.toUpperCase();
  };

  // Helper function to format Peppol ID from VAT number
  const formatPeppolIdFromVAT = (vatNumber, countryCode) => {
    if (!vatNumber || !vatNumber.trim()) return '';
    
    // Extract country from VAT number or use provided country code
    let country = extractCountryFromVAT(vatNumber) || countryCode || 'BE';
    country = country.toUpperCase();
    
    // Clean VAT number (remove country prefix and special characters)
    const cleanedVAT = cleanVATNumber(vatNumber);
    
    if (!cleanedVAT) return '';
    
    // Get scheme ID for the country
    const schemeId = getPeppolVATSchemeId(country);
    if (!schemeId) return '';
    
    // Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    // For Belgium: 9925:BE1009915101
    // For other countries: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    return `${schemeId}:${country}${cleanedVAT}`;
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill Peppol ID when VAT number is entered for professional clients
      if (field === 'regNumber' && prev.type === 'professionnel' && value && value.trim()) {
        const countryCode = prev.country || 'BE';
        const peppolId = formatPeppolIdFromVAT(value, countryCode);
        
        if (peppolId) {
          updated.peppolId = peppolId;
          updated.enablePeppol = true; // Auto-enable Peppol when VAT is entered
        }
      }
      
      // Update Peppol ID if country changes and VAT number exists
      if (field === 'country' && prev.type === 'professionnel' && prev.regNumber && prev.regNumber.trim()) {
        const peppolId = formatPeppolIdFromVAT(prev.regNumber, value);
        if (peppolId) {
          updated.peppolId = peppolId;
        }
      }
      
      return updated;
    });
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
        alert(t('clientManagement.modal.invalidPeppolId'));
        return;
      }
    }
    
    // Prepare data for saving - combine firstName and lastName for individual clients
    const dataToSave = { ...formData };
    if (formData.type === 'particulier') {
      // Combine firstName and lastName into name for backend
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
      dataToSave.name = fullName || formData.name; // Fallback to existing name if both are empty
    }
    
    onSave(dataToSave);
  };

  // Validation: for individual clients, check firstName and lastName; for professional, check name
  // All fields are mandatory
  const isFormValid = (
    (formData.type === 'particulier' ? (formData.firstName.trim() && formData.lastName.trim()) : formData.name.trim()) &&
    formData.email && 
    formData.phone &&
    formData.address.trim() &&
    (formData.type === 'professionnel' ? (
      formData.city.trim() &&
      formData.country &&
      formData.postalCode.trim() &&
      formData.contactPerson.trim() &&
      formData.companySize &&
      formData.regNumber.trim()
    ) : true) &&
    (!formData.enablePeppol || (formData.enablePeppol && formData.peppolId.trim()))
  );

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
              {client ? t('clientManagement.modal.editClient') : t('clientManagement.modal.newClient')}
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
                {t('clientManagement.modal.clientType')} *
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
                  {t('clientManagement.modal.clientStatus')} *
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
                      <span className="text-sm font-medium">{t('clientManagement.status.active')}</span>
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
                    <span className="text-sm font-medium">{t('clientManagement.status.inactive')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Client Form */}
            {formData.type === 'particulier' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="User" size={20} />
                    {t('clientManagement.modal.personalInfo', 'Personal Information')}
                  </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                        label={t('registerForm.step1.firstName', 'First Name')}
                    type="text"
                        placeholder={t('registerForm.step1.firstNamePlaceholder', 'John')}
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                  />
                  
                      <Input
                        label={t('registerForm.step1.lastName', 'Last Name')}
                        type="text"
                        placeholder={t('registerForm.step1.lastNamePlaceholder', 'Doe')}
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('clientManagement.modal.email')}
                    type="email"
                    placeholder={t('clientManagement.modal.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                
                  <Input
                    label={t('clientManagement.modal.phone')}
                    type="tel"
                    placeholder={t('clientManagement.modal.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="MapPin" size={20} />
                    {t('clientManagement.modal.locationInfo', 'Location Information')}
                  </h3>
                  <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label={t('clientManagement.modal.country')}
                    options={countryOptions}
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder={t('clientManagement.modal.countryPlaceholder')}
                        required
                  />
                  
                      <Input
                        label={t('clientManagement.modal.city')}
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder={t('clientManagement.modal.cityPlaceholder')}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t('clientManagement.modal.postalCode')}
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder={t('clientManagement.modal.postalCodePlaceholder')}
                        required
                      />
                      
                      <div className="md:col-span-2">
                        <Input
                          label={t('clientManagement.modal.address')}
                          type="text"
                          placeholder={t('clientManagement.modal.addressPlaceholder', 'Street name + number (e.g., Rue de la Paix 123)')}
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          required
                  />
                </div>
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    {t('clientManagement.modal.preferences', 'Preferences')}
                  </h3>
                  <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.languagePreference')}
                  </label>
                  <Select
                    value={formData.languagePreference || 'fr'}
                    onChange={(e) => handleChange('languagePreference', e.target.value)}
                    options={[
                      { value: 'fr', label: '🇫🇷 Français' },
                      { value: 'en', label: '🇬🇧 English' },
                      { value: 'nl', label: '🇳🇱 Nederlands' }
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                        {t('clientManagement.modal.languagePreferenceHelp')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.communicationPreferences')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {preferenceOptions.map((preference) => (
                          <div key={preference.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`individual-${preference.value}`}
                              checked={formData.preferences.includes(preference.value)}
                              onChange={(e) => handlePreferenceToggle(preference.value)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                            />
                            <label htmlFor={`individual-${preference.value}`} className="text-sm text-foreground">
                              {preference.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Client Form */}
            {formData.type === 'professionnel' && (
              <div className="space-y-6">
                {/* Company Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Briefcase" size={20} />
                    {t('clientManagement.modal.companyInfo', 'Company Information')}
                  </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('clientManagement.modal.companyName')}
                    type="text"
                    placeholder={t('clientManagement.modal.companyNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                    label={t('clientManagement.modal.email')}
                    type="email"
                    placeholder={t('clientManagement.modal.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('clientManagement.modal.phone')}
                    type="tel"
                    placeholder={t('clientManagement.modal.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="MapPin" size={20} />
                    {t('clientManagement.modal.locationInfo', 'Location Information')}
                  </h3>
                  <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label={t('clientManagement.modal.country')}
                    options={countryOptions}
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder={t('clientManagement.modal.countryPlaceholder')}
                        required
                  />
                  
                      <Input
                        label={t('clientManagement.modal.city')}
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder={t('clientManagement.modal.cityPlaceholder')}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t('clientManagement.modal.postalCode')}
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder={t('clientManagement.modal.postalCodePlaceholder')}
                        required
                      />
                      
                      <div className="md:col-span-2">
                        <Input
                          label={t('clientManagement.modal.address')}
                          type="text"
                          placeholder={t('clientManagement.modal.addressPlaceholder', 'Street name + number (e.g., Rue de la Paix 123)')}
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          required
                  />
                </div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Building" size={20} />
                    {t('clientManagement.modal.professionalInfo')}
                  </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('clientManagement.modal.contactPerson')}
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                      placeholder={t('clientManagement.modal.contactPersonPlaceholder')}
                        required
                    />
                    
                    <Select
                      label={t('clientManagement.modal.companySize')}
                      options={companySizeOptions}
                      value={formData.companySize}
                      onChange={(e) => handleChange('companySize', e.target.value)}
                      placeholder={t('clientManagement.modal.companySizePlaceholder')}
                        required
                    />
                    
                    <Input
                      label={t('clientManagement.modal.vatNumber')}
                      type="text"
                      value={formData.regNumber}
                      onChange={(e) => handleChange('regNumber', e.target.value)}
                      placeholder={t('clientManagement.modal.vatNumberPlaceholder')}
                        required
                    />
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    {t('clientManagement.modal.preferences', 'Preferences')}
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.languagePreference')}
                      </label>
                      <Select
                        value={formData.languagePreference || 'fr'}
                        onChange={(e) => handleChange('languagePreference', e.target.value)}
                        options={[
                          { value: 'fr', label: '🇫🇷 Français' },
                          { value: 'en', label: '🇬🇧 English' },
                          { value: 'nl', label: '🇳🇱 Nederlands' }
                        ]}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('clientManagement.modal.languagePreferenceHelp')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.communicationPreferences')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {preferenceOptions.map((preference) => (
                          <div key={preference.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`professional-${preference.value}`}
                              checked={formData.preferences.includes(preference.value)}
                              onChange={(e) => handlePreferenceToggle(preference.value)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                            />
                            <label htmlFor={`professional-${preference.value}`} className="text-sm text-foreground">
                              {preference.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* PEPPOL Configuration - only for professional clients */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Globe" size={20} />
                    {t('clientManagement.modal.peppolConfig')}
                  </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePeppol"
                      checked={formData.enablePeppol}
                      onChange={(e) => handleChange('enablePeppol', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="enablePeppol" className="text-sm font-medium text-foreground">
                      {t('clientManagement.modal.enablePeppol')}
                    </label>
                  </div>
                  
                  {formData.enablePeppol && (
                    <Input
                      label={t('clientManagement.modal.peppolId')}
                      type="text"
                      value={formData.peppolId}
                      onChange={(e) => handleChange('peppolId', e.target.value)}
                      placeholder={t('clientManagement.modal.peppolIdPlaceholder')}
                    />
                  )}
                  </div>
                </div>
              </div>
            )}


            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t('clientManagement.modal.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
              >
                {client ? t('clientManagement.modal.update') : t('clientManagement.modal.create')}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientModal;