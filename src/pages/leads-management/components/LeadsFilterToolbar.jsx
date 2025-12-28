import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../utils/numberFormat';

const LeadsFilterToolbar = ({ filters, onFiltersChange, filteredCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const priceRangeOptions = [
    { value: 'all', label: t('leadsManagement.filter.price.all') },
    { value: '0-1000', label: `${formatCurrency(0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatCurrency(1000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { value: '1000-5000', label: `${formatCurrency(1000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatCurrency(5000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { value: '5000-10000', label: `${formatCurrency(5000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatCurrency(10000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { value: '10000-25000', label: `${formatCurrency(10000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatCurrency(25000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { value: '25000+', label: `${formatCurrency(25000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}+` }
  ];

  const periodOptions = [
    { value: 'all', label: t('leadsManagement.filter.period.all') },
    { value: '7', label: t('leadsManagement.filter.period.last7Days') },
    { value: '30', label: t('leadsManagement.filter.period.last30Days') },
    { value: '90', label: t('leadsManagement.filter.period.last90Days') },
    { value: 'custom', label: t('leadsManagement.filter.period.custom') }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    onFiltersChange({
      priceRange: 'all',
      period: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.priceRange !== 'all' || 
                          filters.period !== 'all' || 
                          filters.startDate || 
                          filters.endDate;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange !== 'all') count++;
    if (filters.period !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">{t('leadsManagement.filter.title')}</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {t('leadsManagement.filter.resultsFound', { count: filteredCount })}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8"
            >
              <span className="flex items-center">
                <Icon name="X" size={14} className="mr-1" />
                {t('leadsManagement.filter.clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('leadsManagement.filter.hideFilters') : t('leadsManagement.filter.showFilters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Price Range Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t('leadsManagement.filter.price.label')}
            </label>
            <Select
              placeholder={t('leadsManagement.filter.price.all')}
              options={priceRangeOptions}
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            />
          </div>
          
          {/* Period Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t('leadsManagement.filter.period.label')}
            </label>
            <Select
              placeholder={t('leadsManagement.filter.period.all')}
              options={periodOptions}
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t('leadsManagement.filter.startDate.label')}
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full"
              disabled={filters.period !== 'custom'}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t('leadsManagement.filter.endDate.label')}
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full"
              disabled={filters.period !== 'custom'}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.priceRange !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('leadsManagement.filter.chips.price', { 
                  value: priceRangeOptions.find(opt => opt.value === filters.priceRange)?.label 
                })}</span>
                <button
                  onClick={() => handleFilterChange('priceRange', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('leadsManagement.filter.chips.removeFilter', { 
                    filter: t('leadsManagement.filter.price.label') 
                  })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.period !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('leadsManagement.filter.chips.period', { 
                  value: periodOptions.find(opt => opt.value === filters.period)?.label 
                })}</span>
                <button
                  onClick={() => handleFilterChange('period', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('leadsManagement.filter.chips.removeFilter', { 
                    filter: t('leadsManagement.filter.period.label') 
                  })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.startDate && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('leadsManagement.filter.chips.startDate', { 
                  value: new Date(filters.startDate).toLocaleDateString('fr-FR') 
                })}</span>
                <button
                  onClick={() => handleDateChange('startDate', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('leadsManagement.filter.chips.removeFilter', { 
                    filter: t('leadsManagement.filter.startDate.label') 
                  })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.endDate && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('leadsManagement.filter.chips.endDate', { 
                  value: new Date(filters.endDate).toLocaleDateString('fr-FR') 
                })}</span>
                <button
                  onClick={() => handleDateChange('endDate', '')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('leadsManagement.filter.chips.removeFilter', { 
                    filter: t('leadsManagement.filter.endDate.label') 
                  })}
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
            {/* Price Range Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                {t('leadsManagement.filter.price.label')}
              </label>
              <Select
                placeholder={t('leadsManagement.filter.price.all')}
                options={priceRangeOptions}
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              />
            </div>
            
            {/* Period Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                {t('leadsManagement.filter.period.label')}
              </label>
              <Select
                placeholder={t('leadsManagement.filter.period.all')}
                options={periodOptions}
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
              />
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                {t('leadsManagement.filter.startDate.label')}
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full"
                disabled={filters.period !== 'custom'}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                {t('leadsManagement.filter.endDate.label')}
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full"
                disabled={filters.period !== 'custom'}
              />
            </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.priceRange !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('leadsManagement.filter.chips.price', { 
                    value: priceRangeOptions.find(opt => opt.value === filters.priceRange)?.label 
                  })}</span>
                  <button
                    onClick={() => handleFilterChange('priceRange', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.period !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('leadsManagement.filter.chips.period', { 
                    value: periodOptions.find(opt => opt.value === filters.period)?.label 
                  })}</span>
                  <button
                    onClick={() => handleFilterChange('period', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                </button>
                </div>
              )}
              
              {filters.startDate && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('leadsManagement.filter.chips.startDate', { 
                    value: new Date(filters.startDate).toLocaleDateString('fr-FR') 
                  })}</span>
                  <button
                    onClick={() => handleDateChange('startDate', '')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.endDate && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('leadsManagement.filter.chips.endDate', { 
                    value: new Date(filters.endDate).toLocaleDateString('fr-FR') 
                  })}</span>
                  <button
                    onClick={() => handleDateChange('endDate', '')}
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
            <span className="font-medium">{t('leadsManagement.filter.activeFilters', { count: activeFiltersCount })}</span>
            <span className="text-xs ml-2">
              {filters.priceRange !== 'all' && `• ${priceRangeOptions.find(opt => opt.value === filters.priceRange)?.label}`}
              {filters.period !== 'all' && ` • ${periodOptions.find(opt => opt.value === filters.period)?.label}`}
              {filters.startDate && ` • ${new Date(filters.startDate).toLocaleDateString('fr-FR')}`}
              {filters.endDate && ` • ${new Date(filters.endDate).toLocaleDateString('fr-FR')}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsFilterToolbar;
