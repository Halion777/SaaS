import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ComparisonAnalytics = () => {
  const [activeComparison, setActiveComparison] = useState('industry');

  const industryBenchmarks = [
    {
      metric: 'Taux de conversion',
      current: 68.5,
      industry: 58.3,
      status: 'above'
    },
    {
      metric: 'Délai moyen de réponse',
      current: 2.4,
      industry: 3.8,
      status: 'above',
      unit: 'h'
    },
    {
      metric: 'Marge bénéficiaire',
      current: 32.8,
      industry: 28.5,
      status: 'above',
      unit: '%'
    },
    {
      metric: 'Satisfaction client',
      current: 4.7,
      industry: 4.2,
      status: 'above',
      unit: '/5'
    }
  ];

  const historicalData = [
    {
      metric: 'Chiffre d\'affaires',
      current: 156750,
      previous: 142300,
      status: 'above',
      unit: '€'
    },
    {
      metric: 'Nouveaux clients',
      current: 23,
      previous: 19,
      status: 'above'
    },
    {
      metric: 'Projets terminés',
      current: 45,
      previous: 42,
      status: 'above'
    },
    {
      metric: 'Temps moyen projet',
      current: 8.5,
      previous: 9.2,
      status: 'above',
      unit: 'j'
    }
  ];

  const getStatusColor = (status) => {
    return status === 'above' ? 'text-emerald-600' : 'text-red-600';
  };

  const getStatusIcon = (status) => {
    return status === 'above' ? 'TrendingUp' : 'TrendingDown';
  };

  const formatValue = (value, unit) => {
    if (unit === '€') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(value);
    }
    return `${value}${unit || ''}`;
  };

  const calculateDifference = (current, comparison) => {
    const diff = ((current - comparison) / comparison * 100);
    return diff.toFixed(1);
  };

  const data = activeComparison === 'industry' ? industryBenchmarks : historicalData;
  const comparisonLabel = activeComparison === 'industry' ? 'Secteur' : 'Période précédente';

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Icon name="BarChart2" size={20} color="rgb(245 158 11)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Analyse comparative</h3>
            <p className="text-sm text-muted-foreground">Benchmarking performance</p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex space-x-1 mb-6 bg-muted/30 p-1 rounded-lg">
        <button
          onClick={() => setActiveComparison('industry')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeComparison === 'industry' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          Vs Secteur
        </button>
        <button
          onClick={() => setActiveComparison('historical')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeComparison === 'historical' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          Vs Historique
        </button>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.metric} className="p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{item.metric}</span>
              <div className={`flex items-center space-x-1 ${getStatusColor(item.status)}`}>
                <Icon name={getStatusIcon(item.status)} size={14} />
                <span className="text-xs font-medium">
                  {item.status === 'above' ? '+' : ''}{calculateDifference(item.current, activeComparison === 'industry' ? item.industry : item.previous)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Vous</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatValue(item.current, item.unit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{comparisonLabel}</span>
                <span className="text-sm text-muted-foreground">
                  {formatValue(activeComparison === 'industry' ? item.industry : item.previous, item.unit)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Icon name="Award" size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-foreground">Performance globale</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">Excellente</div>
          <p className="text-xs text-muted-foreground mt-1">
            Au-dessus de la moyenne du secteur
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonAnalytics;