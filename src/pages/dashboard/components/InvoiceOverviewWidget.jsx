import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceOverviewWidget = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Mock data for the widget
  const invoiceData = {
    clientInvoices: {
      totalRevenue: 16900.00,
      paidRevenue: 9450.00,
      outstandingAmount: 7450.00,
      overdueCount: 2,
      recentCount: 8
    },
    supplierInvoices: {
      totalExpenses: 4370.00,
      paidExpenses: 1810.00,
      outstandingAmount: 2560.00,
      overdueCount: 2,
      recentCount: 8
    }
  };

  const netCashFlow = invoiceData.clientInvoices.paidRevenue - invoiceData.supplierInvoices.paidExpenses;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.invoiceOverview.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.subtitle')}</p>
          </div>
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
            onClick={() => navigate('/supplier-invoices')}
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
                {formatCurrency(invoiceData.clientInvoices.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.paidRevenue')}</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(invoiceData.clientInvoices.paidRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.outstanding')}</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(invoiceData.clientInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.clientInvoices.overdue')}</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {invoiceData.clientInvoices.overdueCount} {t('common.invoice', { count: invoiceData.clientInvoices.overdueCount })}
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
                {formatCurrency(invoiceData.supplierInvoices.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.paidExpenses')}</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(invoiceData.supplierInvoices.paidExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.outstanding')}</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(invoiceData.supplierInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.supplierInvoices.overdue')}</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {invoiceData.supplierInvoices.overdueCount} {t('common.invoice', { count: invoiceData.supplierInvoices.overdueCount })}
              </span>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 sm:p-2 rounded-lg flex items-center justify-center ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Icon 
                name={netCashFlow >= 0 ? "TrendingUp" : "TrendingDown"} 
                size={16} 
                className={`sm:w-5 sm:h-5 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} 
              />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">{t('dashboard.invoiceOverview.sections.cashFlow.title')}</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.monthlyNet')}</span>
              <span className={`text-xs sm:text-sm font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-error'}`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.collectionRate')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {Math.round((invoiceData.clientInvoices.paidRevenue / invoiceData.clientInvoices.totalRevenue) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.paymentRate')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {Math.round((invoiceData.supplierInvoices.paidExpenses / invoiceData.supplierInvoices.totalExpenses) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.invoiceOverview.sections.cashFlow.availableBalance')}</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
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
            <span>•</span>
            <span>{t('dashboard.invoiceOverview.sections.lastUpdate.recentInvoices', { count: invoiceData.clientInvoices.recentCount + invoiceData.supplierInvoices.recentCount })}</span>
          </div>
          <div className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              size="xs"
              iconName="Plus"
              iconPosition="left"
              onClick={() => navigate('/invoices-management')}
              className="text-xs h-8 sm:h-9"
            >
              <span className="hidden sm:inline">{t('dashboard.invoiceOverview.buttons.newInvoice.full')}</span>
              <span className="sm:hidden">{t('dashboard.invoiceOverview.buttons.newInvoice.short')}</span>
            </Button>
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