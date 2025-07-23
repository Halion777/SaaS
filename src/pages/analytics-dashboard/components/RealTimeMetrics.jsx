import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const RealTimeMetrics = ({ data }) => {
  const progressPercentage = data?.currentMonth ? 
    (data.currentMonth.current / data.currentMonth.target) * 100 : 0;

  return (
    <motion.div 
      className="bg-gradient-to-r from-primary/5 to-success/5 border border-primary/20 rounded-lg p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Activity" size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Métriques temps réel</h3>
            <p className="text-sm text-muted-foreground">Progression du mois en cours</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Month Progress */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Objectif mensuel</span>
            <Icon name="Target" size={16} color="var(--color-primary)" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-foreground">
                €{data?.currentMonth?.current?.toLocaleString() || '0'}
              </span>
              <span className="text-sm text-muted-foreground">
                / €{data?.currentMonth?.target?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}% atteint
              </span>
              <span className={progressPercentage >= 100 ? "text-success" : "text-primary"}>
                {progressPercentage >= 100 ? "Objectif atteint !" : `${(100 - progressPercentage).toFixed(0)}% restant`}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Quotes */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Devis aujourd'hui</span>
            <Icon name="FileText" size={16} color="var(--color-success)" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {data?.todayQuotes || 0}
              </span>
              <div className="flex items-center space-x-1 text-success">
                <Icon name="TrendingUp" size={14} />
                <span className="text-sm font-medium">+2</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">vs hier</p>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Clients actifs</span>
            <Icon name="Users" size={16} color="var(--color-warning)" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {data?.activeClients || 0}
              </span>
              <div className="flex items-center space-x-1 text-success">
                <Icon name="Plus" size={14} />
                <span className="text-sm font-medium">3</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">cette semaine</p>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Relances en attente</span>
            <Icon name="Clock" size={16} color="var(--color-error)" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {data?.pendingFollowUps || 0}
              </span>
              {(data?.pendingFollowUps || 0) > 10 && (
                <div className="px-2 py-1 bg-error/10 text-error text-xs rounded-full">
                  Urgent
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">à traiter</p>
          </div>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
          <Icon name="Activity" size={16} color="var(--color-primary)" className="mr-2" />
          Activité récente
        </h4>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Nouveau devis créé pour</span>
            <span className="text-foreground font-medium">Marie Dubois</span>
            <span className="text-muted-foreground">il y a 2 min</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-muted-foreground">Devis signé par</span>
            <span className="text-foreground font-medium">Jean Martin</span>
            <span className="text-muted-foreground">il y a 15 min</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span className="text-muted-foreground">Relance programmée pour</span>
            <span className="text-foreground font-medium">Sophie Bernard</span>
            <span className="text-muted-foreground">il y a 28 min</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RealTimeMetrics;