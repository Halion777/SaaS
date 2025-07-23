import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsProgress = ({ metrics }) => {
  const progressItems = [
    {
      label: 'Progression mensuelle',
      value: metrics.monthProgress,
      icon: 'Calendar',
      color: 'blue'
    },
    {
      label: 'Objectif revenus',
      value: metrics.revenueTarget,
      icon: 'Euro',
      color: 'emerald'
    },
    {
      label: 'Objectif clients',
      value: metrics.clientTarget,
      icon: 'Users',
      color: 'purple'
    },
    {
      label: 'Objectif projets',
      value: metrics.projectsTarget,
      icon: 'Briefcase',
      color: 'orange'
    }
  ];

  const getProgressColor = (value, color) => {
    const colors = {
      blue: value >= 80 ? 'bg-blue-500' : value >= 60 ? 'bg-blue-400' : 'bg-blue-300',
      emerald: value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-emerald-400' : 'bg-emerald-300',
      purple: value >= 80 ? 'bg-purple-500' : value >= 60 ? 'bg-purple-400' : 'bg-purple-300',
      orange: value >= 80 ? 'bg-orange-500' : value >= 60 ? 'bg-orange-400' : 'bg-orange-300'
    };
    return colors[color];
  };

  const getStatusIcon = (value) => {
    if (value >= 90) return { icon: 'TrendingUp', color: 'text-emerald-600' };
    if (value >= 70) return { icon: 'Minus', color: 'text-yellow-600' };
    return { icon: 'TrendingDown', color: 'text-red-600' };
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Icon name="Activity" size={20} color="rgb(99 102 241)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Métriques temps réel</h3>
            <p className="text-sm text-muted-foreground">Progression vs objectifs</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {progressItems.map((item, index) => {
          const status = getStatusIcon(item.value);
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name={item.icon} size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-foreground">{item.value}%</span>
                  <Icon name={status.icon} size={16} className={status.color} />
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(item.value, item.color)} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
                {item.value > 100 && (
                  <div className="absolute right-0 top-0 transform translate-x-2">
                    <Icon name="Crown" size={16} className="text-yellow-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Performance globale</p>
            <p className="text-xl font-bold text-foreground">
              {Math.round(progressItems.reduce((sum, item) => sum + item.value, 0) / progressItems.length)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tendance</p>
            <div className="flex items-center justify-center space-x-1">
              <Icon name="TrendingUp" size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">Positive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsProgress;