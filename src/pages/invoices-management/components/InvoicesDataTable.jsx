import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const InvoicesDataTable = ({ invoices, onInvoiceAction, selectedInvoices, onSelectionChange, filters, onFiltersChange, onStatusUpdate, isExportingPDF = false, canEdit = true, canDelete = true }) => {
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

  const statusOptions = [
    { value: 'paid', label: t('invoicesManagement.status.paid'), badgeColor: 'bg-success' },
    { value: 'unpaid', label: t('invoicesManagement.status.unpaid'), badgeColor: 'bg-warning' },
    { value: 'overdue', label: t('invoicesManagement.status.overdue'), badgeColor: 'bg-error' },
    { value: 'cancelled', label: t('invoicesManagement.status.cancelled'), badgeColor: 'bg-purple-500' }
  ];

  const getStatusBadge = (status, invoice = null) => {
    const statusConfig = {
      paid: { label: t('invoicesManagement.status.paid'), color: 'bg-success text-success-foreground' },
      unpaid: { label: t('invoicesManagement.status.unpaid'), color: 'bg-warning text-warning-foreground' },
      overdue: { label: t('invoicesManagement.status.overdue'), color: 'bg-error text-error-foreground' },
      cancelled: { label: t('invoicesManagement.status.cancelled'), color: 'bg-purple-500 text-white' }
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
            className="w-auto min-w-[120px]"
            usePortal={true}
          />
        </div>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${config.color}`}>
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
                  <div className="text-sm font-medium text-foreground">{invoice.number}</div>
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

            {/* Amount and Payment Method */}
            <div className="mb-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
              {invoice.paymentMethod && (
                <div className="text-xs text-muted-foreground">{invoice.paymentMethod}</div>
              )}
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
                disabled={isExportingPDF}
              />
              <Button
                variant="ghost"
                size="sm"
                iconName="Send"
                onClick={() => onInvoiceAction('send', invoice)}
                className="text-xs text-primary hover:text-primary/80"
                title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendInvoice')}
                disabled={!canEdit}
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
        renderCardView()
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
            {invoices.map((invoice) => {
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
                    <div className="text-sm text-foreground">{invoice.clientName}</div>
                    <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                    {invoice.paymentMethod && (
                      <div className="text-xs text-muted-foreground">{invoice.paymentMethod}</div>
                    )}
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
                        disabled={isExportingPDF}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Send"
                        onClick={() => onInvoiceAction('send', invoice)}
                        title={!canEdit ? t('permissions.noFullAccess') : t('invoicesManagement.table.actions.sendInvoice')}
                        className="text-primary hover:text-primary/80"
                        disabled={!canEdit}
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
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesDataTable;