import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ExpenseInvoicesFilterToolbar = ({ filters, onFiltersChange }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'paid', label: 'Payée' },
    { value: 'pending', label: 'En attente' },
    { value: 'overdue', label: 'En retard' }
  ];



  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'it_software', label: 'IT/Software' },
    { value: 'energy', label: 'Energy' },
    { value: 'materials_supplies', label: 'Materials/Supplies' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'rent_property', label: 'Rent & Property' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'travel_accommodation', label: 'Travel & Accommodation' },
    { value: 'banking_financial', label: 'Banking & Financial' },
    { value: 'marketing_advertising', label: 'Marketing & Advertising' },
    { value: 'other_professional', label: 'Other Professional Costs' }
  ];

  const sourceOptions = [
    { value: '', label: 'Toutes les sources' },
    { value: 'manual', label: 'Manuel' },
    { value: 'peppol', label: 'Peppol' }
  ];

  const handleDateRangeChange = (field, value) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    onFiltersChange({ ...filters, dateRange: newRange });
  };

  const handleAmountRangeChange = (field, value) => {
    const newRange = { ...amountRange, [field]: value };
    setAmountRange(newRange);
    onFiltersChange({ ...filters, amountRange: newRange });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.category) count++;
    if (filters.source) count++;
    if (dateRange.start || dateRange.end) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      category: '',
      source: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    };
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    onFiltersChange(clearedFilters);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Statut"
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            placeholder="Tous les statuts"
          />



          <Select
            label="Catégorie"
            options={categoryOptions}
            value={filters.category || ''}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            placeholder="Toutes les catégories"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Période</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="Du"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
              <Input
                type="date"
                placeholder="Au"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Montant (€)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={amountRange.min}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={amountRange.max}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.status && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, status: '' })}
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
                  onClick={() => onFiltersChange({ ...filters, category: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de catégorie"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}

            {filters.source && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Source: {sourceOptions.find(opt => opt.value === filters.source)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, source: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de source"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(dateRange.start || dateRange.end) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  Période: {dateRange.start || '...'} - {dateRange.end || '...'}
                </span>
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    onFiltersChange({ ...filters, dateRange: { start: '', end: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de période"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(amountRange.min || amountRange.max) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  Montant: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€
                </span>
                <button
                  onClick={() => {
                    setAmountRange({ min: '', max: '' });
                    onFiltersChange({ ...filters, amountRange: { min: '', max: '' } });
                  }}
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
            <Select
              label="Statut"
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              placeholder="Tous les statuts"
            />



            <Select
              label="Catégorie"
              options={categoryOptions}
              value={filters.category || ''}
              onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              placeholder="Toutes les catégories"
            />

            <Select
              label="Source"
              options={sourceOptions}
              value={filters.source || ''}
              onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })}
              placeholder="Toutes les sources"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Période</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="Du"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Au"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Montant (€)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.status && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, status: '' })}
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
                    onClick={() => onFiltersChange({ ...filters, category: '' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}

              {filters.source && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Source: {sourceOptions.find(opt => opt.value === filters.source)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, source: '' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {(dateRange.start || dateRange.end) && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Période: {dateRange.start || '...'} - {dateRange.end || '...'}</span>
                  <button
                    onClick={() => {
                      setDateRange({ start: '', end: '' });
                      onFiltersChange({ ...filters, dateRange: { start: '', end: '' } });
                    }}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {(amountRange.min || amountRange.max) && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Montant: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€</span>
                  <button
                    onClick={() => {
                      setAmountRange({ min: '', max: '' });
                      onFiltersChange({ ...filters, amountRange: { min: '', max: '' } });
                    }}
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
              {filters.status && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.category && ` • ${categoryOptions.find(opt => opt.value === filters.category)?.label}`}
              {filters.source && ` • ${sourceOptions.find(opt => opt.value === filters.source)?.label}`}
              {(dateRange.start || dateRange.end) && ` • Période`}
              {(amountRange.min || amountRange.max) && ` • Montant`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseInvoicesFilterToolbar; 