import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/numberFormat';
import { ExpenseInvoicesService } from '../../../services/expenseInvoicesService';

const ExpenseInvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');
  const [isViewingPDF, setIsViewingPDF] = useState(false);

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
      pending: { label: t('expenseInvoices.status.pending', 'Pending'), color: 'bg-orange-500 text-white' },
      overdue: { label: t('expenseInvoices.status.overdue', 'Overdue'), color: 'bg-error text-error-foreground' },
      cancelled: { label: t('expenseInvoices.status.cancelled', 'Cancelled'), color: 'bg-purple-500 text-white' }
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
  const isCreditNote = invoice?.peppol_metadata?.isCreditNote;

  // Check if PDF attachment is available
  const pdfAttachmentPath = invoice.peppol_metadata?.pdfAttachmentPath;
  const hasPDFAttachment = pdfAttachmentPath && invoice.source === 'peppol';
  
  // Handle PDF view (open in new tab)
  const handleViewPDF = async () => {
    if (!hasPDFAttachment || !pdfAttachmentPath) return;
    
    setIsViewingPDF(true);
    try {
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.getFileDownloadUrl(pdfAttachmentPath);
      
      if (result.success) {
        // Open PDF in new tab for viewing
        window.open(result.data, '_blank');
      } else {
        alert(t('expenseInvoices.errors.viewPDFError', 'Error viewing PDF: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert(t('expenseInvoices.errors.viewPDFError', 'Error viewing PDF: {{error}}', { error: error.message }));
    } finally {
      setIsViewingPDF(false);
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
                {t('expenseInvoices.modal.tabs.peppol', 'Peppol')}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Invoice Information */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="FileText" size={18} className="mr-2 text-primary" />
                  {isCreditNote ? t('expenseInvoices.modal.creditNoteTitle', 'Credit note') : t('expenseInvoices.modal.invoiceInfo.title', 'Invoice Information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.invoiceNumber', 'Invoice Number')}</label>
                    <p className="text-sm font-semibold text-foreground">{displayInvoiceNumber}</p>
                    {showPeppolNumber && (
                      <p className="text-xs text-muted-foreground mt-1">Peppol Invoice Number: {peppolInvoiceNumber}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.amount', 'Amount')}</label>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                    {(invoice.net_amount != null && invoice.net_amount !== '') && (
                      <p className="text-xs text-muted-foreground mt-1">{t('expenseInvoices.table.net', 'Net')}: {formatCurrency(invoice.net_amount)}</p>
                    )}
                    {(invoice.vat_amount != null && invoice.vat_amount !== '') && (
                      <p className="text-xs text-muted-foreground">{t('expenseInvoices.table.vat', 'VAT')}: {formatCurrency(invoice.vat_amount)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.status', 'Status')}</label>
                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.category', 'Category')}</label>
                    <p className="text-sm font-semibold text-foreground">{formatCategory(invoice.category)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.source', 'Source')}</label>
                    <p className="text-sm font-medium text-foreground">
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.issueDate', 'Issue Date')}</label>
                    <p className="text-sm font-semibold text-foreground">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.invoiceInfo.dueDate', 'Due Date')}</label>
                    <p className="text-sm font-semibold text-foreground">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Building" size={18} className="mr-2 text-primary" />
                  {t('expenseInvoices.modal.supplierInfo.title', 'Supplier Information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.supplierInfo.name', 'Name')}</label>
                    <p className="text-sm font-semibold text-foreground">{invoice.supplier_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.supplierInfo.email', 'Email')}</label>
                    <p className="text-sm font-medium text-foreground">{invoice.supplier_email || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.supplierInfo.vatNumber', 'VAT Number')}</label>
                    <p className="text-sm font-semibold text-foreground">{invoice.supplier_vat_number || t('expenseInvoices.common.notAvailable', 'N/A')}</p>
                  </div>
                  {invoice.source === 'peppol' && invoice.sender_peppol_id && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.supplierInfo.peppolId', 'Peppol ID')}</label>
                      <p className="text-sm font-semibold text-foreground flex items-center">
                        <Icon name="Globe" size={14} className="mr-1 text-blue-600" />
                        {invoice.sender_peppol_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'peppol' && invoice.source === 'peppol' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Globe" size={18} className="mr-2 text-primary" />
                  {t('expenseInvoices.modal.peppolInfo.title', 'Peppol Information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.peppolInfo.receivedDate', 'Received')}</label>
                    <p className="text-sm font-semibold text-foreground">
                      {invoice.peppol_received_at ? formatDate(invoice.peppol_received_at) : t('expenseInvoices.common.notAvailable', 'N/A')}
                    </p>
                  </div>
                  {invoice.sender_peppol_id && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.peppolInfo.from', 'From')}</label>
                      <p className="text-sm font-semibold text-foreground flex items-center">
                        <Icon name="Globe" size={14} className="mr-1 text-blue-600" />
                        {invoice.sender_peppol_id}
                      </p>
                    </div>
                  )}
                  {peppolInvoiceNumber && showPeppolNumber && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.peppolInfo.peppolInvoiceNumber', 'Peppol Invoice Number')}</label>
                      <p className="text-sm font-semibold text-foreground">{peppolInvoiceNumber}</p>
                  </div>
                  )}
                  {messageId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('expenseInvoices.modal.peppolInfo.messageId', 'Message ID')}</label>
                      <p className="text-sm font-mono text-foreground break-all">{messageId}</p>
                </div>
              )}
                </div>
              </div>
            </div>
          )}

          </div>
          </div>

          {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border px-6 pb-6">
            <div>
              {hasPDFAttachment && (
                <Button
                  variant="outline"
                  onClick={handleViewPDF}
                  disabled={isViewingPDF}
                  iconName="Eye"
                >
                  {isViewingPDF 
                    ? t('expenseInvoices.modal.viewingPDF', 'Opening...')
                    : t('expenseInvoices.modal.viewPDF', 'View Invoice PDF')
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
  );
};

export default ExpenseInvoiceDetailModal;
