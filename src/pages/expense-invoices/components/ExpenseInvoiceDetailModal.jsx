import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { ExpenseInvoicesService } from '../../../services/expenseInvoicesService';

const ExpenseInvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Reset tab to 'details' when invoice changes or if invoice is not Peppol
  useEffect(() => {
    if (invoice && isOpen) {
      // Reset to 'details' if invoice doesn't have Peppol source
      if (invoice.source !== 'peppol') {
        setActiveTab('details');
      }
    }
  }, [invoice?.id, isOpen]);

  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount) => {
    // Always use comma as decimal separator (fr-FR format) to match quote creation flow
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return t('expenseInvoices.common.notAvailable', 'N/A');
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US').format(new Date(date));
  };

  const formatCategory = (category) => {
    if (!category) return t('expenseInvoices.common.notAvailable', 'N/A');
    // Convert snake_case or kebab-case to Title Case
    return category
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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


  const mapPaymentMethod = (code) => {
    const mappings = {
      '31': t('expenseInvoices.paymentMethods.creditTransfer', 'Credit transfer'),
      '42': t('expenseInvoices.paymentMethods.paymentCard', 'Payment card'),
      '48': t('expenseInvoices.paymentMethods.directDebit', 'Direct debit'),
      '49': t('expenseInvoices.paymentMethods.directDebit', 'Direct debit'),
      'DD': t('expenseInvoices.paymentMethods.directDebit', 'Direct debit'),
      'PP': t('expenseInvoices.paymentMethods.paypal', 'PayPal'),
      'CC': t('expenseInvoices.paymentMethods.creditCard', 'Credit card')
    };
    return mappings[code] || `${t('expenseInvoices.paymentMethods.code', 'Code')}: ${code}`;
  };

  // Use exact VAT percentage from UBL XML - no calculations
  const getTaxPercent = (tax) => {
    // Use exact value from UBL XML <cbc:Percent> element
    // Priority: percent (from TaxCategory/Percent) > taxPercent (fallback)
    return tax?.percent || tax?.taxPercent || 0;
  };

  const buyerRef = invoice?.peppol_metadata?.buyerReference;
  const messageId = invoice?.peppol_message_id || invoice?.peppol_metadata?.messageId;

  // Helper to get display invoice number (prefer original client invoice number from buyerReference)
  const getDisplayInvoiceNumber = (invoice) => {
    // For Peppol invoices, check if buyerReference contains the original client invoice number
    if (invoice.source === 'peppol' && invoice.peppol_metadata?.buyerReference) {
      const buyerRef = invoice.peppol_metadata.buyerReference;
      // If buyerReference looks like a client invoice number (INV-* or FACT-*), use it
      // This ensures consistency - users see the same invoice number they sent
      if (buyerRef && (buyerRef.match(/^(INV|FACT)-\d+$/i) || buyerRef.startsWith('INV-') || buyerRef.startsWith('FACT-'))) {
        return buyerRef;
      }
    }
    // Also check the invoice_number itself - if it's from UBL XML (cbc:ID), it should be the original invoice number
    // The invoice_number should match what was sent (INV-000001 format)
    if (invoice.source === 'peppol' && invoice.invoice_number && 
        (invoice.invoice_number.match(/^(INV|FACT)-\d+$/i) || invoice.invoice_number.startsWith('INV-') || invoice.invoice_number.startsWith('FACT-'))) {
      return invoice.invoice_number;
    }
    // Otherwise, use the stored invoice_number (Peppol-generated or manual)
    return invoice.invoice_number;
  };

  // Helper to get Peppol invoice number (for display in details)
  const getPeppolInvoiceNumber = (invoice) => {
    // For Peppol invoices, return the Peppol-generated invoice number
    if (invoice.source === 'peppol') {
      return invoice.invoice_number;
    }
    return null;
  };

  const displayInvoiceNumber = getDisplayInvoiceNumber(invoice);
  const peppolInvoiceNumber = getPeppolInvoiceNumber(invoice);
  const showPeppolNumber = invoice.source === 'peppol' && peppolInvoiceNumber !== displayInvoiceNumber;
  
  // Check if PDF attachment is available
  const pdfAttachmentPath = invoice.peppol_metadata?.pdfAttachmentPath;
  const hasPDFAttachment = pdfAttachmentPath && invoice.source === 'peppol';
  
  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!hasPDFAttachment || !pdfAttachmentPath) return;
    
    setIsDownloadingPDF(true);
    try {
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.getFileDownloadUrl(pdfAttachmentPath);
      
      if (result.success) {
        // Open PDF in new tab for download
        window.open(result.data, '_blank');
      } else {
        alert(t('expenseInvoices.errors.downloadError', 'Error downloading PDF: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(t('expenseInvoices.errors.downloadError', 'Error downloading PDF: {{error}}', { error: error.message }));
    } finally {
      setIsDownloadingPDF(false);
    }
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
                <p className="text-sm text-muted-foreground">{displayInvoiceNumber}</p>
                {showPeppolNumber && (
                  <p className="text-xs text-muted-foreground mt-1">Peppol: {peppolInvoiceNumber}</p>
                )}
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
                    <p className="text-sm text-foreground mt-1">{displayInvoiceNumber}</p>
                    {showPeppolNumber && (
                      <p className="text-xs text-muted-foreground mt-1">Peppol Invoice Number: {peppolInvoiceNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.status', 'Status')}</label>
                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.invoiceInfo.category', 'Category')}</label>
                    <p className="text-sm text-foreground mt-1">{formatCategory(invoice.category)}</p>
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
            <p className="text-sm text-foreground mt-1">
              {invoice.payment_method
                || invoice.peppol_metadata?.payment?.meansName
                || (invoice.peppol_metadata?.payment?.meansCode ? mapPaymentMethod(invoice.peppol_metadata.payment.meansCode) : t('expenseInvoices.common.notAvailable', 'N/A'))
              }
            </p>
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
                  <ul className="text-sm text-foreground bg-muted/30 p-4 rounded-lg list-disc list-inside space-y-1">
                    {invoice.notes
                      .split(/\r?\n/)
                      .map((noteLine, idx) => noteLine.trim())
                      .filter(Boolean)
                      .map((noteLine, idx) => (
                        <li key={idx}>{noteLine}</li>
                      ))}
                  </ul>
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
                    {(messageId && buyerRef && messageId === buyerRef) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.messageIdAndBuyerReference', 'Message ID / Buyer Reference')}</label>
                        <p className="text-sm text-foreground mt-1">{messageId}</p>
                      </div>
                    )}
                    {(messageId && (!buyerRef || messageId !== buyerRef)) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.messageId', 'Message ID')}</label>
                        <p className="text-sm text-foreground mt-1">{messageId}</p>
                      </div>
                    )}
                    {(buyerRef && (!messageId || messageId !== buyerRef)) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.buyerReference', 'Buyer Reference')}</label>
                        <p className="text-sm text-foreground mt-1">{buyerRef}</p>
                      </div>
                    )}
                    {showPeppolNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.peppolInvoiceNumber', 'Peppol Invoice Number')}</label>
                        <p className="text-sm text-foreground mt-1">{peppolInvoiceNumber}</p>
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
                            <td className="px-4 py-2 text-sm text-foreground">{line.description || line.itemName || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{line.quantity || t('expenseInvoices.common.notAvailable', 'N/A')}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(line.unit_price || line.unitPrice || line.priceAmount || 0)}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(line.amount || line.lineExtensionAmount || 0)}</td>
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
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.rate', 'Rate (%)')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.taxableAmount', 'Taxable Amount')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('expenseInvoices.modal.peppolInfo.table.vatAmount', 'VAT Amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.peppol_metadata.taxSubtotals.map((tax, index) => (
                          <tr key={index}>
                            {/* Use exact VAT percentage from UBL XML <cbc:Percent> - no calculations */}
                            <td className="px-4 py-2 text-sm text-foreground">{getTaxPercent(tax)}%</td>
                            {/* Use exact taxable amount from UBL XML <cbc:TaxableAmount> - no calculations */}
                            <td className="px-4 py-2 text-sm text-foreground">{formatCurrency(tax.taxableAmount || 0)}</td>
                            {/* Use exact VAT amount from UBL XML <cbc:TaxAmount> - no calculations */}
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
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div>
              {hasPDFAttachment && (
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  iconName="Download"
                >
                  {isDownloadingPDF 
                    ? t('expenseInvoices.modal.downloadingPDF', 'Downloading...')
                    : t('expenseInvoices.modal.downloadPDF', 'Download Original PDF')
                  }
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              {t('expenseInvoices.modal.close', 'Close')}
            </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInvoiceDetailModal;

