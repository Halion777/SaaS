import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const StepThree = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const plans = [
    {
      id: 'starter',
      name: t('registerForm.step3.plans.starter.name'),
      price: {
        monthly: '29.99',
        yearly: '24.99'
      },
      period: billingCycle === 'monthly' ? t('registerForm.step3.perMonth') : t('registerForm.step3.perYear'),
      description: t('registerForm.step3.plans.starter.description'),
      features: t('registerForm.step3.plans.starter.features', { returnObjects: true }),
      limitations: t('registerForm.step3.plans.starter.limitations', { returnObjects: true }),
      popular: false
    },
    {
      id: 'pro',
      name: t('registerForm.step3.plans.pro.name'),
      price: {
        monthly: '49.99',
        yearly: '41.66'
      },
      period: billingCycle === 'monthly' ? t('registerForm.step3.perMonth') : t('registerForm.step3.perYear'),
      description: t('registerForm.step3.plans.pro.description'),
      features: t('registerForm.step3.plans.pro.features', { returnObjects: true }),
      limitations: t('registerForm.step3.plans.pro.limitations', { returnObjects: true }),
      popular: true
    }
  ];

  const handlePlanSelect = (planId) => {
    updateFormData('selectedPlan', planId);
    updateFormData('billingCycle', billingCycle);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    updateFormData('billingCycle', cycle);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('registerForm.step3.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('registerForm.step3.subtitle')}
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleBillingCycleChange('monthly')}
          >
            {t('pricing.toggle.monthly')}
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleBillingCycleChange('yearly')}
          >
            {t('pricing.toggle.yearly')}
            <span className="ml-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              {t('pricing.toggle.savings')}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 ${
              formData.selectedPlan === plan.id
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
            } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {t('registerForm.step3.recommended')}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-3xl font-bold text-foreground">€{plan.price[billingCycle]}</span>
                <span className="text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  {t('registerForm.step3.saveAnnual', { 
                    amount: ((parseFloat(plan.price.monthly) * 12) - (parseFloat(plan.price.yearly) * 12)).toFixed(2) 
                  })}
                </p>
              )}
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
              {t('registerForm.step3.freeTrial.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('registerForm.step3.freeTrial.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Shield" size={16} />
            <span>{t('registerForm.step3.trustBadges.gdpr')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Lock" size={16} />
            <span>{t('registerForm.step3.trustBadges.secure')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Award" size={16} />
            <span>{t('registerForm.step3.trustBadges.certified')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThree;