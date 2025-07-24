import React from 'react';
import Icon from '../../../components/AppIcon';

// Revenue Overview Component - for top section
export const RevenueOverview = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Loader2" size={16} className="animate-spin" />
          <span className="text-sm text-muted-foreground">Analyse en cours...</span>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="TrendingUp" size={16} color="var(--color-primary)" />
        <h3 className="text-sm font-medium text-foreground">Aperçu Financier</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">CA Total</span>
          <span className="font-semibold text-sm text-foreground">
            {analytics.totalRevenue?.toLocaleString() || 0}€
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full" 
            style={{ width: '75%' }}
          ></div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Objectif: {((analytics.totalRevenue || 0) * 1.3).toLocaleString()}€
        </p>
      </div>
    </div>
  );
};

// Top Clients Component - for top section
export const TopClients = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="Crown" size={16} color="var(--color-primary)" />
        <h3 className="text-sm font-medium text-foreground">Top Clients</h3>
      </div>
      
      <div className="space-y-1">
        {analytics.topClients?.slice(0, 3).map((client, index) => (
          <div key={index} className="flex items-center justify-between p-1.5 bg-muted/30 rounded text-xs">
            <span className="text-foreground truncate">{client}</span>
            <div className="flex items-center space-x-1">
              <Icon name="Star" size={12} color="var(--color-primary)" />
              <span className="text-muted-foreground">#{index + 1}</span>
            </div>
          </div>
        )) || (
          <p className="text-xs text-muted-foreground">Aucun client analysé</p>
        )}
      </div>
    </div>
  );
};

// AI Recommendations Component - for bottom section
export const AIRecommendations = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="Lightbulb" size={16} color="var(--color-primary)" />
        <h3 className="text-sm font-medium text-foreground">Recommandations IA</h3>
      </div>
      
      <div className="space-y-2">
        {analytics.recommendations?.slice(0, 2).map((recommendation, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded text-xs">
            <Icon name="CheckCircle" size={12} color="var(--color-blue)" className="mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{recommendation}</span>
          </div>
        )) || (
          <p className="text-xs text-muted-foreground">Aucune recommandation disponible</p>
        )}
      </div>
    </div>
  );
};

// Risk Factors Component - for bottom section
export const RiskFactors = ({ analytics, isLoading }) => {
  if (isLoading || !analytics?.riskFactors?.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="AlertTriangle" size={16} color="var(--color-destructive)" />
        <h3 className="text-sm font-medium text-foreground">Facteurs de Risque</h3>
      </div>
      
      <div className="space-y-2">
        {analytics.riskFactors.slice(0, 2).map((risk, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded text-xs">
            <Icon name="AlertCircle" size={12} color="var(--color-destructive)" className="mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions Component - for bottom section
export const QuickActions = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="Zap" size={16} color="var(--color-primary)" />
        <h3 className="text-sm font-medium text-foreground">Actions Rapides</h3>
      </div>
      
      <div className="space-y-1">
        <button className="w-full text-left p-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded transition-colors">
          Exporter la liste clients
        </button>
        <button className="w-full text-left p-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded transition-colors">
          Planifier suivi automatique
        </button>
        <button className="w-full text-left p-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded transition-colors">
          Générer rapport IA
        </button>
      </div>
    </div>
  );
};

// Main ClientAnalytics component (keeping for backward compatibility)
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
      <RevenueOverview analytics={analytics} isLoading={isLoading} />
      <TopClients analytics={analytics} isLoading={isLoading} />
      <AIRecommendations analytics={analytics} isLoading={isLoading} />
      <RiskFactors analytics={analytics} isLoading={isLoading} />
      <QuickActions />
    </div>
  );
};

export default ClientAnalytics;