import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useTranslation } from 'react-i18next';

const FilterBar = ({ filters, onFiltersChange, onClearFilters, searchTerm, onSearchChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const typeOptions = [
    { value: 'all', label: t('common.all', 'All Types') },
    { value: 'invoice', label: t('dashboard.taskList.taskTypes.invoice', 'Invoice') },
    { value: 'follow', label: t('dashboard.taskList.taskTypes.follow', 'Follow Up') },
    { value: 'quote', label: t('dashboard.taskList.taskTypes.finalize', 'Quote') },
  ];

  const priorityOptions = [
    { value: 'all', label: t('common.all', 'All Priorities') },
    { value: 'high', label: t('common.priority.high', 'High') },
    { value: 'medium', label: t('common.priority.medium', 'Medium') },
    { value: 'low', label: t('common.priority.low', 'Low') },
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">{t('common.filters', 'Filters')}</h3>
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
                {t('common.clear', 'Clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('common.hideFilters', 'Hide Filters') : t('common.showFilters', 'Show Filters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('common.search', 'Search')}</label>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('common.searchPlaceholder', 'Search tasks...')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            label={t('common.type', 'Type')}
            options={typeOptions}
            value={filters.type || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
            placeholder={t('common.all', 'All Types')}
          />

          <Select
            label={t('common.priority', 'Priority')}
            options={priorityOptions}
            value={filters.priority || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
            placeholder={t('common.all', 'All Priorities')}
          />
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.type !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('common.type', 'Type')}: {typeOptions.find(opt => opt.value === filters.type)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.priority !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('common.priority', 'Priority')}: {priorityOptions.find(opt => opt.value === filters.priority)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, priority: 'all' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {searchTerm && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('common.search', 'Search')}: {searchTerm}</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
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
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('common.search', 'Search')}</label>
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('common.searchPlaceholder', 'Search tasks...')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select
              label={t('common.type', 'Type')}
              options={typeOptions}
              value={filters.type || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
              placeholder={t('common.all', 'All Types')}
            />

            <Select
              label={t('common.priority', 'Priority')}
              options={priorityOptions}
              value={filters.priority || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
              placeholder={t('common.all', 'All Priorities')}
            />
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.type !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{typeOptions.find(opt => opt.value === filters.type)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.priority !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{priorityOptions.find(opt => opt.value === filters.priority)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, priority: 'all' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {searchTerm && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{searchTerm}</span>
                  <button
                    onClick={() => onSearchChange('')}
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
            <span className="font-medium">{t('common.activeFilters', { count: activeFiltersCount })}</span>
            <span className="text-xs ml-2">
              {filters.type !== 'all' && `• ${typeOptions.find(opt => opt.value === filters.type)?.label}`}
              {filters.priority !== 'all' && ` • ${priorityOptions.find(opt => opt.value === filters.priority)?.label}`}
              {searchTerm && ` • ${t('common.search', 'Search')}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

