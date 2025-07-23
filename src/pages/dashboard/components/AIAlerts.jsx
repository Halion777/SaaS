import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIAlerts = () => {
  const alerts = [
    {
      id: 1,
      type: 'forgotten_quote',
      title: 'Devis oublié',
      message: 'Le devis pour Marie Dubois n\'a pas été envoyé depuis 3 jours',
      priority: 'high',
      action: 'Envoyer maintenant',
      timestamp: '2025-07-16'
    },
    {
      id: 2,
      type: 'inactive_client',
      title: 'Client inactif',
      message: 'Pierre Martin n\'a pas eu de contact depuis 2 semaines',
      priority: 'medium',
      action: 'Programmer relance',
      timestamp: '2025-07-05'
    },
    {
      id: 3,
      type: 'price_optimization',
      title: 'Optimisation prix',
      message: 'Augmentez vos tarifs de 8% selon l\'analyse IA',
      priority: 'low',
      action: 'Voir recommandations',
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
    const colors = {
      high: 'border-error bg-error/5',
      medium: 'border-warning bg-warning/5',
      low: 'border-primary bg-primary/5'
    };
    return colors[priority] || 'border-border bg-card';
  };

  const getIconColor = (priority) => {
    const colors = {
      high: 'text-error',
      medium: 'text-warning',
      low: 'text-primary'
    };
    return colors[priority] || 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-foreground">Alertes IA</h3>
          <div className="ai-indicator w-2 h-2 bg-primary rounded-full"></div>
        </div>
        <Button variant="ghost" size="sm">
          <Icon name="Settings" size={16} color="currentColor" />
        </Button>
      </div>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)} hover-reveal`}>
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center ${getIconColor(alert.priority)}`}>
                <Icon 
                  name={getAlertIcon(alert.type)} 
                  size={16} 
                  color="currentColor"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground mb-1">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{alert.message}</p>
                <Button variant="outline" size="xs">
                  {alert.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>IA activée • Gain moyen: +40%</span>
          <Button variant="ghost" size="sm">
            <Icon name="Brain" size={14} color="currentColor" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAlerts;