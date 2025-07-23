import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QuoteChart = () => {
  const chartData = [
    { month: 'Jan', quotes: 45, signed: 18 },
    { month: 'Fév', quotes: 52, signed: 23 },
    { month: 'Mar', quotes: 48, signed: 19 },
    { month: 'Avr', quotes: 61, signed: 28 },
    { month: 'Mai', quotes: 55, signed: 24 },
    { month: 'Juin', quotes: 67, signed: 31 },
    { month: 'Juil', quotes: 58, signed: 26 }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Évolution des devis</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-muted-foreground">Devis créés</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Devis signés</span>
          </div>
        </div>
      </div>
      <div className="w-full h-80" aria-label="Graphique d'évolution des devis">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-popover-foreground)'
              }}
            />
            <Bar dataKey="quotes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="signed" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QuoteChart;