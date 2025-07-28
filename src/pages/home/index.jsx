import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TestimonialCarousel from '../../components/TestimonialCarousel';
import { useTranslation } from '../../context/TranslationContext';

const HomePage = () => {
  const { t, language } = useTranslation();
  const [isVisible, setIsVisible] = useState({});
  const [openFAQ, setOpenFAQ] = useState(null);
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Testimonials data
  const testimonials = [
    {
      quote: "HAVITAM a révolutionné ma façon de travailler. Je gagne un temps fou sur l'administratif et je peux me concentrer sur mes chantiers.",
      name: "Jean Dupont",
      profession: "Électricien",
      initials: "JD",
      color: "bg-blue-500"
    },
    {
      quote: "Interface intuitive et support réactif. Je recommande HAVITAM à tous mes collègues artisans.",
      name: "Marie Laurent",
      profession: "Plombière",
      initials: "ML",
      color: "bg-green-500"
    },
    {
      quote: "Depuis que j'utilise HAVITAM, ma facturation est plus rapide et mes clients sont plus satisfaits.",
      name: "Pierre Martin",
      profession: "Peintre",
      initials: "PM",
      color: "bg-purple-500"
    },
    {
      quote: "La gestion des devis est maintenant un jeu d'enfant. HAVITAM m'a fait gagner des heures chaque semaine.",
      name: "Sophie Leroy",
      profession: "Carreleuse",
      initials: "SL",
      color: "bg-orange-500"
    },
    {
      quote: "Support exceptionnel et fonctionnalités parfaitement adaptées aux besoins des artisans.",
      name: "Antoine Dubois",
      profession: "Menuisier",
      initials: "AD",
      color: "bg-teal-500"
    },
    {
      quote: "HAVITAM m'a permis de développer mon activité de 40% en un an grâce à une meilleure organisation.",
      name: "Claire Moreau",
      profession: "Électricienne",
      initials: "CM",
      color: "bg-indigo-500"
    }
  ];
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = [heroRef.current, featuresRef.current, statsRef.current, testimonialsRef.current, ctaRef.current];
    elements.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // FAQ toggle function
  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };
  
  return (
    <>
      <Helmet>
        <title>{t('pageTitles.home')}</title>
        <meta name="description" content="HAVITAM simplifie la gestion administrative des artisans du bâtiment. Créez des devis, envoyez des factures et développez votre clientèle." />
        <meta name="keywords" content="artisan, bâtiment, devis, facture, gestion, électricien, plombier, peintre" />
        <meta property="og:title" content={t('pageTitles.home')} />
        <meta property="og:description" content="Simplifiez votre gestion administrative et développez votre clientèle" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://havitam.com" />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://havitam.com" />
        <html lang={language} />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        {/* Hero Section - Modern Design */}
        <section ref={heroRef} id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 -mt-8 pt-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-[#12bf23]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Content */}
                <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  {/* Badge */}
                  <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 animate-fadeIn whitespace-nowrap">
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    {t('ui.tagline')}
              </div>
              
                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    La solution{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      bâtiment
                    </span>{' '}
                    tout-en-un
              </h1>
              
                  {/* Subtitle */}
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Simplifiez votre gestion administrative, créez des devis professionnels, 
                    suivez vos paiements et développez votre clientèle en un seul endroit.
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Devis & Factures</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Suivi des chantiers</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Comptabilité intégrée</span>
                    </div>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                    <Link to="/quote-creation" className="group">
                      <button className="bg-[#0036ab] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-[#0036ab]/90">
                        <span className="flex items-center justify-center">
                          <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse" />
                          Voir nos projets gratuitement
                        </span>
                  </button>
                </Link>
                
                    <Link to="/register" className="group">
                      <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
                        <span className="flex items-center justify-center">
                          <Icon name="ArrowRight" size={20} className="mr-2 group-hover:translate-x-1 transition-transform" />
                          Commencer l'essai gratuit
                        </span>
                  </button>
                </Link>
              </div>
              
                  {/* Trust Indicators */}
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                      <Icon name="Shield" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>100% Sécurisé</span>
                </div>
                <div className="flex items-center">
                      <Icon name="Users" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#0036ab]" />
                      <span>3,500+ Artisans</span>
                </div>
                <div className="flex items-center">
                      <Icon name="Star" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>4.9/5 Étoiles</span>
                </div>
              </div>
            </div>
                
                {/* Right Column - Image */}
                <div className={`transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="relative">
                    {/* Main Dashboard Image */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <img 
                        src="/assets/images/dashboard 1.png" 
                        alt="HAVITAM Dashboard" 
                        className="w-full h-auto rounded-xl"
                      />
            </div>
            
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6">
                      <div className="flex items-center space-x-2">
                        <Icon name="TrendingUp" size={20} className="text-[#12bf23]" />
                        <span className="text-sm font-medium text-gray-700">+45% CA</span>
                  </div>
              </div>
              
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6">
                      <div className="flex items-center space-x-2">
                        <Icon name="Clock" size={20} className="text-[#0036ab]" />
                        <span className="text-sm font-medium text-gray-700">-60% temps</span>
                  </div>
                </div>
              </div>
                  </div>
                </div>
              </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
                  </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Users" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Notre équipe</span>
                </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Une équipe de plus de 110 personnes pour vous accompagner
              </h2>
              <div className="flex justify-center items-center space-x-8 text-lg text-gray-600">
                <div className="flex items-center">
                  <Icon name="Users" size={20} className="mr-2 text-[#0036ab]" />
                  <span>60 experts produit</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Code" size={20} className="mr-2 text-[#12bf23]" />
                  <span>40 ingénieurs</span>
                </div>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-2xl p-8 relative overflow-hidden border border-[#0036ab]/20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0036ab]/5 to-[#12bf23]/5"></div>
                <div className="relative z-10 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#0036ab] to-[#12bf23] rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
                    <Icon name="Users" size={48} className="text-white" />
                  </div>
                  <p className="text-gray-600 text-lg">
                    Notre équipe dédiée vous accompagne dans votre transformation digitale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Promises Section */}
        <section className="py-20 bg-gray-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Shield" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Nos engagements</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Nos promesses</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="CheckCircle" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  Conforme à vos obligations
                </h3>
                <p className="text-gray-600 text-center">
                  Respect des normes fiscales et réglementaires pour votre tranquillité d'esprit
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="Shield" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  Support 100% français
                </h3>
                <p className="text-gray-600 text-center">
                  Une équipe locale disponible pour vous accompagner dans votre réussite
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} id="features" className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
                </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Settings" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Fonctionnalités</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Une gestion simple et un chiffrage juste
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez nos fonctionnalités conçues spécialement pour les professionnels du bâtiment
              </p>
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Monitor" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Un logiciel ultra intuitif et complet
                </h3>
                <p className="text-gray-600 mb-6">
                  Interface moderne et responsive pour une prise en main immédiate
                </p>
                <button className="text-[#0036ab] font-medium hover:text-[#0036ab]/80 transition-colors">
                  En savoir plus →
                </button>
              </div>
              
              {/* Feature 2 */}
              <div className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-10'}`}>
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="FileText" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Devis et factures automatisés
                </h3>
                <p className="text-gray-600 mb-6">
                  Génération automatique de devis professionnels et suivi des paiements
                </p>
                <button className="text-[#12bf23] font-medium hover:text-[#12bf23]/80 transition-colors">
                  En savoir plus →
                </button>
              </div>
              
              {/* Feature 3 */}
              <div className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-400' : 'opacity-0 translate-y-10'}`}>
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Calculator" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Comptabilité intégrée
                </h3>
                <p className="text-gray-600 mb-6">
                  Gestion comptable simplifiée avec export vers votre expert-comptable
                </p>
                <button className="text-[#0036ab] font-medium hover:text-[#0036ab]/80 transition-colors">
                  En savoir plus →
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Dashboard & Mobile App Preview Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-[#0036ab]/5 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#0036ab]/3 to-[#12bf23]/3 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 mb-6">
                <Icon name="Monitor" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-gray-700">Multi-plateforme</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Gérez votre entreprise où que vous soyez
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Accédez à votre tableau de bord depuis votre ordinateur ou en déplacement avec notre application mobile
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Dashboard Preview */}
              <div className="relative group">
                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 transform rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                  <div className="flex items-center space-x-2">
                    <Icon name="TrendingUp" size={20} className="text-[#12bf23]" />
                    <span className="text-sm font-bold text-gray-700">+45% CA</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                  <div className="flex items-center space-x-2">
                    <Icon name="Users" size={20} className="text-[#0036ab]" />
                    <span className="text-sm font-bold text-gray-700">+2,500 clients</span>
                  </div>
                </div>

                {/* Enhanced Dashboard Frame */}
                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transform group-hover:scale-105 transition-all duration-500">
                  {/* Enhanced Browser Header */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center">
                    <div className="flex space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-4 h-4 bg-[#12bf23] rounded-full shadow-sm"></div>
                    </div>
                    <div className="mx-auto text-sm font-semibold text-gray-700 flex items-center">
                      <Icon name="Globe" size={16} className="mr-2 text-[#0036ab]" />
                      Dashboard HAVITAM
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="Shield" size={16} className="text-[#12bf23]" />
                      <span className="text-xs text-gray-500">Sécurisé</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-4">
                    <img 
                      src="/assets/images/dashboard 2.png" 
                      alt="HAVITAM Dashboard" 
                      className="w-full h-auto rounded-2xl shadow-lg"
                    />
                  </div>
                  
                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0036ab] to-[#12bf23]"></div>
                </div>
              </div>
              
              {/* Mobile App Preview */}
              <div className="flex flex-col items-center">
                {/* Enhanced Phone Frame */}
                <div className="relative mx-auto mb-12 group">
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 transform rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                    <div className="flex items-center space-x-2">
                      <Icon name="Smartphone" size={16} className="text-[#12bf23]" />
                      <span className="text-xs font-bold text-gray-700">App mobile</span>
                      </div>
                    </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                    <div className="flex items-center space-x-2">
                      <Icon name="Zap" size={16} className="text-[#0036ab]" />
                      <span className="text-xs font-bold text-gray-700">Rapide</span>
                  </div>
                </div>
                
                  {/* Modern iPhone-style frame */}
                  <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl phone-frame transform group-hover:scale-105 transition-all duration-500">
                    {/* Enhanced Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-8 bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-3xl z-10 shadow-lg">
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                    </div>
                    
                    {/* Screen */}
                    <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[300px] h-[620px] shadow-inner">
                      {/* Enhanced Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-white z-20 flex items-center justify-between px-8">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                        <div className="text-xs font-bold text-black">9:41</div>
                        <div className="flex items-center space-x-1">
                          <div className="w-5 h-2 bg-black rounded-sm"></div>
                          <div className="w-1 h-2 bg-black rounded-sm"></div>
                        </div>
                      </div>
                      
                      {/* App Content with proper notch handling */}
                      <div className="pt-10 pb-4 px-3 h-full">
                        <img 
                          src="/assets/images/mobile 2.png" 
                          alt="HAVITAM Mobile App" 
                          className="w-full h-full mobile-app-image rounded-2xl"
                        />
                      </div>
                    </div>
                    
                    {/* Enhanced Side Buttons */}
                    <div className="absolute -left-1 top-24 w-1 h-14 bg-gray-700 rounded-l-lg shadow-lg"></div>
                    <div className="absolute -left-1 top-40 w-1 h-10 bg-gray-700 rounded-l-lg shadow-lg"></div>
                    <div className="absolute -right-1 top-36 w-1 h-20 bg-gray-700 rounded-r-lg shadow-lg"></div>
                  </div>
                </div>
                
                {/* Enhanced App Store Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mb-8">
                  {/* Google Play Button - Enhanced Transparent */}
                  <a 
                    href="#" 
                    className="flex items-center justify-center bg-white/90 backdrop-blur-sm text-black border-2 border-gray-200 px-8 py-5 rounded-2xl hover:bg-white hover:border-[#0036ab]/30 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 min-w-[200px] group app-store-button"
                    onClick={(e) => { e.preventDefault(); }}
                  >
                    <div className="flex items-center">
                      <div className="mr-4">
                        <Icon name="Play" size={28} className="text-black group-hover:text-[#0036ab] transition-colors" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-500 font-medium">Télécharger sur</div>
                        <div className="font-bold text-base text-black group-hover:text-[#0036ab] transition-colors">Google Play</div>
                      </div>
                    </div>
                  </a>
                  
                  {/* App Store Button - Enhanced Blue */}
                  <a 
                    href="#" 
                    className="flex items-center justify-center bg-gradient-to-r from-[#0036ab] to-[#0036ab]/90 text-white px-8 py-5 rounded-2xl hover:from-[#0036ab]/90 hover:to-[#0036ab] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 min-w-[200px] group app-store-button"
                    onClick={(e) => { e.preventDefault(); }}
                  >
                    <div className="flex items-center">
                      <div className="mr-4">
                        <Icon name="Apple" size={28} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-blue-100 font-medium">Télécharger sur</div>
                        <div className="font-bold text-base text-white">App Store</div>
                      </div>
                    </div>
                  </a>
                </div>
                
                {/* Enhanced App Features */}
                <div className="text-center">
                  <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="CheckCircle" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">Gratuit</span>
              </div>
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="Shield" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">Sécurisé</span>
                    </div>
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="Zap" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">Rapide</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Boost Turnover Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="TrendingUp" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Développement</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Faites décoller votre chiffre d'affaires
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Boost Feature 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Globe" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Outils pour votre visibilité et e-réputation
                </h3>
                <p className="text-gray-600 mb-6">
                  Développez votre présence en ligne et votre notoriété
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-[#12bf23] font-medium hover:text-[#12bf23]/80 transition-colors">
                    En savoir plus →
                  </button>
                  <span className="bg-[#12bf23]/10 text-[#12bf23] px-2 py-1 rounded-full text-xs font-medium">
                    GRATUIT
                  </span>
                </div>
            </div>
            
              {/* Boost Feature 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="TrendingUp" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Analyse de performance et optimisation
                </h3>
                <p className="text-gray-600 mb-6">
                  Suivez vos métriques et optimisez vos processus
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-[#0036ab] font-medium hover:text-[#0036ab]/80 transition-colors">
                    En savoir plus →
                  </button>
                  <span className="bg-[#0036ab]/10 text-[#0036ab] px-2 py-1 rounded-full text-xs font-medium">
                    PRO
                  </span>
                  </div>
                  </div>
              
              {/* Boost Feature 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Users" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Gestion d'équipe et collaboration
                </h3>
                <p className="text-gray-600 mb-6">
                  Coordonnez vos équipes et améliorez la productivité
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-[#0036ab] font-medium hover:text-[#0036ab]/80 transition-colors">
                    En savoir plus →
                  </button>
                  <span className="bg-[#12bf23]/10 text-[#12bf23] px-2 py-1 rounded-full text-xs font-medium">
                    EN OPTION
                  </span>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} id="stats" className="py-20 bg-[#0036ab] relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/20 rounded-full blur-3xl"></div>
                </div>
          
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/30 mb-6">
                <Icon name="BarChart3" size={20} className="text-white mr-2" />
                <span className="text-sm font-medium text-white">Nos résultats</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                HAVITAM en chiffres
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                Découvrez l'impact de notre plateforme sur le secteur du bâtiment
              </p>
                  </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">3,532</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                  </div>
                <p className="text-white/90 text-lg">Artisans nous font confiance</p>
                </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">120,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
              </div>
                <p className="text-white/90 text-lg">Devis générés</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">30M€</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </div>
                <p className="text-white/90 text-lg">Chiffre d'affaires généré</p>
              </div>
            </div>
          </div>
        </section>

        {/* Craftsman Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
                </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Users" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Nos clients</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Des artisans qui nous font confiance
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez comment nos solutions transforment le quotidien des professionnels du bâtiment
              </p>
                  </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Craftsman 1 */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftsman-working-1.jpg" 
                    alt="Artisan au travail" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Artisan Électricien</h3>
                  <p className="text-gray-600 text-sm mb-4">Installation électrique résidentielle et commerciale</p>
                  <div className="flex items-center text-[#12bf23] text-sm">
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    <span>+40% de productivité</span>
                  </div>
                </div>
              </div>

              {/* Craftsman 2 */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftsman-working-2.jpg" 
                    alt="Artisan au travail" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Plombier Professionnel</h3>
                  <p className="text-gray-600 text-sm mb-4">Installation et maintenance de systèmes sanitaires</p>
                  <div className="flex items-center text-[#12bf23] text-sm">
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    <span>+35% de rentabilité</span>
                  </div>
                </div>
              </div>

              {/* Craftsman 3 */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftsman-working-3.jpg" 
                    alt="Artisan au travail" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Peintre Décorateur</h3>
                  <p className="text-gray-600 text-sm mb-4">Peinture intérieure et extérieure, décoration</p>
                  <div className="flex items-center text-[#12bf23] text-sm">
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    <span>+50% de clients</span>
                  </div>
                </div>
              </div>

              {/* Craftsman 4 */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftsman-workshop.jpg" 
                    alt="Artisan au travail" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Menuisier Artisan</h3>
                  <p className="text-gray-600 text-sm mb-4">Menuiserie sur mesure, agencement</p>
                  <div className="flex items-center text-[#12bf23] text-sm">
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    <span>+45% de CA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section ref={testimonialsRef} id="testimonials" className="py-20 bg-gray-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Star" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Témoignages</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Ce que nos clients disent de nous
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez les retours d'expérience de nos utilisateurs satisfaits
              </p>
            </div>
            
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
          
        {/* CTA Section */}
        <section ref={ctaRef} id="cta" className="py-20 bg-[#0036ab] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Prêt à transformer votre activité ?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                Rejoignez plus de 3,500 artisans qui ont déjà simplifié leur gestion et augmenté leur rentabilité avec HAVITAM
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-white/90">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">14 jours d'essai gratuit</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Shield" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">Sans engagement</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">Configuration en 5 minutes</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Users" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">Support français 7j/7</span>
                </div>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">+45%</div>
                  <div className="text-white/80 text-sm">Augmentation du CA moyen</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">-60%</div>
                  <div className="text-white/80 text-sm">Réduction du temps administratif</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">98%</div>
                  <div className="text-white/80 text-sm">Clients satisfaits</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link to="/register">
                  <button className="bg-white text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-gray-50 group">
                    <span className="flex items-center justify-center">
                      <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse" />
                      Commencer l'essai gratuit
                    </span>
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="bg-transparent text-white border-2 border-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white hover:text-[#0036ab] transition-all duration-300 w-full sm:w-auto group">
                    <span className="flex items-center justify-center">
                      <Icon name="Phone" size={20} className="mr-2" />
                      Parler à un expert
                    </span>
                  </button>
                </Link>
              </div>

              {/* Additional Trust Signals */}
              <div className="text-white/70 text-sm">
                <p>✅ Aucune carte de crédit requise • ✅ Annulation à tout moment • ✅ Données sécurisées</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="HelpCircle" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Questions fréquentes</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Questions fréquentes
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Tout ce que vous devez savoir sur HAVITAM et comment nous pouvons vous aider à développer votre activité
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {/* FAQ Item 1 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(0)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Euro" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Combien coûte HAVITAM ?
                  </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 0 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 0 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          HAVITAM propose plusieurs formules adaptées à vos besoins :
                        </p>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>Gratuit :</strong> Fonctionnalités de base pour commencer</span>
                          </li>
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>Pro (29€/mois) :</strong> Toutes les fonctionnalités + support prioritaire</span>
                          </li>
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>Business (59€/mois) :</strong> Multi-utilisateurs + fonctionnalités avancées</span>
                          </li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                          <strong>Essai gratuit de 14 jours</strong> sans engagement sur toutes nos formules !
                  </p>
                </div>
                    </div>
                  )}
            </div>
            
                {/* FAQ Item 2 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(1)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Clock" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Combien de temps faut-il pour configurer HAVITAM ?
                      </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 1 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 1 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          La configuration de HAVITAM est très simple et rapide :
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-[#0036ab]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#0036ab] mb-2">5 min</div>
                            <div className="text-sm text-gray-600">Création du compte</div>
                          </div>
                          <div className="bg-[#12bf23]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#12bf23] mb-2">10 min</div>
                            <div className="text-sm text-gray-600">Configuration de base</div>
                          </div>
                          <div className="bg-[#0036ab]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#0036ab] mb-2">15 min</div>
                            <div className="text-sm text-gray-600">Premier devis créé</div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          Notre équipe vous accompagne gratuitement pour une prise en main optimale !
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Item 3 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(2)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Shield" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mes données sont-elles sécurisées ?
                      </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 2 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 2 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          La sécurité de vos données est notre priorité absolue :
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <Icon name="Lock" size={20} className="text-[#12bf23] mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Chiffrement SSL</div>
                              <div className="text-sm text-gray-600">Données cryptées en transit</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <Icon name="Database" size={20} className="text-[#0036ab] mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Sauvegarde automatique</div>
                              <div className="text-sm text-gray-600">Sauvegarde quotidienne</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                            <Icon name="Eye" size={20} className="text-purple-600 mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Conformité RGPD</div>
                              <div className="text-sm text-gray-600">Respect de la réglementation</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                            <Icon name="Server" size={20} className="text-orange-600 mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Hébergement français</div>
                              <div className="text-sm text-gray-600">Serveurs en France</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          Vos données sont protégées par les plus hauts standards de sécurité du marché.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Item 4 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(3)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Smartphone" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        L'application mobile est-elle disponible ?
                      </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 3 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 3 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          Oui ! Notre application mobile est disponible sur iOS et Android :
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          <div className="flex-1 bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center mb-3">
                              <Icon name="Apple" size={24} className="text-gray-900 mr-2" />
                              <span className="font-semibold text-gray-900">App Store</span>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Compatible iPhone et iPad
                              </li>
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Synchronisation automatique
                              </li>
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Mode hors ligne disponible
                              </li>
                            </ul>
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center mb-3">
                              <Icon name="Play" size={24} className="text-gray-900 mr-2" />
                              <span className="font-semibold text-gray-900">Google Play</span>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Compatible Android
                              </li>
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Synchronisation automatique
                              </li>
                              <li className="flex items-center">
                                <Icon name="CheckCircle" size={14} className="text-[#12bf23] mr-2" />
                                Mode hors ligne disponible
                              </li>
                            </ul>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          Téléchargez l'application et accédez à toutes vos données depuis votre mobile !
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Item 5 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(4)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Headphones" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Quel support client proposez-vous ?
                      </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 4 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 4 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          Notre équipe support est disponible pour vous accompagner :
                        </p>
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                            <Icon name="MessageCircle" size={24} className="text-[#0036ab] mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">Chat en direct</div>
                              <div className="text-sm text-gray-600">Réponse en moins de 2 minutes</div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-green-50 rounded-xl">
                            <Icon name="Phone" size={24} className="text-[#12bf23] mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">Support téléphonique</div>
                              <div className="text-sm text-gray-600">Lun-Ven 9h-18h (gratuit)</div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-purple-50 rounded-xl">
                            <Icon name="Mail" size={24} className="text-purple-600 mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">Email support</div>
                              <div className="text-sm text-gray-600">Réponse sous 24h</div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-orange-50 rounded-xl">
                            <Icon name="Video" size={24} className="text-orange-600 mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">Formation personnalisée</div>
                              <div className="text-sm text-gray-600">Accompagnement gratuit</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          Notre équipe d'experts est là pour vous aider à tirer le meilleur parti de HAVITAM !
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Item 6 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <button 
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                    onClick={() => toggleFAQ(5)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mr-4">
                        <Icon name="Users" size={20} className="text-[#0036ab]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Puis-je utiliser HAVITAM avec mon équipe ?
                      </h3>
                    </div>
                    <Icon 
                      name={openFAQ === 5 ? "ChevronUp" : "ChevronDown"} 
                      size={24} 
                      className="text-[#0036ab] transition-transform duration-300" 
                    />
                  </button>
                  {openFAQ === 5 && (
                    <div className="px-8 pb-6 animate-fadeIn">
                      <div className="pl-14">
                        <p className="text-gray-600 leading-relaxed mb-4">
                          Absolument ! HAVITAM est conçu pour les équipes :
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div className="bg-gradient-to-br from-[#0036ab]/10 to-[#12bf23]/10 rounded-xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Icon name="UserCheck" size={20} className="text-[#0036ab] mr-2" />
                              Gestion des rôles
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>• Administrateur</li>
                              <li>• Commercial</li>
                              <li>• Comptable</li>
                              <li>• Collaborateur</li>
                            </ul>
                          </div>
                          <div className="bg-gradient-to-br from-[#12bf23]/10 to-[#0036ab]/10 rounded-xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Icon name="Activity" size={20} className="text-[#12bf23] mr-2" />
                              Collaboration en temps réel
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>• Modifications simultanées</li>
                              <li>• Notifications instantanées</li>
                              <li>• Historique des actions</li>
                              <li>• Partage de documents</li>
                            </ul>
                          </div>
                        </div>
                        <div className="bg-[#0036ab]/5 rounded-xl p-4">
                          <p className="text-gray-700 font-medium">
                            <Icon name="Info" size={16} className="text-[#0036ab] mr-2 inline" />
                            La formule Business inclut jusqu'à 10 utilisateurs. Contactez-nous pour plus d'utilisateurs.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact CTA */}
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-[#0036ab]/5 to-[#12bf23]/5 rounded-2xl p-8 border border-[#0036ab]/10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Vous avez d'autres questions ?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Notre équipe d'experts est là pour vous répondre et vous accompagner dans votre transition numérique
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/contact">
                      <button className="bg-[#0036ab] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0036ab]/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span className="flex items-center justify-center">
                          <Icon name="MessageCircle" size={20} className="mr-2" />
                          Contacter le support
                        </span>
                      </button>
                    </Link>
                    <a href="tel:+33123456789">
                      <button className="bg-white text-[#0036ab] border-2 border-[#0036ab] px-8 py-4 rounded-xl font-semibold hover:bg-[#0036ab] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span className="flex items-center justify-center">
                          <Icon name="Phone" size={20} className="mr-2" />
                          Appeler maintenant
                        </span>
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <Footer />
        
        {/* Schema.org JSON-LD for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://havitam.com",
            "logo": "https://havitam.com/assets/images/logo.png",
            "name": "Havitam",
            "description": "La plateforme tout-en-un pour artisans du bâtiment. Créez des devis, envoyez des factures, suivez les paiements et recevez des prospects.",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+33-1-23-45-67-89",
              "contactType": "customer service"
            },
            "sameAs": [
              "https://facebook.com/havitam",
              "https://twitter.com/havitam",
              "https://linkedin.com/company/havitam",
              "https://instagram.com/havitam"
            ]
          }
        `}} />
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        /* Mobile app image positioning */
        .mobile-app-image {
          object-position: center top;
          object-fit: cover;
          border-radius: 1rem;
        }
        
        /* Phone frame improvements */
        .phone-frame {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* App store button hover effects */
        .app-store-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
};

export default HomePage; 