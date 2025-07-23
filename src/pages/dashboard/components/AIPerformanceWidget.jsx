import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const AIPerformanceWidget = () => {
  const performanceData = [
    { name: 'Optimisations IA', value: 40, color: 'var(--color-primary)' },
    { name: 'Relances auto', value: 25, color: 'var(--color-success)' },
    { name: 'Suggestions prix', value: 20, color: 'var(--color-warning)' },
    { name: 'Autres gains', value: 15, color: 'var(--color-accent)' }
  ];

  const totalGain = performanceData.reduce((sum, item) => sum + item.value, 0);

  const metrics = [
    {
      label: 'Taux de signature',
      value: '+40%',
      icon: 'TrendingUp',
      color: 'text-success'
    },
    {
      label: 'Temps économisé',
      value: '12h/sem',
      icon: 'Clock',
      color: 'text-primary'
    },
    {
      label: 'CA généré',
      value: '+8.450€',
      icon: 'Euro',
      color: 'text-warning'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-foreground">Performance IA</h3>
          <div className="ai-indicator w-2 h-2 bg-primary rounded-full"></div>
        </div>
        <span className="text-sm font-medium text-success">+{totalGain}% ce mois</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-popover-foreground)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">+{totalGain}%</p>
            <p className="text-xs text-muted-foreground">Gain total IA</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${metric.color}`}>
                <Icon name={metric.icon} size={16} color="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold text-foreground">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Dernière analyse: Il y a 2h</span>
          <div className="flex items-center space-x-1">
            <Icon name="Brain" size={12} color="var(--color-primary)" />
            <span>IA active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPerformanceWidget;