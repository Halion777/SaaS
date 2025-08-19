import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuoteByShareToken } from '../../services/shareService';
import { getPublicUrl } from '../../services/storageService';
import ClientQuoteService from '../../services/clientQuoteService';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ElectronicSignatureModal from '../quote-creation/components/ElectronicSignatureModal';

const currency = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + '€';

const PublicQuoteShareViewer = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
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
          setError(res?.error || 'Lien invalide.');
          return;
        }
        const q = res.data;
        setQuote(q);

        // Track quote view for analytics
        try {
          await ClientQuoteService.trackQuoteView(q.id, token);
        } catch (trackingError) {
          console.error('Error tracking quote view:', trackingError);
        }

        // Check quote status and handle expired quotes (only for quotes that haven't been acted upon)
        let currentStatus = q.status;
        if (q.valid_until && new Date(q.valid_until) < new Date()) {
          // Only mark as expired if quote is still in a state where expiration matters
          if (['sent', 'viewed'].includes(q.status)) {
            currentStatus = 'expired';
          }
          // Don't override 'accepted', 'rejected', 'pending' statuses with 'expired'
        }
        setQuoteStatus(currentStatus);

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
          }
        }
      } catch (e) {
        setError('Erreur lors du chargement du devis.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleAcceptQuote = async () => {
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
        alert('Devis accepté avec succès !');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur lors de l\'acceptation du devis.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectionReason.trim()) {
      alert('Veuillez indiquer un motif de rejet.');
      return;
    }

    try {
      setActionLoading(true);
      const result = await ClientQuoteService.rejectQuote(quote.id, token, rejectionReason);
      
      if (result.success) {
        setQuoteStatus('rejected');
        setShowRejectModal(false);
        // Show success message
        alert('Devis rejeté.');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur lors du rejet du devis.');
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
          <p className="text-gray-600">Chargement du devis...</p>
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
          <p className="text-gray-600">Devis non trouvé.</p>
        </div>
      </div>
    );
  }

  // Get materials price display setting from localStorage (like QuotePreview)
  const includeMaterialsPrices = (localStorage.getItem('include-materials-prices') ?? 'true') === 'true';
  
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
      {/* Clean Header with Quote Info Left, Buttons Right */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Quote Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  quoteStatus === 'sent' ? 'bg-blue-100 text-blue-700' :
                  quoteStatus === 'viewed' ? 'bg-orange-100 text-orange-700' :
                  quoteStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                  quoteStatus === 'rejected' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {quoteStatus === 'sent' ? 'Envoyé' : 
                   quoteStatus === 'viewed' ? 'Consulté' :
                   quoteStatus === 'accepted' ? 'Accepté' :
                   quoteStatus === 'rejected' ? 'Rejeté' : 'Expiré'}
                </span>
                
                <span className="text-sm font-medium text-gray-700">{quote?.quote_number || quote?.id}</span>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            {(quoteStatus === 'sent' || quoteStatus === 'viewed') && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="px-6 py-2.5 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors"
                >
                  <Icon name="XCircle" size={18} className="mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon name="CheckCircle" size={18} className="mr-2" />
                  {actionLoading ? 'Traitement...' : 'Accepter'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
                  {/* Quote Preview Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          {/* Company and Client Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Company Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3 mb-4">
                {logoUrl && (
                  <div className="w-12 h-12 bg-white rounded-lg p-1 shadow-sm border border-blue-200">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {quote?.company_profile?.company_name || 'Votre Entreprise'}
                  </h3>
                  <p className="text-blue-600 font-medium text-sm">Entreprise</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Icon name="MapPin" size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{quote?.company_profile?.address || 'Adresse'}</p>
                    {quote?.company_profile?.city && quote.company_profile.city !== 'N/A' && (
                      <p className="text-sm text-gray-600">{quote.company_profile.city}</p>
                    )}
                    <p className="text-sm text-gray-600">{quote?.company_profile?.postal_code || 'Code postal'}</p>
                    <p className="text-sm text-gray-600">{quote?.company_profile?.country || 'Pays'}</p>
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Client</h3>
                <p className="text-green-600 font-medium text-sm">Destinataire</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Icon name="User" size={14} className="text-green-500 flex-shrink-0" />
                  <p className="text-base font-semibold text-gray-800">{quote?.client?.name || 'Client'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="font-medium text-xs text-green-700 mb-2 flex items-center">
                    <Icon name="MapPin" size={12} className="mr-1" />
                    Adresse de facturation
                  </p>
                  <div className="space-y-1 text-gray-700">
                    <p className="text-sm font-medium">{quote?.client?.address || 'Adresse'}</p>
                    {quote?.client?.city && quote.client.city !== 'N/A' && (
                      <p className="text-sm">{quote.client.city}</p>
                    )}
                    <p className="text-sm">{quote?.client?.postal_code || 'Code postal'}</p>
                    <p className="text-sm">{quote?.client?.country || 'Pays'}</p>
                  </div>
                </div>
                {quote?.client?.delivery_address && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="font-medium text-xs text-green-700 mb-2 flex items-center">
                      <Icon name="Truck" size={12} className="mr-1" />
                      Adresse de livraison
                    </p>
                    <p className="text-sm text-gray-700">{quote.client.delivery_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="Calendar" size={16} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Date du devis</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {quote?.created_at ? new Date(quote.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="Clock" size={16} className="text-orange-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Date d'expiration</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {quote?.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name="DollarSign" size={16} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Montant total</p>
                <p className="text-xl font-bold text-green-600">{currency(totalWithVAT)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Icon name="Wrench" size={18} className="text-blue-600 mr-2" />
            Détails des prestations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 bg-gray-50 text-sm">Description</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-700 bg-gray-50 text-sm">Quantité</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 bg-gray-50 text-sm">Prix unitaire</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 bg-gray-50 text-sm">Total</th>
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
                        <td className="py-3 px-3 text-gray-800">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{index + 1}. {task.name || task.description}</p>
                            {task.description && task.description !== task.name && (
                              <p className="text-xs text-gray-800 mt-1">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-600 font-medium text-sm">{task.quantity || 1}</td>
                        <td className="py-3 px-3 text-right text-gray-600 font-medium text-sm">{currency(task.unit_price || 0)}</td>
                        <td className="py-3 px-3 text-right font-bold text-blue-800 text-sm">
                          {currency(totalHT)}
                        </td>
                      </tr>
                      
                      {/* Materials Rows */}
                      {task.materials.map((material, matIndex) => (
                        <tr key={`${task.id}-${material.id || matIndex}`} className="border-b border-gray-50 bg-gray-25">
                          <td className="py-2 px-3 pl-6 text-gray-700">
                            <div className="flex items-center">
                              <Icon name="Package" size={12} className="text-green-500 mr-1" />
                              <span className="text-xs">{material.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600 text-xs">{material.quantity} {material.unit || ''}</td>
                          <td className="py-2 px-3 text-right text-gray-600 text-xs">
                            {includeMaterialsPrices ? currency(material.unit_price || 0) : ''}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 text-xs">
                            {includeMaterialsPrices ? currency((parseFloat(material.quantity) || 0) * (parseFloat(material.unit_price) || 0)) : ''}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 text-xs">
                            {includeMaterialsPrices ? (() => {
                              const materialTotal = (parseFloat(material.quantity) || 0) * (parseFloat(material.unit_price) || 0);
                              return currency(materialTotal);
                            })() : ''}
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
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Sous-total:</span>
                  <span className="font-medium">{currency(totalPrice)}</span>
                </div>
                {financialConfig.vatConfig?.display && (
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>TVA ({financialConfig.vatConfig.rate}%):</span>
                    <span className="font-medium">{currency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">{currency(totalWithVAT)}</span>
                </div>
                {financialConfig.advanceConfig?.enabled && financialConfig.advanceConfig.amount > 0 && (
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Acompte à la commande:</span>
                    <span className="font-medium">{currency(financialConfig.advanceConfig.amount)}</span>
                  </div>
                )}
                {financialConfig.advanceConfig?.enabled && financialConfig.advanceConfig.amount > 0 && (
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Solde à la livraison:</span>
                    <span className="text-green-600">{currency(totalWithVAT - financialConfig.advanceConfig.amount)}</span>
                  </div>
                )}
                {!includeMaterialsPrices && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    * Les prix des matériaux sont inclus dans le total mais masqués
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {quote.notes && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Icon name="FileText" size={18} className="text-purple-600 mr-2" />
              Notes et conditions
            </h3>
            <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-sm">{quote.notes}</div>
          </div>
        )}

        {/* Signatures Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Icon name="PenTool" size={18} className="text-indigo-600 mr-2" />
            Signatures
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Signature */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800">Signature de l'entreprise</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-24 flex items-center justify-center">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature entreprise" className="max-w-full max-h-20 object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Icon name="PenTool" size={24} className="mx-auto mb-1" />
                    <p className="text-xs">Signature non disponible</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">
                {quote?.company_profile?.company_name || 'Votre Entreprise'}
              </p>
            </div>

            {/* Client Signature */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800">Signature du client</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-24 flex items-center justify-center">
                {clientSignature ? (
                  <img 
                    src={clientSignature.signature_data ? 
                      `data:image/png;base64,${clientSignature.signature_data}` : 
                      clientSignature.signature_file_path ? 
                        getPublicUrl('signatures', clientSignature.signature_file_path) : 
                        null
                    } 
                    alt="Signature client" 
                    className="max-w-full max-h-20 object-contain" 
                  />
                ) : quoteStatus === 'accepted' ? (
                  <div className="text-center text-green-600">
                    <Icon name="CheckCircle" size={24} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">Devis accepté</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Icon name="User" size={24} className="mx-auto mb-1" />
                    <p className="text-xs">En attente de signature</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">
                {quote?.client?.name || 'Client'}
              </p>
              {clientSignature?.customerComment && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Commentaire:</span> {clientSignature.customerComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Display */}
        {quoteStatus === 'accepted' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 text-center border border-green-200">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="CheckCircle" size={32} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-green-800">Devis accepté !</h2>
                <p className="text-green-700 text-lg">Merci pour votre confiance. L'artisan vous contactera bientôt.</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'rejected' && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl shadow-xl p-8 text-center border border-red-200">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="XCircle" size={32} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-red-800">Devis rejeté</h2>
                <p className="text-red-700 text-lg">Votre demande a été enregistrée. L'artisan vous contactera pour discuter des modifications.</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'expired' && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-8 text-center border border-yellow-200">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Icon name="Clock" size={32} className="text-yellow-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-yellow-800">Devis expiré</h2>
                <p className="text-yellow-700 text-lg">Ce devis a dépassé sa date de validité. Veuillez contacter l'artisan pour un nouveau devis.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {quote?.company_profile?.company_name || 'Votre Entreprise'}. 
            Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="XCircle" size={24} className="text-red-600" />
              <h3 className="text-xl font-semibold text-gray-800">Rejeter le devis</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Décrivez la raison du rejet..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectQuote}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Traitement...' : 'Rejeter'}
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
          title="Signature électronique"
          subtitle="Veuillez signer pour accepter ce devis"
          clientName={quote?.client?.name || 'Client'}
        />
      )}
    </div>
  );
};

export default PublicQuoteShareViewer;




