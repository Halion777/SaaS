import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsSection = ({ onBulkOptimize, selectedCount }) => {
  const navigate = useNavigate();

  const handleCreateQuote = () => {
    navigate('/quote-creation');
  };

  const handleTemplatesClick = () => {
    navigate('/templates');
  };

  const handleExportClick = () => {
    console.log('Export clicked');
  };

  const handleCustomersClick = () => {
    navigate('/customers');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-base font-medium text-foreground flex items-center">
          <Icon name="Zap" size={18} className="text-primary mr-2" />
          Actions rapides
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Primary Actions */}
          <div className="space-y-3">
            <Button
              variant="default"
              fullWidth
              onClick={handleCreateQuote}
              iconName="Plus"
              iconPosition="left"
              className="h-10"
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
              className="h-10"
            >
              Optimisation IA
              {selectedCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {selectedCount}
                </span>
              )}
            </Button>

            {/* Quick Links */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTemplatesClick}
                className="flex flex-col items-center justify-center h-16 text-xs"
              >
                <Icon name="FileText" size={18} className="mb-1" />
                Templates
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportClick}
                className="flex flex-col items-center justify-center h-16 text-xs"
              >
                <Icon name="Download" size={18} className="mb-1" />
                Exporter
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCustomersClick}
                className="flex flex-col items-center justify-center h-16 text-xs"
              >
                <Icon name="Users" size={18} className="mb-1" />
                Clients
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsClick}
                className="flex flex-col items-center justify-center h-16 text-xs"
              >
                <Icon name="Settings" size={18} className="mb-1" />
                Paramètres
              </Button>
            </div>
          </div>

          {/* Middle Column - AI Tip Card */}
          <div>
            <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 rounded-lg p-3 border border-blue-600/30 shadow-sm h-full relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-purple-500/10 rounded-full translate-y-6 -translate-x-6 blur-xl"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-full p-1.5 mr-2">
                    <Icon name="Lightbulb" size={14} className="text-yellow-300" />
                  </div>
                  <h4 className="font-medium text-white text-sm">Conseil IA du jour</h4>
                </div>
                <p className="text-xs text-white/90 mb-2 flex-grow">
                  Les devis envoyés le mardi sont 23% plus susceptibles d'être signés. Planifiez vos envois pour optimiser vos conversions.
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-white/90 hover:text-white p-0 h-auto"
                  >
                    <span className="flex items-center text-xs">
                      En savoir plus
                      <Icon name="ArrowRight" size={12} className="ml-1" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Performance Metrics */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-card border border-border rounded-lg p-3 h-full">
              <h4 className="text-sm font-medium text-foreground mb-3">Performance</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center py-2">
                  <div className="text-lg font-bold text-primary">+40%</div>
                  <div className="text-xs text-muted-foreground">Taux signature</div>
                </div>
                <div className="text-center py-2">
                  <div className="text-lg font-bold text-success">-60%</div>
                  <div className="text-xs text-muted-foreground">Temps création</div>
                </div>
                <div className="text-center py-2">
                  <div className="text-lg font-bold text-accent">+25%</div>
                  <div className="text-xs text-muted-foreground">Revenu moyen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsSection;