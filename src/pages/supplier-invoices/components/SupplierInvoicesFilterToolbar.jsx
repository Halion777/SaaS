import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SupplierInvoicesFilterToolbar = ({ onFiltersChange, onBulkAction }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
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

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'Matériaux', label: 'Matériaux' },
    { value: 'Outillage', label: 'Outillage' },
    { value: 'Services', label: 'Services' },
    { value: 'Fournitures', label: 'Fournitures' },
    { value: 'Assurance', label: 'Assurance' },
    { value: 'Transport', label: 'Transport' },
    { value: 'Marketing', label: 'Marketing' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: '7 derniers jours' },
    { value: 'month', label: '30 derniers jours' },
    { value: 'quarter', label: '3 derniers mois' },
    { value: 'year', label: '12 derniers mois' }
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Toutes les méthodes' },
    { value: 'Virement bancaire', label: 'Virement bancaire' },
    { value: 'Chèque', label: 'Chèque' },
    { value: 'Prélèvement', label: 'Prélèvement' },
    { value: 'Espèces', label: 'Espèces' },
    { value: 'Carte bancaire', label: 'Carte bancaire' }
  ];

  const amountRangeOptions = [
    { value: '', label: 'Tous les montants' },
    { value: '0-100', label: '0€ - 100€' },
    { value: '100-500', label: '100€ - 500€' },
    { value: '500-1000', label: '500€ - 1000€' },
    { value: '1000-5000', label: '1000€ - 5000€' },
    { value: '5000+', label: '5000€ et plus' }
  ];

  const bulkActions = [
    { value: 'send_to_accountant', label: 'Envoyer au comptable', icon: 'Send' },
    { value: 'mark_paid', label: 'Marquer comme payée', icon: 'CheckCircle' },
    { value: 'export', label: 'Exporter', icon: 'Download' },
    { value: 'delete', label: 'Supprimer', icon: 'Trash2' }
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
      category: '',
      dateRange: '',
      paymentMethod: '',
      amountRange: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="space-y-4">
        {/* Search and Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Icon 
                name="Search" 
                size={16} 
                color="var(--color-muted-foreground)" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
              />
              <Input
                type="text"
                placeholder="Rechercher par numéro, fournisseur, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              iconName="Filter"
              iconPosition="left"
              onClick={() => {}} // Toggle advanced filters
            >
              Filtres avancés
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                iconName="X"
                iconPosition="left"
                onClick={clearFilters}
              >
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            options={statusOptions}
            placeholder="Statut"
          />
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
            options={categoryOptions}
            placeholder="Catégorie"
          />
          <Select
            value={filters.dateRange}
            onValueChange={(value) => handleFilterChange('dateRange', value)}
            options={dateRangeOptions}
            placeholder="Période"
          />
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => handleFilterChange('paymentMethod', value)}
            options={paymentMethodOptions}
            placeholder="Méthode de paiement"
          />
          <Select
            value={filters.amountRange}
            onValueChange={(value) => handleFilterChange('amountRange', value)}
            options={amountRangeOptions}
            placeholder="Montant"
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Actions groupées :</span>
            <Select
              value=""
              onValueChange={(value) => {
                if (value) {
                  onBulkAction(value);
                }
              }}
              options={bulkActions}
              placeholder="Sélectionner une action"
              className="w-48"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="RefreshCw"
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              onClick={() => onBulkAction('export')}
            >
              Exporter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierInvoicesFilterToolbar; 