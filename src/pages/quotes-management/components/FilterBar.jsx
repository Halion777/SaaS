import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const FilterBar = ({ filters, onFiltersChange, onClearFilters }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'viewed', label: 'Consulté' },
    { value: 'signed', label: 'Signé' },
    { value: 'refused', label: 'Refusé' }
  ];

  const clientOptions = [
    { value: '', label: 'Tous les clients' },
    { value: 'marie-dubois', label: 'Marie Dubois' },
    { value: 'pierre-martin', label: 'Pierre Martin' },
    { value: 'sophie-bernard', label: 'Sophie Bernard' },
    { value: 'jean-moreau', label: 'Jean Moreau' },
    { value: 'claire-petit', label: 'Claire Petit' },
    { value: 'michel-durand', label: 'Michel Durand' },
    { value: 'isabelle-leroy', label: 'Isabelle Leroy' },
    { value: 'thomas-roux', label: 'Thomas Roux' }
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
    if (filters.status) count++;
    if (filters.client) count++;
    if (dateRange.start || dateRange.end) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground flex items-center space-x-2">
          <Icon name="Filter" size={20} />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        <Select
          label="Statut"
          options={statusOptions}
          value={filters.status || ''}
          onChange={(value) => onFiltersChange({ ...filters, status: value })}
          placeholder="Sélectionner un statut"
        />

        <Select
          label="Client"
          options={clientOptions}
          value={filters.client || ''}
          onChange={(value) => onFiltersChange({ ...filters, client: value })}
          placeholder="Sélectionner un client"
          searchable
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

      {/* Mobile Filters */}
      <div className="lg:hidden space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Statut"
            options={statusOptions}
            value={filters.status || ''}
            onChange={(value) => onFiltersChange({ ...filters, status: value })}
            placeholder="Tous les statuts"
          />

          <Select
            label="Client"
            options={clientOptions}
            value={filters.client || ''}
            onChange={(value) => onFiltersChange({ ...filters, client: value })}
            placeholder="Tous les clients"
            searchable
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date de début</label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date de fin</label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Montant min (€)"
            type="number"
            placeholder="0"
            value={amountRange.min}
            onChange={(e) => handleAmountRangeChange('min', e.target.value)}
          />
          <Input
            label="Montant max (€)"
            type="number"
            placeholder="10000"
            value={amountRange.max}
            onChange={(e) => handleAmountRangeChange('max', e.target.value)}
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {filters.status && (
            <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
              <button
                onClick={() => onFiltersChange({ ...filters, status: '' })}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {filters.client && (
            <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              <span>Client: {clientOptions.find(opt => opt.value === filters.client)?.label}</span>
              <button
                onClick={() => onFiltersChange({ ...filters, client: '' })}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          )}
          
          {(dateRange.start || dateRange.end) && (
            <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              <span>
                Période: {dateRange.start || '...'} - {dateRange.end || '...'}
              </span>
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
            <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              <span>
                Montant: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€
              </span>
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
  );
};

export default FilterBar;