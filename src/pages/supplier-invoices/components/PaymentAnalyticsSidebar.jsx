import React from 'react';
import Icon from '../../../components/AppIcon';

const PaymentAnalyticsSidebar = ({ analyticsData, isVisible, onToggle }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground p-3 rounded-l-lg shadow-professional-lg z-50 hover:bg-primary/90 transition-colors duration-150"
      >
        <Icon name="ChevronLeft" size={20} color="currentColor" />
      </button>
    );
  }

  return (
    <div 
      className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-professional-xl z-50 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pt-2 pb-4 z-10">
          <h2 className="text-lg font-semibold text-foreground">Analyses des paiements</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-muted rounded-lg transition-colors duration-150 flex-shrink-0"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Temps de paiement moyen</span>
              <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
            </div>
            <div className="text-2xl font-bold text-foreground">{analyticsData.avgPaymentTime} jours</div>
            <div className="text-xs text-muted-foreground mt-1">Délai moyen de paiement</div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Taux de paiement</span>
              <Icon name="TrendingUp" size={16} color="var(--color-success)" />
            </div>
            <div className="text-2xl font-bold text-foreground">{analyticsData.paymentRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">Factures payées à temps</div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Factures en retard</span>
              <Icon name="AlertTriangle" size={16} color="var(--color-error)" />
            </div>
            <div className="text-2xl font-bold text-foreground">{analyticsData.overdueCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Nécessitent une attention</div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Échéances à venir</h3>
          <div className="space-y-3">
            {analyticsData.upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{deadline.invoiceNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    deadline.daysLeft <= 3 ? 'bg-error text-error-foreground' : 
                    deadline.daysLeft <= 7 ? 'bg-warning text-warning-foreground' : 
                    'bg-success text-success-foreground'
                  }`}>
                    {deadline.daysLeft} jour{deadline.daysLeft > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-1">{deadline.supplierName}</div>
                <div className="text-sm font-medium text-foreground">{formatCurrency(deadline.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions rapides</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <span className="text-sm font-medium">Envoyer au comptable</span>
              <Icon name="Send" size={16} color="currentColor" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-medium">Exporter rapport</span>
              <Icon name="Download" size={16} color="var(--color-muted-foreground)" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-medium">Voir les analyses</span>
              <Icon name="BarChart3" size={16} color="var(--color-muted-foreground)" />
            </button>
          </div>
        </div>

        {/* Insights */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Insights</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={16} color="var(--color-blue-600)" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Optimisation des paiements</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Envisagez de négocier des délais de paiement plus longs avec vos fournisseurs pour améliorer votre trésorerie.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} color="var(--color-green-600)" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Bon taux de paiement</p>
                  <p className="text-xs text-green-600 mt-1">
                    Votre taux de paiement de {analyticsData.paymentRate}% est excellent. Continuez sur cette lancée !
                  </p>
                </div>
              </div>
            </div>

            {analyticsData.overdueCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Icon name="AlertTriangle" size={16} color="var(--color-red-600)" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Attention aux retards</p>
                    <p className="text-xs text-red-600 mt-1">
                      {analyticsData.overdueCount} facture(s) en retard. Pensez à les régler rapidement pour éviter les pénalités.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalyticsSidebar; 