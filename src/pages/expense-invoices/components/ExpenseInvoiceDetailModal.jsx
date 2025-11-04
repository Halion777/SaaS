import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpenseInvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Payée', color: 'bg-success text-success-foreground' },
      pending: { label: 'En attente', color: 'bg-warning text-warning-foreground' },
      overdue: { label: 'En retard', color: 'bg-error text-error-foreground' }
    };
    const config = statusConfig[status] || statusConfig.pending;
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
                <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
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
            {invoice.source === 'peppol' && (
              <button
                onClick={() => setActiveTab('peppol')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'peppol'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Métadonnées Peppol
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
                    <p className="text-sm text-foreground mt-1">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Statut</label>
                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
                    <p className="text-sm text-foreground mt-1">{invoice.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Source</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.source === 'peppol' ? (
                        <span className="inline-flex items-center">
                          <Icon name="Globe" size={14} className="mr-1" />
                          Peppol
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Icon name="Upload" size={14} className="mr-1" />
                          Manuel
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date d'émission</label>
                    <p className="text-sm text-foreground mt-1">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date d'échéance</label>
                    <p className="text-sm text-foreground mt-1">{formatDate(invoice.due_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Méthode de paiement</label>
                    <p className="text-sm text-foreground mt-1">{invoice.payment_method || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Informations fournisseur</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Numéro TVA</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_vat_number || 'N/A'}</p>
                  </div>
                  {invoice.source === 'peppol' && invoice.sender_peppol_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID Peppol</label>
                      <p className="text-sm text-foreground mt-1 flex items-center">
                        <Icon name="Globe" size={14} className="mr-1 text-blue-600" />
                        {invoice.sender_peppol_id}
                      </p>
                    </div>
                  )}
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
                    <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.net_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Montant TVA</label>
                    <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.vat_amount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                  <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'peppol' && invoice.source === 'peppol' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Informations Peppol</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type de document</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.documentTypeLabel || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Auto-facturation</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.isSelfBilling ? 'Oui' : 'Non'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Note de crédit</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.isCreditNote ? 'Oui' : 'Non'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de réception</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_received_at ? formatDate(invoice.peppol_received_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Peppol Metadata */}
              {invoice.peppol_metadata && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Métadonnées supplémentaires</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invoice.peppol_metadata.buyerReference && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Référence acheteur</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.buyerReference}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.orderReference && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Référence commande</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.orderReference}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.salesOrderId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID commande de vente</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.salesOrderId}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.deliveryDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date de livraison</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppol_metadata.deliveryDate)}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.documentCurrencyCode && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Devise</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.documentCurrencyCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Lines */}
              {invoice.peppol_metadata?.invoiceLines && invoice.peppol_metadata.invoiceLines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Lignes de facture</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Quantité</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Prix unitaire</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.peppol_metadata.invoiceLines.map((line, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-foreground">{line.id || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{line.description || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{line.quantity || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(line.unitPrice || 0)}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(line.lineExtensionAmount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tax Information */}
              {invoice.peppol_metadata?.taxSubtotals && invoice.peppol_metadata.taxSubtotals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informations fiscales</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Catégorie</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Taux (%)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Montant taxable</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Montant TVA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.peppol_metadata.taxSubtotals.map((tax, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-foreground">{tax.category || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{tax.percent || 0}%</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(tax.taxableAmount || 0)}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(tax.taxAmount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInvoiceDetailModal;

