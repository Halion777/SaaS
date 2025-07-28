import React from 'react';

const QuoteTemplates = [
  { 
    id: 'moderne', 
    name: 'Moderne', 
    color: 'bg-gradient-to-r from-[#3b82f6] to-[#1e40af]' 
  },
  { 
    id: 'professionnel', 
    name: 'Professionnel', 
    color: 'bg-green-600' 
  },
  { 
    id: 'elegant', 
    name: 'Élégant', 
    color: 'bg-purple-600' 
  },
  { 
    id: 'classique', 
    name: 'Classique', 
    color: 'bg-red-600' 
  },
  { 
    id: 'minimaliste', 
    name: 'Minimaliste', 
    color: 'bg-gray-600' 
  },
  { 
    id: 'blanc', 
    name: 'Blanc', 
    color: 'bg-white border-2 border-gray-300' 
  },
  { 
    id: 'noir', 
    name: 'Noir', 
    color: 'bg-black' 
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
    onTemplateChange(templateId);
    
    // Automatically set appropriate text colors based on template
    switch (templateId) {
      case 'blanc':
        // For white template, set dark text colors
        onColorChange('primary', '#000000'); // Black
        onColorChange('secondary', '#6b7280'); // Gray
        break;
      default:
        // For all other templates, set white text colors
        onColorChange('primary', '#ffffff'); // White
        onColorChange('secondary', '#ffffff'); // Light white
        break;
    }
  };

  const handleResetColors = () => {
    // Reset template to blanc (white) as default
    onTemplateChange('blanc');
    // Reset colors to default for blanc template
    onColorChange('primary', '#000000');
    onColorChange('secondary', '#6b7280');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quote Templates Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Modèles de devis</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {QuoteTemplates.map((template) => (
            <div 
              key={template.id}
              className={`
                ${template.color} 
                rounded-lg p-2 sm:p-3 cursor-pointer relative min-w-[80px] sm:min-w-[100px] text-center
                ${selectedTemplate === template.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
              onClick={() => handleTemplateChange(template.id)}
            >
              <div className={`text-xs sm:text-sm font-medium ${template.id === 'blanc' ? 'text-gray-800' : 'text-white'}`}>
                {template.name}
                {selectedTemplate === template.id && (
                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-xs">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personalization; 