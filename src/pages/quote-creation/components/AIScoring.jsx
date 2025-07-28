import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIScoring = ({ selectedClient, tasks, currentStep }) => {
  const [scores, setScores] = useState({
    readability: 0,
    followUpRate: 0,
    openingLevel: 0,
    signatureProbability: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (tasks.length > 0 || selectedClient) {
      analyzeQuote();
    } else {
      // Reset scores to 0 when there's no data
      setScores({
        readability: 0,
        followUpRate: 0,
        openingLevel: 0,
        signatureProbability: 0
      });
      setRecommendations([]);
      setIsAnalyzing(false);
    }
  }, [tasks, selectedClient, currentStep]);

  const analyzeQuote = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const hasClient = !!selectedClient;
      const hasTasks = tasks.length > 0;
      const hasDetailedTasks = tasks.some(task => task.description.length > 50);
      const hasMaterials = tasks.some(task => task.materials.length > 0);
      const totalPrice = tasks.reduce((sum, task) => {
        const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
          matSum + (mat.price * parseFloat(mat.quantity)), 0);
        return sum + task.price + taskMaterialsTotal;
      }, 0);

      // Calculate scores based on completeness and quality
      const readability = Math.min(100, 
        (hasClient ? 20 : 0) + 
        (hasTasks ? 30 : 0) + 
        (hasDetailedTasks ? 30 : 0) + 
        (hasMaterials ? 20 : 0)
      );

      const followUpRate = Math.min(100, 
        (hasClient ? 25 : 0) + 
        (totalPrice > 0 ? 25 : 0) + 
        (hasDetailedTasks ? 25 : 0) + 
        (currentStep >= 3 ? 25 : 0)
      );

      const openingLevel = Math.min(100, 
        (hasClient ? 30 : 0) + 
        (hasTasks ? 40 : 0) + 
        (currentStep >= 4 ? 30 : 0)
      );

      const signatureProbability = Math.min(100, 
        Math.round((readability + followUpRate + openingLevel) / 3)
      );

      setScores({
        readability,
        followUpRate,
        openingLevel,
        signatureProbability
      });

      // Generate recommendations
      const newRecommendations = [];
      
      if (!hasClient) {
        newRecommendations.push({
          type: 'warning',
          title: 'Client manquant',
          description: 'Sélectionnez un client pour améliorer la personnalisation',
          action: 'Aller à l\'étape 1'
        });
      }

      if (!hasTasks) {
        newRecommendations.push({
          type: 'error',
          title: 'Aucune tâche définie',
          description: 'Ajoutez au moins une tâche pour créer le devis',
          action: 'Aller à l\'étape 2'
        });
      }

      if (!hasDetailedTasks && hasTasks) {
        newRecommendations.push({
          type: 'info',
          title: 'Descriptions trop courtes',
          description: 'Détaillez davantage vos tâches pour rassurer le client',
          action: 'Améliorer les descriptions'
        });
      }

      if (totalPrice > 0 && totalPrice < 100) {
        newRecommendations.push({
          type: 'warning',
          title: 'Prix potentiellement bas',
          description: 'Vérifiez que votre tarification reflète la valeur du travail',
          action: 'Revoir les prix'
        });
      }

      if (totalPrice > 5000) {
        newRecommendations.push({
          type: 'success',
          title: 'Devis de grande valeur',
          description: 'Considérez un appel téléphonique pour accompagner ce devis',
          action: 'Planifier un appel'
        });
      }

      if (signatureProbability >= 80) {
        newRecommendations.push({
          type: 'success',
          title: 'Excellent potentiel',
          description: 'Ce devis a de fortes chances d\'être signé !',
          action: 'Envoyer rapidement'
        });
      }

      setRecommendations(newRecommendations);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-error';
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'success': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Info';
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-primary';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 lg:sticky lg:top-4 lg:top-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
          <Icon name="Sparkles" size={18} className="sm:w-5 sm:h-5 text-primary mr-2" />
          Score IA
        </h3>
        {isAnalyzing && (
          <div className="ai-indicator">
            <Icon name="Loader2" size={14} className="sm:w-4 sm:h-4 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* No Data State */}
      {!selectedClient && tasks.length === 0 && (
        <div className="text-center py-6">
          <Icon name="Sparkles" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Aucune donnée à analyser</p>
          <p className="text-xs text-muted-foreground">
            Commencez par sélectionner un client et définir vos tâches
          </p>
        </div>
      )}

      {/* Scores - Only show when there's data */}
      {(selectedClient || tasks.length > 0) && (
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-foreground">Lisibilité</span>
              <span className={`text-xs sm:text-sm font-bold ${getScoreColor(scores.readability)}`}>
                {scores.readability}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${getScoreBackground(scores.readability)}`}
                style={{ width: `${scores.readability}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-foreground">Taux de suivi</span>
              <span className={`text-xs sm:text-sm font-bold ${getScoreColor(scores.followUpRate)}`}>
                {scores.followUpRate}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${getScoreBackground(scores.followUpRate)}`}
                style={{ width: `${scores.followUpRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-foreground">Niveau d'ouverture</span>
              <span className={`text-xs sm:text-sm font-bold ${getScoreColor(scores.openingLevel)}`}>
                {scores.openingLevel}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${getScoreBackground(scores.openingLevel)}`}
                style={{ width: `${scores.openingLevel}%` }}
              />
            </div>
          </div>

          <div className="border-t border-border pt-2 sm:pt-3">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-sm sm:text-base font-medium text-foreground">Probabilité de signature</span>
              <span className={`text-base sm:text-lg font-bold ${getScoreColor(scores.signatureProbability)}`}>
                {scores.signatureProbability}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 sm:h-3">
              <div 
                className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${getScoreBackground(scores.signatureProbability)}`}
                style={{ width: `${scores.signatureProbability}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm sm:text-base font-medium text-foreground mb-2 sm:mb-3 flex items-center">
            <Icon name="Lightbulb" size={14} className="sm:w-4 sm:h-4 text-primary mr-2" />
            Recommandations
          </h4>
          <div className="space-y-2 sm:space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-2 sm:p-3 bg-muted/50 border border-border rounded-lg">
                <div className="flex items-start space-x-2">
                  <Icon 
                    name={getRecommendationIcon(rec.type)} 
                    size={14} 
                    className={`sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${rec.type === 'info' ? 'text-primary' : `text-${rec.type}`}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    {rec.action && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="mt-1 sm:mt-2 p-0 h-auto text-xs"
                      >
                        {rec.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights - Only show when there's data */}
      {(selectedClient || tasks.length > 0) && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center mb-1 sm:mb-2">
            <Icon name="TrendingUp" size={14} className="sm:w-4 sm:h-4 text-primary mr-2" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Insight IA</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {scores.signatureProbability >= 80 
              ? "Excellent ! Ce devis est optimisé pour la conversion."
              : scores.signatureProbability >= 60
              ? "Bon potentiel. Quelques améliorations peuvent augmenter vos chances." :"Des améliorations sont nécessaires pour optimiser ce devis."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AIScoring;