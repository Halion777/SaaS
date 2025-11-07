import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import SendPeppolModal from './SendPeppolModal';
import SendEmailModal from './SendEmailModal';

const SendInvoiceModal = ({ invoice, isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [sendMethod, setSendMethod] = useState(null); // 'peppol' or 'email'
  
  // Determine client type
  const clientType = invoice?.client?.client_type || invoice?.client?.type;
  const isProfessional = clientType === 'company' || clientType === 'professionnel';
  const isIndividual = clientType === 'individual' || clientType === 'particulier';

  useEffect(() => {
    if (isOpen && invoice) {
      // Reset send method when modal opens
      setSendMethod(null);
    }
  }, [isOpen, invoice]);

  const handleMethodSelect = (method) => {
    setSendMethod(method);
  };

  const handleClose = () => {
    setSendMethod(null);
    onClose();
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
      />
    );
  }

  // Show method selection
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Envoyer la facture</h2>
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
                {invoice.client?.name || 'Client'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isProfessional 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isProfessional ? 'Professionnel' : 'Particulier'}
              </span>
            </div>
          </div>

          {/* Send Options */}
          <div className="space-y-3">
            {isProfessional && (
              <button
                onClick={() => handleMethodSelect('peppol')}
                className="w-full p-4 border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Network" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">Envoyer via Peppol</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envoi sécurisé via le réseau Peppol (nécessite un ID Peppol)
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            )}

            <button
              onClick={() => handleMethodSelect('email')}
              className="w-full p-4 border-2 border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Mail" size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Envoyer par email</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envoi de la facture par email avec PDF en pièce jointe
                  </p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Info Note */}
          {isProfessional && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Les clients professionnels peuvent recevoir des factures via Peppol s'ils ont un ID Peppol configuré.
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

