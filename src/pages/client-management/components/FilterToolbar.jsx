import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const FilterToolbar = ({ filters, onFiltersChange, filteredCount = 0 }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const typeOptions = [
    { value: 'all', label: t('clientManagement.filter.type.all') },
    { value: 'particulier', label: t('clientManagement.types.individual') },
    { value: 'professionnel', label: t('clientManagement.types.professional') }
  ];

  const statusOptions = [
    { value: 'all', label: t('clientManagement.filter.status.all') },
    { value: 'active', label: t('clientManagement.status.active') },
    { value: 'inactive', label: t('clientManagement.status.inactive') }
  ];

  const locationOptions = [
    { value: 'all', label: t('clientManagement.filter.location.all') },
    { value: 'BE', label: t('clientManagement.countries.BE') },
    { value: 'FR', label: t('clientManagement.countries.FR') },
    { value: 'CH', label: t('clientManagement.countries.CH') },
    { value: 'LU', label: t('clientManagement.countries.LU') },
    { value: 'CA', label: t('clientManagement.countries.CA') },
    { value: 'US', label: t('clientManagement.countries.US') },
    { value: 'DE', label: t('clientManagement.countries.DE') },
    { value: 'IT', label: t('clientManagement.countries.IT') },
    { value: 'ES', label: t('clientManagement.countries.ES') },
    { value: 'NL', label: t('clientManagement.countries.NL') },
    { value: 'GB', label: t('clientManagement.countries.GB') },
    { value: 'OTHER', label: t('clientManagement.countries.OTHER') }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    onFiltersChange({
      type: 'all',
      status: 'all',
      location: 'all'
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.status !== 'all' || filters.location !== 'all';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.location !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">{t('clientManagement.filter.title')}</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {t('clientManagement.filter.clientsFound', { count: filteredCount })}
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
                {t('clientManagement.filter.clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('clientManagement.filter.hideFilters') : t('clientManagement.filter.showFilters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.type.label')}</label>
            <Select
              placeholder={t('clientManagement.filter.type.all')}
              options={typeOptions}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.status.label')}</label>
            <Select
              placeholder={t('clientManagement.filter.status.all')}
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
          </div>
          
          {/* Location Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.location.label')}</label>
            <Select
              placeholder={t('clientManagement.filter.location.all')}
              options={locationOptions}
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.type !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('clientManagement.filter.chips.type')}: {typeOptions.find(opt => opt.value === filters.type)?.label}</span>
                <button
                  onClick={() => handleFilterChange('type', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('clientManagement.filter.chips.removeType')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.status !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('clientManagement.filter.chips.status')}: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('clientManagement.filter.chips.removeStatus')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.location !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('clientManagement.filter.chips.location')}: {locationOptions.find(opt => opt.value === filters.location)?.label}</span>
                <button
                  onClick={() => handleFilterChange('location', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('clientManagement.filter.chips.removeLocation')}
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
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.type.label')}</label>
      <Select
                placeholder={t('clientManagement.filter.type.all')}
        options={typeOptions}
        value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
      />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.status.label')}</label>
      <Select
                placeholder={t('clientManagement.filter.status.all')}
        options={statusOptions}
        value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
      />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('clientManagement.filter.location.label')}</label>
      <Select
                placeholder={t('clientManagement.filter.location.all')}
        options={locationOptions}
        value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.type !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Type: {typeOptions.find(opt => opt.value === filters.type)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.status !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Statut: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.location !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Région: {locationOptions.find(opt => opt.value === filters.location)?.label}</span>
                  <button
                    onClick={() => handleFilterChange('location', 'all')}
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
            <span className="font-medium">{t('clientManagement.filter.activeFilters', { count: activeFiltersCount })}</span>
            <span className="text-xs ml-2">
              {filters.type !== 'all' && `• ${typeOptions.find(opt => opt.value === filters.type)?.label}`}
              {filters.status !== 'all' && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.location !== 'all' && ` • ${locationOptions.find(opt => opt.value === filters.location)?.label}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;