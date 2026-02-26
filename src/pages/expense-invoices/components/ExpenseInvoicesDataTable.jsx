import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { formatCurrency } from '../../../utils/numberFormat';

const ExpenseInvoicesDataTable = ({ expenseInvoices, onExpenseInvoiceAction, selectedExpenseInvoices, onSelectionChange, filters, onFiltersChange, onStatusUpdate, downloadingInvoiceId = null, canEdit = true, canDelete = true, groupBySupplier = false }) => {
  const { t, i18n } = useTranslation();
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'desc' });
  const [viewMode, setViewMode] = useState(() => {
    // Default to card view on mobile/tablet, table view on desktop
    return window.innerWidth < 1024 ? 'card' : 'table';
  }); // 'table' or 'card'
  const [expandedGroups, setExpandedGroups] = useState({}); // Track which supplier groups are expanded
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Helper to check if invoice has PDF available for download
  const hasPDFAvailable = (invoice) => {
    return invoice.source === 'peppol' && invoice.peppol_metadata?.pdfAttachmentPath;
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


  const formatDate = (date) => {
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US').format(new Date(date));
  };

  const renderAmountInfo = (invoice) => {
    const invoiceType = invoice.invoice_type || invoice.invoiceType || 'final';
    const depositAmount = invoice.peppol_metadata?.deposit_amount || 0;
    const balanceAmount = invoice.peppol_metadata?.balance_amount || 0;
    const depositEnabled = depositAmount > 0;
    
    // Calculate net and VAT for the displayed amount (credit notes already stored negative)
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
        // For final invoice: show FULL PROJECT net and VAT (not proportional)
        // The invoice.net_amount and invoice.vat_amount already contain full project amounts from UBL
        displayNet = invoice.net_amount || 0;
        displayVAT = invoice.vat_amount || 0;
      }
    }

    // Only show if we have valid amounts (non-zero); credit notes already stored negative
    if (displayNet !== 0 || displayVAT !== 0) {
      return (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>HT: {formatCurrency(displayNet)}</div>
          <div>TVA: {formatCurrency(displayVAT)}</div>
        </div>
      );
    }
    return null;
  };

  // Status options for manual update - includes 'overdue' for manual selection
  // No badgeColor to prevent dots from showing in dropdown
  const statusOptions = [
    { value: 'paid', label: t('expenseInvoices.status.paid', 'Paid') },
    { value: 'pending', label: t('expenseInvoices.status.pending', 'Pending') },
    { value: 'overdue', label: t('expenseInvoices.status.overdue', 'Overdue') },
    { value: 'cancelled', label: t('expenseInvoices.status.cancelled', 'Cancelled') }
  ];

  const getInvoiceTypeBadge = (invoice) => {
    if (invoice?.peppol_metadata?.isCreditNote) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 bg-amber-100 text-amber-800 border border-amber-300">
          <Icon name="FileMinus" size={12} />
          <span>{t('expenseInvoices.invoiceType.creditNote', 'Credit note')}</span>
        </span>
      );
    }
    const invoiceType = typeof invoice === 'string' ? invoice : (invoice?.invoice_type || invoice?.invoiceType || 'final');
    const typeConfig = {
      deposit: {
        label: t('expenseInvoices.invoiceType.deposit', 'Deposit'),
        color: 'bg-blue-100 text-blue-700 border border-blue-300',
        icon: 'CreditCard'
      },
      final: {
        label: t('expenseInvoices.invoiceType.final', 'Final'),
        color: 'bg-purple-100 text-purple-700 border border-purple-300',
        icon: 'CheckCircle'
      }
    };
    const config = typeConfig[invoiceType] || typeConfig.final;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        <Icon name={config.icon} size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

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
        color: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white',
        border: 'border border-orange-400/30',
        shadow: 'shadow-sm shadow-orange-500/20'
      },
      overdue: { 
        label: t('expenseInvoices.status.overdue', 'Overdue'), 
        color: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
        border: 'border border-red-400/30',
        shadow: 'shadow-sm shadow-red-500/20'
      },
      cancelled: { 
        label: t('expenseInvoices.status.cancelled', 'Cancelled'), 
        color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        border: 'border border-purple-400/30',
        shadow: 'shadow-sm shadow-purple-500/20'
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
            className={`w-auto min-w-[100px] max-w-[100px] ${config.color} ${config.border} ${config.shadow} rounded-lg`}
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select all invoices on current page
      const currentPageInvoiceIds = paginatedInvoices.map(invoice => invoice.id);
      onSelectionChange([...new Set([...selectedExpenseInvoices, ...currentPageInvoiceIds])]);
    } else {
      // Deselect all invoices on current page
      const currentPageInvoiceIds = paginatedInvoices.map(invoice => invoice.id);
      onSelectionChange(selectedExpenseInvoices.filter(id => !currentPageInvoiceIds.includes(id)));
    }
  };

  // Group invoices by supplier and buyerReference (for deposit/final pairs)
  const groupInvoicesBySupplier = (invoices) => {
    const groups = {};
    
    invoices.forEach(invoice => {
      // Group by supplier name only - all invoices from same supplier in one group
      const groupKey = invoice.supplier_name;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          supplier: invoice.supplier_name,
          invoices: [],
          totalAmount: 0,
          hasDeposit: false,
          hasFinal: false
        };
      }
      
      groups[groupKey].invoices.push(invoice);
      groups[groupKey].totalAmount += parseFloat(invoice.amount || 0);
      
      const invoiceType = invoice.invoice_type || 'final';
      if (invoiceType === 'deposit') {
        groups[groupKey].hasDeposit = true;
      } else if (invoiceType === 'final') {
        groups[groupKey].hasFinal = true;
      }
    });
    
    return Object.values(groups);
  };

  const toggleGroupExpansion = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      onSelectionChange([...selectedExpenseInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedExpenseInvoices.filter(id => id !== invoiceId));
    }
  };

  // Sort and paginate expense invoices
  const sortedAndPaginatedInvoices = useMemo(() => {
    let sorted = [...expenseInvoices];

    // Apply sorting
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        // Handle special case for invoice number - use getDisplayInvoiceNumber
        if (sortConfig.key === 'number') {
          aValue = getDisplayInvoiceNumber(a) || '';
          bValue = getDisplayInvoiceNumber(b) || '';
          // Extract numeric part for proper sorting
          const aNum = parseInt((aValue || '').replace(/\D/g, '')) || 0;
          const bNum = parseInt((bValue || '').replace(/\D/g, '')) || 0;
          aValue = aNum;
          bValue = bNum;
        } else {
          // For other fields, use the sortKey directly
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];

          if (sortConfig.key === 'amount') {
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
          } else if (sortConfig.key === 'issueDate' || sortConfig.key === 'dueDate') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
          } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = (bValue || '').toLowerCase();
          }
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [expenseInvoices, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedAndPaginatedInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = sortedAndPaginatedInvoices.slice(startIndex, endIndex);

  // Reset to first page when invoices change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [expenseInvoices.length]);

  // Use SortableHeader from ui components
  const SortableHeaderComponent = ({ label, sortKey }) => {
    // Determine if this is a numeric/date column
    const numericDateKeys = ['number', 'amount', 'issueDate', 'dueDate'];
    const showIcon = numericDateKeys.includes(sortKey);
    
    return (
      <SortableHeader
        label={label}
        sortKey={sortKey}
        currentSortKey={sortConfig.key}
        sortDirection={sortConfig.direction}
        onSort={handleSort}
        showIcon={showIcon}
      />
  );
  };

  const renderCardView = () => {
    if (groupBySupplier) {
      // Use paginated invoices for grouped view to ensure pagination works
      const groups = groupInvoicesBySupplier(paginatedInvoices);
      
      return (
        <div className="space-y-4 p-4">
          {groups.map((group, groupIndex) => {
            const groupKey = group.supplier; // Group by supplier name only
            const isExpanded = expandedGroups[groupKey] !== false; // Default to expanded
            
            return (
              <div key={groupKey} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Group Header */}
                <div 
                  className="bg-muted/30 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroupExpansion(groupKey)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                      size={20} 
                      className="text-muted-foreground"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{group.supplier}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {group.hasDeposit && group.hasFinal && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {t('expenseInvoices.grouping.depositAndFinal', 'Deposit + Final')}
                      </span>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">{group.invoices.length} {t('expenseInvoices.grouping.invoices', 'invoice(s)')}</span>
                      <span className="ml-3 font-semibold text-foreground">{formatCurrency(group.totalAmount)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Group Content */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {group.invoices.map((invoice) => {
                      const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
                      return renderInvoiceCard(invoice, daysOverdue);
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Ungrouped view
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {paginatedInvoices.map((invoice) => {
        const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
          return renderInvoiceCard(invoice, daysOverdue);
        })}
      </div>
    );
  };

  const renderInvoiceCard = (invoice, daysOverdue) => {
        return (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-150 overflow-visible">
            {/* Header with checkbox and invoice number */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedExpenseInvoices.includes(invoice.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectionChange([...selectedExpenseInvoices, invoice.id]);
                } else {
                  onSelectionChange(selectedExpenseInvoices.filter(id => id !== invoice.id));
                }
              }}
                />
                <div>
              <div className="font-semibold text-foreground">{getDisplayInvoiceNumber(invoice)}</div>
            </div>
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

        {/* Amount and Payment Method (credit notes stored negative in DB) */}
        <div className="mb-3">
          <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
          {(invoice.net_amount !== null && invoice.net_amount !== undefined && invoice.net_amount !== 0) && (
            <div className="text-xs text-muted-foreground">{t('expenseInvoices.table.net', 'Net')}: {formatCurrency(invoice.net_amount)}</div>
          )}
          {(invoice.vat_amount !== null && invoice.vat_amount !== undefined && invoice.vat_amount !== 0) && (
            <div className="text-xs text-muted-foreground">{t('expenseInvoices.table.vat', 'VAT')}: {formatCurrency(invoice.vat_amount)}</div>
          )}
          {/* Balance amount (same as total for expense invoices) */}
          <div className="text-xs text-muted-foreground mt-1">{t('expenseInvoices.table.balance', 'Balance')}: {formatCurrency(invoice.amount)}</div>
          {invoice.payment_method && (
            <div className="text-xs text-muted-foreground mt-1">{invoice.payment_method}</div>
          )}
        </div>

        {/* Status and Invoice Type */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col space-y-1">
                    {getInvoiceTypeBadge(invoice)}
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

        {/* Category & Source */}
        <div className="flex items-center justify-between mb-3">
          {invoice.category && getCategoryBadge(invoice.category)}
          {getSourceBadge(invoice.source)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpenseInvoiceAction('view', invoice)}
            iconName="Eye"
            className="text-primary hover:text-primary/80"
            title={t('expenseInvoices.table.actions.viewDetails', 'View Details')}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpenseInvoiceAction('export', invoice)}
            iconName="Download"
            className={hasPDFAvailable(invoice) ? "text-primary hover:text-primary/80" : "text-muted-foreground opacity-50 cursor-not-allowed"}
            title={hasPDFAvailable(invoice) 
              ? t('expenseInvoices.table.actions.exportPDF', 'Export PDF')
              : t('expenseInvoices.table.actions.noPDFAvailable', 'PDF not available (only for Peppol invoices with stored PDF)')}
            loading={downloadingInvoiceId === invoice.id}
            disabled={!hasPDFAvailable(invoice) || downloadingInvoiceId === invoice.id}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpenseInvoiceAction('send_to_accountant', invoice)}
            iconName="Mail"
            className="text-primary hover:text-primary/80"
            title={!canEdit ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.sendToAccountant', 'Send to Accountant')}
            disabled={!canEdit}
          />
        </div>
      </div>
    );
  };
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
                  checked={
                    paginatedInvoices.length > 0 && 
                    paginatedInvoices.every(invoice => selectedExpenseInvoices.includes(invoice.id))
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <SortableHeaderComponent 
                label={t('expenseInvoices.table.headers.invoiceNumber', 'Invoice #')} 
                sortKey="number"
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.invoiceType', 'Type')}
              </th>
              <SortableHeaderComponent 
                label={t('expenseInvoices.table.headers.supplier', 'Supplier')} 
                sortKey="supplier_name"
              />
              <SortableHeaderComponent 
                label={t('expenseInvoices.table.headers.amount', 'Amount')} 
                sortKey="amount"
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.status', 'Status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.source', 'Source')}
              </th>
              <SortableHeaderComponent 
                label={t('expenseInvoices.table.headers.issueDate', 'Issue Date')} 
                sortKey="issueDate"
              />
              <SortableHeaderComponent 
                label={t('expenseInvoices.table.headers.dueDate', 'Due Date')} 
                sortKey="dueDate"
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('expenseInvoices.table.headers.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {groupBySupplier ? (
              // Grouped view
              groupInvoicesBySupplier(expenseInvoices).map((group, groupIndex) => {
                const groupKey = group.supplier; // Group by supplier name only
                const isExpanded = expandedGroups[groupKey] !== false;
                
                return (
                  <React.Fragment key={groupKey}>
                    {/* Group Header Row */}
                    <tr className="bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={() => toggleGroupExpansion(groupKey)}>
                      <td colSpan="10" className="px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon 
                              name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                              size={20} 
                              className="text-muted-foreground"
                            />
                            <div>
                              <div className="font-semibold text-foreground">{group.supplier}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {group.hasDeposit && group.hasFinal && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {t('expenseInvoices.groupBySupplier.depositAndFinal', 'Deposit + Final')}
                              </span>
                            )}
                            <div className="text-sm">
                              <span className="text-muted-foreground">{group.invoices.length} {t('expenseInvoices.groupBySupplier.invoices', 'invoice(s)')}</span>
                              <span className="ml-3 font-semibold text-foreground">{formatCurrency(group.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Group Invoices */}
                    {isExpanded && group.invoices.map((invoice) => {
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
                    <div className="text-sm font-medium text-foreground">{getDisplayInvoiceNumber(invoice)}</div>
                    <div className="text-xs text-muted-foreground">{invoice.category || 'N/A'}</div>
                  </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                      {getInvoiceTypeBadge(invoice)}
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
                            <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                            {renderAmountInfo(invoice)}
                          </td>
                          <td className="px-6 py-4" style={{ position: 'relative', minWidth: '120px' }}>
                            <div className="flex flex-col space-y-1">
                              {getStatusBadge(invoice.status, invoice.id)}
                              {daysOverdue && (
                                <span className="text-xs text-error">+{daysOverdue} {t('expenseInvoices.table.days', 'days')}</span>
                              )}
                            </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                    {getSourceBadge(invoice.source)}
                      {invoice.source === 'peppol' && invoice.peppol_received_at && (
                        <span className="text-xs text-muted-foreground">
                          {t('expenseInvoices.table.received', 'Received')}: {formatDate(invoice.peppol_received_at)}
                        </span>
                      )}
                    </div>
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
                                title={hasPDFAvailable(invoice) 
                                  ? t('expenseInvoices.table.actions.exportPDF', 'Export PDF')
                                  : t('expenseInvoices.table.actions.noPDFAvailable', 'PDF not available (only for Peppol invoices with stored PDF)')}
                                className={hasPDFAvailable(invoice) ? "text-primary hover:text-primary/80" : "text-muted-foreground opacity-50 cursor-not-allowed"}
                                loading={downloadingInvoiceId === invoice.id}
                                disabled={!hasPDFAvailable(invoice) || downloadingInvoiceId === invoice.id}
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
                                className="text-muted-foreground hover:text-primary"
                                disabled={!canEdit}
                              />
                              )}
                              {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                iconName="Trash2"
                                onClick={() => onExpenseInvoiceAction('delete', invoice)}
                                title={!canDelete ? t('permissions.noFullAccess') : t('expenseInvoices.table.actions.delete', 'Delete')}
                                className="text-muted-foreground hover:text-error"
                                disabled={!canDelete}
                              />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              // Ungrouped view
              paginatedInvoices.map((invoice) => {
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
                    <div className="text-sm font-medium text-foreground">{getDisplayInvoiceNumber(invoice)}</div>
                    <div className="text-xs text-muted-foreground">{invoice.category || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getInvoiceTypeBadge(invoice)}
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
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                    {renderAmountInfo(invoice)}
                  </td>
                  <td className="px-6 py-4" style={{ position: 'relative', minWidth: '120px' }}>
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(invoice.status, invoice.id)}
                      {daysOverdue && (
                        <span className="text-xs text-error">+{daysOverdue} {t('expenseInvoices.table.days', 'days')}</span>
                      )}
                    </div>
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
                        title={hasPDFAvailable(invoice) 
                          ? t('expenseInvoices.table.actions.exportPDF', 'Export PDF')
                          : t('expenseInvoices.table.actions.noPDFAvailable', 'PDF not available (only for Peppol invoices with stored PDF)')}
                        className={hasPDFAvailable(invoice) ? "text-primary hover:text-primary/80" : "text-muted-foreground opacity-50 cursor-not-allowed"}
                        loading={downloadingInvoiceId === invoice.id}
                        disabled={!hasPDFAvailable(invoice) || downloadingInvoiceId === invoice.id}
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
            })
            )}
          </tbody>
        </table>
        </div>
      )}
      {sortedAndPaginatedInvoices.length > itemsPerPage && (
        <div className="mt-4 px-4 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedAndPaginatedInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
  };
  
export default ExpenseInvoicesDataTable; 