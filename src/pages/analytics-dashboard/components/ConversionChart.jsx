import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const ConversionChart = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-sm text-blue-600">
            Taux: {data.rate}%
          </p>
          <p className="text-sm text-muted-foreground">
            Devis: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxRate = Math.max(...data.map(d => d.rate));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Icon name="Target" size={20} color="rgb(147 51 234)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Taux de conversion</h3>
            <p className="text-sm text-muted-foreground">Par type de service</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">68.5%</p>
          <p className="text-sm text-muted-foreground">Moyenne globale</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="rate" 
              fill="rgb(147 51 234)"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${240 + index * 30}, 70%, 50%)` }}
              ></div>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">{item.rate}%</span>
              <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionChart;