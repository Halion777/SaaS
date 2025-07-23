import React from 'react';
import Icon from '../../../components/AppIcon';

const InvoicesSummaryBar = ({ summaryData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="TrendingUp" size={24} color="var(--color-primary)" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryData.totalRevenue)}</p>
            <p className="text-xs text-success">+{formatPercentage(summaryData.revenueGrowth)} ce mois</p>
          </div>
        </div>

        {/* Paid Revenue */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="CheckCircle" size={24} color="var(--color-success)" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Montant encaissé</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryData.paidRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              {formatPercentage((summaryData.paidRevenue / summaryData.totalRevenue) * 100)} du total
            </p>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="Clock" size={24} color="var(--color-warning)" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryData.outstandingAmount)}</p>
            <p className="text-xs text-error">{summaryData.overdueCount} factures en retard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesSummaryBar;