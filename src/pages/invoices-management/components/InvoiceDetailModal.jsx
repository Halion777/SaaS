import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceDetailModal = ({ invoice, isOpen, onClose }) => {
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
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US', {
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
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.invoiceInfo.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.invoiceNumber')}</label>
                      <p className="text-sm text-foreground mt-1">{invoice.number}</p>
                    </div>
                    {invoice.quoteNumber && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.quoteNumber')}</label>
                        <p className="text-sm text-foreground mt-1">{invoice.quoteNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.status')}</label>
                      <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.issueDate')}</label>
                      <p className="text-sm text-foreground mt-1">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.dueDate')}</label>
                      <p className="text-sm text-foreground mt-1">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.invoiceInfo.paymentMethod')}</label>
                      <p className="text-sm text-foreground mt-1">{invoice.paymentMethod || t('invoicesManagement.common.notAvailable')}</p>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.clientInfo.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.clientInfo.name')}</label>
                      <p className="text-sm text-foreground mt-1">{invoice.clientName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.clientInfo.email')}</label>
                      <p className="text-sm text-foreground mt-1">{invoice.clientEmail || t('invoicesManagement.common.notAvailable')}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.financialInfo.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.financialInfo.totalAmount')}</label>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.financialInfo.netAmount')}</label>
                      <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.netAmount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.financialInfo.taxAmount')}</label>
                      <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.taxAmount)}</p>
                    </div>
                    {invoice.discountAmount > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.modal.financialInfo.discount')}</label>
                        <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(invoice.discountAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {invoice.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.description')}</h3>
                    <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.description}</p>
                  </div>
                )}

                {/* Notes */}
                {invoice.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('invoicesManagement.modal.notes')}</h3>
                    <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg">{invoice.notes}</p>
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

