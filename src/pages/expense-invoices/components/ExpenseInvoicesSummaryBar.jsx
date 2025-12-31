import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import { formatCurrency } from '../../../utils/numberFormat';

const ExpenseInvoicesSummaryBar = ({ summaryData, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const summaryItems = [
    {
      label: t('expenseInvoices.summary.totalExpenses', 'Total Expenses'),
      value: isLoading ? '...' : formatCurrency(summaryData.totalExpenses || 0),
      icon: 'Receipt',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: summaryData.expensesGrowth,
      trendLabel: t('expenseInvoices.summary.vsLastMonth', 'vs last month')
    },
    {
      label: t('expenseInvoices.summary.paidExpenses', 'Paid Expenses'),
      value: isLoading ? '...' : formatCurrency(summaryData.paidExpenses || 0),
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      percentage: summaryData.totalExpenses > 0 ? (summaryData.paidExpenses / summaryData.totalExpenses) * 100 : 0
    },
    {
      label: t('expenseInvoices.summary.outstandingAmount', 'Outstanding Amount'),
      value: isLoading ? '...' : formatCurrency(summaryData.outstandingAmount || 0),
      icon: 'Clock',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: t('expenseInvoices.summary.overdueInvoices', 'Overdue Invoices'),
      value: isLoading ? '...' : summaryData.overdueCount || 0,
      icon: 'AlertTriangle',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },

  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryItems.map((item, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {item.value}
              </p>
              {item.trend !== undefined && (
                <div className="flex items-center mt-1">
                  <Icon 
                    name={item.trend >= 0 ? 'TrendingUp' : 'TrendingDown'} 
                    size={14} 
                    color={item.trend >= 0 ? 'var(--color-success)' : 'var(--color-error)'} 
                  />
                  <span className={`text-xs ml-1 ${
                    item.trend >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {item.trend >= 0 ? '+' : ''}{item.trend !== undefined ? formatPercentage(item.trend) : '0.0%'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {item.trendLabel}
                  </span>
                </div>
              )}
              {item.percentage !== undefined && (
                <div className="flex items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage(item.percentage)} {t('expenseInvoices.summary.ofTotal', 'of total')}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${item.bgColor}`}>
              <Icon 
                name={item.icon} 
                size={24} 
                color="currentColor" 
                className={item.color}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseInvoicesSummaryBar; 