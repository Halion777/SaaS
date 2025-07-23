import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const QuotePreview = ({ 
  selectedClient, 
  tasks, 
  files, 
  onPrevious, 
  onSave, 
  onSend 
}) => {
  const [template, setTemplate] = useState('modern');
  const [customization, setCustomization] = useState({
    primaryColor: '#1E40AF',
    logo: null,
    companyName: 'Havitam Artisan Pro',
    legalMentions: `Devis valable 30 jours. TVA non applicable, art. 293 B du CGI.\nRèglement à 30 jours fin de mois.\nEn cas de retard de paiement, pénalités de 3 fois le taux légal.`
  });

  const templateOptions = [
    { value: 'classic', label: 'Classique', description: 'Design traditionnel et sobre' },
    { value: 'modern', label: 'Moderne', description: 'Design contemporain et épuré' },
    { value: 'compact', label: 'Compact', description: 'Format condensé pour économiser l\'espace' }
  ];

  const colorOptions = [
    { value: '#1E40AF', label: 'Bleu professionnel' },
    { value: '#059669', label: 'Vert émeraude' },
    { value: '#DC2626', label: 'Rouge cardinal' },
    { value: '#7C3AED', label: 'Violet royal' },
    { value: '#EA580C', label: 'Orange énergique' },
    { value: '#1F2937', label: 'Gris anthracite' }
  ];

  const totalPrice = tasks.reduce((sum, task) => {
    const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
      matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + task.price + taskMaterialsTotal;
  }, 0);

  const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

  const handleCustomizationChange = (field, value) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const logoUrl = URL.createObjectURL(file);
      handleCustomizationChange('logo', logoUrl);
    }
  };

  const getTemplateClasses = () => {
    switch (template) {
      case 'classic':
        return 'border-2 border-gray-800 font-serif';
      case 'compact':
        return 'border border-gray-400 text-sm';
      default:
        return 'border border-gray-300 shadow-lg';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Eye" size={24} color="var(--color-primary)" className="mr-3" />
          Aperçu et personnalisation
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customization Panel */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-foreground mb-3">Modèle de devis</h3>
              <Select
                options={templateOptions}
                value={template}
                onChange={setTemplate}
                placeholder="Choisir un modèle"
              />
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">Couleur principale</h3>
              <Select
                options={colorOptions}
                value={customization.primaryColor}
                onChange={(value) => handleCustomizationChange('primaryColor', value)}
                placeholder="Choisir une couleur"
              />
              <div className="mt-2 flex space-x-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleCustomizationChange('primaryColor', color.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      customization.primaryColor === color.value ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-3">Logo de l'entreprise</h3>
              <div className="space-y-3">
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
                  {customization.logo ? 'Changer le logo' : 'Ajouter un logo'}
                </Button>
                {customization.logo && (
                  <div className="w-20 h-20 border border-border rounded-lg overflow-hidden">
                    <Image
                      src={customization.logo}
                      alt="Logo entreprise"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <Input
              label="Nom de l'entreprise"
              type="text"
              value={customization.companyName}
              onChange={(e) => handleCustomizationChange('companyName', e.target.value)}
            />
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mentions légales
              </label>
              <textarea
                value={customization.legalMentions}
                onChange={(e) => handleCustomizationChange('legalMentions', e.target.value)}
                rows={4}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Mentions légales et conditions..."
              />
            </div>
          </div>
          
          {/* Quote Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-lg shadow-professional-lg">
              <div className={`max-w-full mx-auto bg-white p-8 ${getTemplateClasses()}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center space-x-4">
                    {customization.logo && (
                      <div className="w-16 h-16">
                        <Image
                          src={customization.logo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <h1 
                        className="text-2xl font-bold"
                        style={{ color: customization.primaryColor }}
                      >
                        {customization.companyName}
                      </h1>
                      <p className="text-gray-600">Artisan professionnel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: customization.primaryColor }}
                    >
                      DEVIS
                    </h2>
                    <p className="text-gray-600">N° {quoteNumber}</p>
                  </div>
                </div>
                
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Facturé à :</h3>
                    <div className="text-gray-600">
                      <p className="font-medium">{selectedClient?.label?.split(' - ')[0] || 'Client'}</p>
                      {selectedClient?.company && <p>{selectedClient.company}</p>}
                      <p>{selectedClient?.email || 'email@client.com'}</p>
                      <p>{selectedClient?.phone || '06 12 34 56 78'}</p>
                      {selectedClient?.address && <p>{selectedClient.address}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600">
                      <p><span className="font-medium">Date :</span> {currentDate}</p>
                      <p><span className="font-medium">Valable jusqu'au :</span> {validUntil}</p>
                    </div>
                  </div>
                </div>
                
                {/* Tasks Table */}
                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: `${customization.primaryColor}15` }}>
                        <th className="border border-gray-300 p-3 text-left font-semibold">Description</th>
                        <th className="border border-gray-300 p-3 text-center font-semibold w-20">Durée</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold w-24">Prix HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => {
                        const taskMaterialsTotal = task.materials.reduce((sum, mat) => 
                          sum + (mat.price * parseFloat(mat.quantity)), 0);
                        const taskTotal = task.price + taskMaterialsTotal;
                        
                        return (
                          <React.Fragment key={task.id}>
                            <tr>
                              <td className="border border-gray-300 p-3">
                                <div className="font-medium">{task.description}</div>
                                {task.materials.length > 0 && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    Matériaux inclus : {task.materials.map(m => m.name).join(', ')}
                                  </div>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3 text-center">{task.duration}h</td>
                              <td className="border border-gray-300 p-3 text-right">{taskTotal.toFixed(2)}€</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: `${customization.primaryColor}25` }}>
                        <td className="border border-gray-300 p-3 font-bold" colSpan="2">TOTAL HT</td>
                        <td className="border border-gray-300 p-3 text-right font-bold text-lg">
                          {totalPrice.toFixed(2)}€
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Legal Mentions */}
                <div className="text-xs text-gray-600 border-t border-gray-300 pt-4">
                  <pre className="whitespace-pre-wrap font-sans">{customization.legalMentions}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Étape précédente
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => onSave({ template, customization })}
            iconName="Save"
            iconPosition="left"
          >
            Sauvegarder le brouillon
          </Button>
          <Button
            onClick={() => onSend({ template, customization })}
            iconName="Send"
            iconPosition="left"
          >
            Envoyer le devis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;