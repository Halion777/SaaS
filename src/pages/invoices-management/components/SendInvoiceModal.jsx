import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import SendPeppolModal from './SendPeppolModal';
import SendEmailModal from './SendEmailModal';
import PeppolService from '../../../services/peppolService';

const SendInvoiceModal = ({ invoice, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sendMethod, setSendMethod] = useState(null); // 'peppol' or 'email'
  const [fromInvalidPeppolId, setFromInvalidPeppolId] = useState(false); // Track if email modal opened from invalid Peppol ID
  const [isCheckingReceiver, setIsCheckingReceiver] = useState(false);
  const [receiverOnPeppol, setReceiverOnPeppol] = useState(null); // null = not checked, true = on Peppol, false = not on Peppol
  
  // Determine client type
  const clientType = invoice?.client?.client_type || invoice?.client?.type;
  const isProfessional = clientType === 'company' || clientType === 'professionnel';
  const isIndividual = clientType === 'individual' || clientType === 'particulier';
  
  // Check Peppol status for professional clients
  const peppolStatus = invoice?.peppol_status || invoice?.peppolStatus;
  const isPeppolFailed = peppolStatus === 'failed';
  const isPeppolNotSent = !peppolStatus || peppolStatus === 'not_sent';
  // Show warning for both failed and not_sent invoices when sending via email
  const shouldShowEmailWarning = isPeppolFailed || isPeppolNotSent;

  // Check receiver capability when modal opens (for professional clients)
  useEffect(() => {
    if (isOpen && invoice && isProfessional) {
      checkReceiverCapability();
    } else if (isOpen && invoice && isIndividual) {
      // For individual clients, no need to check
      setReceiverOnPeppol(false);
      setIsCheckingReceiver(false);
    }
  }, [isOpen, invoice, isProfessional]);

  const checkReceiverCapability = async () => {
    setIsCheckingReceiver(true);
    setReceiverOnPeppol(null);
    
    try {
      // Get receiver VAT number
      const receiverVatNumber = invoice.client?.vat_number || invoice.client?.vatNumber;
      
      if (!receiverVatNumber) {
        console.warn('No VAT number found for receiver, cannot check Peppol capability');
        setReceiverOnPeppol(false);
        setIsCheckingReceiver(false);
        return;
      }

      // Get client's country code to help normalize VAT number if needed
      const clientCountry = invoice.client?.country || null;
      // Extract country code from country string (e.g., "Belgium" -> "BE", "BE" -> "BE")
      let countryCode = null;
      if (clientCountry) {
        // If country is already a 2-letter code
        if (/^[A-Z]{2}$/i.test(clientCountry.trim())) {
          countryCode = clientCountry.trim().toUpperCase();
        } else {
          // Try to map country name to code (common cases)
          const countryMap = {
            'belgium': 'BE',
            'belgique': 'BE',
            'belgië': 'BE',
            'netherlands': 'NL',
            'pays-bas': 'NL',
            'nederland': 'NL',
            'france': 'FR',
            'germany': 'DE',
            'deutschland': 'DE',
            'allemagne': 'DE'
          };
          countryCode = countryMap[clientCountry.toLowerCase().trim()] || null;
        }
      }

      // Check if receiver is on Peppol
      const peppolService = new PeppolService(true);
      const capabilityCheck = await peppolService.checkReceiverCapability(receiverVatNumber, countryCode);
      
      setReceiverOnPeppol(capabilityCheck.found);
      
      // Auto-select Peppol if receiver is on Peppol (regardless of invoice status)
      // The warning only applies when sending via email, not when blocking Peppol
      if (capabilityCheck.found) {
        setSendMethod('peppol');
      } else {
        // If receiver not on Peppol, show email option
        setSendMethod(null);
      }
    } catch (error) {
      console.error('Error checking receiver capability:', error);
      // On error, assume receiver is not on Peppol to be safe
      setReceiverOnPeppol(false);
      setSendMethod(null);
    } finally {
      setIsCheckingReceiver(false);
    }
  };

  // Determine if email option should be shown
  // Show email option for:
  // - Individual clients (always)
  // - Professional clients not on Peppol
  // - Professional clients on Peppol (as fallback option)
  const showEmailOption = isIndividual || 
    (isProfessional && (receiverOnPeppol === false || receiverOnPeppol === true));
  
  // Determine if Peppol option should be shown
  // Show Peppol option if receiver is on Peppol (regardless of invoice status)
  // The warning only applies when sending via email, not when blocking Peppol
  const showPeppolOption = isProfessional && receiverOnPeppol === true;

  const handleMethodSelect = (method) => {
    setSendMethod(method);
  };

  const handleClose = () => {
    setSendMethod(null);
    setFromInvalidPeppolId(false);
    onClose();
  };

  const handleOpenEmailModal = (isFromInvalidPeppolId = false) => {
    setFromInvalidPeppolId(isFromInvalidPeppolId);
    setSendMethod('email');
  };

  const handleSuccess = () => {
    setSendMethod(null);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  if (!isOpen || !invoice) return null;

  // For individual clients, directly open email modal (no Peppol option)
  if (isIndividual) {
    return (
      <SendEmailModal
        invoice={invoice}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        isProfessionalClient={false}
      />
    );
  }

  // If method is selected, show the appropriate modal
  if (sendMethod === 'peppol') {
    return (
      <SendPeppolModal
        invoice={invoice}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        onOpenEmailModal={handleOpenEmailModal}
      />
    );
  }

  if (sendMethod === 'email') {
    return (
      <SendEmailModal
        invoice={invoice}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        isProfessionalClient={isProfessional}
        fromInvalidPeppolId={fromInvalidPeppolId}
        isPeppolFailed={isPeppolFailed}
        isPeppolNotSent={isPeppolNotSent}
        shouldShowEmailWarning={shouldShowEmailWarning}
      />
    );
  }

  // Show method selection
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{t('invoicesManagement.sendModal.title')}</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Client Type Info */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="User" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {invoice.client?.name || t('invoicesManagement.sendModal.client')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isProfessional 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isProfessional ? t('invoicesManagement.sendModal.professional') : t('invoicesManagement.sendModal.individual')}
              </span>
            </div>
          </div>

          {/* Send Options */}
          <div className="space-y-3">
            {/* Show loading state while checking receiver capability */}
            {isProfessional && isCheckingReceiver && (
              <div className="w-full p-4 border-2 border-border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon name="Loader" size={20} className="text-muted-foreground animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('invoicesManagement.sendModal.checkingReceiver', 'Checking receiver...')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('invoicesManagement.sendModal.checkingReceiverDescription', 'Verifying if receiver is registered on Peppol network')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show Peppol option only if receiver is on Peppol */}
            {isProfessional && !isCheckingReceiver && showPeppolOption && (
              <button
                onClick={() => handleMethodSelect('peppol')}
                className="w-full p-4 border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Network" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{t('invoicesManagement.sendModal.sendViaPeppol')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('invoicesManagement.sendModal.sendViaPeppolDescription')}
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            )}

            {/* Show email option for individual clients or professional clients not on Peppol */}
            {!isCheckingReceiver && showEmailOption && (
              <button
                onClick={() => handleMethodSelect('email')}
                className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                  isProfessional && (receiverOnPeppol === false || shouldShowEmailWarning)
                    ? 'border-warning hover:bg-warning/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isProfessional && (receiverOnPeppol === false || shouldShowEmailWarning)
                      ? 'bg-warning/10'
                      : 'bg-blue-100'
                  }`}>
                    <Icon name="Mail" size={20} className={isProfessional && (receiverOnPeppol === false || shouldShowEmailWarning) ? "text-warning" : "text-blue-600"} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{t('invoicesManagement.sendModal.sendViaEmail')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isProfessional && receiverOnPeppol === false
                        ? t('invoicesManagement.sendModal.receiverNotOnPeppol', 'Receiver is not registered on Peppol network. Please send via email.')
                        : isProfessional && shouldShowEmailWarning
                        ? t('invoicesManagement.sendModal.sendViaEmailWarning', 'This is not the actual invoice. You must send via Peppol to get paid.')
                        : t('invoicesManagement.sendModal.sendViaEmailDescription')
                      }
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            )}
          </div>

          {/* Info Note */}
          {isProfessional && !isCheckingReceiver && (
            <div className={`border rounded-lg p-3 ${
              receiverOnPeppol === false
                ? 'bg-warning/10 border-warning/20'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                <Icon 
                  name="Info" 
                  size={16} 
                  className={`flex-shrink-0 mt-0.5 ${
                    receiverOnPeppol === false ? 'text-warning' : 'text-blue-600'
                  }`} 
                />
                <p className={`text-xs ${
                  receiverOnPeppol === false ? 'text-warning-foreground' : 'text-blue-800'
                }`}>
                  {receiverOnPeppol === false
                    ? t('invoicesManagement.sendModal.receiverNotOnPeppolInfo', 'The receiver is not registered on the Peppol network. Please send the invoice via email. For professional clients, Peppol is the preferred method for invoice delivery.')
                    : t('invoicesManagement.sendModal.professionalInfo')
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;

