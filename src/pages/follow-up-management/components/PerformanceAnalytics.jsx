import React from 'react';
import Icon from '../../../components/AppIcon';

const PerformanceAnalytics = ({ followUps }) => {
  const calculateMetrics = () => {
    const total = followUps.length;
    const sent = followUps.filter(fu => fu.status === 'sent').length;
    const opened = followUps.filter(fu => fu.status === 'opened').length;
    const replied = followUps.filter(fu => fu.status === 'replied').length;
    
    return {
      total,
      sent,
      opened,
      replied,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      responseRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
      conversionRate: total > 0 ? Math.round((replied / total) * 100) : 0
    };
  };

  const metrics = calculateMetrics();

  const getChannelStats = () => {
    const channels = {};
    followUps.forEach(fu => {
      if (!channels[fu.channel]) {
        channels[fu.channel] = { total: 0, sent: 0, opened: 0 };
      }
      channels[fu.channel].total++;
      if (fu.status === 'sent') channels[fu.channel].sent++;
      if (fu.status === 'opened') channels[fu.channel].opened++;
    });
    
    return Object.entries(channels).map(([channel, stats]) => ({
      channel,
      ...stats,
      openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0
    }));
  };

  const channelStats = getChannelStats();

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="BarChart3" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Performance Globale</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Taux d'ouverture</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${metrics.openRate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-foreground">{metrics.openRate}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Taux de réponse</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${metrics.responseRate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-foreground">{metrics.responseRate}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Taux de conversion</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${metrics.conversionRate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-foreground">{metrics.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="MessageSquare" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Performance par Canal</h3>
        </div>
        
        <div className="space-y-3">
          {channelStats.map((stat) => (
            <div key={stat.channel} className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <div className="flex items-center space-x-2">
                <Icon 
                  name={stat.channel === 'email' ? 'Mail' : stat.channel === 'sms' ? 'MessageSquare' : 'Phone'} 
                  size={16} 
                />
                <span className="text-sm capitalize">{stat.channel}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{stat.openRate}%</div>
                <div className="text-xs text-muted-foreground">{stat.sent}/{stat.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Brain" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Insights IA</h3>
        </div>
        
        <div className="space-y-2">
          {metrics.openRate > 70 && (
            <div className="flex items-start space-x-2 p-2 bg-green-50 rounded">
              <Icon name="TrendingUp" size={14} color="var(--color-green)" className="mt-0.5" />
              <span className="text-sm text-foreground">Excellent taux d'ouverture</span>
            </div>
          )}
          
          {metrics.responseRate < 20 && (
            <div className="flex items-start space-x-2 p-2 bg-yellow-50 rounded">
              <Icon name="AlertTriangle" size={14} color="var(--color-yellow)" className="mt-0.5" />
              <span className="text-sm text-foreground">Améliorer le contenu des messages</span>
            </div>
          )}
          
          <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
            <Icon name="Lightbulb" size={14} color="var(--color-blue)" className="mt-0.5" />
            <span className="text-sm text-foreground">Optimiser les heures d'envoi</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Zap" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Actions Rapides</h3>
        </div>
        
        <div className="space-y-2">
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Exporter rapport de performance
          </button>
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Optimiser avec IA
          </button>
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Configurer A/B testing
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;