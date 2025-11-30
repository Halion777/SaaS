import React, { useState } from 'react';
import Select from '../../../../../components/ui/Select';
import Icon from '../../../../../components/AppIcon';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';

const EmailTemplatesFilterToolbar = ({ 
  searchTerm, 
  onSearchChange, 
  typeFilter, 
  onTypeFilterChange, 
  languageFilter, 
  onLanguageFilterChange, 
  filteredCount = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onSearchChange('');
    onTypeFilterChange('all');
    onLanguageFilterChange('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || languageFilter !== 'all';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (typeFilter !== 'all') count++;
    if (languageFilter !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'client_accepted', label: 'Client Accepted' },
    { value: 'quote_sent', label: 'Quote Sent' },
    { value: 'followup_viewed_no_action', label: 'Follow-up - Viewed' },
    { value: 'welcome_client', label: 'Welcome Client' },
    { value: 'general_followup', label: 'General Follow-up' },
    { value: 'client_rejected', label: 'Client Rejected' },
    { value: 'followup_not_viewed', label: 'Follow-up - Not Viewed' },
    { value: 'subscription_upgraded', label: 'Subscription Upgraded' },
    { value: 'subscription_downgraded', label: 'Subscription Downgraded' },
    { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
    { value: 'subscription_activated', label: 'Subscription Activated' },
    { value: 'subscription_trial_ending', label: 'Trial Ending' },
    { value: 'contact_form', label: 'Contact Form' },
    { value: 'credit_insurance_application', label: 'Credit Insurance Application' },
    { value: 'credit_insurance_confirmation', label: 'Credit Insurance Confirmation' },
    { value: 'new_lead_available', label: 'New Lead Available' },
    { value: 'lead_assigned', label: 'Lead Assigned' },
    { value: 'invoice_sent', label: 'Invoice Sent' },
    { value: 'invoice_overdue_reminder', label: 'Invoice Overdue Reminder' },
    { value: 'invoice_payment_reminder', label: 'Invoice Payment Reminder' },
    { value: 'invoice_to_accountant', label: 'Invoice to Accountant' },
    { value: 'expense_invoice_to_accountant', label: 'Expense Invoice to Accountant' },
  ];

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'fr', label: 'French' },
    { value: 'en', label: 'English' },
    { value: 'nl', label: 'Dutch' }
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
            {filteredCount} template{filteredCount !== 1 ? 's' : ''} found
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Type</label>
            <Select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              options={typeOptions}
              className="w-full"
            />
          </div>
          
          {/* Language Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Language</label>
            <Select
              value={languageFilter}
              onChange={(e) => onLanguageFilterChange(e.target.value)}
              options={languageOptions}
              className="w-full"
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
            
            {typeFilter !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Type: {typeOptions.find(opt => opt.value === typeFilter)?.label}</span>
                <button
                  onClick={() => onTypeFilterChange('all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove type filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {languageFilter !== 'all' && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>Language: {languageOptions.find(opt => opt.value === languageFilter)?.label}</span>
                <button
                  onClick={() => onLanguageFilterChange('all')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Remove language filter"
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
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
      
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Type</label>
              <Select
                value={typeFilter}
                onChange={(e) => onTypeFilterChange(e.target.value)}
                options={typeOptions}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Language</label>
              <Select
                value={languageFilter}
                onChange={(e) => onLanguageFilterChange(e.target.value)}
                options={languageOptions}
                className="w-full"
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
              
              {typeFilter !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Type: {typeOptions.find(opt => opt.value === typeFilter)?.label}</span>
                  <button
                    onClick={() => onTypeFilterChange('all')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {languageFilter !== 'all' && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>Language: {languageOptions.find(opt => opt.value === languageFilter)?.label}</span>
                  <button
                    onClick={() => onLanguageFilterChange('all')}
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
            {typeFilter !== 'all' && (
              <span className="text-xs ml-2">• Type: {typeOptions.find(opt => opt.value === typeFilter)?.label}</span>
            )}
            {languageFilter !== 'all' && (
              <span className="text-xs ml-2">• Language: {languageOptions.find(opt => opt.value === languageFilter)?.label}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesFilterToolbar;

