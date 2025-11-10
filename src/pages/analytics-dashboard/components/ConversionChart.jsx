import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';

const ConversionChart = ({ data, isLoading = false }) => {
  const { t } = useTranslation();
  
  // Color palette for different categories
  const COLORS = [
    'rgb(59 130 246)',   // Blue
    'rgb(147 51 234)',   // Purple
    'rgb(236 72 153)',   // Pink
    'rgb(239 68 68)',    // Red
    'rgb(34 197 94)',    // Green
    'rgb(251 146 60)',   // Orange
    'rgb(168 85 247)',   // Violet
    'rgb(14 165 233)'    // Sky
  ];
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-sm text-blue-600">
            {t('analyticsDashboard.charts.conversion.rate')}: {data.rate}%
          </p>
          <p className="text-sm text-muted-foreground">
            {t('analyticsDashboard.charts.conversion.quotes')}: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate average conversion rate
  const totalQuotes = data.reduce((sum, item) => sum + item.count, 0);
  const totalAccepted = data.reduce((sum, item) => sum + Math.round((item.rate / 100) * item.count), 0);
  const averageRate = totalQuotes > 0 ? Math.round((totalAccepted / totalQuotes) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
            <Icon name="Target" size={18} className="sm:w-5 sm:h-5" color="rgb(147 51 234)" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('analyticsDashboard.charts.conversion.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('analyticsDashboard.charts.conversion.subtitle')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{isLoading ? '...' : `${averageRate}%`}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('analyticsDashboard.charts.conversion.globalAverage')}</p>
        </div>
      </div>

      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-muted-foreground)"
              fontSize={10}
              className="sm:text-xs"
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={10}
              className="sm:text-xs"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="rate" 
              radius={[3, 3, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 sm:mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-xs sm:text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-semibold text-foreground">{isLoading ? '...' : `${item.rate}%`}</span>
              <span className="text-xs text-muted-foreground ml-1 sm:ml-2">{isLoading ? '' : `(${item.count})`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionChart;