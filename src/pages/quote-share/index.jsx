import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getQuoteByShareToken } from '../../services/shareService';
import { getPublicUrl } from '../../services/storageService';
import ClientQuoteService from '../../services/clientQuoteService';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ElectronicSignatureModal from '../quote-creation/components/ElectronicSignatureModal';
import LanguageDropdown from '../../components/LanguageDropdown';
import Footer from '../../components/Footer';

const currency = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + '€';

const PublicQuoteShareViewer = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false); // Will be set from backend response
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Trop cher');
  const [actionLoading, setActionLoading] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState('sent'); // sent, accepted, rejected, expired
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [clientSignature, setClientSignature] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const res = await getQuoteByShareToken(token);
        if (!res?.success) {
          setError(res?.error || t('quoteShare.error.invalidLink'));
          return;
        }
        const q = res.data;
        setQuote(q);
        
        // Set view-only mode from backend response (secure - cannot be bypassed by removing URL parameter)
        const viewOnly = res.isViewOnly || false;
        setIsViewOnly(viewOnly);

        // Track quote view for analytics
        // IMPORTANT: Pass isViewOnly flag to prevent status updates for copy emails
        try {
          await ClientQuoteService.trackQuoteView(q.id, token, viewOnly);
        } catch (trackingError) {
          console.error('Error tracking quote view:', trackingError);
        }

        // Expiration is now handled by edge functions - use status directly from backend
        setQuoteStatus(q.status);

        // Load company assets
        try {
          if (q?.company_profile?.logo_path) {
            const logoUrl = getPublicUrl('company-assets', q.company_profile.logo_path);
            setLogoUrl(logoUrl);
          }
          if (q?.company_profile?.signature_path) {
            const signatureUrl = getPublicUrl('company-assets', q.company_profile.signature_path);
            setSignatureUrl(signatureUrl);
          }
        } catch (_) {}

        // Load existing client signature if available
        if (q?.quote_signatures && q.quote_signatures.length > 0) {
          const existingClientSignature = q.quote_signatures.find(sig => sig.signature_type === 'client');
          if (existingClientSignature) {
            setClientSignature({
              signature_data: existingClientSignature.signature_data,
              signature_file_path: existingClientSignature.signature_file_path,
              customerComment: existingClientSignature.customer_comment,
              signedAt: existingClientSignature.signed_at
            });
            // Close signature modal if it was open and there's already a signature
            setShowSignatureModal(false);
          }
        }
      } catch (e) {
        setError(t('quoteShare.error.loadingError'));
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleAcceptQuote = async () => {
    // If already signed, accept directly
    if (clientSignature) {
      try {
        setActionLoading(true);
        const result = await ClientQuoteService.acceptQuote(quote.id, token, clientSignature, quote);
        
        if (result.success) {
          setQuoteStatus('accepted');
          // Show success message
          alert(t('quoteShare.alerts.acceptedSuccess'));
        } else {
          alert(`${t('quoteShare.alerts.error')}: ${result.error}`);
        }
      } catch (error) {
        alert(t('quoteShare.alerts.acceptanceError'));
      } finally {
        setActionLoading(false);
      }
      return;
    }
    
    // If not signed yet, show signature modal
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = async (signatureData) => {
    try {
      setActionLoading(true);
      setClientSignature(signatureData);
      
      const result = await ClientQuoteService.acceptQuote(quote.id, token, signatureData, quote);
      
      if (result.success) {
        setQuoteStatus('accepted');
        setShowSignatureModal(false);
        // Show success message
        alert(t('quoteShare.alerts.acceptedSuccess'));
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert(t('quoteShare.alerts.acceptanceError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectionReason.trim()) {
      alert(t('quoteShare.alerts.rejectionReasonRequired'));
      return;
    }

    try {
      setActionLoading(true);
      const result = await ClientQuoteService.rejectQuote(quote.id, token, rejectionReason);
      
      if (result.success) {
        setQuoteStatus('rejected');
        setShowRejectModal(false);
        // Show success message
        alert(t('quoteShare.alerts.rejectedSuccess'));
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert(t('quoteShare.alerts.rejectionError'));
    } finally {
      setActionLoading(false);
    }
  };

  const getFinancialConfig = () => {
    if (!quote?.quote_financial_configs?.[0]) {
      return {
        vatConfig: { rate: 0, display: false },
        advanceConfig: { enabled: false, amount: 0 },
        discountConfig: { enabled: false, rate: 0 }
      };
    }
    
    const config = quote.quote_financial_configs[0];
    
    // Ensure we have proper structure for each config section
    return {
      vatConfig: {
        rate: config.vat_config?.rate || 0,
        display: config.vat_config?.display || false,
        is_inclusive: config.vat_config?.is_inclusive || false
      },
      advanceConfig: {
        enabled: config.advance_config?.enabled || false,
        amount: config.advance_config?.amount || 0,
        percentage: config.advance_config?.percentage || 0,
        due_date: config.advance_config?.due_date || null
      },
      discountConfig: {
        enabled: config.discount_config?.rate > 0 || false,
        rate: config.discount_config?.rate || 0,
        amount: config.discount_config?.amount || 0,
        type: config.discount_config?.type || 'percentage'
      }
    };
  };

  const financialConfig = getFinancialConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('quoteShare.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="FileX" size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('quoteShare.error.notFound')}</p>
        </div>
      </div>
    );
  }

  // Get materials price display setting from database (quote financial config)
  // Priority: Database > localStorage > default (true)
  const includeMaterialsPrices = quote?.quote_financial_configs?.[0]?.show_material_prices ?? 
    (localStorage.getItem('include-materials-prices') ?? 'true') === 'true';
  
  // Group materials by task_id and add them to tasks (like QuotePreview does)
  const tasksWithMaterials = quote.quote_tasks?.map(task => {
    const taskMaterials = quote.quote_materials?.filter(material => material.quote_task_id === task.id) || [];
    return {
      ...task,
      materials: taskMaterials
    };
  }) || [];

  // Calculate totals using the same logic as QuotePreview
  const totalPrice = tasksWithMaterials.reduce((sum, task) => {
    // Task price (labor)
    const taskPrice = parseFloat(task.total_price) || ((parseFloat(task.quantity) || 1) * (parseFloat(task.unit_price) || 0));
    
    // Materials total (ALWAYS included in calculation, regardless of display setting)
    const taskMaterialsTotal = task.materials.reduce(
      (matSum, mat) => matSum + ((parseFloat(mat.unit_price) || 0) * (parseFloat(mat.quantity) || 0)),
      0
    );
    
    return sum + taskPrice + taskMaterialsTotal;
  }, 0);

  const vatAmount = financialConfig.vatConfig?.display ? (totalPrice * financialConfig.vatConfig.rate / 100) : 0;
  const totalWithVAT = totalPrice + vatAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header with Better Desktop Layout */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-8">
          {/* Mobile Layout - Stacked */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-4">
              {/* Quote Number */}
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900">{quote?.quote_number || quote?.id}</span>
              </div>
              {/* Language Dropdown */}
              <LanguageDropdown />
            </div>
            
            {/* Action Buttons - Mobile */}
            {(quoteStatus === 'sent' || quoteStatus === 'viewed') && !isViewOnly && (
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="w-full px-6 py-3 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors"
                >
                  <Icon name="XCircle" size={18} className="mr-2" />
                  {t('quoteShare.actions.reject')}
                </Button>
                <Button
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                  className={`w-full px-6 py-3 shadow-lg hover:shadow-xl transition-all ${
                    clientSignature 
                      ? 'bg-green-700 hover:bg-green-800 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Icon name="CheckCircle" size={18} className="mr-2" />
                  {actionLoading ? t('quoteShare.actions.processing') : clientSignature ? t('quoteShare.actions.confirmAcceptance') : t('quoteShare.actions.accept')}
                </Button>
              </div>
            )}
            {/* View Only Message - Mobile */}
            {isViewOnly && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700 font-medium">
                  {t('quoteShare.viewOnly.message', 'Mode consultation uniquement - Ce devis vous a été envoyé en copie')}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Layout - Horizontal with Better Spacing */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Left Side - Quote Info */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-2xl font-bold text-gray-900">{quote?.quote_number || quote?.id}</span>
              </div>
             
            </div>

            {/* Center - Language Dropdown */}
            <div className="flex items-center">
              <LanguageDropdown />
            </div>

            {/* Right Side - Action Buttons */}
            {(quoteStatus === 'sent' || quoteStatus === 'viewed') && !isViewOnly && (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="px-8 py-3 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors text-base font-medium"
                >
                  <Icon name="XCircle" size={20} className="mr-2" />
                  {t('quoteShare.actions.reject')}
                </Button>
                <Button
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                  className={`px-8 py-3 shadow-lg hover:shadow-xl transition-all text-base font-medium ${
                    clientSignature 
                      ? 'bg-green-700 hover:bg-green-800 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Icon name="CheckCircle" size={20} className="mr-2" />
                  {actionLoading ? t('quoteShare.actions.processing') : clientSignature ? t('quoteShare.actions.confirmAcceptance') : t('quoteShare.actions.accept')}
                </Button>
              </div>
            )}
            {/* View Only Message - Desktop */}
            {isViewOnly && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
                <p className="text-sm text-blue-700 font-medium">
                  {t('quoteShare.viewOnly.message', 'Mode consultation uniquement - Ce devis vous a été envoyé en copie')}
                </p>
              </div>
            )}
          </div>

          {/* Signature Status - Both Mobile and Desktop */}
          {clientSignature && (
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 w-full sm:w-auto">
                <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-green-800 font-medium text-sm">{t('quoteShare.signatures.quoteAccepted')}</p>
                  <p className="text-xs text-green-600">
                    {t('quoteShare.signatures.signedOn')} {clientSignature.signedAt ? new Date(clientSignature.signedAt).toLocaleDateString('fr-FR') : t('quoteShare.signatures.recently')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-8 lg:py-12">
                  {/* Quote Preview Card */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
          {/* Company and Client Information */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-6">
            {/* Company Information */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-blue-100">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                {logoUrl && (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg p-1 shadow-sm border border-blue-200 flex-shrink-0">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                    {quote?.company_profile?.company_name || t('quoteShare.footer.companyName')}
                  </h3>
                  <p className="text-blue-600 font-medium text-xs sm:text-sm">{t('quoteShare.company.company')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Icon name="MapPin" size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
                    <p className="text-sm font-medium text-gray-800">{quote?.company_profile?.address || t('quoteShare.company.address')}</p>
                {quote?.company_profile?.city && quote.company_profile.city !== 'N/A' && (
                      <p className="text-sm text-gray-600">{quote.company_profile.city}</p>
                    )}
                    <p className="text-sm text-gray-600">{quote?.company_profile?.postal_code || t('quoteShare.company.postalCode')}</p>
                    <p className="text-sm text-gray-600">{quote?.company_profile?.country || t('quoteShare.company.country')}</p>
                  </div>
                </div>
                {quote?.company_profile?.phone && (
                  <div className="flex items-center space-x-2">
                    <Icon name="Phone" size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{quote.company_profile.phone}</span>
                  </div>
                )}
                {quote?.company_profile?.email && (
                  <div className="flex items-center space-x-2">
                    <Icon name="Mail" size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{quote.company_profile.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 lg:p-6 border border-green-100">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{t('quoteShare.client.client')}</h3>
                <p className="text-green-600 font-medium text-xs sm:text-sm">{t('quoteShare.client.recipient')}</p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2">
                  <Icon name="User" size={14} className="text-green-500 flex-shrink-0" />
                  <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">{quote?.client?.name || t('quoteShare.client.client')}</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200">
                  <p className="font-medium text-xs text-green-700 mb-2 flex items-center">
                    <Icon name="MapPin" size={12} className="mr-1" />
                    {t('quoteShare.client.billingAddress')}
                  </p>
                  <div className="space-y-1 text-gray-700">
                    <p className="text-xs sm:text-sm font-medium">{quote?.client?.address || t('quoteShare.company.address')}</p>
                  {quote?.client?.city && quote.client.city !== 'N/A' && (
                      <p className="text-xs sm:text-sm">{quote.client.city}</p>
                  )}
                    <p className="text-xs sm:text-sm">{quote?.client?.postal_code || t('quoteShare.company.postalCode')}</p>
                    <p className="text-xs sm:text-sm">{quote?.client?.country || t('quoteShare.company.country')}</p>
                  </div>
                </div>
                {quote?.client?.delivery_address && (
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200">
                    <p className="font-medium text-xs text-green-700 mb-2 flex items-center">
                      <Icon name="Truck" size={12} className="mr-1" />
                    {t('quoteShare.client.deliveryAddress')}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">{quote.client.delivery_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="Calendar" size={14} className="sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">{t('quoteShare.quoteDetails.quoteDate')}</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {quote?.created_at ? new Date(quote.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="Clock" size={14} className="sm:w-4 sm:h-4 text-orange-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">{t('quoteShare.quoteDetails.expiryDate')}</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {quote?.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="DollarSign" size={14} className="sm:w-4 sm:h-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">{t('quoteShare.quoteDetails.totalAmount')}</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{currency(totalWithVAT)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <Icon name="Wrench" size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600 mr-2" />
            {t('quoteShare.services.title')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{t('quoteShare.services.description')}</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{t('quoteShare.services.quantity')}</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{t('quoteShare.services.unitPrice')}</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{t('quoteShare.services.unit')}</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{t('quoteShare.services.total')}</th>
                </tr>
              </thead>
              <tbody>
                {tasksWithMaterials.map((task, index) => {
                  // Task price (labor)
                  const taskPrice = parseFloat(task.total_price) || ((parseFloat(task.quantity) || 1) * (parseFloat(task.unit_price) || 0));
                  
                  // Materials total (ALWAYS included in calculation, regardless of display setting)
                  const taskMaterialsTotal = task.materials.reduce(
                    (sum, mat) => sum + ((parseFloat(mat.unit_price) || 0) * (parseFloat(mat.quantity) || 0)),
                    0
                  );
                  
                  const totalHT = taskPrice + taskMaterialsTotal;
                  
                  return (
                    <React.Fragment key={task.id || index}>
                      {/* Task Header Row */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-blue-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-800">
                          <div>
                            <p className="font-bold text-gray-900 text-xs sm:text-sm">{index + 1}. {task.name || task.description}</p>
                            {task.description && task.description !== task.name && (
                              <p className="text-xs text-gray-800 mt-1">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-center text-gray-600 font-medium text-xs sm:text-sm">{task.quantity || 1}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-center text-gray-600 font-medium text-xs sm:text-sm">{task.unit || 'piece'}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-gray-600 font-medium text-xs sm:text-sm">{currency(task.unit_price || 0)}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-right font-bold text-blue-800 text-xs sm:text-sm">
                          {currency(totalHT)}
                        </td>
                      </tr>
                      
                      {/* Materials Rows */}
                      {task.materials.map((material, matIndex) => (
                        <tr key={`${task.id}-${material.id || matIndex}`} className="border-b border-gray-50 bg-gray-25">
                          <td className="py-1.5 sm:py-2 px-2 sm:px-3 pl-4 sm:pl-6 text-gray-700">
                            <div className="flex items-center">
                              <Icon name="Package" size={10} className="sm:w-3 sm:h-3 text-green-500 mr-1" />
                              <span className="text-xs">{material.name}</span>
                            </div>
                          </td>
                          <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-center text-gray-600 text-xs">{material.quantity}</td>
                          <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-center text-gray-600 text-xs">{material.unit || 'piece'}</td>
                          <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-right text-gray-600 text-xs">
                            {includeMaterialsPrices ? currency(material.unit_price || 0) : ''}
                          </td>
                          <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-right text-gray-600 text-xs">
                            {includeMaterialsPrices ? currency((parseFloat(material.quantity) || 0) * (parseFloat(material.unit_price) || 0)) : ''}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Materials are now included in task calculations above */}

          {/* Financial Summary */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-full sm:w-80 lg:w-96 space-y-3">
                <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                  <span>{t('quoteShare.financial.subtotal')}:</span>
                <span className="font-medium">{currency(totalPrice)}</span>
              </div>
              {financialConfig.vatConfig?.display && (
                  <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                    <span>TVA ({financialConfig.vatConfig.rate}%):</span>
                  <span className="font-medium">{currency(vatAmount)}</span>
                </div>
              )}
                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>{t('quoteShare.financial.total')}:</span>
                  <span className="text-blue-600">{currency(totalWithVAT)}</span>
                </div>
                {financialConfig.advanceConfig?.enabled && financialConfig.advanceConfig.amount > 0 && (
                  <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                    <span>{t('quoteShare.financial.advancePayment')}:</span>
                  <span className="font-medium">{currency(financialConfig.advanceConfig.amount)}</span>
                </div>
              )}
                {financialConfig.advanceConfig?.enabled && financialConfig.advanceConfig.amount > 0 && (
                  <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>{t('quoteShare.financial.balanceOnDelivery')}:</span>
                    <span className="text-green-600">{currency(totalWithVAT - financialConfig.advanceConfig.amount)}</span>
                  </div>
                )}
                {!includeMaterialsPrices && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    * {t('quoteShare.financial.materialsNote')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {quote.notes && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Icon name="FileText" size={16} className="sm:w-[18px] sm:h-[18px] text-purple-600 mr-2" />
              {t('quoteShare.additionalInfo.title')}
            </h3>
            <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">{quote.notes}</div>
          </div>
        )}

        {/* Files Section */}
        {quote.quote_files && quote.quote_files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Icon name="Paperclip" size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600 mr-2" />
              {t('quoteShare.files.title')} ({quote.quote_files.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {quote.quote_files.map((file, index) => (
                <div key={file.id || index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="File" size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                      </p>
                    </div>
                  </div>
                  {file.mime_type && file.mime_type.startsWith('image/') && (
                    <div className="mt-2 sm:mt-3">
                      <img 
                        src={getPublicUrl('quote-files', file.file_path)} 
                        alt={file.file_name}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          console.error('Error loading image:', file.file_path);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', file.file_path);
                        }}
                      />
                    </div>
                  )}
                  {/* File download link */}
                  <div className="mt-2 sm:mt-3">
                    <a 
                      href={getPublicUrl('quote-files', file.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Icon name="Download" size={12} className="mr-1" />
                      {t('quoteShare.files.download')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <Icon name="PenTool" size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-600 mr-2" />
            {t('quoteShare.signatures.title')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Company Signature */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800">{t('quoteShare.signatures.companySignature')}</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 min-h-20 sm:min-h-24 flex items-center justify-center">
                {signatureUrl ? (
                  <img src={signatureUrl} alt={t('quoteShare.signatures.companySignature')} className="max-w-full max-h-16 sm:max-h-20 object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Icon name="PenTool" size={20} className="sm:w-6 sm:h-6 mx-auto mb-1" />
                    <p className="text-xs">{t('quoteShare.signatures.signatureNotAvailable')}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">
                {quote?.company_profile?.company_name || t('quoteShare.footer.companyName')}
              </p>
            </div>

            {/* Client Signature */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800">{t('quoteShare.signatures.clientSignature')}</h4>
              <div 
                className={`border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 min-h-20 sm:min-h-24 flex items-center justify-center ${!clientSignature && quoteStatus !== 'accepted' && !isViewOnly ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                onClick={() => {
                  if (!clientSignature && quoteStatus !== 'accepted' && !isViewOnly) {
                    setShowSignatureModal(true);
                  }
                }}
                role={!clientSignature && quoteStatus !== 'accepted' && !isViewOnly ? "button" : undefined}
                tabIndex={!clientSignature && quoteStatus !== 'accepted' && !isViewOnly ? 0 : undefined}
                title={!clientSignature && quoteStatus !== 'accepted' && !isViewOnly ? t('quoteCreation.quotePreview.clickToAddSignature', 'Click to add signature') : ''}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !clientSignature && quoteStatus !== 'accepted' && !isViewOnly) {
                    e.preventDefault();
                    setShowSignatureModal(true);
                  }
                }}
              >
                {clientSignature ? (
                  <img 
                    src={
                      clientSignature.signature_data ? 
                        (clientSignature.signature_data.startsWith('http') || clientSignature.signature_data.startsWith('data:')) ?
                          clientSignature.signature_data : // Already a URL or data URI
                          `data:image/png;base64,${clientSignature.signature_data}` : // Base64 data
                        clientSignature.signature_file_path ? 
                          getPublicUrl('signatures', clientSignature.signature_file_path) : 
                          null
                    } 
                    alt={t('quoteShare.signatures.clientSignature')} 
                    className="max-w-full max-h-20 object-contain" 
                  />
                ) : quoteStatus === 'accepted' ? (
                  <div className="text-center text-green-600">
                    <Icon name="CheckCircle" size={24} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">{t('quoteShare.signatures.quoteAccepted')}</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Icon name="User" size={24} className="mx-auto mb-1" />
                    <p className="text-xs">{t('quoteShare.signatures.waitingForSignature')}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">
                  {quote?.client?.name || t('quoteShare.client.client')}
              </p>
              {clientSignature?.customerComment && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">{t('quoteShare.signatures.comment')}:</span> {clientSignature.customerComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Display */}
        {quoteStatus === 'accepted' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-green-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="CheckCircle" size={24} className="sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800">{t('quoteShare.statusMessages.accepted.title')}</h2>
                <p className="text-green-700 text-base sm:text-lg">{t('quoteShare.statusMessages.accepted.message')}</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'rejected' && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-red-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="XCircle" size={24} className="sm:w-8 sm:h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-red-800">{t('quoteShare.statusMessages.rejected.title')}</h2>
                <p className="text-red-700 text-base sm:text-lg">{t('quoteShare.statusMessages.rejected.message')}</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'expired' && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-yellow-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Icon name="Clock" size={24} className="sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-yellow-800">{t('quoteShare.statusMessages.expired.title')}</h2>
                <p className="text-yellow-700 text-base sm:text-lg">{t('quoteShare.statusMessages.expired.message')}</p>
              </div>
            </div>
          </div>
        )}

        
      </div>
      {/* Footer */}
      <Footer />
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 mx-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Icon name="XCircle" size={20} className="sm:w-6 sm:h-6 text-red-600" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{t('quoteShare.rejectModal.title')}</h3>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('quoteShare.rejectModal.rejectionReason')}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                placeholder={t('quoteShare.rejectModal.placeholder')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t('quoteShare.rejectModal.cancel')}
              </button>
              <button
                onClick={handleRejectQuote}
                disabled={actionLoading}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? t('quoteShare.actions.processing') : t('quoteShare.rejectModal.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Electronic Signature Modal */}
      {showSignatureModal && (
        <ElectronicSignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onComplete={handleSignatureComplete}
          title={t('quoteShare.signatureModal.title')}
          subtitle={t('quoteShare.signatureModal.subtitle')}
          clientName={quote?.client?.name || t('quoteShare.client.client')}
        />
      )}
    </div>
  );
};

export default PublicQuoteShareViewer;




