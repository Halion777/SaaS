import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const InvoicesFilterToolbar = ({ onFiltersChange, onBulkAction }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: '',
    paymentMethod: '',
    amountRange: ''
  });

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'paid', label: 'Payée' },
    { value: 'pending', label: 'En attente' },
    { value: 'overdue', label: 'En retard' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Toutes les dates' },
    { value: 'today', label: "Aujourd\'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' }
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Tous les moyens' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte bancaire' }
  ];

  const amountRangeOptions = [
    { value: '', label: 'Tous les montants' },
    { value: '0-500', label: '0€ - 500€' },
    { value: '500-1000', label: '500€ - 1 000€' },
    { value: '1000-5000', label: '1 000€ - 5 000€' },
    { value: '5000+', label: '5 000€+' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      dateRange: '',
      paymentMethod: '',
      amountRange: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const bulkActions = [
    { value: 'send_reminder', label: 'Envoyer rappel', icon: 'Mail' },
    { value: 'mark_paid', label: 'Marquer comme payée', icon: 'CheckCircle' },
    { value: 'export', label: 'Exporter', icon: 'Download' },
    { value: 'delete', label: 'Supprimer', icon: 'Trash2' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Search and Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
        <div className="lg:col-span-2">
          <Input
            type="search"
            placeholder="Rechercher par numéro, client..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        <Select
          placeholder="Statut"
          options={statusOptions}
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
        />

        <Select
          placeholder="Période"
          options={dateRangeOptions}
          value={filters.dateRange}
          onChange={(value) => handleFilterChange('dateRange', value)}
        />

        <Select
          placeholder="Paiement"
          options={paymentMethodOptions}
          value={filters.paymentMethod}
          onChange={(value) => handleFilterChange('paymentMethod', value)}
        />

        <Select
          placeholder="Montant"
          options={amountRangeOptions}
          value={filters.amountRange}
          onChange={(value) => handleFilterChange('amountRange', value)}
        />
      </div>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="RotateCcw"
            iconPosition="left"
            onClick={clearFilters}
          >
            Réinitialiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Filter"
            iconPosition="left"
          >
            Filtres avancés
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bulkActions.map((action) => (
            <Button
              key={action.value}
              variant={action.value === 'delete' ? 'destructive' : 'outline'}
              size="sm"
              iconName={action.icon}
              iconPosition="left"
              onClick={() => onBulkAction(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoicesFilterToolbar;