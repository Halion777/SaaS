import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExpenseInvoicesDataTable = ({ expenseInvoices, onExpenseInvoiceAction, selectedExpenseInvoices, onSelectionChange, filters, onFiltersChange, onStatusUpdate, downloadingInvoiceId = null, canEdit = true, canDelete = true }) => {
  const { t, i18n } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'desc' });
  const [viewMode, setViewMode] = useState(() => {
    // Default to card view on mobile/tablet, table view on desktop
    return window.innerWidth < 1024 ? 'card' : 'table';
  }); // 'table' or 'card'

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

  const renderAmountInfo = (invoice) => {
    const invoiceType = invoice.invoice_type || invoice.invoiceType || 'final';
    const depositAmount = invoice.peppol_metadata?.deposit_amount || 0;
    const balanceAmount = invoice.peppol_metadata?.balance_amount || 0;
    const depositEnabled = depositAmount > 0;
    
    // Calculate net and VAT for the displayed amount
    let displayNet = invoice.net_amount || 0;
    let displayVAT = invoice.vat_amount || 0;
    
    // For invoices with deposits, calculate proportional net/VAT
    if (depositEnabled && depositAmount > 0 && balanceAmount > 0) {
      if (invoiceType === 'deposit') {
        // For deposit invoice: show deposit net and VAT
        // Calculate proportionally based on deposit vs total
        const totalWithVAT = depositAmount + balanceAmount;
        const totalNet = invoice.net_amount || 0;
        const totalVAT = invoice.vat_amount || 0;
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
        const totalNet = invoice.net_amount || 0;
        const totalVAT = invoice.vat_amount || 0;
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

  const statusOptions = [
    { value: 'paid', label: t('expenseInvoices.status.paid', 'Paid'), badgeColor: 'bg-success' },
    { value: 'pending', label: t('expenseInvoices.status.pending', 'Pending'), badgeColor: 'bg-warning' },
    { value: 'overdue', label: t('expenseInvoices.status.overdue', 'Overdue'), badgeColor: 'bg-error' }
  ];

  const getStatusBadge = (status, invoiceId = null) => {
    const statusConfig = {
      paid: { 
        label: t('expenseInvoices.status.paid', 'Paid'), 
        color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
        border: 'border border-green-400/30',
        shadow: 'shadow-sm shadow-green-500/20'
      },
      pending: { 
        label: t('expenseInvoices.status.pending', 'Pending'), 
        color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
        border: 'border border-amber-300/30',
        shadow: 'shadow-sm shadow-amber-500/20'
      },
      overdue: { 
        label: t('expenseInvoices.status.overdue', 'Overdue'), 
        color: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
        border: 'border border-red-400/30',
        shadow: 'shadow-sm shadow-red-500/20'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    // Only show editable dropdown if user has edit permission
    if (onStatusUpdate && invoiceId && canEdit) {
      return (
        <div className="relative inline-block">
          <Select
            value={status}
            onValueChange={(newStatus) => onStatusUpdate(invoiceId, newStatus)}
            options={statusOptions}
            className={`w-auto min-w-[140px] ${config.color} ${config.border} ${config.shadow} rounded-lg`}
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

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      'fuel': { label: 'Fuel', color: 'bg-blue-100 text-blue-800' },
      'it_software': { label: 'IT/Software', color: 'bg-purple-100 text-purple-800' },
      'energy': { label: 'Energy', color: 'bg-yellow-100 text-yellow-800' },
      'materials_supplies': { label: 'Materials/Supplies', color: 'bg-green-100 text-green-800' },
      'telecommunications': { label: 'Telecom', color: 'bg-indigo-100 text-indigo-800' },
      'rent_property': { label: 'Rent/Property', color: 'bg-orange-100 text-orange-800' },
      'professional_services': { label: 'Professional', color: 'bg-pink-100 text-pink-800' },
      'insurance': { label: 'Insurance', color: 'bg-red-100 text-red-800' },
      'travel_accommodation': { label: 'Travel', color: 'bg-teal-100 text-teal-800' },
      'banking_financial': { label: 'Banking', color: 'bg-emerald-100 text-emerald-800' },
      'marketing_advertising': { label: 'Marketing', color: 'bg-rose-100 text-rose-800' },
      'other_professional': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    };

    const config = categoryConfig[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDaysOverdue = (dueDate, status) => {
    // Only show days overdue if:
    // 1. Status is set to overdue, AND
    // 2. The due date has actually passed (to avoid showing negative or 0 when manually set)
    if (status !== 'overdue') return null;
    
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    // Only show if due date has actually passed
    if (due >= today) return null;
    
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Only return positive days (actually overdue)
    return diffDays > 0 ? diffDays : null;
  };

  const getSourceBadge = (source) => {
    if (source === 'peppol') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Icon name="Globe" size={12} className="mr-1" />
          {t('expenseInvoices.source.peppol', 'Peppol')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Icon name="Upload" size={12} className="mr-1" />
          {t('expenseInvoices.source.manual', 'Manual')}
        </span>
      );
    }
  };

  const getInvoiceTypeBadge = (invoiceType) => {
    if (!invoiceType || invoiceType === 'final') {
      return null; // Don't show badge for final invoices (default)
    }
    
    const typeConfig = {
      deposit: { 
        label: t('expenseInvoices.invoiceType.deposit', 'Deposit Invoice'), 
        color: 'bg-blue-100 text-blue-700 border border-blue-300',
        icon: 'CreditCard'
      },
      final: { 
        label: t('expenseInvoices.invoiceType.final', 'Final Invoice'), 
        color: 'bg-green-100 text-green-700 border border-green-300',
        icon: 'FileCheck'
      }
    };
    
    const config = typeConfig[invoiceType];
    if (!config) return null;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        <Icon name={config.icon} size={12} />
        <span>{config.label}</span>
      </span>
    );
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
      onSelectionChange(expenseInvoices.map(invoice => invoice.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      onSelectionChange([...selectedExpenseInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedExpenseInvoices.filter(id => id !== invoiceId));
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
      {expenseInvoices.map((invoice) => {
        const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
        return (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-150 overflow-visible">
            {/* Header with checkbox and invoice number */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedExpenseInvoices.includes(invoice.id)}
                  onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                />
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                  <div className="text-sm font-medium text-foreground">{getDisplayInvoiceNumber(invoice)}</div>
                    {getInvoiceTypeBadge(invoice.invoice_type)}
                  </div>
                  <div className="text-xs text-muted-foreground">{invoice.category || 'N/A'}</div>
                  {invoice.source === 'peppol' && getPeppolInvoiceNumber(invoice) !== getDisplayInvoiceNumber(invoice) && (
                    <div className="text-xs text-muted-foreground">Peppol: {getPeppolInvoiceNumber(invoice)}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Eye"
                  onClick={() => onExpenseInvoiceAction('view', invoice)}
                  title={t('expenseInvoices.table.actions.viewDetails', 'View Details')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Download"
                  onClick={() => onExpenseInvoiceAction('export', invoice)}
                  title={t('expenseInvoices.table.actions.exportPDF', 'Export PDF')}
                  className="text-primary hover:text-primary/80"
                  loading={downloadingInvoiceId === invoice.id}
                  disabled={downloadingInvoiceId === invoice.id}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Mail"
                  onClick={() => onExpenseInvoiceAction('send_to_accountant', invoice)}
                  title={!canEdit ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.sendToAccountant', 'Send to Accountant')}
                  className="text-primary hover:text-primary/80"
                  disabled={!canEdit}
                />
                {invoice.source === 'manual' && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Edit"
                  onClick={() => onExpenseInvoiceAction('edit', invoice)}
                  title={!canEdit ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.edit', 'Edit')}
                  disabled={!canEdit}
                />
                )}
              </div>
            </div>

            {/* Supplier Info */}
            <div className="mb-3">
              <div className="text-sm font-medium text-foreground">{invoice.supplier_name}</div>
              <div className="text-xs text-muted-foreground">{invoice.supplier_email}</div>
              {invoice.supplier_vat_number && (
                <div className="text-xs text-muted-foreground">VAT: {invoice.supplier_vat_number}</div>
              )}
              {invoice.source === 'peppol' && invoice.sender_peppol_id && (
                <div className="text-xs text-blue-600 mt-1 flex items-center">
                  <Icon name="Globe" size={10} className="mr-1" />
                  {invoice.sender_peppol_id}
                </div>
              )}
            </div>

            {/* Amount and Payment Method */}
            <div className="mb-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
              {invoice.net_amount && (
                <div className="text-xs text-muted-foreground">{t('expenseInvoices.table.net', 'Net')}: {formatCurrency(invoice.net_amount)}</div>
              )}
              {invoice.vat_amount && (
                <div className="text-xs text-muted-foreground">{t('expenseInvoices.table.vat', 'VAT')}: {formatCurrency(invoice.vat_amount)}</div>
              )}
              {/* Balance amount (same as total for expense invoices) */}
              <div className="text-xs text-muted-foreground mt-1">{t('expenseInvoices.table.balance', 'Balance')}: {formatCurrency(invoice.amount)}</div>
              {invoice.payment_method && (
                <div className="text-xs text-muted-foreground mt-1">{invoice.payment_method}</div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col space-y-1">
                {/* Document type label removed - not showing Self-Billing Invoice/Credit Note */}
              </div>
              <div className="flex flex-col items-end space-y-1">
                {getStatusBadge(invoice.status, invoice.id)}
                {daysOverdue && (
                  <span className="text-xs text-error">+{daysOverdue} {t('expenseInvoices.table.days', 'days')}</span>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div>
                <div className="font-medium">{t('expenseInvoices.table.issue', 'Issue')}:</div>
                <div>{formatDate(invoice.issue_date)}</div>
              </div>
              <div>
                <div className="font-medium">{t('expenseInvoices.table.due', 'Due')}:</div>
                <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                  {formatDate(invoice.due_date)}
                </div>
              </div>
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
              placeholder={t('expenseInvoices.table.searchPlaceholder', 'Search by number, supplier, category or status...')}
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
                {t('expenseInvoices.table.clearSearch', 'Clear')}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{t('expenseInvoices.table.view.label', 'View')}</span>
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
              {t('expenseInvoices.table.view.table', 'Table')}
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
              {t('expenseInvoices.table.view.cards', 'Cards')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {expenseInvoices.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('expenseInvoices.empty.noInvoicesFound', 'No expense invoices found')}</h3>
          <p className="text-muted-foreground">{t('expenseInvoices.empty.description', 'Start by importing your first expense invoice or adjust your filters.')}</p>
        </div>
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
      <div className="overflow-x-auto overflow-y-visible pb-4">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedExpenseInvoices.length === expenseInvoices.length && expenseInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <SortableHeader label={t('expenseInvoices.table.headers.invoiceNumber', 'Invoice #')} sortKey="number" />
              <SortableHeader label={t('expenseInvoices.table.headers.supplier', 'Supplier')} sortKey="supplier_name" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.source', 'Source')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.status', 'Status')}
              </th>
              <SortableHeader label={t('expenseInvoices.table.headers.amount', 'Amount')} sortKey="amount" />
              <SortableHeader label={t('expenseInvoices.table.headers.issueDate', 'Issue Date')} sortKey="issueDate" />
              <SortableHeader label={t('expenseInvoices.table.headers.dueDate', 'Due Date')} sortKey="dueDate" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {expenseInvoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150" style={{ position: 'relative' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedExpenseInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 flex-wrap">
                    <div className="text-sm font-medium text-foreground">{getDisplayInvoiceNumber(invoice)}</div>
                      {getInvoiceTypeBadge(invoice.invoice_type)}
                    </div>
                    <div className="text-xs text-muted-foreground">{invoice.category || 'N/A'}</div>
                    {invoice.source === 'peppol' && getPeppolInvoiceNumber(invoice) !== getDisplayInvoiceNumber(invoice) && (
                      <div className="text-xs text-muted-foreground">Peppol: {getPeppolInvoiceNumber(invoice)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{invoice.supplier_name}</div>
                    <div className="text-xs text-muted-foreground">{invoice.supplier_email}</div>
                    {invoice.supplier_vat_number && (
                      <div className="text-xs text-muted-foreground">VAT: {invoice.supplier_vat_number}</div>
                    )}
                    {invoice.source === 'peppol' && invoice.sender_peppol_id && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center">
                        <Icon name="Globe" size={10} className="mr-1" />
                        {invoice.sender_peppol_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                    {getSourceBadge(invoice.source)}
                      {/* Document type label removed - not showing Self-Billing Invoice/Credit Note */}
                      {invoice.source === 'peppol' && invoice.peppol_received_at && (
                        <span className="text-xs text-muted-foreground">
                          {t('expenseInvoices.table.received', 'Received')}: {formatDate(invoice.peppol_received_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ position: 'relative' }}>
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(invoice.status, invoice.id)}
                      {daysOverdue && (
                        <span className="text-xs text-error">+{daysOverdue} {t('expenseInvoices.table.days', 'days')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                    {renderAmountInfo(invoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                      {formatDate(invoice.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => onExpenseInvoiceAction('view', invoice)}
                        title={t('expenseInvoices.table.actions.viewDetails', 'View Details')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Download"
                        onClick={() => onExpenseInvoiceAction('export', invoice)}
                        title={t('expenseInvoices.table.actions.exportPDF', 'Export PDF')}
                        className="text-primary hover:text-primary/80"
                        loading={downloadingInvoiceId === invoice.id}
                        disabled={downloadingInvoiceId === invoice.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Mail"
                        onClick={() => onExpenseInvoiceAction('send_to_accountant', invoice)}
                        title={!canEdit ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.sendToAccountant', 'Send to Accountant')}
                        className="text-primary hover:text-primary/80"
                        disabled={!canEdit}
                      />
                      {invoice.source === 'manual' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Edit"
                        onClick={() => onExpenseInvoiceAction('edit', invoice)}
                        title={!canEdit ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.edit', 'Edit')}
                        disabled={!canEdit}
                      />
                      )}
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
  
export default ExpenseInvoicesDataTable; 