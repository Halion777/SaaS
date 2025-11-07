import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, trend, icon, color, description, delay = 0, isLoading = false }) => {
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
      className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className={`p-2 sm:p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon name={icon} size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {isLoading ? '...' : value}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              {!isLoading && <Icon name={trendIcon} size={14} className="sm:w-4 sm:h-4" />}
              <span className="text-xs sm:text-sm font-medium">{isLoading ? '...' : change}</span>
            </div>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;