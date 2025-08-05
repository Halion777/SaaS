import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QuoteChart = () => {
  const { t } = useTranslation();
  const chartData = [
    { month: t('dashboard.quoteChart.months.Jan'), quotes: 45, signed: 18 },
    { month: t('dashboard.quoteChart.months.Feb'), quotes: 52, signed: 23 },
    { month: t('dashboard.quoteChart.months.Mar'), quotes: 48, signed: 19 },
    { month: t('dashboard.quoteChart.months.Apr'), quotes: 61, signed: 28 },
    { month: t('dashboard.quoteChart.months.May'), quotes: 55, signed: 24 },
    { month: t('dashboard.quoteChart.months.Jun'), quotes: 67, signed: 31 },
    { month: t('dashboard.quoteChart.months.Jul'), quotes: 58, signed: 26 }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.quoteChart.title')}</h3>
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full"></div>
            <span className="text-muted-foreground">{t('dashboard.quoteChart.seriesLabels.quotes')}</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success rounded-full"></div>
            <span className="text-muted-foreground">{t('dashboard.quoteChart.seriesLabels.signed')}</span>
          </div>
        </div>
      </div>
      <div className="w-full h-64 sm:h-80" aria-label={t('dashboard.quoteChart.chartAriaLabel')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              className="sm:text-xs"
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              className="sm:text-xs"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-popover-foreground)',
                fontSize: '12px'
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