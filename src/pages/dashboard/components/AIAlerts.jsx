import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIAlerts = () => {
  const { t } = useTranslation();
  const alerts = [
    {
      id: 1,
      type: 'forgotten_quote',
      title: t('dashboard.aiAlerts.alerts.0.title'),
      message: t('dashboard.aiAlerts.alerts.0.message'),
      priority: 'high',
      action: t('dashboard.aiAlerts.alerts.0.action'),
      timestamp: '2025-07-16'
    },
    {
      id: 2,
      type: 'inactive_client',
      title: t('dashboard.aiAlerts.alerts.1.title'),
      message: t('dashboard.aiAlerts.alerts.1.message'),
      priority: 'medium',
      action: t('dashboard.aiAlerts.alerts.1.action'),
      timestamp: '2025-07-05'
    },
    {
      id: 3,
      type: 'price_optimization',
      title: t('dashboard.aiAlerts.alerts.2.title'),
      message: t('dashboard.aiAlerts.alerts.2.message'),
      priority: 'low',
      action: t('dashboard.aiAlerts.alerts.2.action'),
      timestamp: '2025-07-18'
    }
  ];

  const getAlertIcon = (type) => {
    const icons = {
      forgotten_quote: 'AlertTriangle',
      inactive_client: 'UserX',
      price_optimization: 'TrendingUp',
      follow_up: 'Clock'
    };
    return icons[type] || 'Bell';
  };

  const getPriorityColor = (priority) => {
    const configs = {
      high: t('dashboard.aiAlerts.priorities.high.background'),
      medium: t('dashboard.aiAlerts.priorities.medium.background'),
      low: t('dashboard.aiAlerts.priorities.low.background')
    };
    return configs[priority] || 'border-border bg-card';
  };

  const getIconColor = (priority) => {
    const configs = {
      high: t('dashboard.aiAlerts.priorities.high.color'),
      medium: t('dashboard.aiAlerts.priorities.medium.color'),
      low: t('dashboard.aiAlerts.priorities.low.color')
    };
    return configs[priority] || 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.aiAlerts.title')}</h3>
          <div className="ai-indicator w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
          <Icon name="Settings" size={14} className="sm:w-4 sm:h-4" color="currentColor" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-3 sm:p-4 rounded-lg border ${getPriorityColor(alert.priority)} hover-reveal`}>
            <div className="flex items-start space-x-2.5 sm:space-x-3">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background flex items-center justify-center ${getIconColor(alert.priority)}`}>
                <Icon 
                  name={getAlertIcon(alert.type)} 
                  size={14} 
                  className="sm:w-4 sm:h-4"
                  color="currentColor"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground mb-1">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mb-2 sm:mb-3">{alert.message}</p>
                <Button variant="outline" size="xs" className="text-xs">
                  {alert.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('dashboard.aiAlerts.footer.aiEnabled')}</span>
          <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
            <Icon name="Brain" size={12} className="sm:w-[14px] sm:h-[14px]" color="currentColor" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAlerts;