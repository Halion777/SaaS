import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsSection = ({ onBulkOptimize, selectedCount }) => {
  const navigate = useNavigate();

  const handleCreateQuote = () => {
    navigate('/quote-creation');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center space-x-2">
        <Icon name="Zap" size={20} color="var(--color-primary)" />
        <span>Actions rapides</span>
      </h3>

      <div className="space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="default"
            fullWidth
            onClick={handleCreateQuote}
            iconName="Plus"
            iconPosition="left"
            className="h-12"
          >
            Nouveau devis
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={onBulkOptimize}
            disabled={selectedCount === 0}
            iconName="Sparkles"
            iconPosition="left"
            className="h-12"
          >
            Optimisation IA
            {selectedCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {selectedCount}
              </span>
            )}
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="ghost"
            fullWidth
            iconName="FileText"
            iconPosition="left"
            size="sm"
          >
            Templates
          </Button>
          
          <Button
            variant="ghost"
            fullWidth
            iconName="Download"
            iconPosition="left"
            size="sm"
          >
            Exporter
          </Button>
          
          <Button
            variant="ghost"
            fullWidth
            iconName="Users"
            iconPosition="left"
            size="sm"
          >
            Clients
          </Button>
          
          <Button
            variant="ghost"
            fullWidth
            iconName="Settings"
            iconPosition="left"
            size="sm"
          >
            Paramètres
          </Button>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 rounded-lg p-5 border border-blue-600/30 shadow-md transform transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/20 group relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8 blur-xl"></div>
          <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-yellow-300/20 rounded-full blur-md animate-pulse"></div>
          
          <div className="flex items-start space-x-3 relative z-10">
            <div className="bg-white/20 rounded-full p-2.5 shadow-inner">
              <Icon name="Lightbulb" size={20} color="rgb(250, 204, 21)" className="animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white mb-2">Conseil IA du jour</h4>
              <p className="text-sm text-white/80 mb-3">
                Les devis envoyés le mardi ont 23% plus de chances d'être signés. 
                Planifiez vos envois pour optimiser vos conversions.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-white border-white/50 hover:bg-white/20 hover:border-white p-0 h-auto transform transition-all duration-300 group-hover:translate-x-1"
              >
                <span className="flex items-center">
                  En savoir plus
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">+40%</div>
            <div className="text-xs text-muted-foreground">Taux de signature</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">-60%</div>
            <div className="text-xs text-muted-foreground">Temps de création</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-1">+25%</div>
            <div className="text-xs text-muted-foreground">Revenus moyens</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsSection;