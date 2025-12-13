import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import { SubscriptionNotificationService } from '../../../services/subscriptionNotificationService';

const StepThree = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load pricing from database
  useEffect(() => {
    const loadPricing = async () => {
      try {
        setLoading(true);
        const result = await SubscriptionNotificationService.getAllPricingData();
        if (result.success && result.data) {
          const plansData = [
    {
      id: 'starter',
              name: result.data.starter?.name || t('registerForm.step3.plans.starter.name'),
      price: {
                monthly: result.data.starter?.monthly?.toString().replace('.', ',') || '0,00',
                yearly: result.data.starter?.yearly?.toString().replace('.', ',') || '0,00'
      },
      period: billingCycle === 'monthly' ? t('registerForm.step3.perMonth') : t('registerForm.step3.perYear'),
              description: result.data.starter?.description || t('registerForm.step3.plans.starter.description'),
      features: (result.data.starter?.features && result.data.starter.features.length > 0)
        ? result.data.starter.features
        : (t('registerForm.step3.plans.starter.features', { returnObjects: true }) || []),
      limitations: (result.data.starter?.limitations && result.data.starter.limitations.length > 0)
        ? result.data.starter.limitations
        : (t('registerForm.step3.plans.starter.limitations', { returnObjects: true }) || []),
              popular: result.data.starter?.popular || false
    },
    {
      id: 'pro',
              name: result.data.pro?.name || t('registerForm.step3.plans.pro.name'),
      price: {
                monthly: result.data.pro?.monthly?.toString().replace('.', ',') || '0,00',
                yearly: result.data.pro?.yearly?.toString().replace('.', ',') || '0,00'
      },
      period: billingCycle === 'monthly' ? t('registerForm.step3.perMonth') : t('registerForm.step3.perYear'),
              description: result.data.pro?.description || t('registerForm.step3.plans.pro.description'),
      features: (result.data.pro?.features && result.data.pro.features.length > 0)
        ? result.data.pro.features
        : (t('registerForm.step3.plans.pro.features', { returnObjects: true }) || []),
      limitations: (result.data.pro?.limitations && result.data.pro.limitations.length > 0)
        ? result.data.pro.limitations
        : (t('registerForm.step3.plans.pro.limitations', { returnObjects: true }) || []),
              popular: result.data.pro?.popular || true
    }
  ];
          setPlans(plansData);
        }
        // Service returns fallback values on error, so we always have data
      } catch (error) {
        console.error('Error loading pricing:', error);
        // Service will return fallback values, so plans will still be set
      } finally {
        setLoading(false);
      }
    };
    loadPricing();
  }, [t]);

  const handlePlanSelect = (planId) => {
    updateFormData('selectedPlan', planId);
    updateFormData('billingCycle', billingCycle);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    updateFormData('billingCycle', cycle);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Unable to load pricing information. Please try again later.</p>
        </div>
      </div>
    );
  }

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
                <span className="text-3xl font-bold text-foreground">
                  €{billingCycle === 'yearly' 
                    ? (parseFloat(plan.price.yearly.replace(',', '.')) * 12).toFixed(2).replace('.', ',')
                    : plan.price[billingCycle]
                  }
                </span>
                <span className="text-muted-foreground ml-1">
                  /{billingCycle === 'yearly' ? t('registerForm.step3.perYear') : plan.period}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('registerForm.step3.equivalentMonthly', 'Equivalent to {{amount}}€/month', { 
                    amount: plan.price.yearly 
                  })}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  {t('registerForm.step3.saveAnnual', { 
                    amount: ((parseFloat(plan.price.monthly.replace(',', '.')) * 12) - (parseFloat(plan.price.yearly.replace(',', '.')) * 12)).toFixed(2).replace('.', ',') 
                  })}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Icon name="Check" size={16} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground flex-1">{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Icon name="X" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">{limitation}</span>
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