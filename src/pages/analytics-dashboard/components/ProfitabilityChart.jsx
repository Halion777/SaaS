import React from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';

const ProfitabilityChart = ({ serviceCategory }) => {
  const data = [
    { 
      service: 'Plomberie', 
      revenue: 45600, 
      cost: 28400, 
      profit: 17200, 
      margin: 37.7,
      volume: 78 
    },
    { 
      service: 'Électricité', 
      revenue: 38900, 
      cost: 24200, 
      profit: 14700, 
      margin: 37.8,
      volume: 65 
    },
    { 
      service: 'Chauffage', 
      revenue: 52300, 
      cost: 35800, 
      profit: 16500, 
      margin: 31.5,
      volume: 42 
    },
    { 
      service: 'Rénovation', 
      revenue: 67800, 
      cost: 45900, 
      profit: 21900, 
      margin: 32.3,
      volume: 28 
    },
    { 
      service: 'Dépannage', 
      revenue: 23400, 
      cost: 12800, 
      profit: 10600, 
      margin: 45.3,
      volume: 156 
    }
  ];

  const trends = [
    { period: 'Q1', plomberie: 35.2, electricite: 36.8, chauffage: 29.1, renovation: 30.5, depannage: 42.1 },
    { period: 'Q2', plomberie: 36.8, electricite: 37.2, chauffage: 30.8, renovation: 31.2, depannage: 43.7 },
    { period: 'Q3', plomberie: 37.7, electricite: 37.8, chauffage: 31.5, renovation: 32.3, depannage: 45.3 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-3">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CA:</span>
              <span className="text-sm font-medium text-foreground">€{data.revenue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Coûts:</span>
              <span className="text-sm font-medium text-foreground">€{data.cost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profit:</span>
              <span className="text-sm font-medium text-success">€{data.profit?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Marge:</span>
              <span className="text-sm font-medium text-primary">{data.margin}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volume:</span>
              <span className="text-sm font-medium text-foreground">{data.volume} projets</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Icon name="DollarSign" size={20} color="var(--color-primary)" className="mr-2" />
            Rentabilité par service
          </h3>
          <p className="text-sm text-muted-foreground">
            Analyse des marges et recommandations d'optimisation
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Marge moyenne</p>
          <p className="text-xl font-bold text-primary">36.9%</p>
        </div>
      </div>
      
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="service" 
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="amount"
              orientation="left"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="percentage"
              orientation="right"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar yAxisId="amount" dataKey="revenue" fill="var(--color-primary)" opacity={0.7} name="Chiffre d'affaires" />
            <Bar yAxisId="amount" dataKey="cost" fill="var(--color-error)" opacity={0.7} name="Coûts" />
            <Bar yAxisId="amount" dataKey="profit" fill="var(--color-success)" name="Profit" />
            
            <Line 
              yAxisId="percentage"
              type="monotone" 
              dataKey="margin" 
              stroke="var(--color-warning)" 
              strokeWidth={3}
              dot={{ fill: 'var(--color-warning)', strokeWidth: 2, r: 6 }}
              name="Marge (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Service Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">Top services par rentabilité</h4>
          <div className="space-y-3">
            {data
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 3)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.service}</p>
                      <p className="text-xs text-muted-foreground">{item.volume} projets</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">{item.margin}%</p>
                    <p className="text-xs text-muted-foreground">€{item.profit.toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">Recommandations IA</h4>
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="TrendingUp" size={16} color="var(--color-primary)" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Optimiser le dépannage</p>
                  <p className="text-xs text-muted-foreground">Marge excellente, augmenter le volume</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Revoir le chauffage</p>
                  <p className="text-xs text-muted-foreground">Marge faible, optimiser les coûts</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="Target" size={16} color="var(--color-success)" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Développer la rénovation</p>
                  <p className="text-xs text-muted-foreground">Potentiel de croissance élevé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityChart;