import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ExpenseInvoicesFilterToolbar = ({ filters, onFiltersChange }) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: '', label: t('expenseInvoices.filter.status.all', 'All Statuses') },
    { value: 'paid', label: t('expenseInvoices.status.paid', 'Paid') },
    { value: 'pending', label: t('expenseInvoices.status.pending', 'Pending') },
    { value: 'overdue', label: t('expenseInvoices.status.overdue', 'Overdue') }
  ];



  const categoryOptions = [
    { value: '', label: t('expenseInvoices.filter.category.all', 'All Categories') },
    { value: 'fuel', label: t('expenseInvoices.categories.fuel', 'Fuel') },
    { value: 'it_software', label: t('expenseInvoices.categories.itSoftware', 'IT/Software') },
    { value: 'energy', label: t('expenseInvoices.categories.energy', 'Energy') },
    { value: 'materials_supplies', label: t('expenseInvoices.categories.materialsSupplies', 'Materials/Supplies') },
    { value: 'telecommunications', label: t('expenseInvoices.categories.telecommunications', 'Telecommunications') },
    { value: 'rent_property', label: t('expenseInvoices.categories.rentProperty', 'Rent & Property') },
    { value: 'professional_services', label: t('expenseInvoices.categories.professionalServices', 'Professional Services') },
    { value: 'insurance', label: t('expenseInvoices.categories.insurance', 'Insurance') },
    { value: 'travel_accommodation', label: t('expenseInvoices.categories.travelAccommodation', 'Travel & Accommodation') },
    { value: 'banking_financial', label: t('expenseInvoices.categories.bankingFinancial', 'Banking & Financial') },
    { value: 'marketing_advertising', label: t('expenseInvoices.categories.marketingAdvertising', 'Marketing & Advertising') },
    { value: 'other_professional', label: t('expenseInvoices.categories.otherProfessional', 'Other Professional Costs') }
  ];

  const sourceOptions = [
    { value: '', label: t('expenseInvoices.filter.source.all', 'All Sources') },
    { value: 'manual', label: t('expenseInvoices.source.manual', 'Manual') },
    { value: 'peppol', label: t('expenseInvoices.source.peppol', 'Peppol') }
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
          <h3 className="text-base font-medium text-foreground">{t('expenseInvoices.filter.title', 'Filters')}</h3>
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
                {t('expenseInvoices.filter.clear', 'Clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('expenseInvoices.filter.hideFilters', 'Hide filters') : t('expenseInvoices.filter.showFilters', 'Show filters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label={t('expenseInvoices.filter.status.label', 'Status')}
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            placeholder={t('expenseInvoices.filter.status.all', 'All Statuses')}
          />

          <Select
            label={t('expenseInvoices.filter.source.label', 'Source')}
            options={sourceOptions}
            value={filters.source || ''}
            onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })}
            placeholder={t('expenseInvoices.filter.source.all', 'All Sources')}
          />

          <Select
            label={t('expenseInvoices.filter.category.label', 'Category')}
            options={categoryOptions}
            value={filters.category || ''}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            placeholder={t('expenseInvoices.filter.category.all', 'All Categories')}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('expenseInvoices.filter.amount.label', 'Amount (€)')}</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder={t('expenseInvoices.filter.amount.min', 'Min')}
                value={amountRange.min}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder={t('expenseInvoices.filter.amount.max', 'Max')}
                value={amountRange.max}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('expenseInvoices.filter.period.label', 'Period')}</label>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                placeholder={t('expenseInvoices.filter.period.from', 'From')}
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="date"
                placeholder={t('expenseInvoices.filter.period.to', 'To')}
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.status && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('expenseInvoices.filter.chips.status', 'Status')}: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, status: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('expenseInvoices.filter.chips.removeStatus', 'Remove status filter')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            


            {filters.category && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('expenseInvoices.filter.chips.category', 'Category')}: {categoryOptions.find(opt => opt.value === filters.category)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, category: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('expenseInvoices.filter.chips.removeCategory', 'Remove category filter')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}

            {filters.source && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('expenseInvoices.filter.chips.source', 'Source')}: {sourceOptions.find(opt => opt.value === filters.source)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, source: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('expenseInvoices.filter.chips.removeSource', 'Remove source filter')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(dateRange.start || dateRange.end) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('expenseInvoices.filter.chips.period', 'Period')}: {dateRange.start || '...'} - {dateRange.end || '...'}
                </span>
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    onFiltersChange({ ...filters, dateRange: { start: '', end: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('expenseInvoices.filter.chips.removePeriod', 'Remove period filter')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(amountRange.min || amountRange.max) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('expenseInvoices.filter.chips.amount', 'Amount')}: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€
                </span>
                <button
                  onClick={() => {
                    setAmountRange({ min: '', max: '' });
                    onFiltersChange({ ...filters, amountRange: { min: '', max: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('expenseInvoices.filter.chips.removeAmount', 'Remove amount filter')}
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
              label={t('expenseInvoices.filter.status.label', 'Status')}
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              placeholder={t('expenseInvoices.filter.status.all', 'All Statuses')}
            />



            <Select
              label={t('expenseInvoices.filter.category.label', 'Category')}
              options={categoryOptions}
              value={filters.category || ''}
              onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              placeholder={t('expenseInvoices.filter.category.all', 'All Categories')}
            />

            <Select
              label={t('expenseInvoices.filter.source.label', 'Source')}
              options={sourceOptions}
              value={filters.source || ''}
              onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })}
              placeholder={t('expenseInvoices.filter.source.all', 'All Sources')}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('expenseInvoices.filter.amount.label', 'Amount (€)')}</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder={t('expenseInvoices.filter.amount.min', 'Min')}
                  value={amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="number"
                  placeholder={t('expenseInvoices.filter.amount.max', 'Max')}
                  value={amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('expenseInvoices.filter.period.label', 'Period')}</label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  placeholder={t('expenseInvoices.filter.period.from', 'From')}
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="date"
                  placeholder={t('expenseInvoices.filter.period.to', 'To')}
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="flex-1"
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
            <span className="font-medium">{t('expenseInvoices.filter.activeFilters', { count: activeFiltersCount }, `${activeFiltersCount} active filter(s)`)}</span>
            <span className="text-xs ml-2">
              {filters.status && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.category && ` • ${categoryOptions.find(opt => opt.value === filters.category)?.label}`}
              {filters.source && ` • ${sourceOptions.find(opt => opt.value === filters.source)?.label}`}
              {(dateRange.start || dateRange.end) && ` • ${t('expenseInvoices.filter.period.label', 'Period')}`}
              {(amountRange.min || amountRange.max) && ` • ${t('expenseInvoices.filter.amount.label', 'Amount')}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseInvoicesFilterToolbar; 