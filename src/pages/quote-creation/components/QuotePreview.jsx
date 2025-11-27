import React, { useState, useEffect } from 'react';
import AppIcon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import CompanyInfoModal from './CompanyInfoModal';
import Personalization from './Personalization';
import FinancialConfig from './FinancialConfig';
import ElectronicSignatureModal from './ElectronicSignatureModal';
import QuoteSendModal from './QuoteSendModal';
import { loadCompanyInfo, getDefaultCompanyInfo } from '../../../services/companyInfoService';
import { getPublicUrl } from '../../../services/storageService';
import { useAuth } from '../../../context/AuthContext';
import { generatePublicShareLink, getShareLinkInfo, deactivateShareLink } from '../../../services/shareService';
import { useTranslation } from 'react-i18next';
import { createProcessingOverlay } from '../../../components/ui/ProcessingOverlay';

const QuotePreview = ({ 
  selectedClient, 
  tasks, 
  files, 
  projectInfo,
  quoteNumber,
  companyInfo: parentCompanyInfo,
  financialConfig: parentFinancialConfig,
  quoteId,
  onPrevious, 
  onSave, 
  onSend,
  onCompanyInfoChange,
  onFinancialConfigChange,
  isSaving = false
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personalization');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showQuoteSendModal, setShowQuoteSendModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile
  const [signatureData, setSignatureData] = useState(null);
  // PDF generation handled by QuoteSendModal
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareLinkInfo, setShareLinkInfo] = useState(null);
  // Company Information
  const [companyInfo, setCompanyInfo] = useState(parentCompanyInfo || getDefaultCompanyInfo());
  
  // Quote data
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const validUntil = projectInfo?.deadline ? 
    new Date(projectInfo.deadline).toLocaleDateString('fr-FR') : 
    '30 jours';

  // Customization
  const [customization, setCustomization] = useState({
    template: 'minimaliste',
    colors: {
      primary: '#374151',  // Dark gray (Minimaliste)
      secondary: '#1f2937' // Darker gray (Minimaliste)
    }
  });

  // Financial Configuration - must be declared before useEffects that use it
  const [financialConfig, setFinancialConfig] = useState(parentFinancialConfig || {
    vatConfig: {
      display: true,
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
      text: '\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an'
    },
    materialPriceDisplay: (localStorage.getItem('include-materials-prices') ?? 'true') === 'true'
  });

  // Material price display - derived from financialConfig
  const includeMaterialsPrices = financialConfig?.materialPriceDisplay ?? true;

  // Load saved company info on component mount - Database First Strategy
  // Company info is single per user and remains the same for all quotes, so we load it once
  // PRIORITY: Database > Storage > localStorage (fallback only)
  // Logo and signature ALWAYS come from database/storage when available
  useEffect(() => {
    const loadCompanyData = async () => {
      if (user?.id) {
        try {
          // First try to load from database (this is the source of truth)
          const { loadCompanyInfo } = await import('../../../services/companyInfoService');
          const dbCompanyInfo = await loadCompanyInfo(user.id);
          
          if (dbCompanyInfo) {
            // Merge DB company info with any locally cached assets (when DB lacks them)
            let merged = { ...dbCompanyInfo };
            
            // Ensure logo has public URL if it exists
            if (merged.logo && merged.logo.path) {
              merged.logo = {
                ...merged.logo,
                url: getPublicUrl('company-assets', merged.logo.path)
              };
            }
            
            // Ensure signature has public URL if it exists
            if (merged.signature && merged.signature.path) {
              merged.signature = {
                ...merged.signature,
                url: getPublicUrl('company-assets', merged.signature.path)
              };
            }
            


            setCompanyInfo(merged);
          } else {
            // No database record - set empty state
            setCompanyInfo({
              name: 'Votre Entreprise',
              vatNumber: '',
              address: '123 Rue de l\'Exemple',
              postalCode: '1000',
              city: 'Bruxelles',
              state: 'Bruxelles-Capitale',
              country: 'Belgique',
              phone: '+32 123 45 67 89',
              email: 'contact@entreprise.be',
              website: 'www.entreprise.be',
              logo: null,
              signature: null
            });
          }
        } catch (error) {
          console.error('Error loading company data:', error);
          
          // Set default state on error (no localStorage fallback)
          setCompanyInfo({
            name: 'Votre Entreprise',
            vatNumber: '',
            address: '123 Rue de l\'Exemple',
            postalCode: '1000',
            city: 'Bruxelles',
            state: 'Bruxelles-Capitale',
            country: 'Belgique',
            phone: '+32 123 45 67 89',
            email: 'contact@entreprise.be',
            website: 'www.entreprise.be',
            logo: null,
            signature: null
          });
        }
      }
    };

    loadCompanyData();
    
    // Update financial config when prop changes (for editing mode)
    if (parentFinancialConfig) {
      setFinancialConfig(parentFinancialConfig);
    }
    
    // Load saved client signature data if available
    const clientId = selectedClient?.id || selectedClient?.value;
    if (user?.id && clientId) {
      const savedClientSignatureData = localStorage.getItem(`client-signature-${user.id}-${clientId}`);
      if (savedClientSignatureData) {
        try {
          const parsedSignatureData = JSON.parse(savedClientSignatureData);
          setSignatureData(parsedSignatureData);
        } catch (error) {
          console.error('Error loading saved client signature data:', error);
        }
      }
    } else if (user?.id) {
      // Fallback: when editing, we persist client signature under a user-scoped key
      try {
        // First try to get client-specific signature
        const clientId = selectedClient?.id || selectedClient?.value;
        let fallback = null;
        
        if (clientId) {
          fallback = getClientSignature(user.id, clientId);
        }
        
        // If no client-specific signature, fall back to general user signature
        if (!fallback) {
          const generalSignature = localStorage.getItem(`client-signature-${user.id}`);
          if (generalSignature) {
            fallback = JSON.parse(generalSignature);
          }
        }
        
        if (fallback) {
          setSignatureData(fallback);
        }
      } catch (_) {}
    }
  }, [user?.id]);

  // Bubble up financial config changes to parent (for autosave)
  useEffect(() => {
    if (typeof onFinancialConfigChange === 'function') {
      onFinancialConfigChange(financialConfig);
    }
  }, [financialConfig, onFinancialConfigChange]);

  const handleCompanyInfoSave = (info) => {
    setCompanyInfo(info);
    

    
    // Notify parent component of changes
    if (onCompanyInfoChange) {
      onCompanyInfoChange(info);
    }
  };

  // Function to get client-specific signature from localStorage
  const getClientSignature = (userId, clientId) => {
    try {
      if (userId && clientId) {
        const signatureKey = `client-signature-${userId}-${clientId}`;
        const signatureData = localStorage.getItem(signatureKey);
        if (signatureData) {
          return JSON.parse(signatureData);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting client signature:', error);
      return null;
    }
  };

  // Function to refresh company info from database
  const refreshCompanyInfo = async () => {
    if (user?.id) {
      try {
        const { loadCompanyInfo } = await import('../../../services/companyInfoService');
        const dbCompanyInfo = await loadCompanyInfo(user.id);
        
        if (dbCompanyInfo) {
          setCompanyInfo(dbCompanyInfo);
          
          // Update cache for basic company info only
          localStorage.setItem(`company-info-${user.id}`, JSON.stringify({
            name: dbCompanyInfo.name,
            vatNumber: dbCompanyInfo.vatNumber,
            address: dbCompanyInfo.address,
            postalCode: dbCompanyInfo.postalCode,
            city: dbCompanyInfo.city,
            state: dbCompanyInfo.state,
            country: dbCompanyInfo.country,
            phone: dbCompanyInfo.phone,
            email: dbCompanyInfo.email,
            website: dbCompanyInfo.website
          }));
          
          // Clear old logo/signature from localStorage since we're using database
          localStorage.removeItem(`company-logo-${user.id}`);
          localStorage.removeItem(`company-signature-${user.id}`);
        }
      } catch (error) {
        console.error('Error refreshing company info:', error);
      }
    }
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
    } else if (field === 'materialPriceDisplay') {
      // Handle material price display toggle
      setFinancialConfig(prev => ({ 
        ...prev, 
        materialPriceDisplay: value
      }));
    }
  };

  const handleSignature = (signatureData) => {
    
    setSignatureData(signatureData);
    
    // Save signature data to localStorage for persistence
    try {
      // Save with both user ID and client ID for better organization
      const clientId = selectedClient?.id || selectedClient?.value;
      
      
      if (user?.id && clientId) {
        const key = `client-signature-${user.id}-${clientId}`;
        localStorage.setItem(key, JSON.stringify(signatureData));
       
      } else {
        console.warn('Cannot save signature: missing user ID or client ID', {
          userId: user?.id,
          clientId,
          selectedClient
        });
      }
      // Client-specific signature data is already saved above
    } catch (error) {
      console.error('Error saving signature data to localStorage:', error);
    }
  };

  // PDF generation moved to QuoteSendModal

  // Preload existing share link if any
  useEffect(() => {
    const fetchExistingShare = async () => {
      if (!quoteId) return;
      const res = await getShareLinkInfo(quoteId);
      if (res?.success && res.data) {
        const url = `${window.location.origin}/quote-share/${res.data.share_token}`;
        setShareLink(url);
        setShareLinkInfo(res.data);
      }
    };
    fetchExistingShare();
  }, [quoteId]);

  

  // Handle share link deactivation
  const handleDeactivateShareLink = async () => {
    try {
      await deactivateShareLink(quoteId);
      
      setShareLink(null);
      setShareLinkInfo(null);
    } catch (error) {
      console.error('Error deactivating share link:', error);
    }
  };

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // Auto-close share controls after copy
      setShareLink(null);
      setShareLinkInfo(null);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleOpenShareLink = () => {
    if (shareLink) window.open(shareLink, '_blank', 'noopener');
  };

  // Calculate totals
  const totalPrice = tasks.reduce((sum, task) => {
    const taskMaterialsTotal = task.materials.reduce(
      (matSum, mat) => matSum + ((parseFloat(mat.price) || 0) * (parseFloat(mat.quantity) || 0)),
      0
    );
    return sum + (parseFloat(task.price) || 0) + taskMaterialsTotal;
  }, 0);

  const vatAmount = financialConfig.vatConfig.display ? (totalPrice * financialConfig.vatConfig.rate / 100) : 0;
  const totalWithVAT = totalPrice + vatAmount;
  const advanceAmount = financialConfig.advanceConfig.enabled ? (parseFloat(financialConfig.advanceConfig.amount) || 0) : 0;
  const balanceAmount = totalWithVAT - advanceAmount;

  const displayQuoteNumber = quoteNumber || `${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  
  const getTemplateClasses = () => {
    // Return white background with subtle border and ensure readability
    return 'bg-white border border-gray-200 text-black';
  };

  // Localization helpers for small labels
  const getAppLanguage = () => {
    try {
      return (localStorage.getItem('language') || 'fr').toLowerCase();
    } catch (_) {
      return 'fr';
    }
  };
  const lang = getAppLanguage();
  const taskWord = lang.startsWith('en') ? 'Task' : lang.startsWith('nl') ? 'Taak' : t('quoteCreation.quotePreview.task', 'Tâche');
  const laborWord = lang.startsWith('en') ? 'Labor' : lang.startsWith('nl') ? 'Arbeid' : t('quoteCreation.quotePreview.labor', "Main d'œuvre");
  const materialWord = lang.startsWith('en') ? 'Material' : lang.startsWith('nl') ? 'Materiaal' : t('quoteCreation.quotePreview.material', 'Matériau');

  // Formatting helpers
  const numberLocale = lang.startsWith('en') ? 'en-GB' : lang.startsWith('nl') ? 'nl-NL' : 'fr-FR';
  const formatNumber = (value) => {
    const n = Number.isFinite(Number(value)) ? Number(value) : 0;
    return n.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatMoney = (value) => `${formatNumber(value)}€`;

  // Normalize general conditions text: remove redundant leading label since we already render a heading
  const normalizeConditionsText = (text) => {
    if (!text || typeof text !== 'string') return '';
    const patterns = [
      /^\s*(general\s*conditions?)\s*[:：]-?\s*/i,
      /^\s*(conditions?\s*générales?)\s*[:：]-?\s*/i,
      /^\s*(algemene\s*voorwaarden)\s*[:：]-?\s*/i
    ];
    let cleaned = text;
    for (const p of patterns) {
      cleaned = cleaned.replace(p, '');
    }
    return cleaned.trim();
  };

  // Client name helper: prefer raw client name; strip any leading emoji/symbols from label fallback
  // Handle both normalized (flat) and non-normalized (nested) client structures
  const getClientDisplayName = (sel) => {
    if (!sel) return t('quoteCreation.quotePreview.client', 'Client');
    // Check normalized structure first (flat)
    if (sel.name) return sel.name;
    // Check nested structure
    if (sel.client?.name) return sel.client.name;
    // Fallback to label (may have emoji prefix)
    const label = sel.label || '';
    try {
      return label.replace(/^[^\p{L}\p{N}]+\s*/u, '');
    } catch (_) {
      return label.replace(/^[^A-Za-z0-9]+\s*/, '');
    }
  };

  // Build a concise, readable task label: take first sentence or N words
  const buildConciseTaskLabel = (description, index, maxWords = 18) => {
    const text = (description || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const sentence = text.split(/(?<=[.!?])\s+/)[0] || text;
    const words = sentence.split(' ').slice(0, maxWords).join(' ');
    const suffix = sentence.split(' ').length > maxWords ? '…' : '';
    return `${words}${suffix}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompanyModal(true)}
              iconName="Building"
              iconPosition="left"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{t('quoteCreation.quotePreview.companyInfo', 'Info entreprise')}</span>
              <span className="sm:hidden">{t('quoteCreation.quotePreview.company', 'Entreprise')}</span>
            </Button>
            
            <Button
              variant={activeTab === 'personalization' ? 'default' : 'outline'}
              onClick={() => setActiveTab(activeTab === 'personalization' ? null : 'personalization')}
              iconName="Palette"
              iconPosition="left"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{t('quoteCreation.quotePreview.colors', 'Couleurs')}</span>
              <span className="sm:hidden">{t('quoteCreation.quotePreview.colors', 'Couleurs')}</span>
            </Button>
            
            <Button
              variant={activeTab === 'financial' ? 'default' : 'outline'}
              onClick={() => setActiveTab(activeTab === 'financial' ? null : 'financial')}
              iconName="Calculator"
              iconPosition="left"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{t('quoteCreation.quotePreview.configuration', 'Configuration')}</span>
              <span className="sm:hidden">{t('quoteCreation.quotePreview.configShort', 'Config')}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSignatureModal(true)}
              iconName="PenTool"
              iconPosition="left"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{t('quoteCreation.quotePreview.electronicSignature', 'Signature électronique')}</span>
              <span className="sm:hidden">{t('quoteCreation.quotePreview.signature', 'Signature')}</span>
            </Button>
          </div>
          
          {/* Desktop/Mobile Toggle - Hidden on mobile and tablet */}
          <div className="hidden lg:flex space-x-1">
            <button
              onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
              className="p-2 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              title={previewMode === 'mobile' ? t('quoteCreation.quotePreview.switchToDesktop', 'Afficher en mode bureau') : t('quoteCreation.quotePreview.switchToMobile', 'Afficher en mode mobile')}
            >
              <AppIcon name={previewMode === 'mobile' ? "Monitor" : "Smartphone"} size={14} />
            </button>
          </div>
        </div>
      </div>
            
      {/* Quote Preview - Full Width */}
      <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <AppIcon name="Eye" size={18} className="sm:w-5 sm:h-5 mr-2" />
          {t('quoteCreation.quotePreview.title')}
          {!quoteNumber && (
            <span className="ml-2 inline-flex items-center text-orange-600 text-sm">
              <AppIcon name="Loader" size={14} className="mr-1 animate-spin" />
              {t('quoteCreation.quotePreview.generatingNumber', 'Génération du numéro...')}
            </span>
          )}
        </h3>
        
        {/* Configuration Panels - Hidden by default, shown when activeTab changes */}
        {(activeTab === 'personalization' || activeTab === 'financial') && (
          <div className="mt-4 sm:mt-6 bg-card border border-border rounded-lg p-4 sm:p-6">
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
                materialPriceDisplay={financialConfig.materialPriceDisplay}
                onMaterialPriceDisplayChange={(value) => handleFinancialConfigChange('materialPriceDisplay', value)}
              />
            )}
          </div>
        )}

        <div id="quote-preview-capture" className={`${getTemplateClasses()} rounded-lg shadow-lg ${
          previewMode === 'mobile' ? 'max-w-sm mx-auto p-4' : 
          'w-full p-4 sm:p-8 lg:p-10'
        }`}>
          <div className={`w-full ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base lg:text-base'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start mb-8 sm:mb-10 ${
              previewMode === 'mobile' ? 'p-4 flex-col space-y-4' : 
              'p-4 sm:p-8 lg:p-10 flex-col sm:flex-row space-y-4 sm:space-y-0'
            }`}>
              <div className={`flex items-center space-x-3 sm:space-x-6 ${previewMode === 'mobile' ? 'w-full' : 'flex-1'}`}>
                {companyInfo.logo ? (
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center overflow-hidden">
                    {companyInfo.logo.data ? (
                      // Show image from base64 data (same as client signature)
                      <img 
                        src={companyInfo.logo.data} 
                        alt={`Logo ${companyInfo.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : companyInfo.logo.url ? (
                      // Show from database using public URL
                      <img 
                        src={companyInfo.logo.url} 
                        alt={`Logo ${companyInfo.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http') ? (
                      // Show actual image from database (fallback)
                      <img 
                        src={companyInfo.logo} 
                        alt={`Logo ${companyInfo.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      // Show placeholder for files stored in localStorage
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-center">
                        <div className="text-xs text-gray-500">
                          <AppIcon name="File" size={16} className="mx-auto mb-1" />
                          {companyInfo.logo.name}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="w-12 h-12 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center text-xs sm:text-sm cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => setShowCompanyModal(true)}
                    title={t('quoteCreation.quotePreview.clickToAddLogo', 'Click to add logo')}
                  >
                    LOGO
                  </div>
                )}
                <div>
                  <h1 
                    className={`font-bold ${previewMode === 'mobile' ? 'text-lg' : 'text-xl sm:text-2xl lg:text-3xl'}`}
                    style={{ color: customization.colors.primary }}
                  >
                    {companyInfo.name}
                  </h1>
                  <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.secondary }}>Artisan professionnel</p>
                  {financialConfig.marketingBannerConfig.enabled && financialConfig.marketingBannerConfig.message && (
                    <p className={`text-sm font-medium mt-2 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.secondary }}>
                      {financialConfig.marketingBannerConfig.message}
                    </p>
                  )}
                </div>
              </div>
              <div className={`text-right ${previewMode === 'mobile' ? 'text-center w-full' : 'text-right'}`}>
                <h2 
                  className={`font-semibold ${previewMode === 'mobile' ? 'text-base' : 'text-lg sm:text-xl lg:text-2xl'}`}
                  style={{ color: customization.colors.primary }}
                >
                  <span className="text-base" style={{ color: customization.colors.primary }}>{displayQuoteNumber}</span>
                </h2>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.secondary }}>Date: {currentDate}</p>
                <p className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.secondary }}>Valable jusqu'au: {validUntil}</p>
              </div>
            </div>
                
            {/* Company Information */}
            <div className={`grid gap-8 sm:gap-12 mb-8 sm:mb-10 ${
              previewMode === 'mobile' ? 'grid-cols-1 px-4' : 
              'grid-cols-1 sm:grid-cols-2 px-4 sm:px-8 lg:px-10'
            }`}>
              <div>
                <h3 className={`font-semibold text-gray-800 mb-3 sm:mb-4 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.clientHeading', 'CLIENT')}</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{ color: customization.colors.secondary }}>
                  <p className="font-medium">{getClientDisplayName(selectedClient)}</p>
                  <p>{selectedClient?.email || 'email@client.com'}</p>
                  {/* Enhanced address display */}
                  {selectedClient?.address && (
                    <div>
                      <p>{selectedClient.address}</p>
                      {(selectedClient?.city || selectedClient?.postalCode || selectedClient?.postal_code) && selectedClient.city !== 'N/A' && (
                        <p>{selectedClient.postalCode || selectedClient.postal_code} {selectedClient.city}</p>
                      )}
                    </div>
                  )}
                  {/* Fallback if no address but we have client object with address fields */}
                  {!selectedClient?.address && selectedClient?.client && (
                    <div>
                      {selectedClient.client.address && <p>{selectedClient.client.address}</p>}
                      {(selectedClient.client.city || selectedClient.client.postalCode || selectedClient.client.postal_code) && selectedClient.client.city !== 'N/A' && (
                        <p>{selectedClient.client.postalCode || selectedClient.client.postal_code} {selectedClient.client.city}</p>
                      )}
                    </div>
                  )}
                  <p>{selectedClient?.phone || '06 12 34 56 78'}</p>
                  {/* Show VAT for professional clients - similar to company section */}
                  {/* Handle both normalized (flat) and non-normalized (nested) client structures */}
                  {((selectedClient?.type === 'professionnel') || (selectedClient?.client_type === 'company') || (selectedClient?.client?.client_type === 'company') || (selectedClient?.client?.type === 'professionnel')) && (selectedClient?.regNumber || selectedClient?.vat_number || selectedClient?.client?.regNumber || selectedClient?.client?.vat_number) && (
                    <p>{t('quoteCreation.quotePreview.vatLabel', 'VAT:')} {selectedClient?.regNumber || selectedClient?.vat_number || selectedClient?.client?.regNumber || selectedClient?.client?.vat_number}</p>
                  )}
                </div>
              </div>
              <div className={`${previewMode === 'mobile' ? 'text-left' : 'text-right'}`}>
                <h3 className={`font-semibold text-gray-800 mb-3 sm:mb-4 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.companyHeading', 'Entreprise')}</h3>
                <div className={`text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{ color: customization.colors.secondary }}>
                  {companyInfo.name && <p className="font-medium">{companyInfo.name}</p>}
                  {companyInfo.email && <p>{companyInfo.email}</p>}
                  {/* Address display */}
                  {companyInfo.address && (
                    <div>
                  <p>{companyInfo.address}</p>
                      {(companyInfo.postalCode || companyInfo.city) && (
                  <p>{companyInfo.postalCode} {companyInfo.city}</p>
                      )}
                    </div>
                  )}
                  {companyInfo.phone && <p>{companyInfo.phone}</p>}
                  {companyInfo.vatNumber && <p>{t('quoteCreation.quotePreview.vatLabel', 'VAT:')} {companyInfo.vatNumber}</p>}
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className={`mb-8 sm:mb-10 ${previewMode === 'mobile' ? 'px-4' : 'px-4 sm:px-8 lg:px-10'}`}>
                              <h3 className={`font-semibold text-gray-800 mb-2 sm:mb-3 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.project', 'PROJET')}</h3>
              <p className={`text-gray-700 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{ color: customization.colors.secondary }}>
                {projectInfo?.description || 'Description du projet'}
              </p>
              {(projectInfo?.categories?.length || projectInfo?.deadline) && (
                <div className={`mt-2 ${previewMode === 'mobile' ? 'text-[11px]' : 'text-xs sm:text-sm'}`} style={{ color: customization.colors.secondary }}>
                  {projectInfo?.categories?.length > 0 && (
                    <p>Catégories: {(projectInfo.categories || []).join(', ')}</p>
                  )}
                  {/* Deadline is already displayed in the header; avoid duplication here */}
                </div>
              )}
            </div>
                
            {/* Tasks Table */}
            <div className={`mb-8 sm:mb-10 ${previewMode === 'mobile' ? 'px-4' : 'px-4 sm:px-8 lg:px-10'}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`font-semibold text-gray-800 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.serviceDetails', 'DÉTAIL DES PRESTATIONS')}</h3>
              </div>
              <div className={`${previewMode === 'mobile' ? 'overflow-x-auto' : 'overflow-x-auto'}`}>
                <table className={`w-full border-collapse ${previewMode === 'mobile' ? 'text-xs min-w-[520px]' : 'text-xs sm:text-sm min-w-[700px]'}`}>
                  <thead>
                    <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 w-10 text-center' : 'p-3 sm:p-4 w-12 text-center'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.number', 'N°')}</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-left' : 'p-3 sm:p-4 text-left'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.designation', 'DÉSIGNATION')}</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-center w-24' : 'p-3 sm:p-4 text-center w-28 sm:w-32'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.quantity', 'QTÉ')}</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-24' : 'p-3 sm:p-4 text-right w-28 sm:w-32'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.unitPrice', 'PRIX U.')}</th>
                      <th className={`border border-gray-300 font-semibold ${previewMode === 'mobile' ? 'p-2 text-right w-24' : 'p-3 sm:p-4 text-right w-28 sm:w-32'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.totalExclTax', 'TOTAL HT')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => {
                      const materials = task.materials || [];
                      const taskMaterialsTotal = materials.reduce((sum, m) => sum + ((parseFloat(m.price || 0)) * (parseFloat(m.quantity || 0))), 0);
                      const laborTotal = parseFloat(task.price || 0);
                      const taskSubtotal = laborTotal + taskMaterialsTotal;

                      return (
                        <React.Fragment key={task.id}>
                          {/* Section header with subtotal */}
                          <tr style={{ backgroundColor: `${customization.colors.primary}10` }}>
                            <td className={`border border-gray-300 font-semibold text-black text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{index + 1}</td>
                            <td className={`border border-gray-300 font-semibold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{buildConciseTaskLabel(task.description, index)}</td>
                            <td className={`border border-gray-300 text-center ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}></td>
                            <td className={`border border-gray-300 text-right ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}></td>
                            <td className={`border border-gray-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{taskSubtotal.toFixed(2)}€</td>
                          </tr>

                          {/* Labor row */}
                          <tr>
                            <td className={`border border-gray-200 text-center text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{index + 1}.1</td>
                            <td className={`border border-gray-200 text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>
                              <div className="font-medium">{laborWord}</div>
                            </td>
                            {(() => {
                              const hours = parseFloat(task.duration || 0);
                              const laborQty = Number.isFinite(hours) && hours > 0 ? hours : 1;
                              const unitPrice = laborQty > 0 ? laborTotal / laborQty : laborTotal;
                              return (
                                <>
                                  <td className={`border border-gray-200 text-center text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{formatNumber(laborQty)} h</td>
                                  <td className={`border border-gray-200 text-right text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{formatMoney(unitPrice)}</td>
                                  <td className={`border border-gray-200 text-right font-semibold text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{formatMoney(laborTotal)}</td>
                                </>
                              );
                            })()}
                          </tr>

                          {/* Material rows */}
                          {materials.map((m, mi) => {
                            const qty = parseFloat(m.quantity || 0);
                            const pu = parseFloat(m.price || 0);
                            const lineTotal = qty * pu;
                            const stripe = mi % 2 === 0 ? `${customization.colors.primary}08` : 'transparent';
                            return (
                              <tr key={`${task.id}-${m.id}`} style={{ backgroundColor: stripe }}>
                                <td className={`border border-gray-200 text-center text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{index + 1}.{mi + 2}</td>
                                <td className={`border border-gray-200 text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>
                                  <div className="leading-tight text-[12px] sm:text-[13px]">{m.name}</div>
                                </td>
                                <td className={`border border-gray-200 text-center text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{formatNumber(qty)} {m.unit || ''}</td>
                                <td className={`border border-gray-200 text-right text-black ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{includeMaterialsPrices ? formatMoney(pu) : ''}</td>
                                <td className={`border border-gray-200 text-right text-black font-medium ${previewMode === 'mobile' ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>{includeMaterialsPrices ? formatMoney(lineTotal) : ''}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                      <td className={`border border-orange-300 font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`} colSpan="4">{t('quoteCreation.quotePreview.subtotalExclTax', 'SOUS-TOTAL HT:')}</td>
                      <td className={`border border-orange-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{formatMoney(totalPrice)}</td>
                    </tr>
                    {financialConfig.vatConfig.display && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                        <td className={`border border-orange-300 font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`} colSpan="4">{t('quoteCreation.quotePreview.vat', 'TVA')} ({financialConfig.vatConfig.rate}%):</td>
                        <td className={`border border-orange-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{formatMoney(vatAmount)}</td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                      <td className={`border border-orange-300 font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`} colSpan="4">{t('quoteCreation.quotePreview.totalInclTax', 'TOTAL TTC:')}</td>
                      <td className={`border border-orange-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{formatMoney(totalWithVAT)}</td>
                    </tr>
                    {financialConfig.advanceConfig.enabled && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                        <td className={`border border-orange-300 font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`} colSpan="4">{t('quoteCreation.quotePreview.depositOnOrder', 'ACOMPTE À LA COMMANDE:')}</td>
                        <td className={`border border-orange-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{formatMoney(advanceAmount)}</td>
                      </tr>
                    )}
                    {financialConfig.advanceConfig.enabled && (
                      <tr style={{ backgroundColor: `${customization.colors.primary}20` }}>
                        <td className={`border border-orange-300 font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`} colSpan="4">{t('quoteCreation.quotePreview.balanceOnDelivery', 'SOLDE À LA LIVRAISON:')}</td>
                        <td className={`border border-orange-300 text-right font-bold text-black ${previewMode === 'mobile' ? 'p-2' : 'p-3 sm:p-4'}`}>{formatMoney(balanceAmount)}</td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* General Conditions */}
            <div className={`mb-8 sm:mb-10 ${previewMode === 'mobile' ? 'px-4' : 'px-4 sm:px-8 lg:px-10'}`}>
              <h3 className={`font-semibold text-black mb-4 sm:mb-6 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.generalConditions', 'CONDITIONS GÉNÉRALES')}</h3>
              <div className={`text-black whitespace-pre-wrap ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                {normalizeConditionsText(financialConfig.defaultConditions.text)}
              </div>
            </div>

            {/* Signatures */}
            <div className={`grid gap-8 sm:gap-12 ${previewMode === 'mobile' ? 'grid-cols-1 px-4 pb-4' : 'grid-cols-1 sm:grid-cols-2 px-4 sm:px-8 lg:px-10 pb-4 sm:pb-8 lg:pb-10'}`}>
              <div>
                <h4 className={`font-semibold text-black mb-3 sm:mb-4 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.companySignature', 'Signature de l\'entreprise:')}</h4>
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 sm:p-6 min-h-[80px] sm:min-h-[100px]'} ${!companyInfo.signature ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                  onClick={() => !companyInfo.signature && setShowCompanyModal(true)}
                  title={!companyInfo.signature ? t('quoteCreation.quotePreview.clickToAddSignature', 'Click to add signature') : ''}
                >
                  {companyInfo.signature ? (
                    <div className="w-full">
                      {companyInfo.signature.data ? (
                        // Show image from base64 data (same as client signature)
                        <img 
                          src={companyInfo.signature.data} 
                          alt="Signature de l'entreprise" 
                          className="max-h-12 max-w-full mx-auto"
                        />
                      ) : companyInfo.signature.url ? (
                        // Show from database using public URL
                        <img 
                          src={companyInfo.signature.url} 
                          alt="Signature de l'entreprise" 
                          className="max-h-12 max-w-full mx-auto"
                        />
                      ) : typeof companyInfo.signature === 'string' && companyInfo.signature.startsWith('http') ? (
                        // Show actual signature image from database (fallback)
                        <img 
                          src={companyInfo.signature} 
                          alt="Signature de l'entreprise" 
                          className="max-h-12 max-w-full mx-auto"
                        />
                      ) : (
                        // Show placeholder for files stored in localStorage
                        <div className="text-center">
                          <AppIcon name="File" size={24} className="mx-auto mb-2 text-gray-400" />
                          <p className={`text-xs text-gray-600 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                            {companyInfo.signature.name}
                          </p>
                          <p className={`text-xs text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                            {t('quoteCreation.quotePreview.savedSignature', 'Signature enregistrée')}
                          </p>
                        </div>
                      )}
                      <p className={`text-xs text-black mt-1 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                        {t('quoteCreation.quotePreview.signedOn', 'Signé le')} {new Date().toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ) : (
                    <p className={`text-black ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>{t('quoteCreation.quotePreview.signatureZone', 'Zone de signature électronique')}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className={`font-semibold text-black mb-3 sm:mb-4 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>{t('quoteCreation.quotePreview.clientApproval', 'Bon pour accord client:')}</h4>
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 flex items-center justify-center ${previewMode === 'mobile' ? 'p-3 min-h-[60px]' : 'p-4 sm:p-6 min-h-[80px] sm:min-h-[100px]'} ${!signatureData?.signature ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                  onClick={() => !signatureData?.signature && setShowSignatureModal(true)}
                  role={!signatureData?.signature ? "button" : undefined}
                  tabIndex={!signatureData?.signature ? 0 : undefined}
                  title={!signatureData?.signature ? t('quoteCreation.quotePreview.clickToAddSignature', 'Click to add signature') : ''}
                  onKeyDown={!signatureData?.signature ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSignatureModal(true);
                    }
                  } : undefined}
                >
                  {signatureData?.signature ? (
                    <div className="w-full">
                      <img 
                        src={signatureData.signature} 
                        alt="Signature du client" 
                        className="max-h-12 max-w-full mx-auto"
                      />
                      <p className={`text-xs text-black mt-1 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                        {t('quoteCreation.quotePreview.signedOn', 'Signé le')} {new Date(signatureData.signedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ) : (
                    <p className={`text-black ${previewMode === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'}`}>{t('quoteCreation.quotePreview.clientSignature', 'Signature du client')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files Section */}
        {files && files.length > 0 && (
          <div className={`px-4 sm:px-8 lg:px-10 py-4 sm:py-8 lg:py-10`}>
            <h4 className={`font-semibold text-black mb-3 sm:mb-4 ${previewMode === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`} style={{ color: customization.colors.primary }}>
              {t('quoteCreation.quotePreview.attachedFiles', 'Fichiers joints')} ({files.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div key={file.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {(file.type || file.mime_type) && (file.type || file.mime_type).startsWith('image/') ? (
                        <AppIcon name="Image" size={20} className="text-blue-600" />
                      ) : (file.type || file.mime_type) === 'application/pdf' ? (
                        <AppIcon name="FileText" size={20} className="text-red-600" />
                      ) : (
                        <AppIcon name="File" size={20} className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 truncate ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>
                        {file.name || file.file_name}
                      </p>
                      <p className={`text-xs text-gray-500 ${previewMode === 'mobile' ? 'text-xs' : 'text-xs'}`}>
                        {file.size || file.file_size ? `${((file.size || file.file_size) / 1024 / 1024).toFixed(1)} MB` : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Image Preview for Image Files */}
                  {(file.type || file.mime_type) && (file.type || file.mime_type).startsWith('image/') && (
                    <div className="mb-3">
                      {file.data ? (
                        // Show image from base64 data (for newly uploaded files)
                        <img
                          src={file.data}
                          alt={file.name || file.file_name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            console.error('Error loading image from base64 data:', file.name);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : file.publicUrl ? (
                        // Show image from public URL (for existing files)
                        <img
                          src={file.publicUrl}
                          alt={file.name || file.file_name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            console.error('Error loading image from public URL:', file.publicUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : file.path || file.file_path ? (
                        // Try to get public URL for the file path
                        <img
                          src={getPublicUrl('quote-files', file.path || file.file_path)}
                          alt={file.name || file.file_name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            console.error('Error loading image from file path:', file.path || file.file_path);
                            e.target.style.display = 'none';
                          }}
                          
                        />
                      ) : null}
                    </div>
                  )}
                  
                  {/* File Download Link */}
                  <div className="flex justify-center">
                    <a
                      href={file.data || file.publicUrl || (file.path || file.file_path ? getPublicUrl('quote-files', file.path || file.file_path) : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors ${previewMode === 'mobile' ? 'text-xs' : 'text-xs'}`}
                      onClick={(e) => {
                        // If no valid URL, prevent download
                        if (!file.data && !file.publicUrl && !(file.path || file.file_path)) {
                          e.preventDefault();
                          console.warn('No valid file source for download:', file);
                        }
                      }}
                    >
                      <AppIcon name="Download" size={12} className="mr-1" />
                      {t('quoteCreation.quotePreview.download', 'Télécharger')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center bg-card border border-border rounded-lg p-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          iconName="ArrowLeft"
          iconPosition="left"
          disabled={isSaving}
        >
          {t('quoteCreation.navigation.back')}
        </Button>
        
        <div className="flex space-x-2">
          {null}
          
          {/* Share actions moved to quotes management */}
          
          <Button
            variant="outline"
            onClick={async () => {
              if (!isSaving) {
                // Create and show the processing overlay
                const overlay = createProcessingOverlay(t('ui.processingOverlay.saving'), 'quote-draft-overlay');
                overlay.show();
                
                try {
                  await onSave({ customization, financialConfig, companyInfo, signatureData });
                  
                  // Hide the overlay
                  overlay.hide();
                } catch (error) {
                  console.error('Error saving draft:', error);
                  // Show error message
                  alert('Une erreur est survenue lors de la sauvegarde du brouillon. Veuillez réessayer.');
                  
                  // Hide the overlay
                  overlay.hide();
                }
              }
            }}
            iconName="Save"
            iconPosition="left"
            size="sm"
            disabled={isSaving}
          >
            {isSaving ? t('quoteCreation.navigation.saving', 'Sauvegarde...') : t('quoteCreation.navigation.saveAsDraft', 'Brouillon')}
          </Button>
          <Button
            onClick={() => setShowQuoteSendModal(true)}
            iconName="Send"
            iconPosition="left"
            size="sm"
            disabled={isSaving}
          >
            {isSaving ? t('quoteCreation.navigation.sending', 'Envoi...') : t('quoteCreation.navigation.send', 'Envoyer')}
          </Button>
        </div>
      </div>

      {/* no extra share panel */}

      {/* Modals */}
      {showCompanyModal && (
        <CompanyInfoModal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          onSave={async (info) => {
            handleCompanyInfoSave(info);
            // Don't refresh from database - keep local changes
          }}
          onCompanyInfoChange={onCompanyInfoChange}
          initialData={companyInfo}
        />
      )}
      
      {showSignatureModal && (
        <ElectronicSignatureModal
          isOpen={showSignatureModal}
          initialData={signatureData}
          onSign={(signature) => {
            handleSignature(signature);
            setShowSignatureModal(false);
          }}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
      
      {/* Quote Send Modal */}
      {showQuoteSendModal && (
        <QuoteSendModal
          isOpen={showQuoteSendModal}
          onClose={() => setShowQuoteSendModal(false)}
          onSend={onSend}
          selectedClient={selectedClient}
          projectInfo={projectInfo}
          companyInfo={companyInfo}
          quoteNumber={quoteNumber}
          tasks={tasks}
          files={files}
          financialConfig={financialConfig}
          signatureData={signatureData}
          customization={customization}
        />
      )}
    </div>
  );
};

export default QuotePreview;
