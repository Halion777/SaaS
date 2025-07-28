import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, change, changeType, icon, color = "primary" }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional hover-reveal">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon name={icon} size={20} className="sm:w-6 sm:h-6" color="currentColor" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
            <Icon name={getChangeIcon()} size={14} className="sm:w-4 sm:h-4" color="currentColor" />
            <span className="text-xs sm:text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
};

export default MetricsCard;