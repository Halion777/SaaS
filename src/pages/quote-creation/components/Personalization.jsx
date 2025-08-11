import React from 'react';

const QuoteTemplates = [
  { 
    id: 'minimaliste', 
    name: 'Minimaliste', 
    primaryColor: '#374151',
    secondaryColor: '#1f2937',
    description: 'Gris minimaliste et épuré'
  },
  { 
    id: 'blanc', 
    name: 'Blanc', 
    primaryColor: '#FF6B00',
    secondaryColor: '#FF8533',
    description: 'Orange vibrant sur fond blanc'
  },
  { 
    id: 'navy', 
    name: 'Navy', 
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
    description: 'Bleu marine élégant et professionnel'
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    primaryColor: '#166534',
    secondaryColor: '#22c55e',
    description: 'Vert forêt naturel et apaisant'
  }
];

const Personalization = ({ 
  selectedTemplate, 
  onTemplateChange, 
  primaryColor, 
  secondaryColor, 
  onColorChange 
}) => {
  const handleTemplateChange = (templateId) => {
    const template = QuoteTemplates.find(t => t.id === templateId);
    if (template) {
      onTemplateChange(templateId);
      onColorChange('primary', template.primaryColor);
      onColorChange('secondary', template.secondaryColor);
    }
  };

  const handleResetColors = () => {
    // Reset template to minimaliste as default
    const minimalisteTemplate = QuoteTemplates.find(t => t.id === 'minimaliste');
    onTemplateChange('minimaliste');
    onColorChange('primary', minimalisteTemplate.primaryColor);
    onColorChange('secondary', minimalisteTemplate.secondaryColor);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quote Templates Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Schémas de couleurs</h3>
        <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
          Choisissez un schéma de couleurs pour les éléments de votre devis. Le fond restera blanc.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {QuoteTemplates.map((template) => (
            <div 
              key={template.id}
              className={`
                bg-white border-2 rounded-lg p-3 sm:p-4 cursor-pointer relative
                ${selectedTemplate === template.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                transition-all duration-200
              `}
              onClick={() => handleTemplateChange(template.id)}
            >
              {/* Color Preview */}
              <div className="flex space-x-1 mb-2">
                <div 
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: template.primaryColor }}
                />
                <div 
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: template.secondaryColor }}
                />
              </div>
              
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                  {template.name}
                </div>
                <div className="text-xs text-gray-500">
                  {template.description}
                </div>
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Customization Section */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Couleurs personnalisées</h3>
          <button
            onClick={handleResetColors}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset template and colors to default"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Couleur principale
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => onColorChange('primary', e.target.value)}
                className="w-10 h-10 sm:w-12 sm:h-12 p-1 border rounded-lg"
              />
              <input 
                type="text" 
                value={primaryColor}
                onChange={(e) => onColorChange('primary', e.target.value)}
                className="flex-1 p-2 text-xs sm:text-sm border rounded-lg"
                placeholder="#3b82f6"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Utilisée pour les titres et éléments principaux
            </p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Couleur secondaire
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={secondaryColor}
                onChange={(e) => onColorChange('secondary', e.target.value)}
                className="w-10 h-10 sm:w-12 sm:h-12 p-1 border rounded-lg"
              />
              <input 
                type="text" 
                value={secondaryColor}
                onChange={(e) => onColorChange('secondary', e.target.value)}
                className="flex-1 p-2 text-xs sm:text-sm border rounded-lg"
                placeholder="#1e40af"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Utilisée pour les sous-titres et éléments secondaires
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personalization; 