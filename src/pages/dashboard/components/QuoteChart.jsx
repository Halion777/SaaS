import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QuoteChart = ({ quotes = [], loading = false }) => {
  const { t } = useTranslation();

  // Process quotes data to get monthly statistics
  const chartData = useMemo(() => {
    if (loading) {
      // Return loading data with "..." for last 7 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      return months.map(month => ({
        month: t(`dashboard.quoteChart.months.${month}`) || month,
        quotes: '...',
        signed: '...'
      }));
    }
    
    if (!quotes || quotes.length === 0) {
      // Return empty data for last 7 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      return months.map(month => ({
        month: t(`dashboard.quoteChart.months.${month}`) || month,
        quotes: 0,
        signed: 0
      }));
    }

    // Group quotes by month
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 7 months
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = {
        month: t(`dashboard.quoteChart.months.${monthKey}`) || monthKey,
        quotes: 0,
        signed: 0
      };
    }

    // Process quotes
    quotes.forEach(quote => {
      if (!quote.created_at) return;
      
      const quoteDate = new Date(quote.created_at);
      const monthKey = quoteDate.toLocaleDateString('en-US', { month: 'short' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].quotes++;
        // Count both 'accepted' and 'converted_to_invoice' as signed quotes
        if (quote.status === 'accepted' || quote.status === 'converted_to_invoice') {
          monthlyData[monthKey].signed++;
        }
      }
    });

    return Object.values(monthlyData);
  }, [quotes, t, loading]);

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
