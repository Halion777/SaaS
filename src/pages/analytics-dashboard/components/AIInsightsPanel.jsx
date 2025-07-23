import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const AIInsightsPanel = ({ insights, pricingOptimization, performanceAnalysis, isLoading }) => {
  const [activeTab, setActiveTab] = useState('insights');

  const tabs = [
    { id: 'insights', label: 'Insights IA', icon: 'Brain' },
    { id: 'pricing', label: 'Optimisation prix', icon: 'DollarSign' },
    { id: 'performance', label: 'Performance', icon: 'Zap' }
  ];

  const LoadingCard = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
  );

  const renderInsights = () => {
    if (isLoading) return <LoadingCard />;
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Lightbulb" size={18} className="mr-2 text-yellow-500" />
            Insights clés
          </h4>
          <div className="space-y-2">
            {insights?.insights?.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <p className="text-sm text-blue-800">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Target" size={18} className="mr-2 text-emerald-500" />
            Recommandations
          </h4>
          <div className="space-y-2">
            {insights?.recommendations?.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <p className="text-sm text-emerald-800">{rec}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="TrendingUp" size={18} className="mr-2 text-purple-500" />
            Prédictions
          </h4>
          <div className="space-y-2">
            {insights?.predictions?.map((pred, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.6 }}
                className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <p className="text-sm text-purple-800">{pred}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPricing = () => {
    if (isLoading) return <LoadingCard />;
    
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Position marché</h4>
          <p className="text-sm text-green-700">
            {pricingOptimization?.marketPosition || 'Position compétitive favorable'}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3">Avantages concurrentiels</h4>
          <div className="space-y-2">
            {(pricingOptimization?.competitiveAdvantages || [
              'Rapport qualité-prix optimal',
              'Expertise reconnue',
              'Service personnalisé'
            ]).map((advantage, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={16} className="text-emerald-500" />
                <span className="text-sm text-foreground">{advantage}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-800 mb-2">Impact rentabilité</h4>
          <p className="text-sm text-orange-700">
            {pricingOptimization?.profitabilityImpact || 'Optimisation attendue de +15% sur la marge'}
          </p>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (isLoading) return <LoadingCard />;
    
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {performanceAnalysis?.efficiencyScore || 85}%
          </div>
          <p className="text-sm text-blue-700">Score d'efficacité global</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="AlertTriangle" size={18} className="mr-2 text-amber-500" />
            Goulots d'étranglement
          </h4>
          <div className="space-y-2">
            {(performanceAnalysis?.bottlenecks || [
              'Temps de réponse aux devis',
              'Processus de validation'
            ]).map((bottleneck, index) => (
              <div key={index} className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                {bottleneck}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Icon name="Zap" size={18} className="mr-2 text-blue-500" />
            Améliorations suggérées
          </h4>
          <div className="space-y-2">
            {(performanceAnalysis?.improvements || [
              'Automatiser les suivis clients',
              'Optimiser la planification'
            ]).map((improvement, index) => (
              <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                {improvement}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'insights':
        return renderInsights();
      case 'pricing':
        return renderPricing();
      case 'performance':
        return renderPerformance();
      default:
        return renderInsights();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
            <Icon name="Sparkles" size={20} color="rgb(147 51 234)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Insights IA</h3>
            <p className="text-sm text-muted-foreground">
              Recommandations automatisées basées sur vos données
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Temps réel</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted/30 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={tab.icon} size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default AIInsightsPanel;