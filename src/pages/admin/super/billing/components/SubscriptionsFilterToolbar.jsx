import React, { useState } from 'react';
import Select from '../../../../../components/ui/Select';
import Icon from '../../../../../components/AppIcon';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';

const SubscriptionsFilterToolbar = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, filteredCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onSearchChange('');
    onStatusFilterChange('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'trialing', label: 'Trialing' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'incomplete', label: 'Incomplete' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm mb-4 sm:mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} className="text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {filteredCount} subscription{filteredCount !== 1 ? 's' : ''} found
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
                Clear
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? 'Hide filters' : 'Show filters'}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Search</label>
            <Input
              placeholder="Search subscriptions by name, email, or subscription ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              iconName="Search"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              placeholder="Filter by status"
              options={statusOptions}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {searchTerm && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Search: {searchTerm}</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove search"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {statusFilter !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
                <button
                  onClick={() => onStatusFilterChange('all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove status filter"
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
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Search</label>
              <Input
                placeholder="Search subscriptions by name, email, or subscription ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                iconName="Search"
              />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                placeholder="Filter by status"
                options={statusOptions}
              />
            </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {searchTerm && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Search: {searchTerm}</span>
                  <button
                    onClick={() => onSearchChange('')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {statusFilter !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
                  <button
                    onClick={() => onStatusFilterChange('all')}
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
            <span className="font-medium">{activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}</span>
            {searchTerm && <span className="text-xs ml-2">• Search: {searchTerm}</span>}
            {statusFilter !== 'all' && (
              <span className="text-xs ml-2">• Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsFilterToolbar;

