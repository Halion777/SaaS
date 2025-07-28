import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIAnalyticsPanel = ({ selectedQuote, onOptimizeQuote, onFollowUpRecommendation }) => {
  if (!selectedQuote) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
        <div className="text-center">
          <Icon name="Sparkles" size={24} className="sm:w-8 sm:h-8 md:w-12 md:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3 md:mb-4" />
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-1 sm:mb-2">Analyse IA</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sélectionnez un devis pour voir son analyse IA détaillée
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-600';
    return 'text-destructive';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-destructive/10';
  };

  const recommendations = [
    {
      type: 'pricing',
      priority: 'high',
      title: 'Ajustement de prix',
      description: `Le prix proposé (${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedQuote.amount)}) semble 15% supérieur à la moyenne du marché pour ce type de prestation.`,
      action: 'Réduire de 10-15%',
      impact: '+25% de signature'
    },
    {
      type: 'content',
      priority: 'medium',
      title: 'Amélioration du contenu',
      description: 'La description technique pourrait être simplifiée pour une meilleure compréhension client.',
      action: 'Simplifier le langage',
      impact: '+12% de lisibilité'
    },
    {
      type: 'timing',
      priority: 'high',
      title: 'Relance recommandée',
      description: 'Le devis a été consulté il y a 3 jours. C\'est le moment optimal pour une relance.',
      action: 'Envoyer une relance',
      impact: '+40% de réponse'
    }
  ];

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-destructive bg-red-100',
      medium: 'text-amber-700 bg-amber-100',
      low: 'text-blue-700 bg-blue-100'
    };
    return colors[priority] || colors.low;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible'
    };
    return labels[priority] || 'Faible';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-3 sm:p-4 md:p-6 border-b border-border">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 md:mb-4">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Sparkles" size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
            <span>Analyse IA</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOptimizeQuote(selectedQuote)}
            iconName="Zap"
            iconPosition="left"
            className="text-xs sm:text-sm w-full sm:w-auto"
          >
            Optimiser
          </Button>
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">Devis: {selectedQuote.number}</p>
          <p className="text-sm sm:text-base font-medium text-foreground">{selectedQuote.clientName}</p>
        </div>
      </div>

      {/* AI Scores */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-border">
        <h4 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-2 sm:mb-3 md:mb-4">Scores de performance</h4>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <div className={`p-2 sm:p-3 md:p-4 rounded-lg ${getScoreBackground(selectedQuote.aiScore)}`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-foreground">Score global</span>
              <Icon name="TrendingUp" size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
            </div>
            <div className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${getScoreColor(selectedQuote.aiScore)}`}>
              {selectedQuote.aiScore}%
            </div>
          </div>
          
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-foreground">Lisibilité</span>
              <Icon name="Eye" size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
            </div>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-700">
              {Math.floor(selectedQuote.aiScore * 0.9)}%
            </div>
          </div>
          
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-green-50">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-foreground">Prob. signature</span>
              <Icon name="CheckCircle" size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
            </div>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-success">
              {Math.floor(selectedQuote.aiScore * 0.8)}%
            </div>
          </div>
          
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-amber-50">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-foreground">Taux d'ouverture</span>
              <Icon name="Mail" size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
            </div>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-amber-700">
              {Math.floor(selectedQuote.aiScore * 1.1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-3 sm:p-4 md:p-6">
        <h4 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-2 sm:mb-3 md:mb-4">Recommandations IA</h4>
        
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border border-border rounded-lg p-2 sm:p-3 md:p-4 hover:shadow-professional transition-shadow">
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
                <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
                  <h5 className="text-xs sm:text-sm md:text-base font-medium text-foreground">{rec.title}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getPriorityColor(rec.priority)}`}>
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>
                <Icon 
                  name={rec.type === 'pricing' ? 'Euro' : rec.type === 'content' ? 'FileText' : 'Clock'} 
                  size={12} 
                  className="sm:w-3 sm:h-3 md:w-4 md:h-4 text-muted-foreground" 
                />
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{rec.description}</p>
              
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    Action: {rec.action}
                  </span>
                  <span className="text-xs sm:text-sm text-success">
                    Impact: {rec.impact}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFollowUpRecommendation(rec)}
                  iconName="ArrowRight"
                  iconPosition="right"
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-muted/30 p-3 sm:p-4 md:p-6 border-t border-border">
        <h4 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-2 sm:mb-3 md:mb-4">Actions rapides</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'follow-up' })}
            iconName="Send"
            iconPosition="left"
            className="text-xs sm:text-sm"
          >
            Relance automatique
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onOptimizeQuote(selectedQuote)}
            iconName="Edit"
            iconPosition="left"
            className="text-xs sm:text-sm"
          >
            Modifier le contenu
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'pricing' })}
            iconName="Calculator"
            iconPosition="left"
            className="text-xs sm:text-sm"
          >
            Ajuster le prix
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'call' })}
            iconName="Phone"
            iconPosition="left"
            className="text-xs sm:text-sm"
          >
            Programmer un appel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPanel;