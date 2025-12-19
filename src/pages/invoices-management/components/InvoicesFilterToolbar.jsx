import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const InvoicesFilterToolbar = ({ filters, onFiltersChange, invoices = [], filteredCount = 0 }) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: '', label: t('invoicesManagement.filter.status.all') },
    { value: 'unpaid', label: t('invoicesManagement.status.unpaid') },
    { value: 'paid', label: t('invoicesManagement.status.paid') },
    { value: 'overdue', label: t('invoicesManagement.status.overdue') },
    { value: 'cancelled', label: t('invoicesManagement.status.cancelled') }
  ];

  const invoiceTypeOptions = [
    { value: '', label: t('invoicesManagement.filter.invoiceType.all', 'All Types') },
    { value: 'deposit', label: t('invoicesManagement.filter.invoiceType.deposit', 'Deposit Invoices') },
    { value: 'final', label: t('invoicesManagement.filter.invoiceType.final', 'Final Invoices') }
  ];

  // Generate client options from actual invoices data
  const clientOptions = React.useMemo(() => {
    const uniqueClients = new Map();
    
    // Add default option
    uniqueClients.set('', { value: '', label: t('invoicesManagement.filter.client.all') });
    
    // Extract unique clients from invoices
    invoices.forEach(invoice => {
      if (invoice.client && invoice.client.id) {
        const clientId = invoice.client.id.toString();
        const clientName = invoice.client.name || invoice.clientName || t('invoicesManagement.unknownClient');
        
        if (!uniqueClients.has(clientId)) {
          uniqueClients.set(clientId, { value: clientId, label: clientName });
        }
      }
    });
    
    return Array.from(uniqueClients.values());
  }, [invoices]);

  const dateRangeOptions = [
    { value: '', label: t('invoicesManagement.filter.period.all') },
    { value: 'today', label: t('invoicesManagement.filter.period.today') },
    { value: 'week', label: t('invoicesManagement.filter.period.thisWeek') },
    { value: 'month', label: t('invoicesManagement.filter.period.thisMonth') },
    { value: 'quarter', label: t('invoicesManagement.filter.period.thisQuarter') },
    { value: 'year', label: t('invoicesManagement.filter.period.thisYear') }
  ];

  const amountRangeOptions = [
    { value: '', label: t('invoicesManagement.filter.amount.all') },
    { value: '0-500', label: t('invoicesManagement.filter.amount.0-500') },
    { value: '500-1000', label: t('invoicesManagement.filter.amount.500-1000') },
    { value: '1000-5000', label: t('invoicesManagement.filter.amount.1000-5000') },
    { value: '5000+', label: t('invoicesManagement.filter.amount.5000+') }
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
    if (filters.client) count++;
    if (dateRange.start || dateRange.end) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      client: '',
      invoiceType: '',
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
          <h3 className="text-base font-medium text-foreground">{t('invoicesManagement.filter.title')}</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {t('invoicesManagement.filter.invoicesFound', { count: filteredCount })}
          </span>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8"
            >
              <span className="flex items-center">
                <Icon name="X" size={14} className="mr-1" />
                {t('invoicesManagement.filter.clear')}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden h-8 w-8"
            aria-label={isExpanded ? t('invoicesManagement.filter.hideFilters') : t('invoicesManagement.filter.showFilters')}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Desktop Filters - Always visible on md+ screens */}
      <div className="hidden md:block p-4 space-y-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label={t('invoicesManagement.filter.status.label')}
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            placeholder={t('invoicesManagement.filter.status.all')}
          />

          <Select
            label={t('invoicesManagement.filter.client.label')}
            options={clientOptions}
            value={filters.client || ''}
            onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
            placeholder={t('invoicesManagement.filter.client.placeholder')}
            searchable
          />

          <Select
            label={t('invoicesManagement.filter.invoiceType.label', 'Invoice Type')}
            options={invoiceTypeOptions}
            value={filters.invoiceType || ''}
            onChange={(e) => onFiltersChange({ ...filters, invoiceType: e.target.value })}
            placeholder={t('invoicesManagement.filter.invoiceType.all', 'All Types')}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('invoicesManagement.filter.amount.label')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t('invoicesManagement.filter.amount.min')}
                value={amountRange.min}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder={t('invoicesManagement.filter.amount.max')}
                value={amountRange.max}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('invoicesManagement.filter.period.label')}</label>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                placeholder={t('invoicesManagement.filter.period.from')}
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="date"
                placeholder={t('invoicesManagement.filter.period.to')}
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
                <span>{t('invoicesManagement.filter.chips.status')}: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, status: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('invoicesManagement.filter.chips.removeStatus')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.client && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('invoicesManagement.filter.chips.client')}: {clientOptions.find(opt => opt.value === filters.client)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, client: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('invoicesManagement.filter.chips.removeClient')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {filters.invoiceType && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>{t('invoicesManagement.filter.chips.invoiceType', 'Type')}: {invoiceTypeOptions.find(opt => opt.value === filters.invoiceType)?.label}</span>
                <button
                  onClick={() => onFiltersChange({ ...filters, invoiceType: '' })}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('invoicesManagement.filter.chips.removeInvoiceType', 'Remove invoice type filter')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(dateRange.start || dateRange.end) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('invoicesManagement.filter.chips.period')}: {dateRange.start || '...'} - {dateRange.end || '...'}
                </span>
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    onFiltersChange({ ...filters, dateRange: { start: '', end: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('invoicesManagement.filter.chips.removePeriod')}
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
            
            {(amountRange.min || amountRange.max) && (
              <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                <span>
                  {t('invoicesManagement.filter.chips.amount')}: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€
                </span>
                <button
                  onClick={() => {
                    setAmountRange({ min: '', max: '' });
                    onFiltersChange({ ...filters, amountRange: { min: '', max: '' } });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={t('invoicesManagement.filter.chips.removeAmount')}
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
              label={t('invoicesManagement.filter.status.label')}
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              placeholder={t('invoicesManagement.filter.status.all')}
            />

            <Select
              label={t('invoicesManagement.filter.client.label')}
              options={clientOptions}
              value={filters.client || ''}
              onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
              placeholder={t('invoicesManagement.filter.client.all')}
            />

            <Select
              label={t('invoicesManagement.filter.invoiceType.label', 'Invoice Type')}
              options={invoiceTypeOptions}
              value={filters.invoiceType || ''}
              onChange={(e) => onFiltersChange({ ...filters, invoiceType: e.target.value })}
              placeholder={t('invoicesManagement.filter.invoiceType.all', 'All Types')}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('invoicesManagement.filter.amount.label')}</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder={t('invoicesManagement.filter.amount.min')}
                  value={amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder={t('invoicesManagement.filter.amount.max')}
                  value={amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('invoicesManagement.filter.period.label')}</label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  placeholder={t('invoicesManagement.filter.period.from')}
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  type="date"
                  placeholder={t('invoicesManagement.filter.period.to')}
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
                  <span>{t('invoicesManagement.filter.chips.status')}: {statusOptions.find(opt => opt.value === filters.status)?.label}</span>
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
                  <span>{t('invoicesManagement.filter.chips.client')}: {clientOptions.find(opt => opt.value === filters.client)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, client: '' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {filters.invoiceType && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('invoicesManagement.filter.chips.invoiceType', 'Type')}: {invoiceTypeOptions.find(opt => opt.value === filters.invoiceType)?.label}</span>
                  <button
                    onClick={() => onFiltersChange({ ...filters, invoiceType: '' })}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )}
              
              {(dateRange.start || dateRange.end) && (
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  <span>{t('invoicesManagement.filter.chips.period')}: {dateRange.start || '...'} - {dateRange.end || '...'}</span>
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
                  <span>{t('invoicesManagement.filter.chips.amount')}: {amountRange.min || '0'}€ - {amountRange.max || '∞'}€</span>
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
            <span className="font-medium">{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
            <span className="text-xs ml-2">
              {filters.status && ` • ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
              {filters.client && ` • ${clientOptions.find(opt => opt.value === filters.client)?.label}`}
              {filters.invoiceType && ` • ${invoiceTypeOptions.find(opt => opt.value === filters.invoiceType)?.label}`}
              {(dateRange.start || dateRange.end) && ` • ${t('invoicesManagement.filter.chips.period', 'Period')}`}
              {(amountRange.min || amountRange.max) && ` • ${t('invoicesManagement.filter.chips.amount', 'Amount')}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesFilterToolbar;