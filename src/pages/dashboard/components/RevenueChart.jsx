import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';
import { formatCurrency } from '../../../utils/numberFormat';

const RevenueChart = ({ invoices = [], loading = false }) => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get available years from invoices data
  const availableYears = useMemo(() => {
    if (!invoices || invoices.length === 0) return [new Date().getFullYear()];
    
    const years = new Set();
    invoices.forEach(invoice => {
      if (invoice.created_at) {
        const year = new Date(invoice.created_at).getFullYear();
        years.add(year);
      }
    });
    
    // Always include current year
    years.add(new Date().getFullYear());
    
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  // Process invoices data to get monthly revenue for selected year
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (loading) {
      // Return loading data with "..." for all 12 months
      return months.map(month => ({
        month: t(`dashboard.revenueChart.months.${month}`) || month,
        revenue: '...'
      }));
    }
    
    if (!invoices || invoices.length === 0) {
      // Return empty data for all 12 months
      return months.map(month => ({
        month: t(`dashboard.revenueChart.months.${month}`) || month,
        revenue: 0
      }));
    }

    // Initialize all 12 months for selected year
    const monthlyData = {};
    months.forEach((monthKey, index) => {
      monthlyData[index] = {
        month: t(`dashboard.revenueChart.months.${monthKey}`) || monthKey,
        monthIndex: index,
        revenue: 0
      };
    });

    // Process invoices for selected year
    invoices.forEach(invoice => {
      if (!invoice.created_at) return;
      
      const invoiceDate = new Date(invoice.created_at);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();
      
      // Only count invoices from the selected year
      if (invoiceYear === selectedYear && monthlyData[invoiceMonth] !== undefined) {
        const amount = parseFloat(invoice.final_amount || invoice.amount || 0);
        monthlyData[invoiceMonth].revenue += amount;
      }
    });

    // Return all 12 months in order
    return Object.values(monthlyData).sort((a, b) => a.monthIndex - b.monthIndex);
  }, [invoices, t, loading, selectedYear]);

  const handlePreviousYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  const currentYear = new Date().getFullYear();
  const canGoPrevious = availableYears.indexOf(selectedYear) < availableYears.length - 1;
  const canGoNext = availableYears.indexOf(selectedYear) > 0 && selectedYear < currentYear;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {t('dashboard.revenueChart.revenue')}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.revenueChart.title')}</h3>
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-warning rounded-full"></div>
          <span className="text-muted-foreground text-xs sm:text-sm">{t('dashboard.revenueChart.seriesLabel')}</span>
        </div>
      </div>
      
      {/* Year Navigation */}
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <button
          onClick={handlePreviousYear}
          disabled={!canGoPrevious}
          className={`p-2 rounded-md transition-colors ${
            canGoPrevious
              ? 'hover:bg-muted text-foreground'
              : 'opacity-50 cursor-not-allowed text-muted-foreground'
          }`}
          aria-label={t('dashboard.revenueChart.previousYear')}
        >
          <Icon name="ChevronLeft" size={20} />
        </button>
        <span className="mx-4 text-base sm:text-lg font-semibold text-foreground min-w-[80px] text-center">
          {selectedYear}
        </span>
        <button
          onClick={handleNextYear}
          disabled={!canGoNext}
          className={`p-2 rounded-md transition-colors ${
            canGoNext
              ? 'hover:bg-muted text-foreground'
              : 'opacity-50 cursor-not-allowed text-muted-foreground'
          }`}
          aria-label={t('dashboard.revenueChart.nextYear')}
        >
          <Icon name="ChevronRight" size={20} />
        </button>
      </div>

      <div className="w-full h-64 sm:h-80" aria-label={t('dashboard.revenueChart.chartAriaLabel')}>
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
              tickFormatter={(value) => {
                if (typeof value === 'string' && value === '...') return value;
                return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;

