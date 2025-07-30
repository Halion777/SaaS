import React from 'react';
import Icon from '../../../components/AppIcon';

const StepThree = ({ formData, updateFormData }) => {
  
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '29.99',
      period: 'mois',
      description: 'Parfait pour débuter',
      features: [
        '15 devis/factures par mois',
        'Templates de base',
        'Suivi des paiements',
        'Support email',
        'Gestion clients basique'
      ],
      limitations: [
        'IA limitée',
        'Pas de relances automatiques'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '49.99',
      period: 'mois',
      description: 'Solution complète avec IA',
      features: [
        'Devis/factures illimités',
        'IA complète et optimisations',
        'Relances automatiques',
        'Analytics avancés',
        'Templates premium',
        'Support prioritaire',
        'Prédictions de signature',
        'Optimisation des prix'
      ],
      limitations: [],
      popular: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Choisissez votre plan
        </h2>
        <p className="text-muted-foreground">
          Commencez avec 14 jours gratuits, sans engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 ${
              formData.selectedPlan === plan.id
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
            } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => updateFormData('selectedPlan', plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Recommandé
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Icon name="Check" size={16} color="var(--color-success)" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Icon name="X" size={16} color="var(--color-muted-foreground)" />
                  <span className="text-sm text-muted-foreground">{limitation}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.selectedPlan === plan.id
                  ? 'border-primary bg-primary' :'border-muted-foreground'
              }`}>
                {formData.selectedPlan === plan.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Gift" size={20} color="var(--color-accent)" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Essai gratuit de 14 jours
            </h3>
            <p className="text-sm text-muted-foreground">
              Testez toutes les fonctionnalités sans engagement. Aucune carte bancaire requise.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Shield" size={16} />
            <span>GDPR</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Lock" size={16} />
            <span>Sécurisé</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Award" size={16} />
            <span>Certifié</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThree;