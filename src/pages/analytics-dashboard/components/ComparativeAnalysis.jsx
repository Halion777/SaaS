import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const ComparativeAnalysis = () => {
  const comparisons = [
    {
      metric: 'Taux de conversion',
      current: 78.5,
      previous: 72.3,
      industry: 65.0,
      unit: '%'
    },
    {
      metric: 'Délai moyen',
      current: 2.4,
      previous: 3.1,
      industry: 3.2,
      unit: 'jours',
      inverse: true
    },
    {
      metric: 'Satisfaction client',
      current: 4.3,
      previous: 4.1,
      industry: 3.8,
      unit: '/5'
    },
    {
      metric: 'Marge bénéficiaire',
      current: 32.8,
      previous: 29.4,
      industry: 28.0,
      unit: '%'
    }
  ];

  const historicalTrends = [
    { period: 'Q1 2024', performance: 85 },
    { period: 'Q2 2024', performance: 92 },
    { period: 'Q3 2024', performance: 96 },
    { period: 'Q4 2024', performance: 98 }
  ];

  const getComparisonStatus = (current, target, inverse = false) => {
    const diff = inverse ? target - current : current - target;
    if (diff > 0) return { status: 'positive', icon: 'TrendingUp', color: 'success' };
    if (diff < 0) return { status: 'negative', icon: 'TrendingDown', color: 'error' };
    return { status: 'neutral', icon: 'Minus', color: 'muted-foreground' };
  };

  const formatValue = (value, unit) => {
    return `${value}${unit}`;
  };

  const calculateChange = (current, previous, inverse = false) => {
    const change = inverse ? previous - current : current - previous;
    const percentage = (Math.abs(change) / previous) * 100;
    return {
      value: change,
      percentage: percentage.toFixed(1),
      isPositive: change > 0
    };
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Icon name="BarChart2" size={20} color="var(--color-primary)" className="mr-2" />
            Analyse comparative
          </h3>
          <p className="text-sm text-muted-foreground">
            Performance vs période précédente et secteur
          </p>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="space-y-4 mb-6">
        {comparisons.map((item, index) => {
          const prevComparison = getComparisonStatus(item.current, item.previous, item.inverse);
          const industryComparison = getComparisonStatus(item.current, item.industry, item.inverse);
          const change = calculateChange(item.current, item.previous, item.inverse);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-border rounded-lg bg-muted/30"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground">{item.metric}</h4>
                <span className="text-lg font-bold text-foreground">
                  {formatValue(item.current, item.unit)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* vs Previous Period */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">vs précédent</span>
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={prevComparison.icon} 
                      size={14} 
                      color={`var(--color-${prevComparison.color})`} 
                    />
                    <span className={`text-xs font-medium text-${prevComparison.color}`}>
                      {change.isPositive ? '+' : ''}{change.percentage}%
                    </span>
                  </div>
                </div>
                
                {/* vs Industry */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">vs secteur</span>
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={industryComparison.icon} 
                      size={14} 
                      color={`var(--color-${industryComparison.color})`} 
                    />
                    <span className={`text-xs font-medium text-${industryComparison.color}`}>
                      {formatValue(item.industry, item.unit)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Minimum</span>
                  <span>Objectif</span>
                  <span>Excellence</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full relative">
                  <div 
                    className={`h-full rounded-full bg-${prevComparison.color}`}
                    style={{ 
                      width: `${Math.min((item.current / (item.industry * 1.5)) * 100, 100)}%` 
                    }}
                  />
                  <div 
                    className="absolute top-0 w-0.5 h-2 bg-warning"
                    style={{ left: `${(item.industry / (item.industry * 1.5)) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Historical Performance */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-4 flex items-center">
          <Icon name="Clock" size={16} color="var(--color-primary)" className="mr-2" />
          Performance historique
        </h4>
        <div className="space-y-3">
          {historicalTrends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{trend.period}</span>
              <div className="flex items-center space-x-3">
                <div className="w-24 h-2 bg-muted rounded-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${trend.performance}%` }}
                    transition={{ delay: index * 0.2, duration: 0.8 }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-8">
                  {trend.performance}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="TrendingUp" size={16} color="var(--color-success)" />
            <span className="text-sm font-medium text-success">Tendance positive</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Amélioration constante sur les 4 derniers trimestres
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysis;