import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ClientModal = ({ client, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    companySize: '',
    preferences: []
  });

  const typeOptions = [
    { value: 'individual', label: 'Particulier' },
    { value: 'professional', label: 'Professionnel' }
  ];

  const companySizeOptions = [
    { value: 'TPE', label: 'TPE (1-9 salariés)' },
    { value: 'PME', label: 'PME (10-249 salariés)' },
    { value: 'ETI', label: 'ETI (250-4999 salariés)' },
    { value: 'GE', label: 'Grande Entreprise (5000+ salariés)' }
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
        type: client.type || 'individual',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        contactPerson: client.contactPerson || '',
        companySize: client.companySize || '',
        preferences: client.preferences || []
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isFormValid = formData.name && formData.email && formData.phone;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom / Raison sociale *"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du client ou de l'entreprise"
                required
              />
              
              <Select
                label="Type de client *"
                options={typeOptions}
                value={formData.type}
                onChange={(value) => handleChange('type', value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemple.com"
                required
              />
              
              <Input
                label="Téléphone *"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
                required
              />
            </div>

            <Input
              label="Adresse"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          {/* Professional-specific fields */}
          {formData.type === 'professional' && (
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-medium text-foreground">Informations entreprise</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Personne de contact"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder="Nom du contact principal"
                />
                
                <Select
                  label="Taille de l'entreprise"
                  options={companySizeOptions}
                  value={formData.companySize}
                  onChange={(value) => handleChange('companySize', value)}
                  placeholder="Sélectionner la taille"
                />
              </div>
            </div>
          )}

          {/* Communication Preferences */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="font-medium text-foreground">Préférences de communication</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {preferenceOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handlePreferenceToggle(option.value)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.preferences.includes(option.value)
                      ? 'border-primary bg-primary/10' :'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon 
                      name={formData.preferences.includes(option.value) ? 'CheckCircle' : 'Circle'} 
                      size={16} 
                      color={formData.preferences.includes(option.value) ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} 
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
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
              iconName="Save"
              iconPosition="left"
            >
              {client ? 'Mettre à jour' : 'Créer le client'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientModal;