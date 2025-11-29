import React, { useState } from 'react';
import Select from '../../../../../components/ui/Select';
import Icon from '../../../../../components/AppIcon';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';

const UsersFilterToolbar = ({ searchTerm, onSearchChange, sortBy, sortOrder, onSortChange, filteredCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('-');
    onSortChange(field, order);
  };

  const handleReset = () => {
    onSearchChange('');
    onSortChange('created_at', 'desc');
  };

  const hasActiveFilters = searchTerm || (sortBy !== 'created_at' || sortOrder !== 'desc');

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (sortBy !== 'created_at' || sortOrder !== 'desc') count++;
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
            {filteredCount} user{filteredCount !== 1 ? 's' : ''} found
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
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              iconName="Search"
            />
          </div>
          
          {/* Sort */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Sort by</label>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
              placeholder="Sort by"
              options={[
                { value: 'created_at-desc', label: 'Newest First' },
                { value: 'created_at-asc', label: 'Oldest First' },
                { value: 'first_name-asc', label: 'Name A-Z' },
                { value: 'first_name-desc', label: 'Name Z-A' },
                { value: 'last_sign_in_at-desc', label: 'Last Login' }
              ]}
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
            
            {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Sort: {
                  sortBy === 'created_at' && sortOrder === 'desc' ? 'Newest First' :
                  sortBy === 'created_at' && sortOrder === 'asc' ? 'Oldest First' :
                  sortBy === 'first_name' && sortOrder === 'asc' ? 'Name A-Z' :
                  sortBy === 'first_name' && sortOrder === 'desc' ? 'Name Z-A' :
                  sortBy === 'last_sign_in_at' && sortOrder === 'desc' ? 'Last Login' : 'Custom'
                }</span>
                <button
                  onClick={() => onSortChange('created_at', 'desc')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove sort"
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
                placeholder="Search users by name, email, or company..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                iconName="Search"
              />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Sort by</label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                placeholder="Sort by"
                options={[
                  { value: 'created_at-desc', label: 'Newest First' },
                  { value: 'created_at-asc', label: 'Oldest First' },
                  { value: 'first_name-asc', label: 'Name A-Z' },
                  { value: 'first_name-desc', label: 'Name Z-A' },
                  { value: 'last_sign_in_at-desc', label: 'Last Login' }
                ]}
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
              
              {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Sort: {
                    sortBy === 'created_at' && sortOrder === 'desc' ? 'Newest First' :
                    sortBy === 'created_at' && sortOrder === 'asc' ? 'Oldest First' :
                    sortBy === 'first_name' && sortOrder === 'asc' ? 'Name A-Z' :
                    sortBy === 'first_name' && sortOrder === 'desc' ? 'Name Z-A' :
                    sortBy === 'last_sign_in_at' && sortOrder === 'desc' ? 'Last Login' : 'Custom'
                  }</span>
                  <button
                    onClick={() => onSortChange('created_at', 'desc')}
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
            {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <span className="text-xs ml-2">• Sort: {
                sortBy === 'created_at' && sortOrder === 'desc' ? 'Newest First' :
                sortBy === 'created_at' && sortOrder === 'asc' ? 'Oldest First' :
                sortBy === 'first_name' && sortOrder === 'asc' ? 'Name A-Z' :
                sortBy === 'first_name' && sortOrder === 'desc' ? 'Name Z-A' :
                sortBy === 'last_sign_in_at' && sortOrder === 'desc' ? 'Last Login' : 'Custom'
              }</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersFilterToolbar;

