import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const Personalization = ({ customization, onCustomizationChange }) => {
  const [activeTab, setActiveTab] = useState('colors');

  const colorOptions = [
    { value: '#3b82f6', label: 'Bleu principal' },
    { value: '#1e40af', label: 'Bleu secondaire' },
    { value: '#059669', label: 'Vert émeraude' },
    { value: '#DC2626', label: 'Rouge cardinal' },
    { value: '#7C3AED', label: 'Violet royal' },
    { value: '#EA580C', label: 'Orange énergique' },
    { value: '#1F2937', label: 'Gris anthracite' }
  ];

  const templateOptions = [
    { value: 'modern', label: 'Moderne', color: '#3b82f6' },
    { value: 'professional', label: 'Professionnel', color: '#059669' },
    { value: 'elegant', label: 'Élégant', color: '#7C3AED' },
    { value: 'classic', label: 'Classique', color: '#DC2626' },
    { value: 'minimalist', label: 'Minimaliste', color: '#1F2937' }
  ];

  const handleColorChange = (type, color) => {
    onCustomizationChange('colors', {
      ...customization.colors,
      [type]: color
    });
  };

  const handleTemplateChange = (template) => {
    onCustomizationChange('template', template);
  };

  const handleVATChange = (field, value) => {
    onCustomizationChange('vat', {
      ...customization.vat,
      [field]: value
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Icon name="Palette" size={20} className="mr-2" />
        Personnalisation
      </h3>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'colors'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Couleurs
        </button>
        <button
          onClick={() => setActiveTab('vat')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'vat'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          TVA
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Modèles
        </button>
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Couleurs personnalisées</h4>
            
            {/* Primary Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Couleur principale
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: customization.colors?.primary || '#3b82f6' }}
                />
                <Input
                  type="text"
                  value={customization.colors?.primary || '#3b82f6'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: customization.colors?.secondary || '#1e40af' }}
                />
                <Input
                  type="text"
                  value={customization.colors?.secondary || '#1e40af'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1"
                  placeholder="#1e40af"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Couleurs prédéfinies
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange('primary', color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      customization.colors?.primary === color.value
                        ? 'border-foreground scale-110'
                        : 'border-border hover:border-foreground'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VAT Tab */}
      {activeTab === 'vat' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Configuration TVA</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Afficher la TVA
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Calcul automatique TVA {customization.vat?.rate || 21}%
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customization.vat?.enabled || false}
                    onChange={(e) => handleVATChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {customization.vat?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Taux de TVA (%)
                  </label>
                  <Input
                    type="number"
                    value={customization.vat?.rate || 21}
                    onChange={(e) => handleVATChange('rate', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="21"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Modèles de devis</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {templateOptions.map((template) => (
                <button
                  key={template.value}
                  onClick={() => handleTemplateChange(template.value)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    customization.template === template.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: template.color }}
                      />
                      <span className="font-medium text-foreground">{template.label}</span>
                    </div>
                    {customization.template === template.value && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Sélectionné
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personalization; 