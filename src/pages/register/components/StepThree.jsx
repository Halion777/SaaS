import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from '../../../context/TranslationContext';

const StepThree = ({ formData, updateFormData }) => {
  const { t } = useTranslation();
  
  const plans = [
    {
      id: 'starter',
      name: t('pricing.plans.starter.name') || 'Starter',
      price: '29.99',
      period: t('pricing.billing.period') || 'mois',
      description: t('pricing.plans.starter.description') || 'Parfait pour débuter',
      features: [
        t('pricing.plans.starter.features.quotes') || '15 devis/factures par mois',
        t('pricing.plans.starter.features.templates') || 'Templates de base',
        t('pricing.plans.starter.features.invoices') || 'Suivi des paiements',
        t('pricing.plans.starter.features.support') || 'Support email',
        t('pricing.plans.starter.features.clients') || 'Gestion clients basique'
      ],
      limitations: [
        t('pricing.plans.starter.limitations.leads') || 'IA limitée',
        t('pricing.plans.starter.limitations.reminders') || 'Pas de relances automatiques'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: t('pricing.plans.pro.name') || 'Pro',
      price: '49.99',
      period: t('pricing.billing.period') || 'mois',
      description: t('pricing.plans.pro.description') || 'Solution complète avec IA',
      features: [
        t('pricing.plans.pro.features.quotes') || 'Devis/factures illimités',
        t('register.step3.proFeatures.ai') || 'IA complète et optimisations',
        t('pricing.plans.pro.features.reminders') || 'Relances automatiques',
        t('pricing.plans.pro.features.analytics') || 'Analytics avancés',
        t('pricing.plans.pro.features.templates') || 'Templates premium',
        t('pricing.plans.pro.features.support') || 'Support prioritaire',
        t('register.step3.proFeatures.predictions') || 'Prédictions de signature',
        t('register.step3.proFeatures.optimization') || 'Optimisation des prix'
      ],
      limitations: [],
      popular: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('register.step3.title') || 'Choisissez votre plan'}
        </h2>
        <p className="text-muted-foreground">
          {t('register.step3.subtitle') || 'Commencez avec 14 jours gratuits, sans engagement'}
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
                  {t('pricing.popular') || 'Recommandé'}
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
              {t('register.step3.freeTrial') || 'Essai gratuit de 14 jours'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('register.step3.freeTrialDescription') || 'Testez toutes les fonctionnalités sans engagement. Aucune carte bancaire requise.'}
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
            <span>{t('login.security.secureData') || 'Sécurisé'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Award" size={16} />
            <span>{t('register.step3.certified') || 'Certifié'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThree;