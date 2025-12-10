import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceOverviewWidget = ({ invoiceData, expenseInvoiceData, loading = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    if (loading || amount === '...') return '...';
    // Always use comma as decimal separator (fr-FR format) to match quote creation flow
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (loading || num === '...') return '...';
    return num?.toString() || '0';
  };

  const formatPercentage = (num) => {
    if (loading || num === '...') return '...';
    return `${num}%`;
  };

  // Use real data or defaults
  const clientInvoices = loading ? {
    totalRevenue: '...',
    paidRevenue: '...',
    outstandingAmount: '...',
    overdueCount: '...'
  } : (invoiceData || {
    totalRevenue: 0,
    paidRevenue: 0,
    outstandingAmount: 0,
    overdueCount: 0
  });

  const supplierInvoices = loading ? {
    totalExpenses: '...',
    paidExpenses: '...',
    outstandingAmount: '...',
    overdueCount: '...'
  } : (expenseInvoiceData || {
    totalExpenses: 0,
    paidExpenses: 0,
    outstandingAmount: 0,
    overdueCount: 0
  });

  const netCashFlow = loading ? '...' : (clientInvoices.paidRevenue - supplierInvoices.paidExpenses);
  const collectionRate = loading ? '...' : (clientInvoices.totalRevenue > 0 
    ? Math.round((clientInvoices.paidRevenue / clientInvoices.totalRevenue) * 100) 
    : 0);
  const paymentRate = loading ? '...' : (supplierInvoices.totalExpenses > 0
    ? Math.round((supplierInvoices.paidExpenses / supplierInvoices.totalExpenses) * 100)
    : 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.invoiceOverview.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.subtitle')}</p>
        </div>
        <div className="flex flex-row space-x-2">
          <Button
            variant="outline"
            size="xs"
            iconName="Receipt"
            iconPosition="left"
            onClick={() => navigate('/invoices-management')}
            className="text-xs h-8 sm:h-9"
          >
            <span className="hidden sm:inline">{t('dashboard.invoiceOverview.buttons.clientInvoices.full')}</span>
            <span className="sm:hidden">{t('dashboard.invoiceOverview.buttons.clientInvoices.short')}</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            iconName="Truck"
            iconPosition="left"
            onClick={() => navigate('/expense-invoices')}
            className="text-xs h-8 sm:h-9"
          >
            <span className="hidden sm:inline">{t('dashboard.invoiceOverview.buttons.supplierInvoices.full')}</span>
            <span className="sm:hidden">{t('dashboard.invoiceOverview.buttons.supplierInvoices.short')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Invoices Summary */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">{t('dashboard.invoiceOverview.sections.clientInvoices.title')}</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.totalRevenue')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatCurrency(clientInvoices.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.paidRevenue')}</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(clientInvoices.paidRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.outstanding')}</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(clientInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.overdue')}</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {formatNumber(clientInvoices.overdueCount)} {!loading && clientInvoices.overdueCount !== '...' && t('common.invoice', { count: clientInvoices.overdueCount })}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Invoices Summary */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon name="Truck" size={16} className="sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">{t('dashboard.invoiceOverview.sections.supplierInvoices.title')}</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.totalExpenses')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatCurrency(supplierInvoices.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.paidExpenses')}</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(supplierInvoices.paidExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.outstanding')}</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(supplierInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.overdue')}</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {formatNumber(supplierInvoices.overdueCount)} {!loading && supplierInvoices.overdueCount !== '...' && t('common.invoice', { count: supplierInvoices.overdueCount })}
              </span>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 sm:p-2 rounded-lg flex items-center justify-center ${loading || netCashFlow === '...' ? 'bg-gray-100' : (netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100')}`}>
              <Icon 
                name={loading || netCashFlow === '...' ? "Minus" : (netCashFlow >= 0 ? "TrendingUp" : "TrendingDown")} 
                size={16} 
                className={`sm:w-5 sm:h-5 ${loading || netCashFlow === '...' ? 'text-gray-600' : (netCashFlow >= 0 ? 'text-green-600' : 'text-red-600')}`} 
              />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">{t('dashboard.invoiceOverview.sections.cashFlow.title')}</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.monthlyNet')}</span>
              <span className={`text-xs sm:text-sm font-bold ${loading || netCashFlow === '...' ? 'text-foreground' : (netCashFlow >= 0 ? 'text-success' : 'text-error')}`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.collectionRate')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatPercentage(collectionRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.paymentRate')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatPercentage(paymentRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.availableBalance')}</span>
              <span className={`text-xs sm:text-sm font-medium ${loading || netCashFlow === '...' ? 'text-foreground' : (netCashFlow >= 0 ? 'text-success' : 'text-error')}`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
            <span>{t('dashboard.invoiceOverview.sections.lastUpdate.prefix')} {new Date().toLocaleDateString(i18n.language)}</span>
          </div>
          <div className="flex space-x-2 justify-end">
            <Button
              variant="default"
              size="xs"
              iconName="BarChart3"
              iconPosition="left"
              onClick={() => navigate('/analytics-dashboard')}
              className="text-xs h-8 sm:h-9"
            >
              <span className="hidden sm:inline">{t('dashboard.invoiceOverview.buttons.viewAnalytics.full')}</span>
              <span className="sm:hidden">{t('dashboard.invoiceOverview.buttons.viewAnalytics.short')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOverviewWidget;
