import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import CompanyInfoModal from './CompanyInfoModal';
import Personalization from './Personalization';
import FinancialConfig from './FinancialConfig';
import ElectronicSignatureModal from './ElectronicSignatureModal';
import { loadCompanyInfo, getDefaultCompanyInfo } from '../../../services/companyInfoService';

const QuotePreview = ({ 
  selectedClient, 
  tasks, 
  files, 
  onPrevious, 
  onSave, 
  onSend 
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile
  
  // Company Information
  const [companyInfo, setCompanyInfo] = useState(getDefaultCompanyInfo());

  // Customization
  const [customization, setCustomization] = useState({
    template: 'modern',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af'
    },
    vat: {
      enabled: false,
      rate: 21
    }
  });

  // Financial Configuration
  const [financialConfig, setFinancialConfig] = useState({
    showVAT: false,
    vatRate: 21,
    advancePayment: false,
    advanceAmount: '',
    marketingBanner: false,
    marketingMessage: '',
    defaultConditions: 'Devis valable 30 jours. Paiement à 30 jours. TVA en sus si applicable.'
  });

  // Load saved company info on component mount
  useEffect(() => {
    const savedCompanyInfo = loadCompanyInfo();
    if (savedCompanyInfo) {
      setCompanyInfo(savedCompanyInfo);
    }
  }, []);

  const handleCompanyInfoSave = (info) => {
    setCompanyInfo(info);
  };

  const handleCustomizationChange = (field, value) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialConfigChange = (field, value) => {
    setFinancialConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSignature = (signatureData) => {
    console.log('Quote signed:', signatureData);
    // Here you would typically save the signature data
  };

  const totalPrice = tasks.reduce((sum, task) => {
    const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
      matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + task.price + taskMaterialsTotal;
  }, 0);

  const vatAmount = financialConfig.showVAT ? (totalPrice * financialConfig.vatRate / 100) : 0;
  const totalWithVAT = totalPrice + vatAmount;
  const advanceAmount = financialConfig.advancePayment ? parseFloat(financialConfig.advanceAmount) || 0 : 0;
  const balanceAmount = totalWithVAT - advanceAmount;

  const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

  const getTemplateClasses = () => {
    switch (customization.template) {
      case 'classic':
        return 'border-2 border-gray-800 font-serif';
      case 'professional':
        return 'border border-gray-600 shadow-lg';
      case 'elegant':
        return 'border border-purple-300 shadow-xl';
      case 'minimalist':
        return 'border border-gray-400';
      default:
        return 'border border-gray-300 shadow-lg';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCompanyModal(true)}
              iconName="Building"
              iconPosition="left"
              size="sm"
            >
              Info entreprise
            </Button>
            
            <Button
              variant={activeTab === 'personalization' || activeTab === 'financial' ? 'default' : 'outline'}
              onClick={() => {
                if (activeTab === 'personalization') {
                  setActiveTab('financial');
                } else {
                  setActiveTab('personalization');
                }
              }}
              iconName={activeTab === 'personalization' ? "Sliders" : "Euro"}
              iconPosition="left"
              size="sm"
            >
              {activeTab === 'personalization' ? 'Personnaliser' : 'Masquer'}
            </Button>
            
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              size="sm"
            >
              Télécharger PDF
            </Button>
            
            <Button
              variant="outline"
              iconName="Share"
              iconPosition="left"
              size="sm"
            >
              Créer lien public
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSignatureModal(true)}
              iconName="PenTool"
              iconPosition="left"
              size="sm"
            >
              Signature électronique
            </Button>
          </div>
          
          <div className="flex space-x-1 ml-2">
                  <button
              onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
              className="p-2 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
              <Icon name={previewMode === 'mobile' ? "Monitor" : "Smartphone"} size={14} />
            </button>
          </div>
              </div>
            </div>
            
      {/* Quote Preview - Full Width */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Eye" size={20} className="mr-2" />
          Aperçu du devis
        </h3>
        
        {/* Personalization Controls - Top of Quote Preview */}
        {activeTab === 'personalization' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Colors */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Couleurs</label>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: customization.colors?.primary || '#3b82f6' }}
                    />
                <input
                      type="text"
                      value={customization.colors?.primary || '#3b82f6'}
                      onChange={(e) => handleCustomizationChange('colors', { ...customization.colors, primary: e.target.value })}
                      className="w-20 text-xs p-1 border border-border rounded"
                />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: customization.colors?.secondary || '#1e40af' }}
                    />
                    <input
                      type="text"
                      value={customization.colors?.secondary || '#1e40af'}
                      onChange={(e) => handleCustomizationChange('colors', { ...customization.colors, secondary: e.target.value })}
                      className="w-20 text-xs p-1 border border-border rounded"
                    />
                  </div>
                </div>
              </div>
              
              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Modèle</label>
                <select
                  value={customization.template}
                  onChange={(e) => handleCustomizationChange('template', e.target.value)}
                  className="w-full p-2 text-sm border border-border rounded bg-white"
                >
                  <option value="modern">Moderne</option>
                  <option value="professional">Professionnel</option>
                  <option value="elegant">Élégant</option>
                  <option value="classic">Classique</option>
                  <option value="minimalist">Minimaliste</option>
                </select>
              </div>
              
              {/* VAT */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">TVA</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customization.vat?.enabled || false}
                    onChange={(e) => handleCustomizationChange('vat', { ...customization.vat, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Afficher TVA</span>
                  {customization.vat?.enabled && (
                    <input
                      type="number"
                      value={customization.vat?.rate || 21}
                      onChange={(e) => handleCustomizationChange('vat', { ...customization.vat, rate: parseFloat(e.target.value) })}
                      className="w-16 p-1 text-sm border border-border rounded"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Financial Configuration Controls - Top of Quote Preview */}
        {activeTab === 'financial' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* VAT Display */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">TVA</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={financialConfig.showVAT || false}
                    onChange={() => handleFinancialConfigChange('showVAT', !financialConfig.showVAT)}
                    className="rounded"
                  />
                  <span className="text-sm">Afficher TVA</span>
                </div>
              </div>
              
              {/* Advance Payment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Acompte</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={financialConfig.advancePayment || false}
                    onChange={() => handleFinancialConfigChange('advancePayment', !financialConfig.advancePayment)}
                    className="rounded"
                  />
                  <span className="text-sm">Demander acompte</span>
              </div>
            </div>
            
              {/* Marketing Banner */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bannière</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={financialConfig.marketingBanner || false}
                    onChange={() => handleFinancialConfigChange('marketingBanner', !financialConfig.marketingBanner)}
                    className="rounded"
                  />
                  <span className="text-sm">Offre promo</span>
                </div>
              </div>
              
              {/* VAT Rate */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Taux TVA (%)</label>
                <input
                  type="number"
                  value={financialConfig.vatRate || 21}
                  onChange={(e) => handleFinancialConfigChange('vatRate', parseFloat(e.target.value))}
                  className="w-20 p-1 text-sm border border-border rounded"
                  min="0"
                  max="100"
                  step="0.1"
              />
              </div>
            </div>
          </div>
        )}
        
        <div className={`bg-white rounded-lg shadow-lg ${previewMode === 'mobile' ? 'max-w-sm mx-auto p-4' : 'w-full p-8'}`}>
          <div className={`w-full bg-white ${getTemplateClasses()} ${previewMode === 'mobile' ? 'text-sm' : ''}`}>
                {/* Header */}
            <div className={`flex justify-between items-start mb-8 ${previewMode === 'mobile' ? 'p-4 flex-col space-y-4' : 'p-8'}`}>
                  <div className="flex items-center space-x-4">
                {companyInfo.logo ? (
                  <div className={`${previewMode === 'mobile' ? 'w-12 h-12' : 'w-16 h-16'}`}>
                        <Image
                      src={companyInfo.logo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                ) : (
                  <div 
                    className={`flex items-center justify-center text-white font-bold ${previewMode === 'mobile' ? 'w-12 h-12 text-xs' : 'w-16 h-16'}`}
                    style={{ backgroundColor: customization.colors.primary }}
                  >
                    LOGO
                      </div>
                    )}
                    <div>
                      <h1 
                    className={`font-bold ${previewMode === 'mobile' ? 'text-lg' : 'text-2xl'}`}
                    style={{ color: customization.colors.primary }}
                      >
                    {companyInfo.name}
                      </h1>
                  <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>Artisan professionnel</p>
                    </div>
                  </div>
              <div className={`text-right ${previewMode === 'mobile' ? 'text-center w-full' : ''}`}>
                    <h2 
                  className={`font-semibold ${previewMode === 'mobile' ? 'text-base' : 'text-xl'}`}
                  style={{ color: customization.colors.primary }}
                    >
                  DEVIS N° {quoteNumber}
                    </h2>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>Date: {currentDate}</p>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>Valable jusqu'au: {validUntil}</p>
                  </div>
                </div>
                
            {/* Company Information */}
            <div className={`grid gap-8 mb-8 ${previewMode === 'mobile' ? 'grid-cols-1 px-4' : 'grid-cols-2 px-8'}`}>
                  <div>
                <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>CLIENT</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>
                      <p className="font-medium">{selectedClient?.label?.split(' - ')[0] || 'Client'}</p>
                      {selectedClient?.company && <p>{selectedClient.company}</p>}
                      <p>{selectedClient?.email || 'email@client.com'}</p>
                      <p>{selectedClient?.phone || '06 12 34 56 78'}</p>
                      {selectedClient?.address && <p>{selectedClient.address}</p>}
                    </div>
                  </div>
              <div className={`${previewMode === 'mobile' ? 'text-left' : 'text-right'}`}>
                <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>VOTRE ENTREPRISE</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>
                  <p>{companyInfo.address}</p>
                  <p>{companyInfo.postalCode} {companyInfo.city}</p>
                  <p>{companyInfo.email}</p>
                  <p>{companyInfo.phone}</p>
                  <p>TVA: {companyInfo.vatNumber}</p>
                    </div>
                  </div>
                </div>

            {/* Project Info */}
            <div className={`mb-8 ${previewMode === 'mobile' ? 'px-4' : 'px-8'}`}>
              <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>PROJET: d</h3>
              <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`}>ddd</p>
            </div>

            {/* Marketing Banner */}
            {financialConfig.marketingBanner && financialConfig.marketingMessage && (
              <div className={`mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg ${previewMode === 'mobile' ? 'mx-4' : 'mx-8'}`}>
                <p className={`text-yellow-800 font-medium text-center ${previewMode === 'mobile' ? 'text-xs' : ''}`}>
                  {financialConfig.marketingMessage}
                </p>
              </div>
            )}
                
                {/* Tasks Table */}
            <div className={`mb-8 ${previewMode === 'mobile' ? 'px-4' : 'px-8'}`}>
              <h3 className={`font-semibold text-gray-800 mb-4 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>DÉTAIL DES PRESTATIONS</h3>
              <div className={`${previewMode === 'mobile' ? 'overflow-x-auto' : ''}`}>
                <table className={`w-full border-collapse ${previewMode === 'mobile' ? 'text-xs min-w-[500px]' : ''}`}>
                    <thead>
                    <tr style={{ backgroundColor: `${customization.colors.primary}15` }}>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-left' : 'p-3 text-left'}`}>Description</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-center w-16' : 'p-3 text-center w-24'}`}>Durée (h)</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-20' : 'p-3 text-right w-32'}`}>Prix unitaire</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-center w-20' : 'p-3 text-center w-32'}`}>Matériaux</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-20' : 'p-3 text-right w-32'}`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => {
                        const taskMaterialsTotal = task.materials.reduce((sum, mat) => 
                          sum + (mat.price * parseFloat(mat.quantity)), 0);
                        const taskTotal = task.price + taskMaterialsTotal;
                        
                        return (
                        <tr key={task.id}>
                          <td className={`border border-gray-300 ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>
                                <div className="font-medium">{task.description}</div>
                          </td>
                          <td className={`border border-gray-300 text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{task.duration}</td>
                          <td className={`border border-gray-300 text-right ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{task.price}€/h</td>
                          <td className={`border border-gray-300 text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>
                            {task.materials.length > 0 ? task.materials.map(m => m.name).join(', ') : '-'}
                              </td>
                          <td className={`border border-gray-300 text-right ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{taskTotal.toFixed(2)}€</td>
                            </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                    <tr style={{ backgroundColor: `${customization.colors.primary}25` }}>
                      <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4">SOUS-TOTAL HT:</td>
                      <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{totalPrice.toFixed(2)}€</td>
                    </tr>
                    {financialConfig.showVAT && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}25` }}>
                        <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4">TOTAL HT:</td>
                        <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{totalPrice.toFixed(2)}€</td>
                      </tr>
                    )}
                    {financialConfig.showVAT && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}25` }}>
                        <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4">TVA ({financialConfig.vatRate}%):</td>
                        <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{vatAmount.toFixed(2)}€</td>
                      </tr>
                    )}
                    {financialConfig.advancePayment && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}25` }}>
                        <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4">ACOMPTE À LA COMMANDE:</td>
                        <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{advanceAmount.toFixed(2)}€</td>
                      </tr>
                    )}
                    {financialConfig.advancePayment && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}25` }}>
                        <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4">SOLDE À LA LIVRAISON:</td>
                        <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`}>{balanceAmount.toFixed(2)}€</td>
                      </tr>
                    )}
                    </tfoot>
                  </table>
              </div>
            </div>

            {/* General Conditions */}
            <div className={`mb-8 ${previewMode === 'mobile' ? 'px-4' : 'px-8'}`}>
              <h3 className={`font-semibold text-gray-800 mb-4 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>CONDITIONS GÉNÉRALES</h3>
              <div className={`text-gray-600 whitespace-pre-wrap ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>
                {financialConfig.defaultConditions}
              </div>
            </div>

            {/* Signatures */}
            <div className={`grid gap-8 ${previewMode === 'mobile' ? 'grid-cols-1 px-4 pb-4' : 'grid-cols-2 px-8 pb-8'}`}>
              <div>
                <h4 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>Signature de l'entreprise:</h4>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 min-h-[80px]'}`}>
                  <p className={`text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>Zone de signature électronique</p>
                </div>
                <p className={`text-gray-600 mt-2 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>Date: _______________</p>
              </div>
              <div>
                <h4 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`}>Bon pour accord client:</h4>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 min-h-[80px]'}`}>
                  <p className={`text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>Signature du client</p>
                </div>
                <p className={`text-gray-600 mt-2 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>Date: _______________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions Section - Below Quote Preview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Programmer l'envoi:
            </label>
            <input
              type="datetime-local"
              defaultValue="2025-07-26T12:30"
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center bg-card border border-border rounded-lg p-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Précédent
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onSave({ customization, financialConfig, companyInfo })}
            iconName="Save"
            iconPosition="left"
            size="sm"
          >
            Brouillon
          </Button>
          <Button
            onClick={() => onSend({ customization, financialConfig, companyInfo })}
            iconName="Send"
            iconPosition="left"
            size="sm"
          >
            Envoyer
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CompanyInfoModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSave={handleCompanyInfoSave}
        initialData={companyInfo}
      />

      <ElectronicSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSign={handleSignature}
        quoteData={{ id: quoteNumber }}
      />
    </div>
  );
};

export default QuotePreview;