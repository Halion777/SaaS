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
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-[#12bf23]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn">
                <Icon name="Euro" size={16} className="mr-2" />
                Nos tarifs
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Des tarifs{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  transparents
                </span>{' '}
                et adaptés
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                {t('pricing.header.description') || 'Choisissez le plan qui correspond le mieux à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.'}
              </p>
              
              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>14 jours d'essai gratuit</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>Annulation à tout moment</span>
                </div>
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-gray-200 w-80 relative">
                {/* Animated Background Slider */}
                <div 
                  className={`absolute top-1 bottom-1 rounded-lg transition-all duration-500 ease-in-out ${
                    billingCycle === 'monthly' 
                      ? 'left-1 w-[calc(50%-4px)] bg-[#0036ab]' 
                      : 'left-[calc(50%+2px)] w-[calc(50%-4px)] bg-[#0036ab]'
                  }`}
                ></div>
                
                <button
                  className={`relative flex-1 px-8 py-2 rounded-lg text-sm font-medium transition-all duration-500 ease-in-out z-10 ${
                    billingCycle === 'monthly'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-[#0036ab]'
                  }`}
                  onClick={() => toggleBillingCycle('monthly')}
                >
                  {t('pricing.billing.monthly') || 'Mensuel'}
                </button>
                <button
                  className={`relative flex-1 px-8 py-2 rounded-lg text-sm font-medium transition-all duration-500 ease-in-out z-10 ${
                    billingCycle === 'annual'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-[#0036ab]'
                  }`}
                  onClick={() => toggleBillingCycle('annual')}
                >
                  {t('pricing.billing.annual') || 'Annuel'} 
                  <span className="ml-2 bg-[#0036ab] text-white px-2 py-1 rounded-full text-xs">-20%</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Cards */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={index}
                  className={`bg-white border-2 ${
                    plan.popular ? 'border-[#0036ab] shadow-2xl' : 'border-gray-200 shadow-xl'
                  } rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative transform hover:-translate-y-2`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
                      <span className="bg-[#0036ab] text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                        {t('pricing.popular') || 'Le plus populaire'}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">{plan.description}</p>
                  
                  <div className="mb-8">
                    <div className="flex items-end">
                      <span className="text-5xl font-bold text-gray-900">
                        {plan.price[billingCycle]}€
                      </span>
                      <span className="text-gray-600 ml-2 mb-2">/ {billingCycle === 'monthly' ? 'mois' : 'mois'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('pricing.price.vat') || 'HT, TVA applicable'}
                    </p>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-[#12bf23] font-medium mt-2">
                        Économisez {((plan.price.monthly * 12) - (plan.price.annual * 12)).toFixed(2)}€ par an
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Icon name="Check" size={20} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start">
                          <Icon name="X" size={20} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link to="/register" className="w-full">
                    <Button 
                      className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-[#0036ab] hover:bg-[#0036ab]/90 text-white' 
                          : 'bg-white border-2 border-[#0036ab] text-[#0036ab] hover:bg-[#0036ab] hover:text-white'
                      }`}
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
        <section className="py-20 bg-gray-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Shield" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Garanties</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('pricing.details.title') || 'Pourquoi choisir HAVITAM ?'}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Nous vous offrons la tranquillité d'esprit avec nos garanties et notre support
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6">
                  <Icon name="Calendar" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pricing.details.trial.title') || 'Essai gratuit'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pricing.details.trial.description') || 'Testez HAVITAM gratuitement pendant 14 jours sans engagement'}
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6">
                  <Icon name="Check" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pricing.details.no_commitment.title') || 'Sans engagement'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pricing.details.no_commitment.description') || 'Annulez à tout moment, sans frais cachés ni pénalités'}
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6">
                  <Icon name="Shield" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pricing.details.secure_payment.title') || 'Paiement sécurisé'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pricing.details.secure_payment.description') || 'Vos informations de paiement sont traitées en toute sécurité'}
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
        <section className="py-16 bg-gradient-to-br from-blue-700 to-blue-800 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-32 bg-white/20 transform -skew-y-6"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -top-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-full blur-md animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/3 w-8 h-8 bg-cyan-300/30 rounded-full blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                {t('pricing.cta.title')}
              </h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('pricing.cta.description')}
              </p>
              <Link to="/register">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-white text-blue-800 border-white shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-blue-900/50 group"
                >
                  <span className="flex items-center">
                    <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse text-blue-600" />
                    {t('pricing.cta.button')}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage; 