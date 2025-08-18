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
        alert('Devis rejeté avec succès.');
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
        vatConfig: { rate: 20, display: true },
        advanceConfig: { enabled: false, amount: 0 },
        discountConfig: { enabled: false, rate: 0 }
      };
    }
    return quote.quote_financial_configs[0];
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

  // Calculate totals
  const totalPrice = quote.quote_tasks?.reduce((sum, task) => {
    const taskMaterialsTotal = task.materials?.reduce(
      (matSum, mat) => matSum + ((parseFloat(mat.price) || 0) * (parseFloat(mat.quantity) || 0)),
      0
    ) || 0;
    return sum + (parseFloat(task.price) || 0) + taskMaterialsTotal;
  }, 0) || 0;

  const vatAmount = financialConfig.vatConfig?.display ? (totalPrice * (financialConfig.vatConfig.rate || 20) / 100) : 0;
  const totalWithVAT = totalPrice + vatAmount;

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
        {/* Quote Status Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Ce devis a été envoyé par {quote?.company_profile?.company_name || 'Biarritz Artisanat'}. 
              Vous pouvez accepter le devis si vous en êtes satisfait, ou le rejeter si vous souhaitez apporter des modifications.
            </p>
            
            {(quoteStatus === 'sent' || quoteStatus === 'viewed') && (
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Rejeter
                </Button>
                <Button
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? 'Traitement...' : 'Accepter'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2">
                <img 
                  src="https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=👷" 
                  alt="Artisan" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">DEVIS</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
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
            </div>

            <div className="text-left text-sm text-gray-600 space-y-1">
              <div><strong>Date du devis:</strong> {quote?.created_at ? new Date(quote.created_at).toLocaleDateString('fr-FR') : 'N/A'}</div>
              <div><strong>Date d'expiration:</strong> {quote?.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'N/A'}</div>
              <div><strong>N° du devis:</strong> {quote?.quote_number || quote?.id}</div>
            </div>
          </div>
        </div>

        {/* Quote Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sender Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">De</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium">{quote?.company_profile?.company_name || 'Biarritz Artisanat'}</p>
                <p>{quote?.company_profile?.address || '42 Rue des Lys'}</p>
                {quote?.company_profile?.city && quote.company_profile.city !== 'N/A' && (
                  <p>{quote.company_profile.city}</p>
                )}
                <p>{quote?.company_profile?.postal_code || '75005'}</p>
                <p>{quote?.company_profile?.country || 'France'}</p>
                <p>{quote?.company_profile?.phone || ''}</p>
                <p>{quote?.company_profile?.email || ''}</p>
              </div>
            </div>

            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Destinataire</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium">{quote?.client?.name || 'Client'}</p>
                <div className="mt-4">
                  <p className="font-medium text-sm text-gray-500">Adresse de facturation:</p>
                  <p>{quote?.client?.address || '25 rue d\'Orsel'}</p>
                  {quote?.client?.city && quote.client.city !== 'N/A' && (
                    <p>{quote.client.city}</p>
                  )}
                  <p>{quote?.client?.postal_code || '75018'}</p>
                  <p>{quote?.client?.country || 'France'}</p>
                </div>
                {quote?.client?.delivery_address && (
                  <div className="mt-4">
                    <p className="font-medium text-sm text-gray-500">Adresse de livraison:</p>
                    <p>{quote.client.delivery_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Détails des prestations</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Quantité</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Prix unitaire</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">TVA (%)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Montant HT</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">TVA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.quote_tasks?.map((task, index) => (
                  <tr key={task.id || index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{task.name || task.description}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{task.quantity || 1}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{currency(task.unit_price || task.price)}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{financialConfig.vatConfig?.rate || 20}%</td>
                    <td className="py-3 px-4 text-right text-gray-600">{currency((task.quantity || 1) * (task.unit_price || task.price))}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{currency(((task.quantity || 1) * (task.unit_price || task.price)) * (financialConfig.vatConfig?.rate || 20) / 100)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">{currency(((task.quantity || 1) * (task.unit_price || task.price)) * (1 + (financialConfig.vatConfig?.rate || 20) / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Materials Table if exists */}
          {quote.quote_materials && quote.quote_materials.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Matériaux</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Matériau</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Quantité</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Prix unitaire</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.quote_materials.map((material, index) => (
                      <tr key={material.id || index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-800">{material.name}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{material.quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{currency(material.price)}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-800">{currency(material.quantity * material.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 flex justify-end">
            <div className="text-right space-y-2">
              <div className="text-gray-600">
                <span className="mr-4">Sous-total (HT):</span>
                <span className="font-medium">{currency(totalPrice)}</span>
              </div>
              {financialConfig.vatConfig?.display && (
                <div className="text-gray-600">
                  <span className="mr-4">TVA:</span>
                  <span className="font-medium">{currency(vatAmount)}</span>
                </div>
              )}
              {financialConfig.discountConfig?.enabled && (
                <div className="text-gray-600">
                  <span className="mr-4">Remise ({financialConfig.discountConfig.rate}%):</span>
                  <span className="font-medium">-{currency(totalPrice * financialConfig.discountConfig.rate / 100)}</span>
                </div>
              )}
              {financialConfig.advanceConfig?.enabled && (
                <div className="text-gray-600">
                  <span className="mr-4">Acompte:</span>
                  <span className="font-medium">{currency(financialConfig.advanceConfig.amount)}</span>
                </div>
              )}
              <div className="text-lg font-bold text-gray-800">
                <span className="mr-4">Total (TTC):</span>
                <span>{currency(totalWithVAT)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {quote.notes && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes et conditions</h3>
            <div className="text-gray-600 whitespace-pre-wrap">{quote.notes}</div>
          </div>
        )}

        {/* Status Display */}
        {quoteStatus === 'accepted' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Icon name="CheckCircle" size={32} className="text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Devis accepté !</h2>
                <p className="text-gray-600">Merci pour votre confiance. L'artisan vous contactera bientôt.</p>
              </div>
            </div>
            {clientSignature && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Signature du client:</p>
                <img src={clientSignature} alt="Signature" className="max-w-xs mx-auto border border-gray-300 rounded" />
              </div>
            )}
          </div>
        )}

        {quoteStatus === 'rejected' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Icon name="XCircle" size={32} className="text-red-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Devis rejeté</h2>
                <p className="text-gray-600">Votre demande a été enregistrée. L'artisan vous contactera pour discuter des modifications.</p>
              </div>
            </div>
          </div>
        )}

        {quoteStatus === 'expired' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Icon name="Clock" size={32} className="text-gray-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Devis expiré</h2>
                <p className="text-gray-600">Ce devis a dépassé sa date de validité. Veuillez contacter l'artisan pour un nouveau devis.</p>
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




