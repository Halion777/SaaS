import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SupplierInvoicesFilterToolbar = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    dateRange: '',
    paymentMethod: '',
    amountRange: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.category) count++;
    if (filters.dateRange) count++;
    if (filters.paymentMethod) count++;
    if (filters.amountRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">Filtres</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
            </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8"
            >
              <span className="flex items-center">
                <Icon name="X" size={14} className="mr-1" />
                Effacer
              </span>
              </Button>
            )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? "Masquer les filtres" : "Afficher les filtres"}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
        </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Input
              type="search"
              placeholder="Rechercher par numéro, fournisseur..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>

          <Select
            label="Statut"
            options={statusOptions}
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            placeholder="Sélectionner un statut"
          />

          <Select
            label="Catégorie"
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            placeholder="Sélectionner une catégorie"
          />

          <Select
            label="Période"
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            placeholder="Sélectionner une période"
          />

          <Select
            label="Paiement"
            options={paymentMethodOptions}
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            placeholder="Sélectionner un moyen"
          />

          <Select
            label="Montant"
            options={amountRangeOptions}
            value={filters.amountRange}
            onChange={(e) => handleFilterChange('amountRange', e.target.value)}
            placeholder="Sélectionner un montant"
          />
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.search && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Recherche: {filters.search}</span>
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer la recherche"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.status && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de statut"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.category && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Catégorie: {categoryOptions.find(opt => opt.value === filters.category)?.label}</span>
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de catégorie"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.dateRange && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Période: {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}</span>
                <button
                  onClick={() => handleFilterChange('dateRange', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de période"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.paymentMethod && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Paiement: {paymentMethodOptions.find(opt => opt.value === filters.paymentMethod)?.label}</span>
                <button
                  onClick={() => handleFilterChange('paymentMethod', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de paiement"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.amountRange && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Montant: {amountRangeOptions.find(opt => opt.value === filters.amountRange)?.label}</span>
                <button
                  onClick={() => handleFilterChange('amountRange', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de montant"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filters - Expandable */}
      {isExpanded && (
        <div className="md:hidden p-3 space-y-4 border-t border-border">
          <div className="space-y-3">
            <Input
              type="search"
              placeholder="Rechercher par numéro, fournisseur..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />

            <Select
              label="Statut"
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              placeholder="Tous les statuts"
            />

            <Select
              label="Catégorie"
              options={categoryOptions}
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Toutes les catégories"
            />

            <Select
              label="Période"
              options={dateRangeOptions}
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              placeholder="Toutes les dates"
            />

            <Select
              label="Paiement"
              options={paymentMethodOptions}
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              placeholder="Toutes les méthodes"
            />

            <Select
              label="Montant"
              options={amountRangeOptions}
              value={filters.amountRange}
              onChange={(e) => handleFilterChange('amountRange', e.target.value)}
              placeholder="Tous les montants"
            />
          </div>
          
          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.search && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Recherche: {filters.search}</span>
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.status && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.category && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Catégorie: {categoryOptions.find(opt => opt.value === filters.category)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.dateRange && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Période: {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('dateRange', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.paymentMethod && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Paiement: {paymentMethodOptions.find(opt => opt.value === filters.paymentMethod)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('paymentMethod', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.amountRange && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Montant: {amountRangeOptions.find(opt => opt.value === filters.amountRange)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('amountRange', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Active Filters Summary (when collapsed) */}
      {!isExpanded && activeFiltersCount > 0 && (
        <div className="md:hidden p-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
            <span className="text-xs ml-2">
              {filters.search && '• Recherche'}
              {filters.status && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.category && ` • ${categoryOptions.find(opt => opt.value === filters.category)?.label}`}
              {filters.dateRange && ` • ${dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}`}
              {filters.paymentMethod && ` • ${paymentMethodOptions.find(opt => opt.value === filters.paymentMethod)?.label}`}
              {filters.amountRange && ` • ${amountRangeOptions.find(opt => opt.value === filters.amountRange)?.label}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierInvoicesFilterToolbar; 