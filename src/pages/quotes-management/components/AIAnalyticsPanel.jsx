import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIAnalyticsPanel = ({ selectedQuote, onOptimizeQuote, onFollowUpRecommendation }) => {
  if (!selectedQuote) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <Icon name="Sparkles" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Analyse IA</h3>
          <p className="text-muted-foreground">
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
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Sparkles" size={20} color="var(--color-primary)" />
            <span>Analyse IA</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOptimizeQuote(selectedQuote)}
            iconName="Zap"
            iconPosition="left"
          >
            Optimiser
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Devis: {selectedQuote.number}</p>
          <p className="font-medium text-foreground">{selectedQuote.clientName}</p>
        </div>
      </div>

      {/* AI Scores */}
      <div className="p-6 border-b border-border">
        <h4 className="font-medium text-foreground mb-4">Scores de performance</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${getScoreBackground(selectedQuote.aiScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Score global</span>
              <Icon name="TrendingUp" size={16} color="currentColor" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(selectedQuote.aiScore)}`}>
              {selectedQuote.aiScore}%
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Lisibilité</span>
              <Icon name="Eye" size={16} color="currentColor" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {Math.floor(selectedQuote.aiScore * 0.9)}%
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Prob. signature</span>
              <Icon name="CheckCircle" size={16} color="currentColor" />
            </div>
            <div className="text-2xl font-bold text-success">
              {Math.floor(selectedQuote.aiScore * 0.8)}%
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-amber-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Taux d'ouverture</span>
              <Icon name="Mail" size={16} color="currentColor" />
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {Math.floor(selectedQuote.aiScore * 1.1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6">
        <h4 className="font-medium text-foreground mb-4">Recommandations IA</h4>
        
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border border-border rounded-lg p-4 hover:shadow-professional transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-foreground">{rec.title}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>
                <Icon 
                  name={rec.type === 'pricing' ? 'Euro' : rec.type === 'content' ? 'FileText' : 'Clock'} 
                  size={16} 
                  color="var(--color-muted-foreground)" 
                />
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-foreground">
                    Action: {rec.action}
                  </span>
                  <span className="text-sm text-success">
                    Impact: {rec.impact}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFollowUpRecommendation(rec)}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-muted/30 p-6 border-t border-border">
        <h4 className="font-medium text-foreground mb-4">Actions rapides</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'follow-up' })}
            iconName="Send"
            iconPosition="left"
          >
            Relance automatique
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onOptimizeQuote(selectedQuote)}
            iconName="Edit"
            iconPosition="left"
          >
            Modifier le contenu
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'pricing' })}
            iconName="Calculator"
            iconPosition="left"
          >
            Ajuster le prix
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => onFollowUpRecommendation({ type: 'call' })}
            iconName="Phone"
            iconPosition="left"
          >
            Programmer un appel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPanel;