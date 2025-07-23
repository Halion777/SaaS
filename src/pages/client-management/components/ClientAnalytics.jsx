import React from 'react';
import Icon from '../../../components/AppIcon';

const ClientAnalytics = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Loader2" size={20} className="animate-spin" />
          <h3 className="font-medium text-foreground">Analyse IA en cours...</h3>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Revenue Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="TrendingUp" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Aperçu Financier</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Chiffre d'affaires total</span>
            <span className="font-semibold text-foreground">
              {analytics.totalRevenue?.toLocaleString() || 0}€
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: '75%' }}
            ></div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Objectif annuel: {((analytics.totalRevenue || 0) * 1.3).toLocaleString()}€
          </p>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Crown" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Top Clients</h3>
        </div>
        
        <div className="space-y-2">
          {analytics.topClients?.map((client, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm text-foreground">{client}</span>
              <div className="flex items-center space-x-1">
                <Icon name="Star" size={14} color="var(--color-primary)" />
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
              </div>
            </div>
          )) || (
            <p className="text-sm text-muted-foreground">Aucun client analysé</p>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Lightbulb" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Recommandations IA</h3>
        </div>
        
        <div className="space-y-2">
          {analytics.recommendations?.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
              <Icon name="CheckCircle" size={14} color="var(--color-blue)" className="mt-0.5" />
              <span className="text-sm text-foreground">{recommendation}</span>
            </div>
          )) || (
            <p className="text-sm text-muted-foreground">Aucune recommandation disponible</p>
          )}
        </div>
      </div>

      {/* Risk Factors */}
      {analytics.riskFactors && analytics.riskFactors.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="AlertTriangle" size={20} color="var(--color-destructive)" />
            <h3 className="font-medium text-foreground">Facteurs de Risque</h3>
          </div>
          
          <div className="space-y-2">
            {analytics.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                <Icon name="AlertCircle" size={14} color="var(--color-destructive)" className="mt-0.5" />
                <span className="text-sm text-foreground">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Zap" size={20} color="var(--color-primary)" />
          <h3 className="font-medium text-foreground">Actions Rapides</h3>
        </div>
        
        <div className="space-y-2">
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Exporter la liste clients
          </button>
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Planifier suivi automatique
          </button>
          <button className="w-full text-left p-2 text-sm bg-muted/30 hover:bg-muted/50 rounded transition-colors">
            Générer rapport IA
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;