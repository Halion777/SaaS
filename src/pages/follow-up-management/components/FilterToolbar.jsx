import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const FilterToolbar = ({ filters, onFiltersChange, filteredCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const typeOptions = [
    { value: 'all', label: t('followUpManagement.filter.type.all') },
    { value: 'email_not_opened', label: t('followUpManagement.followUpType.email_not_opened') },
    { value: 'viewed_no_action', label: t('followUpManagement.followUpType.viewed_no_action') }
  ];

  const priorityOptions = [
    { value: 'all', label: t('followUpManagement.filter.priority.all') },
    { value: 'high', label: t('followUpManagement.filter.priority.high') },
    { value: 'medium', label: t('followUpManagement.filter.priority.medium') },
    { value: 'low', label: t('followUpManagement.filter.priority.low') }
  ];

  const statusOptions = [
    { value: 'all', label: t('followUpManagement.filter.status.all') },
    { value: 'scheduled', label: t('followUpManagement.filter.status.scheduled') },
    { value: 'stopped', label: t('followUpManagement.filter.status.stopped') },
    { value: 'stage_1_completed', label: t('followUpManagement.filter.status.stage1Completed') },
    { value: 'stage_2_completed', label: t('followUpManagement.filter.status.stage2Completed') },
    { value: 'stage_3_completed', label: t('followUpManagement.filter.status.stage3Completed') },
    { value: 'all_stages_completed', label: t('followUpManagement.filter.status.allStagesCompleted') }
  ];

  const daysOptions = [
    { value: 'all', label: t('followUpManagement.filter.days.all') },
    { value: '0-2', label: t('followUpManagement.filter.days.0-2') },
    { value: '3-5', label: t('followUpManagement.filter.days.3-5') },
    { value: '6-10', label: t('followUpManagement.filter.days.6-10') },
    { value: '10+', label: t('followUpManagement.filter.days.10+') }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    onFiltersChange({
      type: 'all',
      priority: 'all',
      status: 'all',
      days: 'all'
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.priority !== 'all' || filters.status !== 'all' || filters.days !== 'all';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.days !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">{t('followUpManagement.filter.title')}</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {t('followUpManagement.filter.resultsFound', { count: filteredCount })}
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
                {t('followUpManagement.filter.clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('followUpManagement.filter.hideFilters') : t('followUpManagement.filter.showFilters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.type.label')}</label>
            <Select
              placeholder={t('followUpManagement.filter.type.all')}
              options={typeOptions}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            />
          </div>
          
          {/* Priority Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.priority.label')}</label>
            <Select
              placeholder={t('followUpManagement.filter.priority.all')}
              options={priorityOptions}
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.status.label')}</label>
            <Select
              placeholder={t('followUpManagement.filter.status.all')}
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
          </div>

          {/* Days Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.days.label')}</label>
            <Select
              placeholder={t('followUpManagement.filter.days.all')}
              options={daysOptions}
              value={filters.days}
              onChange={(e) => handleFilterChange('days', e.target.value)}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {filters.type !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('followUpManagement.filter.chips.type', { value: typeOptions.find(opt => opt.value === filters.type)?.label })}</span>
                <button
                  onClick={() => handleFilterChange('type', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('followUpManagement.filter.chips.removeFilter', { filter: t('followUpManagement.filter.type.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.priority !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('followUpManagement.filter.chips.priority', { value: priorityOptions.find(opt => opt.value === filters.priority)?.label })}</span>
                <button
                  onClick={() => handleFilterChange('priority', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('followUpManagement.filter.chips.removeFilter', { filter: t('followUpManagement.filter.priority.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.status !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('followUpManagement.filter.chips.status', { value: statusOptions.find(opt => opt.value === filters.status)?.label })}</span>
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('followUpManagement.filter.chips.removeFilter', { filter: t('followUpManagement.filter.status.label') })}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.days !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('followUpManagement.filter.chips.days', { value: daysOptions.find(opt => opt.value === filters.days)?.label })}</span>
                <button
                  onClick={() => handleFilterChange('days', 'all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('followUpManagement.filter.chips.removeFilter', { filter: t('followUpManagement.filter.days.label') })}
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
               <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.type.label')}</label>
               <Select
                 placeholder={t('followUpManagement.filter.type.all')}
                 options={typeOptions}
                 value={filters.type}
                 onChange={(e) => handleFilterChange('type', e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.priority.label')}</label>
               <Select
                 placeholder={t('followUpManagement.filter.priority.all')}
                 options={priorityOptions}
                 value={filters.priority}
                 onChange={(e) => handleFilterChange('priority', e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.status.label')}</label>
               <Select
                 placeholder={t('followUpManagement.filter.status.all')}
                 options={statusOptions}
                 value={filters.status}
                 onChange={(e) => handleFilterChange('status', e.target.value)}
               />
             </div>

             <div>
               <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('followUpManagement.filter.days.label')}</label>
               <Select
                 placeholder={t('followUpManagement.filter.days.all')}
                 options={daysOptions}
                 value={filters.days}
                 onChange={(e) => handleFilterChange('days', e.target.value)}
               />
             </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {filters.type !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('followUpManagement.filter.chips.type', { value: typeOptions.find(opt => opt.value === filters.type)?.label })}</span>
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.priority !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('followUpManagement.filter.chips.priority', { value: priorityOptions.find(opt => opt.value === filters.priority)?.label })}</span>
                  <button
                    onClick={() => handleFilterChange('priority', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.status !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('followUpManagement.filter.chips.status', { value: statusOptions.find(opt => opt.value === filters.status)?.label })}</span>
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.days !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('followUpManagement.filter.chips.days', { value: daysOptions.find(opt => opt.value === filters.days)?.label })}</span>
                  <button
                    onClick={() => handleFilterChange('days', 'all')}
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
             <span className="font-medium">{t('followUpManagement.filter.activeFilters', { count: activeFiltersCount })}</span>
             <span className="text-xs ml-2">
               {filters.type !== 'all' && `• ${typeOptions.find(opt => opt.value === filters.type)?.label}`}
               {filters.priority !== 'all' && ` • ${priorityOptions.find(opt => opt.value === filters.priority)?.label}`}
               {filters.status !== 'all' && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
               {filters.days !== 'all' && ` • ${daysOptions.find(opt => opt.value === filters.days)?.label}`}
             </span>
           </div>
         </div>
       )}
    </div>
  );
};

export default FilterToolbar; 