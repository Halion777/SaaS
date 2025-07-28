import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const RevenueChart = ({ data }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
            <Icon name="TrendingUp" size={18} className="sm:w-5 sm:h-5" color="rgb(59 130 246)" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Prévisions de revenus</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Analyse et prédictions IA</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Réalisé</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-muted-foreground">Prévision</span>
          </div>
        </div>
      </div>

      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              fontSize={10}
              className="sm:text-xs"
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={10}
              className="sm:text-xs"
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="rgb(59 130 246)"
              strokeWidth={2}
              dot={{ fill: 'rgb(59 130 246)', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="rgb(34 197 94)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'rgb(34 197 94)', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Croissance mensuelle</p>
          <p className="text-sm sm:text-lg font-semibold text-emerald-600">+12.5%</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Prévision T2</p>
          <p className="text-sm sm:text-lg font-semibold text-blue-600">520K€</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;