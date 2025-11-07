import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !invoice) return null;

  // Determine client type
  const clientType = invoice?.client?.client_type || invoice?.client?.type;
  const isProfessional = clientType === 'company' || clientType === 'professionnel';
  
  // Show Peppol tab only for professional clients who have Peppol enabled
  const showPeppolTab = isProfessional && invoice.peppolEnabled;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Payée', color: 'bg-success text-success-foreground' },
      unpaid: { label: 'Non payée', color: 'bg-warning text-warning-foreground' },
      overdue: { label: 'En retard', color: 'bg-error text-error-foreground' },
      cancelled: { label: 'Annulée', color: 'bg-muted text-muted-foreground' }
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPeppolStatusBadge = (status) => {
    const statusConfig = {
      not_sent: { label: 'Non envoyée', color: 'bg-muted text-muted-foreground' },
      sending: { label: 'Envoi en cours', color: 'bg-warning text-warning-foreground' },
      sent: { label: 'Envoyée', color: 'bg-primary text-primary-foreground' },
      delivered: { label: 'Livrée', color: 'bg-success text-success-foreground' },
      failed: { label: 'Échouée', color: 'bg-error text-error-foreground' }
    };
    const config = statusConfig[status] || statusConfig.not_sent;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Détails de la facture</h2>
                <p className="text-sm text-muted-foreground">{invoice.number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Détails
            </button>
            {showPeppolTab && (
              <button
                onClick={() => setActiveTab('peppol')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'peppol'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Peppol
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Invoice Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations de la facture</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Numéro de facture</label>
                      <p className="text-sm text-foreground mt-1">{invoice.number}</p>
                    </div>
                    {invoice.quoteNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Numéro de devis</label>
                        <p className="text-sm text-foreground mt-1">{invoice.quoteNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Statut</label>
                      <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date d'émission</label>
                      <p className="text-sm text-foreground mt-1">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date d'échéance</label>
                      <p className="text-sm text-foreground mt-1">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Méthode de paiement</label>
                      <p className="text-sm text-foreground mt-1">{invoice.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations client</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nom</label>
                      <p className="text-sm text-foreground mt-1">{invoice.clientName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm text-foreground mt-1">{invoice.clientEmail || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations financières</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Montant total (TTC)</label>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Montant HT</label>
                      <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.netAmount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Montant TVA</label>
                      <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.taxAmount)}</p>
                    </div>
                    {invoice.discountAmount > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Remise</label>
                        <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.discountAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {invoice.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Description</h3>
                    <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.description}</p>
                  </div>
                )}

                {/* Notes */}
                {invoice.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                    <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'peppol' && showPeppolTab && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations Peppol</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Statut Peppol</label>
                      <div className="mt-1">{getPeppolStatusBadge(invoice.peppolStatus)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID Peppol du client</label>
                      <p className="text-sm text-foreground mt-1 flex items-center">
                        <Icon name="Globe" size={14} className="mr-1 text-blue-600" />
                        {invoice.receiverPeppolId || 'N/A'}
                      </p>
                    </div>
                    {invoice.peppolSentAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date d'envoi</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppolSentAt)}</p>
                      </div>
                    )}
                    {invoice.peppolDeliveredAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date de livraison</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppolDeliveredAt)}</p>
                      </div>
                    )}
                    {invoice.peppolMessageId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Message ID</label>
                        <p className="text-sm text-foreground mt-1 font-mono">{invoice.peppolMessageId}</p>
                      </div>
                    )}
                    {invoice.peppolErrorMessage && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Message d'erreur</label>
                        <p className="text-sm text-error mt-1 bg-error/10 p-3 rounded-lg">{invoice.peppolErrorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

