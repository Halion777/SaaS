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
  const [activeTab, setActiveTab] = useState('personalization');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile
  const [signatureData, setSignatureData] = useState(null);
  
  // Company Information
  const [companyInfo, setCompanyInfo] = useState(getDefaultCompanyInfo());

  // Customization
  const [customization, setCustomization] = useState({
    template: 'moderne',
    colors: {
      primary: '#ffffff',
      secondary: '#ffffff'
    }
  });

  // Financial Configuration
  const [financialConfig, setFinancialConfig] = useState({
    vatConfig: {
      display: false,
      rate: 21
    },
    advanceConfig: {
      enabled: false,
      amount: ''
    },
    marketingBannerConfig: {
      enabled: false,
      message: ''
    },
    defaultConditions: {
      language: 'FR',
      text: 'Conditions générales:\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an'
    }
  });

  // Load saved company info on component mount
  useEffect(() => {
    const savedCompanyInfo = loadCompanyInfo();
    if (savedCompanyInfo) {
      setCompanyInfo(savedCompanyInfo);
    }
    
    // Load saved signature data if available
    const savedSignatureData = localStorage.getItem('quote-signature-data');
    if (savedSignatureData) {
      try {
        const parsedSignatureData = JSON.parse(savedSignatureData);
        setSignatureData(parsedSignatureData);
      } catch (error) {
        console.error('Error loading saved signature data:', error);
      }
    }
  }, []);

  const handleCompanyInfoSave = (info) => {
    setCompanyInfo(info);
  };

  const handleCustomizationChange = (field, value) => {
    if (field === 'template') {
      setCustomization(prev => ({ ...prev, template: value }));
    } else if (field === 'colors') {
      setCustomization(prev => ({ 
        ...prev, 
        colors: { ...prev.colors, ...value }
      }));
    }
  };

  const handleFinancialConfigChange = (field, value) => {
    if (field === 'vatConfig') {
      setFinancialConfig(prev => ({ 
        ...prev, 
        vatConfig: { ...prev.vatConfig, ...value }
      }));
    } else if (field === 'advanceConfig') {
      setFinancialConfig(prev => ({ 
        ...prev, 
        advanceConfig: { ...prev.advanceConfig, ...value }
      }));
    } else if (field === 'marketingBannerConfig') {
      setFinancialConfig(prev => ({ 
        ...prev, 
        marketingBannerConfig: { ...prev.marketingBannerConfig, ...value }
      }));
    } else if (field === 'defaultConditions') {
      if (typeof value === 'string') {
        // Handle language change
        setFinancialConfig(prev => ({ 
          ...prev, 
          defaultConditions: { 
            language: value,
            text: prev.defaultConditions.text 
          }
        }));
      } else if (value && typeof value === 'object' && value.language && value.text) {
        // Handle both language and text change
        setFinancialConfig(prev => ({ 
          ...prev, 
          defaultConditions: value
        }));
      } else {
        // Handle text change only
        setFinancialConfig(prev => ({ 
          ...prev, 
          defaultConditions: { 
            language: prev.defaultConditions.language,
            text: value 
          }
        }));
      }
    }
  };

  const handleSignature = (signatureData) => {
    console.log('Quote signed:', signatureData);
    setSignatureData(signatureData);
    
    // Save signature data to localStorage for persistence
    try {
      localStorage.setItem('quote-signature-data', JSON.stringify(signatureData));
    } catch (error) {
      console.error('Error saving signature data to localStorage:', error);
    }
  };

  // Calculate totals
  const totalPrice = tasks.reduce((sum, task) => {
    const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
      matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + task.price + taskMaterialsTotal;
  }, 0);

  const vatAmount = financialConfig.vatConfig.display ? (totalPrice * financialConfig.vatConfig.rate / 100) : 0;
  const totalWithVAT = totalPrice + vatAmount;
  const advanceAmount = financialConfig.advanceConfig.enabled ? (parseFloat(financialConfig.advanceConfig.amount) || 0) : 0;
  const balanceAmount = totalWithVAT - advanceAmount;

  const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

  const getTemplateClasses = () => {
    switch (customization.template) {
      case 'moderne':
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
      case 'professionnel':
        return 'bg-gradient-to-r from-green-500 to-green-700 text-white';
      case 'elegant':
        return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
      case 'classique':
        return 'bg-gradient-to-r from-red-500 to-red-700 text-white';
      case 'minimaliste':
        return 'bg-gradient-to-r from-gray-500 to-gray-700 text-white';
      case 'blanc':
        return 'bg-white border-2 border-gray-300 text-gray-800';
      case 'noir':
        return 'bg-black text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
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
              key={activeTab}
              variant={activeTab === 'personalization' || activeTab === 'financial' ? 'default' : 'outline'}
              onClick={() => {
                if (activeTab === 'personalization') {
                  setActiveTab('financial');
                } else {
                  setActiveTab('personalization');
                }
              }}
              iconName="Settings"
              iconPosition="left"
              size="sm"
            >
              {activeTab === 'personalization' ? 'Masquer' : 'Personnaliser'}
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
        

        
        {/* Configuration Panels - Hidden by default, shown when activeTab changes */}
        {(activeTab === 'personalization' || activeTab === 'financial') && (
          <div className="mt-6 bg-card border border-border rounded-lg p-6">
            {activeTab === 'personalization' && (
              <Personalization
                selectedTemplate={customization.template}
                onTemplateChange={(template) => handleCustomizationChange('template', template)}
                primaryColor={customization.colors.primary}
                secondaryColor={customization.colors.secondary}
                onColorChange={(type, color) => handleCustomizationChange('colors', { [type]: color })}
              />
            )}
            
            {activeTab === 'financial' && (
              <FinancialConfig
                vatConfig={financialConfig.vatConfig}
                onVATConfigChange={(field, value) => handleFinancialConfigChange('vatConfig', { [field]: value })}
                advanceConfig={financialConfig.advanceConfig}
                onAdvanceConfigChange={(field, value) => handleFinancialConfigChange('advanceConfig', { [field]: value })}
                marketingBannerConfig={financialConfig.marketingBannerConfig}
                onMarketingBannerConfigChange={(field, value) => handleFinancialConfigChange('marketingBannerConfig', { [field]: value })}
                defaultConditions={financialConfig.defaultConditions}
                onDefaultConditionsChange={(language, text) => {
                  if (text) {
                    handleFinancialConfigChange('defaultConditions', { language, text });
                  } else {
                    handleFinancialConfigChange('defaultConditions', language);
                  }
                }}
              />
            )}
          </div>
        )}

        <div className={`${getTemplateClasses()} rounded-lg shadow-lg ${previewMode === 'mobile' ? 'max-w-sm mx-auto p-4' : 'w-full p-8'}`}>
          <div className={`w-full ${previewMode === 'mobile' ? 'text-sm' : ''}`}>
                {/* Header */}
            <div className={`flex justify-between items-start mb-8 ${previewMode === 'mobile' ? 'p-4 flex-col space-y-4' : 'p-8'}`}>
              <div className={`flex items-center space-x-4 ${previewMode === 'mobile' ? 'w-full' : ''}`}>
                {companyInfo.logo ? (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    LOGO
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
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
                  <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>Artisan professionnel</p>
                  {financialConfig.marketingBannerConfig.enabled && financialConfig.marketingBannerConfig.message && (
                    <p className={`text-sm font-medium mt-2 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>
                      {financialConfig.marketingBannerConfig.message}
                    </p>
                  )}
                    </div>
                  </div>
              <div className={`text-right ${previewMode === 'mobile' ? 'text-center w-full' : ''}`}>
                    <h2 
                  className={`font-semibold ${previewMode === 'mobile' ? 'text-base' : 'text-xl'}`}
                  style={{ color: customization.colors.primary }}
                    >
                  DEVIS N° {quoteNumber}
                    </h2>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>Date: {currentDate}</p>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>Valable jusqu'au: {validUntil}</p>
                  </div>
                </div>
                
            {/* Company Information */}
            <div className={`grid gap-8 mb-8 ${previewMode === 'mobile' ? 'grid-cols-1 px-4' : 'grid-cols-2 px-8'}`}>
                  <div>
                <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>CLIENT</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>
                      <p className="font-medium">{selectedClient?.label?.split(' - ')[0] || 'Client'}</p>
                      {selectedClient?.company && <p>{selectedClient.company}</p>}
                      <p>{selectedClient?.email || 'email@client.com'}</p>
                      <p>{selectedClient?.phone || '06 12 34 56 78'}</p>
                      {selectedClient?.address && <p>{selectedClient.address}</p>}
                    </div>
                  </div>
              <div className={`${previewMode === 'mobile' ? 'text-left' : 'text-right'}`}>
                <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>VOTRE ENTREPRISE</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>
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
              <h3 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>PROJET: d</h3>
              <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: customization.colors.secondary }}>ddd</p>
            </div>


                
                {/* Tasks Table */}
            <div className={`mb-8 ${previewMode === 'mobile' ? 'px-4' : 'px-8'}`}>
              <h3 className={`font-semibold text-gray-800 mb-4 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>DÉTAIL DES PRESTATIONS</h3>
              <div className={`${previewMode === 'mobile' ? 'overflow-x-auto' : ''}`}>
                <table className={`w-full border-collapse ${previewMode === 'mobile' ? 'text-xs min-w-[500px]' : ''}`}>
                    <thead>
                      <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                        <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-left' : 'p-3 text-left'}`} style={{ color: customization.colors.primary }}>Description</th>
                        <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-center w-16' : 'p-3 text-center w-24'}`} style={{ color: customization.colors.primary }}>Durée (h)</th>
                        <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-20' : 'p-3 text-right w-32'}`} style={{ color: customization.colors.primary }}>Prix unitaire</th>
                        <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-center w-20' : 'p-3 text-center w-32'}`} style={{ color: customization.colors.primary }}>Matériaux</th>
                        <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-20' : 'p-3 text-right w-32'}`} style={{ color: customization.colors.primary }}>Total</th>
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
                              <div className="font-medium" style={{ color: customization.colors.secondary }}>{task.description}</div>
                            </td>
                            <td className={`border border-gray-300 text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{task.duration}</td>
                            <td className={`border border-gray-300 text-right ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{task.price}€/h</td>
                            <td className={`border border-gray-300 text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>
                              {task.materials.length > 0 ? task.materials.map(m => m.name).join(', ') : '-'}
                              </td>
                            <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{taskTotal.toFixed(2)}€</td>
                            </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                        <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4" style={{ color: customization.colors.primary }}>SOUS-TOTAL HT:</td>
                        <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{totalPrice.toFixed(2)}€</td>
                      </tr>
                      {financialConfig.vatConfig.display && (
                        <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                          <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4" style={{ color: customization.colors.primary }}>TOTAL HT:</td>
                          <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{totalPrice.toFixed(2)}€</td>
                        </tr>
                      )}
                      {financialConfig.vatConfig.display && (
                        <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                          <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4" style={{ color: customization.colors.primary }}>TVA ({financialConfig.vatConfig.rate}%):</td>
                          <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{vatAmount.toFixed(2)}€</td>
                        </tr>
                      )}
                      {financialConfig.advanceConfig.enabled && (
                        <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                          <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4" style={{ color: customization.colors.primary }}>ACOMPTE À LA COMMANDE:</td>
                          <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{advanceAmount.toFixed(2)}€</td>
                        </tr>
                      )}
                      {financialConfig.advanceConfig.enabled && (
                        <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                          <td className={`border border-gray-300 font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} colSpan="4" style={{ color: customization.colors.primary }}>SOLDE À LA LIVRAISON:</td>
                          <td className={`border border-gray-300 text-right font-bold ${previewMode === 'mobile' ? 'p-2' : 'p-3'}`} style={{ color: customization.colors.secondary }}>{balanceAmount.toFixed(2)}€</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
              </div>
            </div>

            {/* General Conditions */}
            <div className={`mb-8 ${previewMode === 'mobile' ? 'px-4' : 'px-8'}`}>
              <h3 className={`font-semibold text-gray-800 mb-4 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>CONDITIONS GÉNÉRALES</h3>
              <div className={`text-gray-600 whitespace-pre-wrap ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>
                {financialConfig.defaultConditions.text}
              </div>
            </div>

            {/* Signatures */}
            <div className={`grid gap-8 ${previewMode === 'mobile' ? 'grid-cols-1 px-4 pb-4' : 'grid-cols-2 px-8 pb-8'}`}>
              <div>
                <h4 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>Signature de l'entreprise:</h4>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 min-h-[80px]'}`}>
                  <p className={`text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>Zone de signature électronique</p>
                </div>
                <p className={`text-gray-600 mt-2 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>
                  Date: _______________
                </p>
              </div>
              <div>
                <h4 className={`font-semibold text-gray-800 mb-2 ${previewMode === 'mobile' ? 'text-sm' : ''}`} style={{ color: customization.colors.primary }}>Bon pour accord client:</h4>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 min-h-[80px]'}`}>
                  {signatureData?.signature ? (
                    <div className="w-full">
                      <img 
                        src={signatureData.signature} 
                        alt="Signature du client" 
                        className="max-h-12 max-w-full mx-auto"
                      />
                      <p className={`text-xs text-gray-500 mt-1 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>
                        Signé le {new Date(signatureData.signedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ) : (
                    <p className={`text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>Signature du client</p>
                  )}
                </div>
                <p className={`text-gray-600 mt-2 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`} style={{ color: customization.colors.secondary }}>
                  Date: {signatureData?.signedAt ? new Date(signatureData.signedAt).toLocaleDateString('fr-FR') : '_______________'}
                </p>
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
            onClick={() => onSave({ customization, financialConfig, companyInfo, signatureData })}
            iconName="Save"
            iconPosition="left"
            size="sm"
          >
            Brouillon
          </Button>
          <Button
            onClick={() => onSend({ customization, financialConfig, companyInfo, signatureData })}
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