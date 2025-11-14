import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useTranslation } from 'react-i18next';

const FilterBar = ({ filters, onFiltersChange, onClearFilters, quotes = [] }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const statusOptions = [
    { value: '', label: t('quotesManagement.filter.status.all') },
    { value: 'draft', label: t('quotesManagement.filter.status.draft') },
    { value: 'sent', label: t('quotesManagement.filter.status.sent') },
    { value: 'viewed', label: t('quotesManagement.filter.status.viewed') },
    { value: 'accepted', label: t('quotesManagement.filter.status.accepted') },
    { value: 'rejected', label: t('quotesManagement.filter.status.rejected') },
    { value: 'expired', label: t('quotesManagement.filter.status.expired') },
    { value: 'converted_to_invoice', label: t('quotesManagement.filter.status.converted') },
  ];

  // Generate client options from actual quotes data
  const clientOptions = React.useMemo(() => {
    const uniqueClients = new Map();
    
    // Add default option
    uniqueClients.set('', { value: '', label: t('quotesManagement.filter.client.all') });
    
    // Extract unique clients from quotes
    quotes.forEach(quote => {
      if (quote.client && quote.client.id) {
        const clientId = quote.client.id.toString();
        const clientName = quote.client.name || quote.clientName || t('quotesManagement.draft.unknownClient');
        
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
          <h3 className="text-base font-medium text-foreground">{t('quotesManagement.filter.title')}</h3>
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
                {t('quotesManagement.filter.clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('quotesManagement.filter.hideFilters') : t('quotesManagement.filter.showFilters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label={t('quotesManagement.filter.status.label')}
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            placeholder={t('quotesManagement.filter.status.all')}
          />

          <Select
            label={t('quotesManagement.filter.client.label')}
            options={clientOptions}
            value={filters.client || ''}
            onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
            placeholder={t('quotesManagement.filter.client.placeholder')}
            searchable
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('quotesManagement.filter.amount.label')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t('quotesManagement.filter.amount.min')}
                value={amountRange.min}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder={t('quotesManagement.filter.amount.max')}
                value={amountRange.max}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('quotesManagement.filter.period.label')}</label>
            <div className="grid grid-cols-2 gap-2 relative" style={{ zIndex: 10 }}>
              <Input
                type="date"
                placeholder={t('quotesManagement.filter.period.from')}
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="relative"
                style={{ position: 'relative', zIndex: 10 }}
              />
              <Input
                type="date"
                placeholder={t('quotesManagement.filter.period.to')}
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="relative"
                style={{ position: 'relative', zIndex: 10 }}
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.status && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('quotesManagement.filter.chips.status', { value: statusOptions.find(opt => opt.value === filters.status)?.label })}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, status: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('quotesManagement.filter.chips.removeFilter', { filter: t('quotesManagement.filter.status.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.client && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('quotesManagement.filter.chips.client', { value: clientOptions.find(opt => opt.value === filters.client)?.label })}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, client: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('quotesManagement.filter.chips.removeFilter', { filter: t('quotesManagement.filter.client.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(dateRange.start || dateRange.end) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('quotesManagement.filter.chips.period', { start: dateRange.start || '...', end: dateRange.end || '...' })}
                </span>
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    onFiltersChange({ ...filters, dateRange: { start: '', end: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('quotesManagement.filter.chips.removeFilter', { filter: t('quotesManagement.filter.period.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(amountRange.min || amountRange.max) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('quotesManagement.filter.chips.amount', { min: amountRange.min || '0', max: amountRange.max || '∞' })}
                </span>
                <button
                  onClick={() => {
                    setAmountRange({ min: '', max: '' });
                    onFiltersChange({ ...filters, amountRange: { min: '', max: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('quotesManagement.filter.chips.removeFilter', { filter: t('quotesManagement.filter.amount.label') })}
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
              label={t('quotesManagement.filter.status.label')}
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              placeholder={t('quotesManagement.filter.status.all')}
            />

            <Select
              label={t('quotesManagement.filter.client.label')}
              options={clientOptions}
              value={filters.client || ''}
              onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
              placeholder={t('quotesManagement.filter.client.all')}
              searchable
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('quotesManagement.filter.amount.label')}</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder={t('quotesManagement.filter.amount.min')}
                  value={amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder={t('quotesManagement.filter.amount.max')}
                  value={amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('quotesManagement.filter.period.label')}</label>
              <div className="grid grid-cols-2 gap-2 relative" style={{ zIndex: 10 }}>
                <Input
                  type="date"
                  placeholder={t('quotesManagement.filter.period.from')}
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="relative"
                  style={{ position: 'relative', zIndex: 10 }}
                />
                <Input
                  type="date"
                  placeholder={t('quotesManagement.filter.period.to')}
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="relative"
                  style={{ position: 'relative', zIndex: 10 }}
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
            <span className="font-medium">{t('quotesManagement.filter.activeFilters', { count: activeFiltersCount })}</span>
            <span className="text-xs ml-2">
              {filters.status && `• ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.client && ` • ${clientOptions.find(opt => opt.value === filters.client)?.label}`}
              {(dateRange.start || dateRange.end) && ` • ${t('quotesManagement.filter.period.label')}`}
              {(amountRange.min || amountRange.max) && ` • ${t('quotesManagement.filter.amount.label')}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;