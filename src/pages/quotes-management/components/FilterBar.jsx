import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const FilterBar = ({ filters, onFiltersChange, onClearFilters, quotes = [] }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyé' },
  ];

  // Generate client options from actual quotes data
  const clientOptions = React.useMemo(() => {
    const uniqueClients = new Map();
    
    // Add default option
    uniqueClients.set('', { value: '', label: 'Tous les clients' });
    
    // Extract unique clients from quotes
    quotes.forEach(quote => {
      if (quote.client && quote.client.id) {
        const clientId = quote.client.id.toString();
        const clientName = quote.client.name || quote.clientName || 'Client inconnu';
        
        if (!uniqueClients.has(clientId)) {
          uniqueClients.set(clientId, { value: clientId, label: clientName });
        }
      }
    });
    
    return Array.from(uniqueClients.values());
  }, [quotes]);

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
              onClick={onClearFilters}
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
            placeholder="Sélectionner un statut"
          />

          <Select
            label="Client"
            options={clientOptions}
            value={filters.client || ''}
            onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
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
            
            {filters.client && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Client: {clientOptions.find(opt => opt.value === filters.client)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, client: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Supprimer le filtre de client"
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
              label="Client"
              options={clientOptions}
              value={filters.client || ''}
              onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
              placeholder="Tous les clients"
              searchable
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
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
              
              {filters.client && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
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
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
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
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
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
      )}

      {/* Mobile Active Filters Summary (when collapsed) */}
      {!isExpanded && activeFiltersCount > 0 && (
        <div className="md:hidden p-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
            <span className="text-xs ml-2">
              {filters.status && `• ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.client && ` • ${clientOptions.find(opt => opt.value === filters.client)?.label}`}
              {(dateRange.start || dateRange.end) && ' • Période'}
              {(amountRange.min || amountRange.max) && ' • Montant'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;