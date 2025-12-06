import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PeppolService, { generatePEPPOLXML } from '../../../services/peppolService';
import { loadCompanyInfo } from '../../../services/companyInfoService';
import { fetchClients } from '../../../services/clientsService';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const SendPeppolModal = ({ invoice, isOpen, onClose, onSuccess, onOpenEmailModal, validatedPeppolIdentifier = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [clientPeppolId, setClientPeppolId] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [peppolSettings, setPeppolSettings] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      loadData();
      setShowDropdown(false); // Reset dropdown state when modal opens
    }

    // Cleanup timeout on unmount
    return () => {
      if (window.peppolValidationTimeout) {
        clearTimeout(window.peppolValidationTimeout);
      }
    };
  }, [isOpen, invoice]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load Peppol settings (primary source for VAT and Peppol ID)
      const peppolService = new PeppolService(true);
      const settings = await peppolService.getPeppolSettings();
      if (settings.success) {
        setPeppolSettings(settings.data);
        
        // Check if Peppol is disabled
        if (settings.data.peppolDisabled) {
          setError(t('invoicesManagement.sendPeppolModal.errors.peppolDisabled'));
        }
      } else {
        setError(t('invoicesManagement.sendPeppolModal.errors.configNotFound'));
      }

      // Load company info (fallback for address, city, postal code, IBAN)
      try {
        const company = await loadCompanyInfo(user?.id);
        setCompanyInfo(company);
      } catch (companyErr) {
        // Company info not available, will use Peppol settings only
        // Continue without company info - we'll use Peppol settings for most fields
      }

      // Use client's Peppol ID from client table if available
      if (invoice.client?.peppol_id) {
        setClientPeppolId(invoice.client.peppol_id);
        
        // Optimize Check #2: Reuse result from Check #1 if identifier matches
        if (validatedPeppolIdentifier && validatedPeppolIdentifier === invoice.client.peppol_id) {
          // Identifier was already validated in SendInvoiceModal, skip redundant validation
          setIsValid(true);
          setValidationError('');
        } else {
          // Only validate if we don't have a matching validated identifier
        validatePeppolId(invoice.client.peppol_id);
        }
      } else {
        // Reset validation state if no Peppol ID
        setIsValid(false);
        setValidationError('');
      }
    } catch (err) {
      // Error loading data
      setError(t('invoicesManagement.sendPeppolModal.errors.loadDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!clientPeppolId) {
      setError(t('invoicesManagement.sendPeppolModal.errors.clientPeppolIdRequired'));
      return;
    }

    if (!peppolSettings) {
      setError(t('invoicesManagement.sendPeppolModal.errors.configMissing'));
      return;
    }

    // Check if Peppol is disabled
    if (peppolSettings.peppolDisabled) {
      setError(t('invoicesManagement.sendPeppolModal.errors.peppolDisabled'));
      return;
    }

    // Removed redundant Check #4: Validation before send
    // The Peppol ID is already validated on load (Check #2) or on change (Check #3)
    // If isValid is false, it means the ID is invalid and user should fix it before sending

    setIsSending(true);
    setError('');

    try {
      const peppolService = new PeppolService(true);

      // Helper function to convert country name to ISO code
      const countryToISO = (country) => {
        if (!country) return 'BE';
        const countryMap = {
          'belgique': 'BE',
          'belgium': 'BE',
          'france': 'FR',
          'nederland': 'NL',
          'netherlands': 'NL',
          'deutschland': 'DE',
          'germany': 'DE'
        };
        const normalized = country.trim().toLowerCase();
        // If it's already a 2-letter code, return it
        if (country.length === 2) return country.toUpperCase();
        // Otherwise, try to map it
        return countryMap[normalized] || 'BE';
      };

      // Helper function to extract VAT number from Peppol ID
      const extractVATFromPeppolId = (peppolId) => {
        if (!peppolId) return '';
        const parts = peppolId.split(":");
        if (parts.length === 2 && parts[0] === '0208') {
          // Belgian enterprise number: extract 10 digits and add "BE" prefix
          const enterpriseNumber = parts[1];
          if (enterpriseNumber.length === 10) {
            return `BE${enterpriseNumber}`;
          }
        } else if (parts.length === 2 && parts[0] === '9925' && parts[1].startsWith('BE')) {
          // VAT-based identifier: use directly
          return parts[1].toUpperCase();
        }
        return '';
      };

      // Helper function to format VAT number with country prefix
      const formatVATWithCountryPrefix = (vatNumber, countryCode) => {
        if (!vatNumber || vatNumber.trim() === '') return '';
        
        // Clean VAT number (remove any Peppol scheme prefixes)
        let cleanVat = vatNumber.replace(/^\d{4}:/, '').trim();
        
        // Convert country code from name to ISO if needed
        let isoCountryCode = countryCode;
        if (countryCode && countryCode.length > 2) {
          const countryMap = {
            'belgique': 'BE', 'belgium': 'BE', 'france': 'FR', 'nederland': 'NL',
            'netherlands': 'NL', 'deutschland': 'DE', 'germany': 'DE'
          };
          const normalized = countryCode.trim().toLowerCase();
          isoCountryCode = countryMap[normalized] || (countryCode.length === 2 ? countryCode.toUpperCase() : 'BE');
        } else if (countryCode) {
          isoCountryCode = countryCode.toUpperCase();
        } else {
          isoCountryCode = 'BE';
        }
        
        // If VAT number already has country prefix (e.g., "BE0630675588"), return as is (uppercase)
        if (/^[A-Z]{2}\d+$/.test(cleanVat)) {
          return cleanVat.toUpperCase();
        }
        
        // Otherwise, add country prefix
        const countryPrefix = isoCountryCode === 'GR' ? 'EL' : isoCountryCode;
        // Remove any existing country prefix from VAT number if present
        const vatWithoutPrefix = cleanVat.replace(/^[A-Z]{2}/i, '');
        
        return `${countryPrefix}${vatWithoutPrefix}`;
      };

      // Extract VAT number from Peppol ID
      const senderVATNumber = extractVATFromPeppolId(peppolSettings.peppolId);

      // Prepare sender info from Peppol settings (primary) and company profile (fallback for address/IBAN)
      const senderInfo = {
        vat_number: senderVATNumber, // Extract from Peppol ID (already formatted with BE prefix)
        company_name: peppolSettings.name || companyInfo?.name || '', // Use business_name from Peppol settings
        full_name: peppolSettings.contact_person_name || companyInfo?.name || '', // Use name from Peppol settings
        address: companyInfo?.address || '', // Fallback to company info for address
        city: companyInfo?.city || '', // Fallback to company info for city
        country: peppolSettings.countryCode || 'BE', // Use country_code from Peppol settings
        zip_code: companyInfo?.postalCode || '', // Fallback to company info for postal code
        iban: companyInfo?.iban || '', // Get IBAN from company profile (not in Peppol settings)
        peppol_identifier: peppolSettings.peppolId // Use Peppol ID directly from settings
      };

      // Get receiver country code (convert to ISO if needed)
      const receiverCountryCode = countryToISO(invoice.client?.country || 'BE');

      // Format receiver VAT number with country prefix
      const receiverVATNumber = formatVATWithCountryPrefix(
        invoice.client?.vat_number || '',
        receiverCountryCode
      );

      // Prepare receiver info from client
      const receiverInfo = {
        vat_number: receiverVATNumber, // Format with country prefix (e.g., "BE0630344489")
        company_name: invoice.clientName || '',
        full_name: invoice.clientName || '',
        address: invoice.client?.address || '',
        city: invoice.client?.city || '',
        country: receiverCountryCode, // Use ISO country code
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
        // Clear error message on successful send
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            peppol_enabled: true,
            peppol_status: 'sent',
            receiver_peppol_id: clientPeppolId,
            peppol_sent_at: new Date().toISOString(),
            peppol_message_id: messageId,
            ubl_xml: ublXml,
            peppol_error_message: null // Clear any previous error messages
          })
          .eq('id', invoice.id);

        if (updateError) {
          // Error updating invoice
          setError(t('invoicesManagement.sendPeppolModal.errors.updateError') + ': ' + updateError.message);
        } else {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }
      } else {
        console.error('[SendPeppolModal] Send failed:', result);
        setError(result.error || t('invoicesManagement.sendPeppolModal.errors.sendError'));
      }
    } catch (err) {
      // Error sending invoice via Peppol
      console.error('[SendPeppolModal] Error caught:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      setError(err.message || t('invoicesManagement.sendPeppolModal.errors.sendError'));

      // Update invoice with failed status
      try {
        await supabase
          .from('invoices')
          .update({
            peppol_enabled: true,
            peppol_status: 'failed',
            peppol_error_message: err.message || t('invoicesManagement.sendPeppolModal.errors.sendError')
          })
          .eq('id', invoice.id);
      } catch (updateErr) {
        // Error updating invoice status
      }
    } finally {
      setIsSending(false);
    }
  };

  // Validate Peppol ID
  const validatePeppolId = async (peppolId) => {
    if (!peppolId || peppolId.trim() === '') {
      setIsValid(false);
      setValidationError('');
      return;
    }

    setIsValidating(true);
    setValidationError('');
    setIsValid(false);

    try {
      const peppolService = new PeppolService(true);
      const result = await peppolService.getDetailedParticipantInfo(peppolId.trim());

      if (result.success && result.data) {
        // Peppol ID exists and is valid
        setIsValid(true);
        setValidationError('');
      } else {
        // Peppol ID not found or invalid
        setIsValid(false);
        setValidationError(t('invoicesManagement.sendPeppolModal.errors.invalidPeppolId', 'This Peppol ID does not exist in the Peppol network. Please verify the ID and try again.'));
      }
    } catch (err) {
      // Error validating Peppol ID
      setIsValid(false);
      setValidationError(t('invoicesManagement.sendPeppolModal.errors.validationError', 'Unable to validate Peppol ID. Please check your connection and try again.'));
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced validation handler
  const handlePeppolIdChange = (value) => {
    setClientPeppolId(value);
    setIsValid(false);
    setValidationError('');

    // Clear any existing timeout
    if (window.peppolValidationTimeout) {
      clearTimeout(window.peppolValidationTimeout);
    }

    // Debounce validation - wait 800ms after user stops typing
    if (value && value.trim() !== '') {
      window.peppolValidationTimeout = setTimeout(() => {
        validatePeppolId(value);
      }, 800);
    }
  };

  // Check if client has Peppol ID from client table
  const clientHasPeppolId = invoice.client?.peppol_id;

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
                <h2 className="text-xl font-semibold text-foreground">{t('invoicesManagement.sendPeppolModal.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('invoicesManagement.sendPeppolModal.invoice')} {invoice?.number}</p>
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
                      {t('invoicesManagement.sendPeppolModal.configRequired.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('invoicesManagement.sendPeppolModal.configRequired.description')}
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        navigate('/services/peppol');
                      }}
                      variant="default"
                      className="w-full"
                    >
                      {t('invoicesManagement.sendPeppolModal.configRequired.button')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : peppolSettings?.peppolDisabled ? (
            <div className="space-y-4">
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {t('invoicesManagement.sendPeppolModal.peppolDisabled.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('invoicesManagement.sendPeppolModal.peppolDisabled.description')}
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        navigate('/services/peppol');
                      }}
                      variant="default"
                      className="w-full"
                    >
                      {t('invoicesManagement.sendPeppolModal.peppolDisabled.button')}
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
                  {t('invoicesManagement.sendPeppolModal.client')}
                </label>
                <p className="text-sm text-muted-foreground">{invoice?.clientName}</p>
              </div>

              {/* Peppol ID Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('invoicesManagement.sendPeppolModal.clientPeppolId')} <span className="text-red-500">*</span>
                </label>
                {!showDropdown ? (
                  // If client has Peppol ID from client table, show it directly with option to change
                  <div className="space-y-2">
                    <div className={`w-full px-3 py-2 border rounded-lg bg-muted/30 text-foreground flex items-center justify-between relative ${
                      isValidating
                        ? 'border-warning'
                        : isValid && clientPeppolId
                        ? 'border-green-500'
                        : validationError && clientPeppolId
                        ? 'border-error'
                        : 'border-border'
                    }`}>
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-medium">{clientPeppolId || t('invoicesManagement.sendPeppolModal.notDefined')}</span>
                        {isValidating && (
                          <div className="ml-2">
                            <Icon name="Loader2" size={16} className="animate-spin text-warning" />
                          </div>
                        )}
                        {!isValidating && isValid && clientPeppolId && (
                          <div className="ml-2">
                            <Icon name="CheckCircle" size={16} className="text-green-500" />
                          </div>
                        )}
                        {!isValidating && validationError && clientPeppolId && (
                          <div className="ml-2">
                            <Icon name="XCircle" size={16} className="text-error" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDropdown(true)}
                        className="text-xs text-primary hover:underline ml-2"
                      >
                        {t('invoicesManagement.sendPeppolModal.edit')}
                      </button>
                    </div>
                    {validationError && clientPeppolId && (
                      <div className="space-y-1">
                        <p className="text-xs text-error mt-1">{validationError}</p>
                        {onOpenEmailModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenEmailModal(true); // Pass true to indicate it's from invalid Peppol ID
                            }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {t('invoicesManagement.sendPeppolModal.notPeppolUser', 'Not a Peppol user?')}
                          </button>
                        )}
                      </div>
                    )}
                    {isValid && !validationError && clientPeppolId && (
                      <p className="text-xs text-green-600 mt-1">
                        {t('invoicesManagement.sendPeppolModal.peppolIdValid', 'Peppol ID is valid')}
                      </p>
                    )}
                  </div>
                ) : (
                  // Show input field for editing
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={clientPeppolId || ''}
                        onChange={(e) => handlePeppolIdChange(e.target.value)}
                        placeholder="0208:0630675588"
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:border-transparent ${
                          isValidating
                            ? 'border-warning focus:ring-warning'
                            : isValid
                            ? 'border-green-500 focus:ring-green-500'
                            : validationError
                            ? 'border-error focus:ring-error'
                            : 'border-border focus:ring-primary'
                        }`}
                      />
                      {isValidating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icon name="Loader2" size={16} className="animate-spin text-warning" />
                        </div>
                      )}
                      {!isValidating && isValid && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icon name="CheckCircle" size={16} className="text-green-500" />
                        </div>
                      )}
                      {!isValidating && validationError && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icon name="XCircle" size={16} className="text-error" />
                        </div>
                      )}
                    </div>
                    {validationError && (
                      <div className="space-y-1">
                        <p className="text-xs text-error mt-1">{validationError}</p>
                        {onOpenEmailModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenEmailModal(true); // Pass true to indicate it's from invalid Peppol ID
                            }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {t('invoicesManagement.sendPeppolModal.notPeppolUser', 'Not a Peppol user?')}
                          </button>
                        )}
                      </div>
                    )}
                    {isValid && !validationError && (
                      <p className="text-xs text-green-600 mt-1">
                        {t('invoicesManagement.sendPeppolModal.peppolIdValid', 'Peppol ID is valid')}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        // Don't reset validation state when canceling - keep it for read-only view
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t('invoicesManagement.sendPeppolModal.cancel')}
                    </button>
                  </div>
                )}
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
                  {t('invoicesManagement.sendPeppolModal.cancel')}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !clientPeppolId || isValidating || (!isValid && clientPeppolId.trim() !== '')}
                  iconName={isSending ? "Loader2" : "Send"}
                  iconPosition="left"
                >
                  {isSending ? t('invoicesManagement.sendPeppolModal.sending') : t('invoicesManagement.sendPeppolModal.send')}
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

