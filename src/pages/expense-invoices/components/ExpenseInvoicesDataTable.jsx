import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExpenseInvoicesDataTable = ({ expenseInvoices, onExpenseInvoiceAction, selectedExpenseInvoices, onSelectionChange, filters, onFiltersChange }) => {
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Payée', color: 'bg-success text-success-foreground' },
      pending: { label: 'En attente', color: 'bg-warning text-warning-foreground' },
      overdue: { label: 'En retard', color: 'bg-error text-error-foreground' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${config.color}`}>
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
    if (status !== 'overdue') return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSourceBadge = (source) => {
    if (source === 'peppol') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Icon name="Globe" size={12} className="mr-1" />
          Peppol
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Icon name="Upload" size={12} className="mr-1" />
          Manual
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
      {supplierInvoices.map((invoice) => {
        const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
        return (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-150">
            {/* Header with checkbox and invoice number */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedSupplierInvoices.includes(invoice.id)}
                  onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                  <div className="text-xs text-muted-foreground">{invoice.invoiceFile}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Eye"
                  onClick={() => onSupplierInvoiceAction('view', invoice)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Edit"
                  onClick={() => onSupplierInvoiceAction('edit', invoice)}
                />
              </div>
            </div>

            {/* Supplier Info */}
            <div className="mb-3">
              <div className="text-sm font-medium text-foreground">{invoice.supplierName}</div>
              <div className="text-xs text-muted-foreground">{invoice.supplierEmail}</div>
            </div>

            {/* Amount and Payment Method */}
            <div className="mb-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</div>
              {invoice.paymentMethod && (
                <div className="text-xs text-muted-foreground">{invoice.paymentMethod}</div>
              )}
            </div>

            {/* Category and Status */}
            <div className="flex items-center justify-between mb-3">
              {getCategoryBadge(invoice.category)}
              <div className="flex flex-col items-end space-y-1">
                {getStatusBadge(invoice.status)}
                {daysOverdue && (
                  <span className="text-xs text-error">+{daysOverdue} jours</span>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div>
                <div className="font-medium">Émission:</div>
                <div>{formatDate(invoice.issueDate)}</div>
              </div>
              <div>
                <div className="font-medium">Échéance:</div>
                <div className={`${invoice.status === 'overdue' ? 'text-error font-medium' : ''}`}>
                  {formatDate(invoice.dueDate)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                iconName="Copy"
                onClick={() => onSupplierInvoiceAction('duplicate', invoice)}
                className="text-xs"
              >
                Dupliquer
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Search Bar */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par numéro, fournisseur, catégorie ou statut..."
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
                Effacer
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Vue:</span>
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
              Tableau
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
              Cartes
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {expenseInvoices.length} facture(s)
        </div>
      </div>

      {/* Content */}
      {expenseInvoices.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune facture de dépense trouvée</h3>
          <p className="text-muted-foreground">Commencez par importer votre première facture de dépense ou ajustez vos filtres.</p>
        </div>
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedExpenseInvoices.length === expenseInvoices.length && expenseInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <SortableHeader label="N° Facture" sortKey="number" />
              <SortableHeader label="Fournisseur" sortKey="supplierName" />
              <SortableHeader label="Montant" sortKey="amount" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <SortableHeader label="Date émission" sortKey="issueDate" />
              <SortableHeader label="Date échéance" sortKey="dueDate" />
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {expenseInvoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedExpenseInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{invoice.number}</div>
                    <div className="text-xs text-muted-foreground">{invoice.invoiceFile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{invoice.supplierName}</div>
                    <div className="text-xs text-muted-foreground">{invoice.supplierEmail}</div>
                    {invoice.supplierVatNumber && (
                      <div className="text-xs text-muted-foreground">VAT: {invoice.supplierVatNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                    {invoice.netAmount && (
                      <div className="text-xs text-muted-foreground">Net: {formatCurrency(invoice.netAmount)}</div>
                    )}
                    {invoice.vatAmount && (
                      <div className="text-xs text-muted-foreground">VAT: {formatCurrency(invoice.vatAmount)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(invoice.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSourceBadge(invoice.source)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(invoice.status)}
                      {daysOverdue && (
                        <span className="text-xs text-error">+{daysOverdue} jours</span>
                      )}
                    </div>
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
                        onClick={() => onExpenseInvoiceAction('view', invoice)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Edit"
                        onClick={() => onExpenseInvoiceAction('edit', invoice)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Copy"
                        onClick={() => onExpenseInvoiceAction('duplicate', invoice)}
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
  
export default ExpenseInvoicesDataTable; 