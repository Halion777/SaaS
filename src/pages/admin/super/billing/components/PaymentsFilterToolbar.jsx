import React, { useState } from 'react';
import Select from '../../../../../components/ui/Select';
import Icon from '../../../../../components/AppIcon';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';

const PaymentsFilterToolbar = ({ dateFilter, onDateFilterChange, filteredCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onDateFilterChange({ from: '', to: '' });
  };

  const hasActiveFilters = dateFilter.from || dateFilter.to;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (dateFilter.from) count++;
    if (dateFilter.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

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
            {filteredCount} payment{filteredCount !== 1 ? 's' : ''} found
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
          {/* From Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">From Date</label>
            <Input
              type="date"
              value={dateFilter.from}
              onChange={(e) => onDateFilterChange({ ...dateFilter, from: e.target.value })}
            />
          </div>
          
          {/* To Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">To Date</label>
            <Input
              type="date"
              value={dateFilter.to}
              onChange={(e) => onDateFilterChange({ ...dateFilter, to: e.target.value })}
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {dateFilter.from && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>From: {new Date(dateFilter.from).toLocaleDateString()}</span>
                <button
                  onClick={() => onDateFilterChange({ ...dateFilter, from: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove from date"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {dateFilter.to && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>To: {new Date(dateFilter.to).toLocaleDateString()}</span>
                <button
                  onClick={() => onDateFilterChange({ ...dateFilter, to: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove to date"
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
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">From Date</label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => onDateFilterChange({ ...dateFilter, from: e.target.value })}
              />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">To Date</label>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => onDateFilterChange({ ...dateFilter, to: e.target.value })}
              />
            </div>
          </div>

          {/* Active Filter Chips - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {dateFilter.from && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>From: {new Date(dateFilter.from).toLocaleDateString()}</span>
                  <button
                    onClick={() => onDateFilterChange({ ...dateFilter, from: '' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {dateFilter.to && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>To: {new Date(dateFilter.to).toLocaleDateString()}</span>
                  <button
                    onClick={() => onDateFilterChange({ ...dateFilter, to: '' })}
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
            {dateFilter.from && <span className="text-xs ml-2">• From: {new Date(dateFilter.from).toLocaleDateString()}</span>}
            {dateFilter.to && <span className="text-xs ml-2">• To: {new Date(dateFilter.to).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsFilterToolbar;

