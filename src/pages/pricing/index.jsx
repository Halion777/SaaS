import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const PricingPage = () => {
  const { t, language } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Toggle billing cycle
  const toggleBillingCycle = (cycle) => {
    setBillingCycle(cycle);
  };

  // Get plans data with translations
  const getPlans = () => [
    {
      name: t('pricing.plans.starter.name') || "Starter",
      description: t('pricing.plans.starter.description') || "Pour les débutants ou une utilisation à petite échelle",
      price: {
        monthly: "29.99",
        annual: "24.99",
      },
      features: [
        t('pricing.plans.starter.features.quotes') || "Jusqu'à 15 devis par mois",
        t('pricing.plans.starter.features.invoices') || "Jusqu'à 15 factures par mois",
        t('pricing.plans.starter.features.clients') || "Gestion des clients",
        t('pricing.plans.starter.features.templates') || "Modèles professionnels",
        t('pricing.plans.starter.features.support') || "Support par e-mail"
      ],
      limitations: [
        t('pricing.plans.starter.limitations.leads') || "Pas de génération de leads clients",
        t('pricing.plans.starter.limitations.reminders') || "Pas de rappels automatiques",
        t('pricing.plans.starter.limitations.users') || "Pas d'accès multi-utilisateurs",
        t('pricing.plans.starter.limitations.analytics') || "Pas d'analyses avancées"
      ],
      cta: t('pricing.plans.starter.cta') || "Essai gratuit de 14 jours",
      popular: false
    },
    {
      name: t('pricing.plans.pro.name') || "Pro",
      description: t('pricing.plans.pro.description') || "Pour les utilisateurs professionnels ou petites entreprises",
      price: {
        monthly: "49.99",
        annual: "41.66",
      },
      features: [
        t('pricing.plans.pro.features.quotes') || "Devis et factures illimités",
        t('pricing.plans.pro.features.clients') || "Gestion des clients",
        t('pricing.plans.pro.features.templates') || "Modèles professionnels",
        t('pricing.plans.pro.features.leads') || "Génération de leads clients",
        t('pricing.plans.pro.features.reminders') || "Rappels automatiques pour les factures impayées",
        t('pricing.plans.pro.features.users') || "Support multi-utilisateurs",
        t('pricing.plans.pro.features.support') || "Support prioritaire par e-mail et chat",
        t('pricing.plans.pro.features.analytics') || "Outils d'analyse et de rapports avancés"
      ],
      limitations: [],
      cta: t('pricing.plans.pro.cta') || "Essai gratuit de 14 jours",
      popular: true
    }
  ];

  const plans = getPlans();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('pricing.title') || 'Tarifs - HAVITAM'}</title>
        <meta name="description" content={t('pricing.description') || 'Choisissez le plan qui correspond le mieux à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.'} />
      </Helmet>
      <Header />
      
      {/* Main Content */}
      <main>
        {/* Pricing Header */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('pricing.header.title')}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.header.description')}
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-muted p-1 rounded-lg mb-10">
              <button
                className={`px-4 py-2 rounded-md text-sm ${
                  billingCycle === 'monthly'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => toggleBillingCycle('monthly')}
              >
                {t('pricing.billing.monthly')}
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm ${
                  billingCycle === 'annual'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => toggleBillingCycle('annual')}
              >
                {t('pricing.billing.annual')} <span className="text-success text-xs">-17%</span>
              </button>
            </div>
          </div>
        </section>
        
        {/* Pricing Cards */}
        <section className="py-10 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={index}
                  className={`bg-card border ${
                    plan.popular ? 'border-primary' : 'border-border'
                  } rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
                      <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                        {t('pricing.popular')}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-end">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price[billingCycle]}€
                      </span>
                      <span className="text-muted-foreground ml-2 mb-1">/ {t('pricing.billing.period')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('pricing.price.vat')}
                    </p>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-success mt-1">
                        {t('pricing.price.annual')} {(plan.price.annual * 12).toFixed(2)}€
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Icon name="Check" size={18} className="text-success mr-2 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start">
                          <Icon name="X" size={18} className="text-muted-foreground mr-2 mt-0.5" />
                          <span className="text-muted-foreground">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link to="/register" className="w-full">
                    <Button 
                      variant={plan.popular ? "default" : "outline"} 
                      size="lg" 
                      fullWidth
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Additional Details */}
        <section className="py-10 bg-muted">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('pricing.details.title')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Calendar" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('pricing.details.trial.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('pricing.details.trial.description')}
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Check" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('pricing.details.no_commitment.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('pricing.details.no_commitment.description')}
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Shield" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('pricing.details.secure_payment.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('pricing.details.secure_payment.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('pricing.faqs.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('pricing.faqs.description')}
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {/* FAQ Item 1 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('pricing.faqs.change_plan.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('pricing.faqs.change_plan.answer')}
                </p>
              </div>
              
              {/* FAQ Item 2 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('pricing.faqs.trial_period.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('pricing.faqs.trial_period.answer')}
                </p>
              </div>
              
              {/* FAQ Item 3 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('pricing.faqs.payment_methods.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('pricing.faqs.payment_methods.answer')}
                </p>
              </div>
              
              {/* FAQ Item 4 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('pricing.faqs.lead_generation.question')}
                </h3>
                <p className="text-muted-foreground">
                  {t('pricing.faqs.lead_generation.answer')}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t('pricing.cta.title')}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              {t('pricing.cta.description')}
            </p>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                {t('pricing.cta.button')}
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage; 