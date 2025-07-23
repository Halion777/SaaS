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
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Icon name="Lightbulb" size={20} color="var(--color-primary)" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Conseil IA du jour</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Les devis envoyés le mardi ont 23% plus de chances d'être signés. 
                Planifiez vos envois pour optimiser vos conversions.
              </p>
              <Button
                variant="link"
                size="sm"
                iconName="ArrowRight"
                iconPosition="right"
                className="p-0 h-auto"
              >
                En savoir plus
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