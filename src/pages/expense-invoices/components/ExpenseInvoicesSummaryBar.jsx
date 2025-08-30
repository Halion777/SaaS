import React from 'react';
import Icon from '../../../components/AppIcon';

const ExpenseInvoicesSummaryBar = ({ summaryData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const summaryItems = [
    {
      label: 'Total dépenses',
      value: formatCurrency(summaryData.totalExpenses),
      icon: 'Receipt',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: summaryData.expensesGrowth,
      trendLabel: 'vs mois dernier'
    },
    {
      label: 'Dépenses payées',
      value: formatCurrency(summaryData.paidExpenses),
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Montant en attente',
      value: formatCurrency(summaryData.outstandingAmount),
      icon: 'Clock',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Factures en retard',
      value: summaryData.overdueCount,
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
                    {item.trend >= 0 ? '+' : ''}{item.trend}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {item.trendLabel}
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