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
                  {t('expenseInvoices.modal.invoiceInfo.title', 'Invoice Information')}
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

              {/* Invoice Line Items */}
              {(() => {
                // Build invoice lines from peppol_metadata.invoiceLines
                let invoiceLines = [];
                const metadata = invoice.peppol_metadata || {};
                
                if (metadata.invoiceLines && metadata.invoiceLines.length > 0) {
                  invoiceLines = metadata.invoiceLines.map((line, index) => {
                          // Use EXACT values from UBL XML - no calculations, no fallbacks
                          const exactUnitPrice = typeof line.priceAmount === 'number' ? line.priceAmount :
                                                 typeof line.unitPrice === 'number' ? line.unitPrice :
                                                 typeof line.unit_price === 'number' ? line.unit_price :
                                                 0;
                          const exactLineTotal = typeof line.lineExtensionAmount === 'number' ? line.lineExtensionAmount :
                                                 typeof line.amount === 'number' ? line.amount :
                                                 0;
                          
                    return {
                      number: index + 1,
                      description: line.description || line.itemName || 'Service',
                      quantity: line.quantity || 1,
                      unit: line.unit || '',
                      unitPrice: exactUnitPrice,
                      totalPrice: exactLineTotal
                    };
                  });
                } else {
                  // Single line from invoice summary
                  invoiceLines = [{
                    number: 1,
                    description: invoice.notes || 'Service',
                    quantity: 1,
                    unit: '',
                    unitPrice: parseFloat(invoice.net_amount || invoice.amount || 0),
                    totalPrice: parseFloat(invoice.net_amount || invoice.amount || 0)
                  }];
                }
                
                // Calculate totals
                const invoiceType = invoice.invoice_type || metadata.invoice_type || 'final';
                const depositAmount = metadata.deposit_amount || 0;
                const balanceAmount = metadata.balance_amount || 0;
                const depositEnabled = depositAmount > 0;
                
                let subtotal = parseFloat(invoice.net_amount || 0);
                let taxAmount = parseFloat(invoice.vat_amount || 0);
                let total = parseFloat(invoice.amount || 0);
                let totalWithVAT = subtotal + taxAmount;
                
                // For deposit invoices, calculate total from deposit + balance
                if (invoiceType === 'deposit' && depositEnabled) {
                  totalWithVAT = depositAmount + balanceAmount;
                  total = depositAmount;
                  // Calculate proportional subtotal and VAT for deposit
                  if (totalWithVAT > 0) {
                    const totalNet = invoice.net_amount || 0;
                    const totalVAT = invoice.vat_amount || 0;
                    if (totalNet > 0 || totalVAT > 0) {
                      subtotal = (depositAmount / totalWithVAT) * totalNet;
                      taxAmount = (depositAmount / totalWithVAT) * totalVAT;
                    }
                  }
                } else if (invoiceType === 'final' && depositEnabled) {
                  totalWithVAT = depositAmount + balanceAmount;
                  total = balanceAmount || invoice.amount;
                }
                
                return (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <Icon name="List" size={18} className="mr-2 text-primary" />
                      {t('expenseInvoices.modal.invoiceLines', 'Invoice Line Items')}
                    </h3>
                    <div className="overflow-x-auto border border-border rounded-lg bg-card">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase border-b border-border">{t('expenseInvoices.modal.invoiceLinesTable.number', 'N°')}</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase border-b border-border">{t('expenseInvoices.modal.invoiceLinesTable.description', 'Description')}</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase border-b border-border">{t('expenseInvoices.modal.invoiceLinesTable.quantity', 'Qty')}</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase border-b border-border">{t('expenseInvoices.modal.invoiceLinesTable.unitPrice', 'Unit Price')}</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase border-b border-border">{t('expenseInvoices.modal.invoiceLinesTable.totalExclVat', 'Total Excl. VAT')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceLines.map((line, index) => {
                            const hasMaterials = line.materials && line.materials.length > 0;
                          return (
                              <React.Fragment key={index}>
                                <tr className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                  <td className="px-4 py-3 text-sm text-foreground border-b border-border text-center font-medium">{line.number}</td>
                                  <td className="px-4 py-3 text-sm text-foreground border-b border-border font-medium">{line.description}</td>
                                  <td className="px-4 py-3 text-sm text-foreground border-b border-border text-center">{hasMaterials ? '' : `${typeof line.quantity === 'number' ? line.quantity : parseFloat(String(line.quantity).trim().split(' ')[0]) || 1} ${line.unit || ''}`}</td>
                                  <td className="px-4 py-3 text-sm text-foreground border-b border-border text-right">{hasMaterials ? '' : formatCurrency(line.unitPrice)}</td>
                                  <td className="px-4 py-3 text-sm text-foreground border-b border-border text-right font-medium">{formatCurrency(line.totalPrice)}</td>
                                </tr>
                                {hasMaterials && line.materials.map((mat, matIndex) => (
                                  <tr key={`${index}-${matIndex}`} className="bg-muted/10">
                                    <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-center pl-8">{line.number}.{matIndex + 1}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border pl-8">{mat.name || mat.description}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-center">{mat.quantity} {mat.unit}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-right">{formatCurrency(mat.unitPrice || mat.price)}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-right">{formatCurrency(mat.totalPrice || mat.amount)}</td>
                            </tr>
                                ))}
                              </React.Fragment>
                          );
                        })}
                      </tbody>
                        <tfoot>
                          <tr className="bg-muted/30">
                            <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-foreground border-t border-border">Subtotal Excl. VAT</td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground border-t border-border text-right">{formatCurrency(subtotal)}</td>
                          </tr>
                          {taxAmount > 0 && (
                            <tr className="bg-muted/30">
                              <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-foreground">VAT</td>
                              <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{formatCurrency(taxAmount)}</td>
                            </tr>
                          )}
                          {invoiceType === 'deposit' && depositEnabled && (
                            <>
                              <tr className="bg-blue-50 border-l-4 border-blue-500">
                                <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-blue-700">
                                  {i18n.language === 'fr' ? 'Paiement avant travaux:' : i18n.language === 'nl' ? 'Betaling voor werk:' : 'Payment before work:'}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{formatCurrency(depositAmount)}</td>
                              </tr>
                              {balanceAmount > 0 && (
                                <tr className="bg-muted/20">
                                  <td colSpan="4" className="px-4 py-3 text-xs text-muted-foreground italic">
                                    {i18n.language === 'fr' ? 'Montant restant à payer après travaux:' : i18n.language === 'nl' ? 'Resterend bedrag te betalen na werk:' : 'Remaining amount to pay after work:'}
                                  </td>
                                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">{formatCurrency(balanceAmount)}</td>
                                </tr>
                              )}
                              <tr className="bg-primary/10 border-t-2 border-primary">
                                <td colSpan="4" className="px-4 py-3 text-base font-bold text-foreground">{t('expenseInvoices.modal.invoiceLinesTable.totalInclVat', 'Total Incl. VAT')}</td>
                                <td className="px-4 py-3 text-base font-bold text-foreground text-right">{formatCurrency(totalWithVAT)}</td>
                              </tr>
                            </>
                          )}
                          {invoiceType === 'final' && depositEnabled && (
                            <>
                              <tr className="bg-blue-50 border-l-4 border-blue-500">
                                <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-blue-700">
                                  {i18n.language === 'fr' ? 'MONTANT RESTANT À PAYER:' : i18n.language === 'nl' ? 'RESTEREND BEDRAG TE BETALEN:' : 'REMAINING AMOUNT TO PAY:'}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{formatCurrency(balanceAmount || total)}</td>
                              </tr>
                              <tr className="bg-primary/10 border-t-2 border-primary">
                                <td colSpan="4" className="px-4 py-3 text-base font-bold text-foreground">{t('expenseInvoices.modal.invoiceLinesTable.totalInclVat', 'Total Incl. VAT')}</td>
                                <td className="px-4 py-3 text-base font-bold text-foreground text-right">{formatCurrency(totalWithVAT)}</td>
                              </tr>
                            </>
                          )}
                          {!depositEnabled && (
                            <tr className="bg-primary/10 border-t-2 border-primary">
                              <td colSpan="4" className="px-4 py-3 text-base font-bold text-foreground">Total Incl. VAT</td>
                              <td className="px-4 py-3 text-base font-bold text-foreground text-right">{formatCurrency(total)}</td>
                            </tr>
                          )}
                        </tfoot>
                    </table>
                  </div>
                  </div>
                );
              })()}

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
  );
};

export default ExpenseInvoiceDetailModal;
