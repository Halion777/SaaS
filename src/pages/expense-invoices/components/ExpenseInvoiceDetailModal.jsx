import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpenseInvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return t('expenseInvoices.common.notAvailable', 'N/A');
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US').format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: t('expenseInvoices.status.paid', 'Paid'), color: 'bg-success text-success-foreground' },
      pending: { label: t('expenseInvoices.status.pending', 'Pending'), color: 'bg-warning text-warning-foreground' },
      overdue: { label: t('expenseInvoices.status.overdue', 'Overdue'), color: 'bg-error text-error-foreground' }
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
                <h2 className="text-xl font-semibold text-foreground">{t('expenseInvoices.modal.title', 'Invoice Details')}</h2>
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
              {t('expenseInvoices.modal.tabs.details', 'Details')}
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
                {t('expenseInvoices.modal.tabs.peppol', 'Peppol Metadata')}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Invoice Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.invoiceInfo.title', 'Invoice Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.invoiceNumber', 'Invoice Number')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.status', 'Status')}</label>
                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.category', 'Category')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.category || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.source', 'Source')}</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.source === 'peppol' ? (
                        <span className="inline-flex items-center">
                          <Icon name="Globe" size={14} className="mr-1" />
                          {t('expenseInvoices.source.peppol', 'Peppol')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Icon name="Upload" size={14} className="mr-1" />
                          {t('expenseInvoices.source.manual', 'Manual')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.issueDate', 'Issue Date')}</label>
                    <p className="text-sm text-foreground mt-1">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.dueDate', 'Due Date')}</label>
                    <p className="text-sm text-foreground mt-1">{formatDate(invoice.due_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.paymentMethod', 'Payment Method')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.payment_method || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.supplierInfo.title', 'Supplier Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.supplierInfo.name', 'Name')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.supplierInfo.email', 'Email')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_email || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.supplierInfo.vatNumber', 'VAT Number')}</label>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier_vat_number || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                  {invoice.source === 'peppol' && invoice.sender_peppol_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.supplierInfo.peppolId', 'Peppol ID')}</label>
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
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.financialInfo.title', 'Financial Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.financialInfo.totalAmount', 'Total Amount (incl. VAT)')}</label>
                    <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.financialInfo.netAmount', 'Net Amount')}</label>
                    <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.net_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.financialInfo.vatAmount', 'VAT Amount')}</label>
                    <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.vat_amount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.notes', 'Notes')}</h3>
                  <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'peppol' && invoice.source === 'peppol' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.peppolInfo.title', 'Peppol Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.documentType', 'Document Type')}</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.documentTypeLabel || t('expenseInvoices.common.notAvailable', 'N/A')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.selfBilling', 'Self-billing')}</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.isSelfBilling ? t('expenseInvoices.common.yes', 'Yes') : t('expenseInvoices.common.no', 'No')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.creditNote', 'Credit Note')}</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_metadata?.isCreditNote ? t('expenseInvoices.common.yes', 'Yes') : t('expenseInvoices.common.no', 'No')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.receivedDate', 'Receipt Date')}</label>
                    <p className="text-sm text-foreground mt-1">
                      {invoice.peppol_received_at ? formatDate(invoice.peppol_received_at) : t('expenseInvoices.common.notAvailable', 'N/A')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Peppol Metadata */}
              {invoice.peppol_metadata && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.peppolInfo.additionalMetadata', 'Additional Metadata')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invoice.peppol_metadata.buyerReference && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.buyerReference', 'Buyer Reference')}</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.buyerReference}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.orderReference && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.orderReference', 'Order Reference')}</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.orderReference}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.salesOrderId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.salesOrderId', 'Sales Order ID')}</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.salesOrderId}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.deliveryDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.deliveryDate', 'Delivery Date')}</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppol_metadata.deliveryDate)}</p>
                      </div>
                    )}
                    {invoice.peppol_metadata.documentCurrencyCode && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.currency', 'Currency')}</label>
                        <p className="text-sm text-foreground mt-1">{invoice.peppol_metadata.documentCurrencyCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Lines */}
              {invoice.peppol_metadata?.invoiceLines && invoice.peppol_metadata.invoiceLines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.peppolInfo.invoiceLines', 'Invoice Lines')}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.id', 'ID')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.description', 'Description')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.quantity', 'Quantity')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.unitPrice', 'Unit Price')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.amount', 'Amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.peppol_metadata.invoiceLines.map((line, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-foreground">{line.id || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{line.description || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{line.quantity || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
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
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('expenseInvoices.modal.peppolInfo.taxInformation', 'Tax Information')}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.category', 'Category')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.rate', 'Rate (%)')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.taxableAmount', 'Taxable Amount')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.vatAmount', 'VAT Amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.peppol_metadata.taxSubtotals.map((tax, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-foreground">{tax.category || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
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
              {t('expenseInvoices.modal.close', 'Close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInvoiceDetailModal;

