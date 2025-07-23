import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, trend, icon, color, description, delay = 0 }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
    orange: 'bg-orange-500/10 text-orange-600 border-orange-200'
  };

  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-red-600';
  const trendIcon = trend === 'up' ? 'TrendingUp' : 'TrendingDown';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon name={icon} size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              <Icon name={trendIcon} size={16} />
              <span className="text-sm font-medium">{change}</span>
            </div>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;