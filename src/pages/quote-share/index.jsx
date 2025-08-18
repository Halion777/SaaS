import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuoteByShareToken } from '../../services/shareService';
import { getSignedUrl } from '../../services/storageService';
import ClientQuoteService from '../../services/clientQuoteService';
import ElectronicSignatureModal from '../quote-creation/components/ElectronicSignatureModal';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const currency = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0)) + '€';

const PublicQuoteShareViewer = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState(null); // null, pending, accepted, rejected
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

        // NEW: Track quote view for analytics and follow-up
        try {
          await ClientQuoteService.trackQuoteView(q.id, token);
        } catch (trackingError) {
          console.error('Error tracking quote view:', trackingError);
          // Don't fail quote loading if tracking fails
        }

        // Check if quote already has client signature or status
        if (q.quote_signatures && q.quote_signatures.length > 0) {
          const clientSignature = q.quote_signatures.find(s => s.signature_type === 'client');
          if (clientSignature) {
            setClientSignature(clientSignature);
            if (clientSignature.signature_mode === 'pending') {
              setQuoteStatus('pending');
            } else {
              setQuoteStatus('accepted');
            }
          }
        } else if (q.status === 'accepted') {
          setQuoteStatus('accepted');
        } else if (q.status === 'rejected') {
          setQuoteStatus('rejected');
        } else if (q.status === 'pending') {
          setQuoteStatus('pending');
        }

        // Build signed URLs for private assets if present
        try {
          if (q?.company_profile?.logo_path) {
            const { data } = await getSignedUrl('company-assets', q.company_profile.logo_path, 3600);
            if (data) setLogoUrl(data);
          }
          if (q?.company_profile?.signature_path) {
            const { data } = await getSignedUrl('company-assets', q.company_profile.signature_path, 3600);
            if (data) setSignatureUrl(data);
          }
        } catch (_) {}
      } catch (e) {
        setError('Erreur lors du chargement du devis.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleAcceptQuote = () => {
    setShowSignatureModal(true);
  };

  const handleRejectQuote = async () => {
    try {
      const rejectionReason = prompt('Veuillez indiquer la raison du refus (optionnel):');
      
      const result = await ClientQuoteService.rejectQuote(quote.id, rejectionReason, token);
      
      if (result.success) {
        setQuoteStatus('rejected');
        alert('Devis refusé. Nous avons été notifiés de votre décision.');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Erreur lors du refus du devis. Veuillez réessayer.');
    }
  };

    const handleSignatureComplete = async (signatureData) => {
    try {
      // Save the signature and update quote status using the service
      const result = await ClientQuoteService.acceptQuote(quote.id, signatureData, token);
      
      if (result.success) {
        // Get the updated signature data from the service response
        const signatureResult = await ClientQuoteService.getClientSignature(quote.id, token);
        if (signatureResult.success && signatureResult.data) {
          setClientSignature(signatureResult.data);
        } else {
          // Fallback to the signature data from the modal
          setClientSignature({
            signature_data: signatureData.signature,
            signed_at: signatureData.signedAt,
            customer_comment: signatureData.clientComment
          });
        }
        setQuoteStatus('accepted');
        setShowSignatureModal(false);
        
        // Show success message
        alert('Devis accepté avec succès ! Votre signature a été enregistrée.');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Erreur lors de l\'acceptation du devis. Veuillez réessayer.');
    }
  };

  const handlePendingSubmit = async () => {
    try {
      const comment = document.getElementById('pendingComment').value.trim();
      if (!comment) {
        alert('Veuillez saisir un commentaire ou une question.');
        return;
      }

      // Create a pending signature record with comment
      const pendingSignatureData = {
        clientEmail: quote?.client?.email || 'client@example.com',
        clientName: quote?.client?.name || 'Client',
        signature: null, // No signature for pending
        clientComment: comment,
        signedAt: new Date().toISOString()
      };

      // Use the service to handle pending status
      const result = await ClientQuoteService.setQuotePending(quote.id, pendingSignatureData, token);
      
      if (result.success) {
        setQuoteStatus('pending');
        setClientSignature(result.data);
        setShowPendingModal(false);
        
        // Show success message
        alert('Votre demande a été envoyée. L\'artisan vous contactera bientôt pour discuter des modifications.');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error setting quote pending:', error);
      alert('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <Icon name="AlertCircle" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Icon name="Home" size={20} className="mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Build grouped preview similar to in-app QuotePreview
  const tasks = (quote?.quote_tasks || []).map(t => ({
    ...t,
    materials: (quote?.quote_materials || []).filter(m => m.quote_task_id === t.id)
  }));
  
  let includeMaterialsPrices = true;
  try {
    const stored = localStorage.getItem('include-materials-prices');
    if (stored != null) includeMaterialsPrices = stored === 'true';
  } catch (_) {}
  
  const tasksSubtotal = tasks.reduce((s, t) => {
    const mat = (t.materials || []).reduce((ms, m) => ms + (Number(m.quantity||0)*Number(m.unit_price||0)), 0);
    return s + Number(t.total_price || 0) + mat;
  }, 0);

  const getFinancialConfig = () => {
    const cfg = Array.isArray(quote?.quote_financial_configs) ? quote.quote_financial_configs[0] : quote?.quote_financial_configs;
    const parseMaybe = (v) => {
      if (!v) return {};
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
      return v;
    };
    const vatConf = parseMaybe(cfg?.vat_config);
    const advConf = parseMaybe(cfg?.advance_config);
    const vatAmount = vatConf?.display ? (tasksSubtotal * Number(vatConf.rate || 0) / 100) : 0;
    const totalWithVat = tasksSubtotal + vatAmount;
    const advanceAmount = advConf?.enabled ? Number(advConf.amount || 0) : 0;
    const balance = totalWithVat - advanceAmount;
    
    return { vatConf, advConf, vatAmount, totalWithVat, advanceAmount, balance };
  };

  const financialConfig = getFinancialConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {quote?.company_profile?.company_name || 'Votre Entreprise'}
                </h1>
                <p className="text-gray-600">{quote?.company_profile?.address}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">DEVIS</div>
              <div className="text-2xl font-bold text-blue-600">{quote?.quote_number || quote?.id}</div>
              <div className="text-sm text-gray-500">
                {quote?.created_at && `Créé le ${new Date(quote.created_at).toLocaleDateString('fr-FR')}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quote Status Banner */}
        {quoteStatus === 'accepted' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center">
              <Icon name="CheckCircle" size={24} className="text-green-600 mr-3" />
            <div>
                <h3 className="text-lg font-semibold text-green-800">Devis accepté !</h3>
                <p className="text-green-700">Merci pour votre confiance. Nous commencerons les travaux bientôt.</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'rejected' && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <Icon name="XCircle" size={24} className="text-red-600 mr-3" />
            <div>
                <h3 className="text-lg font-semibold text-red-800">Devis refusé</h3>
                <p className="text-red-700">Nous comprenons votre décision. N'hésitez pas à nous contacter pour discuter.</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'pending' && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center">
              <Icon name="Clock" size={24} className="text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Devis en attente de modifications</h3>
                <p className="text-yellow-700">
                  Vous avez demandé des modifications. L'artisan vous contactera bientôt pour discuter de vos demandes.
                </p>
                {clientSignature?.customer_comment && (
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Votre commentaire :</strong> {clientSignature.customer_comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Client Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Icon name="User" size={24} className="text-blue-600 mr-3" />
            Informations client
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <p className="text-lg text-gray-900">{quote?.client?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-lg text-gray-900">{quote?.client?.email}</p>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Icon name="Folder" size={24} className="text-blue-600 mr-3" />
            Détails du projet
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-lg text-gray-900">{quote?.title || 'Projet personnalisé'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de validité</label>
              <p className="text-lg text-gray-900">
                {quote?.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '30 jours'}
              </p>
            </div>
          </div>
          </div>

        {/* Quote Details Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Icon name="FileText" size={24} className="text-blue-600 mr-3" />
              Détail du devis
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((t, idx) => {
                  const hours = Number(t.duration||0) > 0 ? Number(t.duration) : 1;
                  const laborTotal = Number(t.total_price||0);
                  const unit = hours > 0 ? laborTotal / hours : laborTotal;
                  return (
                    <React.Fragment key={t.id}>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{idx+1}.1</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{t.description || t.name || `Tâche ${idx+1}`}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center">{hours.toFixed(2)} h</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">{currency(unit)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">{currency(laborTotal)}</td>
                      </tr>
                      {(t.materials||[]).map((m, mi) => {
                        const qty = Number(m.quantity||0);
                        const pu = Number(m.unit_price||0);
                        const line = qty*pu;
                        return (
                          <tr key={`${t.id}-${m.id}`}>
                            <td className="px-6 py-4 text-sm text-gray-500">{idx+1}.{mi+2}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{m.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-center">{qty.toFixed(2)} {m.unit||''}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">{includeMaterialsPrices ? currency(pu) : ''}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{includeMaterialsPrices ? currency(line) : ''}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900" colSpan={4}>SOUS-TOTAL HT</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{currency(tasksSubtotal)}</td>
                      </tr>
                {financialConfig.vatConf?.display && (
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900" colSpan={4}>
                      TVA ({Number(financialConfig.vatConf.rate||0)}%)
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {currency(financialConfig.vatAmount)}
                    </td>
                        </tr>
                      )}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 font-bold text-lg text-blue-900" colSpan={4}>TOTAL TTC</td>
                  <td className="px-6 py-4 text-right font-bold text-lg text-blue-900">
                    {currency(financialConfig.totalWithVat)}
                  </td>
                      </tr>
                {financialConfig.advConf?.enabled && (
                  <>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-gray-900" colSpan={4}>ACOMPTE À LA COMMANDE</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {currency(financialConfig.advanceAmount)}
                      </td>
                          </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-gray-900" colSpan={4}>SOLDE À LA LIVRAISON</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {currency(financialConfig.balance)}
                      </td>
                          </tr>
                        </>
                      )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Icon name="FileText" size={24} className="text-blue-600 mr-3" />
            Conditions générales
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
                {(() => {
                  const cfg = Array.isArray(quote?.quote_financial_configs) ? quote.quote_financial_configs[0] : quote?.quote_financial_configs;
                  const parseMaybe = (v) => { if (!v) return {}; if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } } return v; };
                const defaultConditions = parseMaybe(cfg?.default_conditions)?.text || 'Ce devis est valable 30 jours. Délai de paiement : 30 jours.';
                  return defaultConditions;
                })()}
            </p>
              </div>
            </div>

        {/* Signatures Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Icon name="PenTool" size={24} className="text-blue-600 mr-3" />
            Signatures
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Company Signature */}
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-sm text-gray-500 mb-3">Signature entreprise</div>
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature entreprise" className="mx-auto h-20 object-contain" />
                ) : (
                  <div className="h-20 flex items-center justify-center text-gray-400">
                    <Icon name="PenTool" size={32} />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {quote?.company_profile?.company_name || 'Votre Entreprise'}
                </p>
              </div>
            </div>

            {/* Client Signature */}
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-sm text-gray-500 mb-3">Signature client</div>
                {clientSignature ? (
                  <div>
                    <img src={clientSignature.signature_data} alt="Signature client" className="mx-auto h-20 object-contain" />
                    <p className="text-xs text-gray-500 mt-2">
                      Signé le {new Date(clientSignature.signed_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center text-gray-400">
                    <Icon name="User" size={32} />
              </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {quote?.client?.name || 'Client'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!quoteStatus || quoteStatus === 'sent' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Que souhaitez-vous faire ?</h2>
            <div className="flex flex-col gap-6">
              {/* Accept/Reject Row */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleAcceptQuote}
                  className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
                  iconName="CheckCircle"
                  iconPosition="left"
                >
                  Accepter le devis
                </Button>
                <Button
                  onClick={handleRejectQuote}
                  variant="outline"
                  className="px-8 py-4 text-lg border-red-300 text-red-600 hover:bg-red-50"
                  iconName="XCircle"
                  iconPosition="left"
                >
                  Refuser le devis
                </Button>
              </div>

              {/* Pending with Comment */}
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => setShowPendingModal(true)}
                  variant="outline"
                  className="px-8 py-4 text-lg border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                  iconName="Clock"
                  iconPosition="left"
                >
                  Demander des modifications
                </Button>
                <p className="text-sm text-gray-500">
                  Vous avez des questions ou souhaitez des changements ? Laissez un commentaire.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              En acceptant ce devis, vous confirmez votre accord avec les conditions et tarifs proposés.
            </p>
          </div>
        ) : quoteStatus === 'pending' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-start gap-3 mb-6">
              <Icon name="Clock" size={32} className="text-yellow-600 mt-1" />
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800">Statut en attente</h2>
                <p className="text-gray-600">Vous avez demandé des modifications. L'artisan vous contactera bientôt.</p>
              </div>
            </div>
            
            {clientSignature?.customer_comment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-yellow-800 mb-2">Votre commentaire :</h4>
                <p className="text-yellow-700">{clientSignature.customer_comment}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleAcceptQuote}
                className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
                iconName="CheckCircle"
                iconPosition="left"
              >
                Accepter maintenant
              </Button>
              <Button
                onClick={handleRejectQuote}
                variant="outline"
                className="px-8 py-4 text-lg border-red-300 text-red-600 hover:bg-red-50"
                iconName="XCircle"
                iconPosition="left"
              >
                Refuser maintenant
              </Button>
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

      {/* Electronic Signature Modal */}
      <ElectronicSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSign={handleSignatureComplete}
        quoteData={quote}
      />

      {/* Pending with Comment Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="Clock" size={24} className="text-yellow-600" />
              <h3 className="text-xl font-semibold text-gray-800">Demander des modifications</h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire ou question
              </label>
              <textarea
                id="pendingComment"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Décrivez vos questions, demandes de modification ou préoccupations..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPendingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handlePendingSubmit}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Envoyer
              </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default PublicQuoteShareViewer;


