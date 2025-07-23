import React from 'react';
import Icon from '../../../components/AppIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PaymentAnalyticsSidebar = ({ analyticsData, isVisible, onToggle }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const paymentMethodData = [
    { name: 'Virement', value: 45, color: '#1E40AF' },
    { name: 'Chèque', value: 30, color: '#10B981' },
    { name: 'Espèces', value: 15, color: '#F59E0B' },
    { name: 'Carte', value: 10, color: '#EF4444' }
  ];

  const paymentTimeData = [
    { month: 'Jan', avgDays: 12 },
    { month: 'Fév', avgDays: 15 },
    { month: 'Mar', avgDays: 10 },
    { month: 'Avr', avgDays: 18 },
    { month: 'Mai', avgDays: 14 },
    { month: 'Jun', avgDays: 11 }
  ];

  const clientReliabilityData = [
    { name: 'Jean Martin', score: 95, amount: 15420 },
    { name: 'Sophie Dubois', score: 88, amount: 12300 },
    { name: 'Pierre Moreau', score: 92, amount: 9800 },
    { name: 'Marie Leroy', score: 76, amount: 8500 },
    { name: 'Paul Bernard', score: 85, amount: 7200 }
  ];

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-error';
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
    <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-professional-xl z-40 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Analyses de paiement</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
          >
            <Icon name="X" size={20} color="var(--color-muted-foreground)" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Clock" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Délai moyen de paiement</p>
                <p className="text-xl font-bold text-foreground">{analyticsData.avgPaymentTime} jours</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={20} color="var(--color-success)" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
                <p className="text-xl font-bold text-foreground">{analyticsData.recoveryRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} color="var(--color-warning)" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Factures en retard</p>
                <p className="text-xl font-bold text-foreground">{analyticsData.overdueCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Répartition des moyens de paiement</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {paymentMethodData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Time Trend */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Évolution des délais de paiement</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} jours`, 'Délai moyen']}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                />
                <Bar dataKey="avgDays" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Reliability Scores */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Fiabilité des clients</h3>
          <div className="space-y-3">
            {clientReliabilityData.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(client.amount)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getScoreColor(client.score)}`}>
                    {client.score}%
                  </span>
                  <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        client.score >= 90 ? 'bg-success' : 
                        client.score >= 75 ? 'bg-warning' : 'bg-error'
                      }`}
                      style={{ width: `${client.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Échéances à venir</h3>
          <div className="space-y-2">
            {analyticsData.upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{deadline.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{deadline.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{formatCurrency(deadline.amount)}</p>
                  <p className={`text-xs ${deadline.daysLeft <= 3 ? 'text-error' : 'text-muted-foreground'}`}>
                    {deadline.daysLeft} jours
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalyticsSidebar;