import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import PeppolService, { generatePEPPOLXML } from '../../../services/peppolService';
import { loadCompanyInfo } from '../../../services/companyInfoService';
import { fetchClients } from '../../../services/clientsService';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const SendPeppolModal = ({ invoice, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [clientPeppolId, setClientPeppolId] = useState('');
  const [peppolParticipants, setPeppolParticipants] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [peppolSettings, setPeppolSettings] = useState(null);

  useEffect(() => {
    if (isOpen && invoice) {
      loadData();
    }
  }, [isOpen, invoice]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load company info
      const company = await loadCompanyInfo(user?.id);
      setCompanyInfo(company);

      // Load Peppol settings
      const peppolService = new PeppolService(true);
      const settings = await peppolService.getPeppolSettings();
      if (settings.success) {
        setPeppolSettings(settings.data);
      }

      // Load client Peppol ID if available
      if (invoice.client?.peppol_id) {
        setClientPeppolId(invoice.client.peppol_id);
      }

      // Load Peppol participants
      const participants = await peppolService.getPeppolParticipants();
      setPeppolParticipants(participants || []);

      // If client has Peppol ID, set it
      if (invoice.client?.peppol_id) {
        setClientPeppolId(invoice.client.peppol_id);
      } else if (participants.length > 0) {
        // Try to find participant by client email
        const matchingParticipant = participants.find(p => 
          p.contact_email === invoice.clientEmail || 
          p.business_name === invoice.clientName
        );
        if (matchingParticipant) {
          setClientPeppolId(matchingParticipant.peppol_identifier);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!clientPeppolId) {
      setError('Veuillez sélectionner un ID Peppol pour le client');
      return;
    }

    if (!companyInfo || !peppolSettings) {
      setError('Informations de l\'entreprise ou configuration Peppol manquantes');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const peppolService = new PeppolService(true);

      // Prepare sender info from company profile and Peppol settings
      const senderInfo = {
        vat_number: companyInfo.vatNumber || '',
        company_name: companyInfo.name || '',
        full_name: companyInfo.name || '',
        address: companyInfo.address || '',
        city: companyInfo.city || '',
        country: companyInfo.country || 'BE',
        zip_code: companyInfo.postalCode || '',
        iban: '' // TODO: Get from company profile if available
      };

      // Prepare receiver info from client
      const receiverInfo = {
        vat_number: invoice.client?.vat_number || '',
        company_name: invoice.clientName || '',
        full_name: invoice.clientName || '',
        address: invoice.client?.address || '',
        city: invoice.client?.city || '',
        country: invoice.client?.country || 'BE',
        zip_code: invoice.client?.postal_code || '',
        peppol_identifier: clientPeppolId,
        contact_name: invoice.clientName || '',
        phone: invoice.client?.phone || '',
        email: invoice.clientEmail || ''
      };

      // Convert invoice to Peppol format
      // Create invoice lines from quote tasks if available, otherwise create a single line
      let invoiceLines = [];
      
      if (invoice.quote?.quote_tasks && invoice.quote.quote_tasks.length > 0) {
        // Use quote tasks as invoice lines
        invoiceLines = invoice.quote.quote_tasks.map((task, index) => {
          const lineNetAmount = parseFloat(task.total_price || task.unit_price || 0);
          const lineTaxAmount = invoice.taxAmount > 0 && invoice.netAmount > 0 
            ? (lineNetAmount * (invoice.taxAmount / invoice.netAmount))
            : 0;
          const vatPercentage = lineNetAmount > 0 ? Math.round((lineTaxAmount / lineNetAmount) * 100) : 21;
          
          return {
            description: task.description || task.name || `Ligne ${index + 1}`,
            quantity: task.quantity || 1,
            unit_price: parseFloat(task.unit_price || 0),
            subtotal: lineNetAmount,
            tax_amount: lineTaxAmount,
            total: lineNetAmount + lineTaxAmount,
            vat_code: 'S', // Standard VAT
            vat_percentage: vatPercentage
          };
        });
      } else {
        // Create a single line from invoice summary
        const netAmount = invoice.netAmount || (invoice.amount - (invoice.taxAmount || 0));
        const taxAmount = invoice.taxAmount || 0;
        const vatPercentage = netAmount > 0 ? Math.round((taxAmount / netAmount) * 100) : 21;

        invoiceLines = [{
          description: invoice.description || invoice.title || 'Service',
          quantity: 1,
          unit_price: netAmount,
          subtotal: netAmount,
          tax_amount: taxAmount,
          total: invoice.amount,
          vat_code: 'S', // Standard VAT
          vat_percentage: vatPercentage
        }];
      }

      const haliqoInvoice = {
        ...invoice,
        items: invoiceLines
      };

      const peppolInvoiceData = peppolService.convertHaliqoInvoiceToPeppol(
        haliqoInvoice,
        senderInfo,
        receiverInfo
      );

      // Generate UBL XML before sending
      const ublXml = generatePEPPOLXML(peppolInvoiceData);

      // Send invoice via Peppol
      const result = await peppolService.sendInvoice(peppolInvoiceData);

      if (result.success) {
        // Extract message ID from result if available
        const messageId = result.messageId || result.data?.messageId || null;

        // Update invoice with Peppol status and UBL XML
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            peppol_enabled: true,
            peppol_status: 'sent',
            receiver_peppol_id: clientPeppolId,
            peppol_sent_at: new Date().toISOString(),
            peppol_message_id: messageId,
            ubl_xml: ublXml
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error('Error updating invoice:', updateError);
          setError('Facture envoyée mais erreur lors de la mise à jour: ' + updateError.message);
        } else {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }
      } else {
        setError(result.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Error sending invoice via Peppol:', err);
      setError(err.message || 'Erreur lors de l\'envoi via Peppol');

      // Update invoice with failed status
      try {
        await supabase
          .from('invoices')
          .update({
            peppol_enabled: true,
            peppol_status: 'failed',
            peppol_error_message: err.message || 'Erreur lors de l\'envoi'
          })
          .eq('id', invoice.id);
      } catch (updateErr) {
        console.error('Error updating invoice status:', updateErr);
      }
    } finally {
      setIsSending(false);
    }
  };

  const participantOptions = peppolParticipants.map(p => ({
    value: p.peppol_identifier,
    label: `${p.business_name || p.peppol_identifier} (${p.peppol_identifier})`
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Send" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Envoyer via Peppol</h2>
                <p className="text-sm text-muted-foreground">Facture {invoice?.number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : !peppolSettings?.isConfigured ? (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="AlertTriangle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Configuration Peppol requise
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Vous devez configurer votre connexion Peppol avant de pouvoir envoyer des factures.
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        navigate('/services/peppol');
                      }}
                      variant="default"
                      className="w-full"
                    >
                      Configurer Peppol
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Client Info */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Client
                </label>
                <p className="text-sm text-muted-foreground">{invoice?.clientName}</p>
              </div>

              {/* Peppol ID Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  ID Peppol du client <span className="text-red-500">*</span>
                </label>
                {participantOptions.length > 0 ? (
                  <Select
                    options={[
                      { value: '', label: 'Sélectionner un ID Peppol' },
                      ...participantOptions
                    ]}
                    value={clientPeppolId}
                    onChange={(e) => setClientPeppolId(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Ex: 0208:0630675588"
                    value={clientPeppolId}
                    onChange={(e) => setClientPeppolId(e.target.value)}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Format: 0208:1234567890 (scheme:identifier)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-error" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !clientPeppolId}
                  iconName={isSending ? "Loader2" : "Send"}
                  iconPosition="left"
                >
                  {isSending ? 'Envoi en cours...' : 'Envoyer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendPeppolModal;

