import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceDetailModal = ({ invoice, isOpen, onClose, allInvoices = [] }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');

  // Reset active tab when modal opens/closes or invoice changes
  React.useEffect(() => {
    if (isOpen && invoice) {
      setActiveTab('details');
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  // Determine client type
  const clientType = invoice?.client?.client_type || invoice?.client?.type;
  const isProfessional = clientType === 'company' || clientType === 'professionnel';
  
  // Show Peppol tab for all professional clients (regardless of peppolEnabled)
  // Professional clients can use Peppol, even if they haven't sent via Peppol yet
  const showPeppolTab = isProfessional;

  const formatCurrency = (amount) => {
    // Always use comma as decimal separator (fr-FR format) to match quote creation flow
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return t('invoicesManagement.common.notAvailable');
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US').format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: t('invoicesManagement.status.paid'), color: 'bg-success text-success-foreground' },
      unpaid: { label: t('invoicesManagement.status.unpaid'), color: 'bg-warning text-warning-foreground' },
      overdue: { label: t('invoicesManagement.status.overdue'), color: 'bg-error text-error-foreground' },
      cancelled: { label: t('invoicesManagement.status.cancelled'), color: 'bg-purple-500 text-white' }
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
      not_sent: { label: t('invoicesManagement.peppolStatus.notSent'), color: 'bg-gray-100 text-gray-700 border border-gray-300', icon: 'Clock' },
      sending: { label: t('invoicesManagement.peppolStatus.sending'), color: 'bg-warning text-warning-foreground', icon: 'Loader2' },
      sent: { label: t('invoicesManagement.peppolStatus.sent'), color: 'bg-primary text-primary-foreground', icon: 'Send' },
      delivered: { label: t('invoicesManagement.peppolStatus.delivered'), color: 'bg-success text-success-foreground', icon: 'CheckCircle' },
      failed: { label: t('invoicesManagement.peppolStatus.failed'), color: 'bg-error text-error-foreground', icon: 'AlertCircle' }
    };
    const config = statusConfig[status] || statusConfig.not_sent;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        {config.icon && <Icon name={config.icon} size={12} />}
        <span>{config.label}</span>
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
                <h2 className="text-xl font-semibold text-foreground">{t('invoicesManagement.modal.title')}</h2>
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
              {t('invoicesManagement.modal.tabs.details')}
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
                {t('invoicesManagement.modal.tabs.peppol')}
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
                    {t('invoicesManagement.modal.invoiceInfo.title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.invoiceInfo.invoiceNumber')}</label>
                      <p className="text-sm font-semibold text-foreground">{invoice.number}</p>
                    </div>
                    {invoice.quoteNumber && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.invoiceInfo.quoteNumber')}</label>
                        <p className="text-sm font-semibold text-foreground">{invoice.quoteNumber}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.invoiceInfo.status')}</label>
                      <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.invoiceInfo.issueDate')}</label>
                      <p className="text-sm font-medium text-foreground">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.invoiceInfo.dueDate')}</label>
                      <p className="text-sm font-medium text-foreground">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Icon name="User" size={18} className="mr-2 text-primary" />
                    {t('invoicesManagement.modal.clientInfo.title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.clientInfo.name')}</label>
                      <p className="text-sm font-semibold text-foreground">{invoice.clientName}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('invoicesManagement.modal.clientInfo.email')}</label>
                      <p className="text-sm font-medium text-foreground">{invoice.clientEmail || t('invoicesManagement.common.notAvailable')}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Line Items */}
                {(() => {
                  // Build invoice lines from quote tasks and materials (similar to PDF)
                  let invoiceLines = [];
                  const quote = invoice.quote;
                  
                  if (quote && quote.quote_tasks && quote.quote_tasks.length > 0) {
                    // Group materials by task_id
                    const materialsByTaskId = {};
                    if (quote.quote_materials && quote.quote_materials.length > 0) {
                      quote.quote_materials.forEach((material) => {
                        const taskId = material.quote_task_id;
                        if (!materialsByTaskId[taskId]) {
                          materialsByTaskId[taskId] = [];
                        }
                        materialsByTaskId[taskId].push({
                          name: material.name || '',
                          quantity: material.quantity || 1,
                          unit: material.unit || 'piece',
                          unitPrice: parseFloat(material.total_price || material.unit_price || 0),
                          totalPrice: parseFloat(material.total_price || material.unit_price || 0)
                        });
                      });
                    }
                    
                    // Build invoice lines with tasks and their materials
                    quote.quote_tasks.forEach((task, taskIndex) => {
                      const taskMaterials = materialsByTaskId[task.id] || [];
                      const taskPrice = parseFloat(task.total_price || task.unit_price || 0);
                      
                      invoiceLines.push({
                        number: taskIndex + 1,
                        description: task.description || task.name || '',
                        quantity: task.quantity || 1,
                        unit: task.unit || '',
                        unitPrice: taskPrice,
                        totalPrice: taskPrice,
                        materials: taskMaterials
                      });
                    });
                  } else {
                    // Single line from invoice summary
                    invoiceLines = [{
                      number: 1,
                      description: invoice.description || invoice.title || 'Service',
                      quantity: 1,
                      unit: '',
                      unitPrice: parseFloat(invoice.amount || 0),
                      totalPrice: parseFloat(invoice.amount || 0),
                      materials: []
                    }];
                  }
                  
                  // Calculate totals - handle deposit invoices
                  const invoiceType = invoice.invoiceType || invoice.invoice_type || invoice.peppol_metadata?.invoice_type || 'final';
                  const depositAmount = invoice.peppol_metadata?.deposit_amount || (quote?.deposit_amount ? parseFloat(quote.deposit_amount) : 0);
                  const balanceAmount = invoice.peppol_metadata?.balance_amount || (quote?.balance_amount ? parseFloat(quote.balance_amount) : 0);
                  const depositEnabled = depositAmount > 0;
                  
                  // Check if deposit invoice is paid for the same quote (for final invoices)
                  let isDepositPaid = false;
                  if (invoiceType === 'final' && invoice.quoteId) {
                    const depositInvoice = allInvoices.find(inv => 
                      inv.invoiceType === 'deposit' && 
                      inv.quoteId === invoice.quoteId
                    );
                    isDepositPaid = depositInvoice?.status === 'paid';
                  }
                  
                  let subtotal = parseFloat(invoice.netAmount || invoice.amount || 0);
                  let taxAmount = parseFloat(invoice.taxAmount || 0);
                  let total = parseFloat(invoice.final_amount || invoice.amount || 0);
                  let totalWithVAT = subtotal + taxAmount;
                  
                  // For deposit invoices, calculate total from quote if available
                  if (invoiceType === 'deposit' && depositEnabled && quote) {
                    // Calculate total with VAT from quote (deposit + balance)
                    if (quote.deposit_amount && quote.balance_amount) {
                      const quoteDeposit = parseFloat(quote.deposit_amount || 0);
                      const quoteBalance = parseFloat(quote.balance_amount || 0);
                      const quoteTotal = parseFloat(quote.total_amount || 0);
                      const quoteVAT = parseFloat(quote.tax_amount || 0);
                      // Total with VAT = deposit + balance
                      totalWithVAT = quoteDeposit + quoteBalance;
                      // For deposit invoice, show deposit amount as the invoice total
                      total = quoteDeposit;
                      // Calculate proportional subtotal and VAT for deposit
                      if (quoteTotal + quoteVAT > 0) {
                        subtotal = (quoteDeposit / (quoteTotal + quoteVAT)) * quoteTotal;
                        taxAmount = (quoteDeposit / (quoteTotal + quoteVAT)) * quoteVAT;
                      }
                    }
                  } else if (invoiceType === 'final' && depositEnabled && quote) {
                    // For final invoices, total with VAT includes both deposit and balance
                    if (quote.deposit_amount && quote.balance_amount) {
                      const quoteDeposit = parseFloat(quote.deposit_amount || 0);
                      const quoteBalance = parseFloat(quote.balance_amount || 0);
                      totalWithVAT = quoteDeposit + quoteBalance;
                      // Final invoice amount is the balance
                      total = parseFloat(invoice.final_amount || quoteBalance || invoice.amount || 0);
                    }
                  }
                  
                  return (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Icon name="List" size={18} className="mr-2 text-primary" />
                        {t('invoicesManagement.modal.invoiceLines', 'Invoice Line Items')}
                      </h3>
                      <div className="overflow-x-auto border border-border rounded-lg bg-card">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase border-b border-border">N°</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase border-b border-border">Description</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase border-b border-border">Qty</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase border-b border-border">Unit Price</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase border-b border-border">Total Excl. VAT</th>
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
                                    <td className="px-4 py-3 text-sm text-foreground border-b border-border text-center">{hasMaterials ? '' : `${line.quantity} ${line.unit}`}</td>
                                    <td className="px-4 py-3 text-sm text-foreground border-b border-border text-right">{hasMaterials ? '' : formatCurrency(line.unitPrice)}</td>
                                    <td className="px-4 py-3 text-sm text-foreground border-b border-border text-right font-medium">{formatCurrency(line.totalPrice)}</td>
                                  </tr>
                                  {hasMaterials && line.materials.map((mat, matIndex) => (
                                    <tr key={`${index}-${matIndex}`} className="bg-muted/10">
                                      <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-center pl-8">{line.number}.{matIndex + 1}</td>
                                      <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border pl-8">{mat.name}</td>
                                      <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-center">{mat.quantity} {mat.unit}</td>
                                      <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-right">{formatCurrency(mat.unitPrice)}</td>
                                      <td className="px-4 py-2 text-xs text-muted-foreground border-b border-border text-right">{formatCurrency(mat.totalPrice)}</td>
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
                                  <td colSpan="4" className="px-4 py-3 text-base font-bold text-foreground">Total Incl. VAT</td>
                                  <td className="px-4 py-3 text-base font-bold text-foreground text-right">{formatCurrency(totalWithVAT)}</td>
                                </tr>
                              </>
                            )}
                            {invoiceType === 'final' && depositEnabled && (
                              <>
                                {isDepositPaid && (
                                  <tr className="bg-green-50 border-l-4 border-green-500">
                                    <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-green-700">
                                      ✓ {i18n.language === 'fr' ? 'Acompte payé:' : i18n.language === 'nl' ? 'Betaald voorschot:' : 'Paid deposit:'}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">{formatCurrency(depositAmount)}</td>
                                  </tr>
                                )}
                                <tr className="bg-blue-50 border-l-4 border-blue-500">
                                  <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-blue-700">
                                    {i18n.language === 'fr' ? 'MONTANT RESTANT À PAYER:' : i18n.language === 'nl' ? 'RESTEREND BEDRAG TE BETALEN:' : 'REMAINING AMOUNT TO PAY:'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{formatCurrency(balanceAmount || total)}</td>
                                </tr>
                                <tr className="bg-primary/10 border-t-2 border-primary">
                                  <td colSpan="4" className="px-4 py-3 text-base font-bold text-foreground">Total Incl. VAT</td>
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

            {activeTab === 'peppol' && showPeppolTab && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.peppolInfo.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.status')}</label>
                      <div className="mt-1">{getPeppolStatusBadge(invoice.peppolStatus)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.clientId')}</label>
                      <p className="text-sm text-foreground mt-1 flex items-center">
                        <Icon name="Globe" size={14} className="mr-1 text-blue-600" />
                        {invoice.receiverPeppolId || invoice.client?.peppol_id || t('invoicesManagement.common.notAvailable')}
                      </p>
                    </div>
                    {invoice.peppolSentAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.sentDate')}</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppolSentAt)}</p>
                      </div>
                    )}
                    {invoice.peppolDeliveredAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.deliveredDate')}</label>
                        <p className="text-sm text-foreground mt-1">{formatDate(invoice.peppolDeliveredAt)}</p>
                      </div>
                    )}
                    {invoice.peppolMessageId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.messageId')}</label>
                        <p className="text-sm text-foreground mt-1 font-mono">{invoice.peppolMessageId}</p>
                      </div>
                    )}
                    {invoice.peppolErrorMessage && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.peppolInfo.errorMessage')}</label>
                        <p className="text-sm text-error mt-1 bg-error/10 p-3 rounded-lg">{invoice.peppolErrorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with Close Button */}
        <div className="border-t border-border p-6 bg-muted/30 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('invoicesManagement.modal.close', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

