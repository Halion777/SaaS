import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const SupplierInvoicesDataTable = ({ supplierInvoices, onSupplierInvoiceAction, selectedSupplierInvoices, onSelectionChange }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'desc' });

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'Matériaux': 'bg-blue-100 text-blue-800',
      'Outillage': 'bg-green-100 text-green-800',
      'Services': 'bg-purple-100 text-purple-800',
      'Fournitures': 'bg-orange-100 text-orange-800',
      'Assurance': 'bg-red-100 text-red-800',
      'Transport': 'bg-yellow-100 text-yellow-800',
      'Marketing': 'bg-pink-100 text-pink-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
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
      onSelectionChange(supplierInvoices.map(invoice => invoice.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      onSelectionChange([...selectedSupplierInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedSupplierInvoices.filter(id => id !== invoiceId));
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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedSupplierInvoices.length === supplierInvoices.length && supplierInvoices.length > 0}
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
            {supplierInvoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedSupplierInvoices.includes(invoice.id)}
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatCurrency(invoice.amount)}</div>
                    {invoice.paymentMethod && (
                      <div className="text-xs text-muted-foreground">{invoice.paymentMethod}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(invoice.category)}
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
                        onClick={() => onSupplierInvoiceAction('view', invoice)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Download"
                        onClick={() => onSupplierInvoiceAction('download', invoice)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Send"
                        onClick={() => onSupplierInvoiceAction('send_to_accountant', invoice)}
                        title="Envoyer au comptable"
                      />
                      {invoice.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="CheckCircle"
                          onClick={() => onSupplierInvoiceAction('markPaid', invoice)}
                          title="Marquer comme payée"
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

      {supplierInvoices.length === 0 && (
        <div className="text-center py-12">
          <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune facture fournisseur trouvée</h3>
          <p className="text-muted-foreground">Commencez par importer votre première facture fournisseur ou ajustez vos filtres.</p>
        </div>
      )}
    </div>
  );
};

export default SupplierInvoicesDataTable; 