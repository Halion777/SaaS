import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const InvoicesDataTable = ({ invoices, onInvoiceAction, selectedInvoices, onSelectionChange, filters, onFiltersChange, onStatusUpdate, downloadingInvoiceId = null, canEdit = true, canDelete = true, groupByQuote = false }) => {
  const { t, i18n } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'desc' });
  const [viewMode, setViewMode] = useState(() => {
    // Default to card view on mobile/tablet, table view on desktop
    return window.innerWidth < 1024 ? 'card' : 'table';
  }); // 'table' or 'card'

  // Auto-switch to card view on mobile/tablet
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'table') {
        setViewMode('card');
      } else if (window.innerWidth >= 1024 && viewMode === 'card') {
        setViewMode('table');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const formatCurrency = (amount) => {
    // Always use comma as decimal separator (fr-FR format) to match quote creation flow
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US').format(new Date(date));
  };

  // Status options for manual update - EXCLUDES 'overdue' because it's auto-calculated based on due_date
  const statusOptions = [
    { value: 'paid', label: t('invoicesManagement.status.paid') },
    { value: 'unpaid', label: t('invoicesManagement.status.unpaid') },
    { value: 'cancelled', label: t('invoicesManagement.status.cancelled') }
  ];

  const getStatusBadge = (status, invoice = null) => {
    const statusConfig = {
      paid: { 
        label: t('invoicesManagement.status.paid'), 
        color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
        border: 'border border-green-400/30',
        shadow: 'shadow-sm shadow-green-500/20'
      },
      unpaid: { 
        label: t('invoicesManagement.status.unpaid'), 
        color: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
        border: 'border border-red-400/30',
        shadow: 'shadow-sm shadow-red-500/20'
      },
      overdue: { 
        label: t('invoicesManagement.status.overdue'), 
        color: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
        border: 'border border-red-400/30',
        shadow: 'shadow-sm shadow-red-500/20'
      },
      cancelled: { 
        label: t('invoicesManagement.status.cancelled'), 
        color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        border: 'border border-purple-400/30',
        shadow: 'shadow-sm shadow-purple-500/20'
      }
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    
    // Show editable status dropdown for all clients (invoice status can be updated manually)
    if (onStatusUpdate && invoice && canEdit) {
      return (
        <div className="relative inline-block">
          <Select
            value={status}
            onValueChange={(newStatus) => onStatusUpdate(invoice.id, newStatus)}
            options={statusOptions}
            className={`w-auto min-w-[100px] ${config.color} ${config.border} ${config.shadow} rounded-lg`}
            usePortal={true}
          />
        </div>
      );
    }
    
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center inline-flex items-center justify-center ${config.color} ${config.border} ${config.shadow} min-w-[70px]`}>
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
        <Icon name={config.icon} size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  // Helper function to render deposit/final financial info instead of payment method
  const renderAmountInfo = (invoice) => {
    const invoiceType = invoice.invoiceType || invoice.invoice_type || 'final';
    const depositAmount = invoice.peppol_metadata?.deposit_amount || 0;
    const balanceAmount = invoice.peppol_metadata?.balance_amount || 0;
    const depositEnabled = depositAmount > 0;
    
    // Calculate net and VAT for the displayed amount
    let displayNet = invoice.netAmount || 0;
    let displayVAT = invoice.taxAmount || 0;
    
    // For invoices with deposits, calculate proportional net/VAT
    if (depositEnabled && depositAmount > 0 && balanceAmount > 0) {
      if (invoiceType === 'deposit') {
        // For deposit invoice: show deposit net and VAT
        // Calculate proportionally based on deposit vs total
        const totalWithVAT = depositAmount + balanceAmount;
        const totalNet = invoice.netAmount || 0;
        const totalVAT = invoice.taxAmount || 0;
        if (totalWithVAT > 0 && (totalNet > 0 || totalVAT > 0)) {
          displayNet = (depositAmount / totalWithVAT) * totalNet;
          displayVAT = (depositAmount / totalWithVAT) * totalVAT;
        } else {
          // Fallback: estimate from deposit amount (assuming 21% VAT)
          displayNet = depositAmount / 1.21;
          displayVAT = depositAmount - displayNet;
        }
      } else if (invoiceType === 'final') {
        // For final invoice: show balance net and VAT
        const totalWithVAT = depositAmount + balanceAmount;
        const totalNet = invoice.netAmount || 0;
        const totalVAT = invoice.taxAmount || 0;
        if (totalWithVAT > 0 && (totalNet > 0 || totalVAT > 0)) {
          displayNet = (balanceAmount / totalWithVAT) * totalNet;
          displayVAT = (balanceAmount / totalWithVAT) * totalVAT;
        } else {
          // Fallback: estimate from balance amount (assuming 21% VAT)
          displayNet = balanceAmount / 1.21;
          displayVAT = balanceAmount - displayNet;
        }
      }
    }
    
    // Only show if we have valid amounts
    if (displayNet > 0 || displayVAT > 0) {
      return (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>HT: {formatCurrency(displayNet)}</div>
          <div>TVA: {formatCurrency(displayVAT)}</div>
        </div>
      );
    }
    return null;
  };

  const getInvoiceTypeBadge = (invoiceType) => {
    const typeConfig = {
      deposit: { 
        label: t('invoicesManagement.invoiceType.deposit', 'Deposit'), 
        color: 'bg-blue-100 text-blue-700 border border-blue-300',
        icon: 'CreditCard'
      },
      final: { 
        label: t('invoicesManagement.invoiceType.final', 'Final'), 
        color: 'bg-purple-100 text-purple-700 border border-purple-300',
        icon: 'CheckCircle'
      }
    };
    
    // Default to 'final' if no type specified
    const type = invoiceType === 'deposit' ? 'deposit' : 'final';
    const config = typeConfig[type];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        <Icon name={config.icon} size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  const getDaysOverdue = (dueDate, status) => {
    if (status !== 'overdue') return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(invoices.map(invoice => invoice.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedInvoices.filter(id => id !== invoiceId));
    }
  };

  // Group invoices by quote when groupByQuote is enabled
  const groupedInvoices = useMemo(() => {
    if (!groupByQuote) {
      return { ungrouped: invoices };
    }

    const groups = {};
    invoices.forEach(invoice => {
      const groupKey = invoice.quoteId || 'ungrouped';
      if (!groups[groupKey]) {
        groups[groupKey] = {
          quoteId: invoice.quoteId,
          quoteNumber: invoice.quoteNumber,
          invoices: []
        };
      }
      groups[groupKey].invoices.push(invoice);
    });

    // Sort groups: ungrouped first, then by quote number
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (!a.quoteId) return -1;
      if (!b.quoteId) return 1;
      return (a.quoteNumber || '').localeCompare(b.quoteNumber || '');
    });

    return sortedGroups;
  }, [invoices, groupByQuote]);

  const SortableHeader = ({ label, sortKey }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <Icon 
          name={sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} 
          size={14} 
          color="currentColor" 
        />
      </div>
    </th>
  );

  const renderGroupedCardView = () => {
    if (!groupByQuote) {
      return renderCardView();
    }

    return (
      <div className="p-4 space-y-6">
        {groupedInvoices.map((group, groupIndex) => (
          <div key={group.quoteId || `ungrouped-${groupIndex}`} className="space-y-4">
            {group.quoteId && (
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="FileText" size={18} className="text-primary" />
                  <span className="text-base font-semibold text-foreground">
                    {t('invoicesManagement.groupByQuote.quoteLabel', 'Quote')}: {group.quoteNumber || group.quoteId}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({t('invoicesManagement.groupByQuote.invoiceCount', { count: group.invoices.length }, `${group.invoices.length} invoice(s)`)})
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.invoices.map((invoice) => {
                const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
                return (
                  <div key={invoice.id} className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-150 ${group.quoteId ? 'bg-muted/5' : ''}`}>
                    {/* Header with checkbox and invoice number */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                        </div>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground">{invoice.clientName}</div>
                      <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                    </div>

                    {/* Amount and Financial Info */}
                    <div className="mb-3">
                      <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
                      {renderAmountInfo(invoice)}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col space-y-1">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{t('invoicesManagement.table.headers.status')}</div>
                          {getStatusBadge(invoice.status, invoice)}
                        </div>
                        {daysOverdue && (
                          <span className="text-xs text-error">+{daysOverdue} {t('invoicesManagement.table.days')}</span>
                        )}
                      </div>
                    </div>

                    {/* Peppol Status */}
                    {(() => {
                      const clientType = invoice.client?.client_type || invoice.client?.type;
                      const isProfessional = clientType === 'company' || clientType === 'professionnel';
                      if (isProfessional) {
                        return (
                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">{t('invoicesManagement.table.headers.peppolStatus', 'Peppol Status')}</div>
                            {getPeppolStatusBadge(invoice.peppolStatus || 'not_sent')}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>
                        <div className="font-medium">{t('invoicesManagement.table.issue')}:</div>
                        <div>{formatDate(invoice.issueDate)}</div>
                      </div>
                      <div>
                        <div className="font-medium">{t('invoicesManagement.table.due')}:</div>
                        <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                          {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => onInvoiceAction('view', invoice)}
                        className="text-xs"
                        title={t('invoicesManagement.table.actions.viewDetails')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Download"
                        onClick={() => onInvoiceAction('export', invoice)}
                        className="text-xs text-primary hover:text-primary/80"
                        title={t('invoicesManagement.table.actions.exportPDF', 'Export PDF')}
                        loading={downloadingInvoiceId === invoice.id}
                        disabled={downloadingInvoiceId === invoice.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Send"
                        onClick={() => onInvoiceAction('send', invoice)}
                        className="text-xs text-primary hover:text-primary/80"
                        title={
                          !canEdit 
                            ? t('permissions.noFullAccess') 
                            : invoice.peppolSentAt 
                              ? t('invoicesManagement.table.actions.alreadySent', 'Invoice already sent')
                              : t('invoicesManagement.table.actions.sendInvoice')
                        }
                        disabled={!canEdit || !!invoice.peppolSentAt}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Mail"
                        onClick={() => onInvoiceAction('send_to_accountant', invoice)}
                        className="text-xs text-primary hover:text-primary/80"
                        title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendToAccountant', 'Send to Accountant')}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {invoices.map((invoice) => {
        const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
        return (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-150">
            {/* Header with checkbox and invoice number */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                />
                <div>
                  <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                    {getInvoiceTypeBadge(invoice.invoiceType)}
                  </div>
                  {invoice.quoteNumber && (
                    <div className="text-xs text-muted-foreground">{t('invoicesManagement.table.quote')}: {invoice.quoteNumber}</div>
                  )}
                </div>
              </div>
              
            </div>

            {/* Client Info */}
            <div className="mb-3">
              <div className="text-sm font-medium text-foreground">{invoice.clientName}</div>
              <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
            </div>

            {/* Amount and Financial Info */}
            <div className="mb-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
              {renderAmountInfo(invoice)}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col space-y-1">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('invoicesManagement.table.headers.status')}</div>
                  {getStatusBadge(invoice.status, invoice)}
                </div>
                {daysOverdue && (
                  <span className="text-xs text-error">+{daysOverdue} {t('invoicesManagement.table.days')}</span>
                )}
              </div>
            </div>

            {/* Peppol Status */}
            {(() => {
              const clientType = invoice.client?.client_type || invoice.client?.type;
              const isProfessional = clientType === 'company' || clientType === 'professionnel';
              if (isProfessional) {
                return (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">{t('invoicesManagement.table.headers.peppolStatus', 'Peppol Status')}</div>
                    {getPeppolStatusBadge(invoice.peppolStatus || 'not_sent')}
                  </div>
                );
              }
              return null;
            })()}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div>
                <div className="font-medium">{t('invoicesManagement.table.issue')}:</div>
                <div>{formatDate(invoice.issueDate)}</div>
              </div>
              <div>
                <div className="font-medium">{t('invoicesManagement.table.due')}:</div>
                <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                  {formatDate(invoice.dueDate)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border space-x-2">
              <Button
                variant="ghost"
                size="sm"
                iconName="Eye"
                onClick={() => onInvoiceAction('view', invoice)}
                className="text-xs"
                title={t('invoicesManagement.table.actions.viewDetails')}
              />
              <Button
                variant="ghost"
                size="sm"
                iconName="Download"
                onClick={() => onInvoiceAction('export', invoice)}
                className="text-xs text-primary hover:text-primary/80"
                title={t('invoicesManagement.table.actions.exportPDF', 'Export PDF')}
                loading={downloadingInvoiceId === invoice.id}
                disabled={downloadingInvoiceId === invoice.id}
              />
              <Button
                variant="ghost"
                size="sm"
                iconName="Send"
                onClick={() => onInvoiceAction('send', invoice)}
                className="text-xs text-primary hover:text-primary/80"
                title={
                  !canEdit 
                    ? t('permissions.noFullAccess') 
                    : invoice.peppolSentAt 
                      ? t('invoicesManagement.table.actions.alreadySent', 'Invoice already sent')
                      : t('invoicesManagement.table.actions.sendInvoice')
                }
                disabled={!canEdit || !!invoice.peppolSentAt}
              />
              <Button
                variant="ghost"
                size="sm"
                iconName="Mail"
                onClick={() => onInvoiceAction('send_to_accountant', invoice)}
                className="text-xs text-primary hover:text-primary/80"
                title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendToAccountant', 'Send to Accountant')}
                disabled={!canEdit}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-visible">
      {/* Search Bar */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('invoicesManagement.table.searchPlaceholder')}
              value={filters?.search || ''}
              onChange={(e) => onFiltersChange?.({ ...filters, search: e.target.value })}
              className="pl-9 w-full"
            />
          </div>
          {filters?.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange?.({ ...filters, search: '' })}
              className="ml-3 h-8"
            >
              <span className="flex items-center">
                <Icon name="X" size={14} className="mr-1" />
                {t('invoicesManagement.table.clearSearch')}
              </span>
            </Button>
            )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{t('invoicesManagement.table.view.label')}</span>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Table" size={14} className="mr-1" />
              {t('invoicesManagement.table.view.table')}
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Grid" size={14} className="mr-1" />
              {t('invoicesManagement.table.view.cards')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('invoicesManagement.empty.noInvoicesFound')}</h3>
          <p className="text-muted-foreground">{t('invoicesManagement.empty.description')}</p>
        </div>
      ) : viewMode === 'card' ? (
        groupByQuote ? renderGroupedCardView() : renderCardView()
      ) : (
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <SortableHeader label={t('invoicesManagement.table.headers.invoiceNumber')} sortKey="number" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('invoicesManagement.table.headers.type', 'Type')}
              </th>
              <SortableHeader label={t('invoicesManagement.table.headers.client')} sortKey="clientName" />
              <SortableHeader label={t('invoicesManagement.table.headers.amount')} sortKey="amount" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('invoicesManagement.table.headers.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('invoicesManagement.table.headers.peppolStatus', 'Peppol Status')}
              </th>
              <SortableHeader label={t('invoicesManagement.table.headers.issueDate')} sortKey="issueDate" />
              <SortableHeader label={t('invoicesManagement.table.headers.dueDate')} sortKey="dueDate" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('invoicesManagement.table.headers.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {groupByQuote ? (
              // Grouped view
              groupedInvoices.map((group, groupIndex) => (
                <React.Fragment key={group.quoteId || `ungrouped-${groupIndex}`}>
                  {group.quoteId && (
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <Icon name="FileText" size={16} className="text-primary" />
                          <span className="text-sm font-semibold text-foreground">
                            {t('invoicesManagement.groupByQuote.quoteLabel', 'Quote')}: {group.quoteNumber || group.quoteId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({t('invoicesManagement.groupByQuote.invoiceCount', { count: group.invoices.length }, `${group.invoices.length} invoice(s)`)})
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {group.invoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
                    return (
                      <tr key={invoice.id} className={`hover:bg-muted/30 transition-colors duration-150 ${group.quoteId ? 'bg-muted/5' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                          {invoice.quoteNumber && !groupByQuote && (
                            <div className="text-xs text-muted-foreground">{t('invoicesManagement.table.quote')}: {invoice.quoteNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getInvoiceTypeBadge(invoice.invoiceType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{invoice.clientName}</div>
                          <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                          {renderAmountInfo(invoice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {getStatusBadge(invoice.status, invoice)}
                            {daysOverdue && (
                              <span className="text-xs text-error">+{daysOverdue} {t('invoicesManagement.table.days')}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const clientType = invoice.client?.client_type || invoice.client?.type;
                            const isProfessional = clientType === 'company' || clientType === 'professionnel';
                            if (isProfessional) {
                              return getPeppolStatusBadge(invoice.peppolStatus || 'not_sent');
                            }
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                                {t('invoicesManagement.peppolStatus.notApplicable', 'N/A')}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                            {formatDate(invoice.dueDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Eye"
                              onClick={() => onInvoiceAction('view', invoice)}
                              title={t('invoicesManagement.table.actions.viewDetails')}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Download"
                              onClick={() => onInvoiceAction('export', invoice)}
                              title={t('invoicesManagement.table.actions.exportPDF', 'Export PDF')}
                              className="text-primary hover:text-primary/80"
                              loading={downloadingInvoiceId === invoice.id}
                              disabled={downloadingInvoiceId === invoice.id}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Send"
                              onClick={() => onInvoiceAction('send', invoice)}
                              title={
                                !canEdit 
                                  ? t('permissions.noFullAccess') 
                                  : (invoice.peppolSentAt || invoice.peppolStatus === 'sent' || invoice.peppolStatus === 'delivered')
                                    ? t('invoicesManagement.table.actions.alreadySent', 'Invoice already sent')
                                    : t('invoicesManagement.table.actions.sendInvoice')
                              }
                              className="text-primary hover:text-primary/80"
                              disabled={!canEdit || !!invoice.peppolSentAt || invoice.peppolStatus === 'sent' || invoice.peppolStatus === 'delivered'}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Mail"
                              onClick={() => onInvoiceAction('send_to_accountant', invoice)}
                              title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendToAccountant', 'Send to Accountant')}
                              className="text-primary hover:text-primary/80"
                              disabled={!canEdit}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            ) : (
              // Ungrouped view (original)
              invoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                    {invoice.quoteNumber && (
                      <div className="text-xs text-muted-foreground">{t('invoicesManagement.table.quote')}: {invoice.quoteNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getInvoiceTypeBadge(invoice.invoiceType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{invoice.clientName}</div>
                    <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                      {renderAmountInfo(invoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(invoice.status, invoice)}
                      {daysOverdue && (
                        <span className="text-xs text-error">+{daysOverdue} {t('invoicesManagement.table.days')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Show Peppol status (read-only) for professional clients */}
                    {(() => {
                      const clientType = invoice.client?.client_type || invoice.client?.type;
                      const isProfessional = clientType === 'company' || clientType === 'professionnel';
                      if (isProfessional) {
                        // Show Peppol status (read-only badge, cannot be modified by user)
                        return getPeppolStatusBadge(invoice.peppolStatus || 'not_sent');
                      }
                      // Individual clients don't use Peppol
                      return (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                          {t('invoicesManagement.peppolStatus.notApplicable', 'N/A')}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => onInvoiceAction('view', invoice)}
                        title={t('invoicesManagement.table.actions.viewDetails')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Download"
                        onClick={() => onInvoiceAction('export', invoice)}
                        title={t('invoicesManagement.table.actions.exportPDF', 'Export PDF')}
                        className="text-primary hover:text-primary/80"
                        loading={downloadingInvoiceId === invoice.id}
                        disabled={downloadingInvoiceId === invoice.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Send"
                        onClick={() => onInvoiceAction('send', invoice)}
                        title={
                          !canEdit 
                            ? t('permissions.noFullAccess') 
                            : (invoice.peppolSentAt || invoice.peppolStatus === 'sent' || invoice.peppolStatus === 'delivered')
                              ? t('invoicesManagement.table.actions.alreadySent', 'Invoice already sent')
                              : t('invoicesManagement.table.actions.sendInvoice')
                        }
                        className="text-primary hover:text-primary/80"
                        disabled={!canEdit || !!invoice.peppolSentAt || invoice.peppolStatus === 'sent' || invoice.peppolStatus === 'delivered'}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Mail"
                        onClick={() => onInvoiceAction('send_to_accountant', invoice)}
                        title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendToAccountant', 'Send to Accountant')}
                        className="text-primary hover:text-primary/80"
                        disabled={!canEdit}
                      />
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesDataTable;