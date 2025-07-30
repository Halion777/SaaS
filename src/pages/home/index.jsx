import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TestimonialCarousel from '../../components/TestimonialCarousel';
const HomePage = () => {
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
        <title>HAVITAM - Votre vitamine digitale professionnelle</title>
        <meta name="description" content="HAVITAM simplifie la gestion administrative des artisans du bâtiment. Créez des devis, envoyez des factures et développez votre clientèle." />
        <meta name="keywords" content="artisan, bâtiment, devis, facture, gestion, électricien, plombier, peintre" />
        <meta property="og:title" content="HAVITAM - Votre vitamine digitale professionnelle" />
        <meta property="og:description" content="Simplifiez votre gestion administrative et développez votre clientèle" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://havitam.com" />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://havitam.com" />
        <html lang="fr" />
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
                    Havitam - Votre vitamine digitale professionnelle
              </div>
              
                                    {/* Main Headline */}
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    La solution tout-en-un pour les{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      pros du bâtiment
                    </span>
              </h1>
              
                  {/* Subtitle */}
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Gagnez du temps, envoyez vos devis, factures et suivez vos paiements – sans stress.
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Devis & Factures</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Gestion clients</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Paiements automatisés</span>
                    </div>
              </div>
              
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                    <Link to="/register" className="group">
                      <button className="bg-[#0036ab] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-[#0036ab]/90">
                        <span className="flex items-center justify-center">
                          <Icon name="Calendar" size={20} className="mr-2 group-hover:animate-pulse" />
                          Essai gratuit – 14 jours
                        </span>
                  </button>
                </Link>
              </div>
              
                  {/* Trust Indicators */}
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                      <Icon name="Users" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#0036ab]" />
                      <span>500+ Artisans</span>
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
                    {/* PEPPOL Logo - Floating Element */}
                    <div className="absolute -top-8 -left-8 bg-white rounded-full shadow-lg p-3 z-20 animate-pulse">
                      <img 
                        src="/assets/logo/peppol_logo.png" 
                        alt="PEPPOL Logo" 
                        className="w-20 h-10 object-contain"
                      />
                    </div>
                    
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
                    
                    <div className="absolute -bottom-8 -right-8 bg-white rounded-full shadow-lg p-4 transform -rotate-6 animate-pulse">
                      <div className="flex items-center space-x-2">
                        <Icon name="Brain" size={20} className="text-[#12bf23]" />
                        <span className="text-sm font-medium text-gray-700">AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Demo Video Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Play" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Demo Rapide</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Apprenez avec cette{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  demo
                </span>{' '}
                rapide comment utiliser notre système
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-2xl p-8 relative overflow-hidden border border-[#0036ab]/20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0036ab]/5 to-[#12bf23]/5"></div>
                <div className="relative z-10 text-center">
                  <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="Play" size={64} className="text-white mx-auto mb-4" />
                        <p className="text-white text-lg font-medium">VIDEO</p>
                        <p className="text-gray-400 text-sm mt-2">Cliquez pour lancer la démo</p>
                  </div>
                </div>
              </div>
                </div>
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
                Les 8 fonctionnalités clés de Havitam
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Boostez votre business avec des outils simples, rapides et intelligents
              </p>
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="MousePointer" size={24} className="text-[#0036ab]" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Devis & factures en 1 clic
                </h3>
                <p className="text-gray-600 text-sm">
                  Créez vos devis et factures en quelques secondes grâce à une interface ultra-intuitive. Personnalisation rapide incluse.
                </p>
                </div>
              
              {/* Feature 2 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Clock" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Suivi en temps réel & signature instantanée
                </h3>
                <p className="text-gray-600 text-sm">
                  Suivez les statuts de vos devis, envoyez-les et faites-les signer en ligne. Même chose pour vos factures : envoyées, vues, payées — tout est tracé.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Bell" size={24} className="text-[#0036ab]" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Rappels automatiques de paiement
                </h3>
                <p className="text-gray-600 text-sm">
                  Réduisez les retards : envoyez des rappels automatisés avant et après la date d'échéance. Moins de stress, plus de cash-flow.
                </p>
                </div>
              
              {/* Feature 4 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Database" size={24} className="text-[#12bf23]" />
              </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Gestion centralisée des clients & documents
                </h3>
                <p className="text-gray-600 text-sm">
                  Toutes vos données (clients, devis, factures, paiements) sont organisées et accessibles depuis un seul tableau de bord.
                </p>
            </div>
            
              {/* Feature 5 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-400' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Users" size={24} className="text-[#0036ab]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Réception de leads qualifiés automatiquement
                </h3>
                <p className="text-gray-600 text-sm">
                  Recevez des demandes de projets dans votre zone géographique selon vos spécialités. Répondez avec un devis en 1 clic, ou passez au suivant.
                </p>
              </div>
              
              {/* Feature 6 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Mic" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Devis dictés à la voix (Nouveau)
                </h3>
                <p className="text-gray-600 text-sm">
                  Gagnez un temps fou en dictant vos devis à la voix. Notre assistant vocal les rédige pour vous, instantanément.
                </p>
              </div>
              
              {/* Feature 7 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-600' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Brain" size={24} className="text-[#0036ab]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Tarification intelligente par IA (Bêta)
                </h3>
                <p className="text-gray-600 text-sm">
                  Une IA vous aide à estimer vos tarifs selon le marché, vos précédents devis, et le type de client. Plus de précision, plus de conversions.
                </p>
              </div>
              
              {/* Feature 8 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-700' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="TrendingUp" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Analyse de devis & recommandations IA (Bêta)
                </h3>
                <p className="text-gray-600 text-sm">
                  Recevez un feedback automatique sur chaque devis : trop cher ? trop long ? incomplet ? L'IA vous guide pour l'optimiser avant l'envoi.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Complementary Services Section */}
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
                <span className="text-sm font-medium text-[#0036ab]">Services complémentaires</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Recouvrement & Assurance crédit
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Sécurisez vos revenus, concentrez-vous sur votre métier
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Recouvrement professionnel */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="Handshake" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Recouvrement professionnel – 0€ sans résultat
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Uniquement pour vos clients B2B</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>En cas de facture impayée, nous lançons les démarches à votre place</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Procédures amiables et juridiques gérées par nos partenaires spécialisés</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>100% gratuit tant qu'aucune somme n'est récupérée</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Commission à partir de 4% sur le montant recouvré</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Notification automatique dès qu'un retard est détecté</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Vous restez concentré sur vos chantiers, on s'occupe du reste</span>
                  </li>
                </ul>
              </div>
              
              {/* Assurance crédit */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="Shield" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Assurance crédit – Factures B2B garanties
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Service proposé via notre partenaire certifié</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Évaluation de la solvabilité du client B2B avant validation du devis</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Activez la garantie en un clic depuis votre tableau de bord</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>En cas d'impayé, jusqu'à 90% de la facture couverte</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Système intelligent qui alerte sur les clients à risque</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Suivi des garanties, remboursements et risques en temps réel</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>Simple, rapide, sans paperasse</span>
                  </li>
                </ul>
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
                
                {/* Coming Soon Badge */}
                <div className="flex flex-col items-center w-full max-w-md mb-8">
                  {/* Coming Soon Badge */}
                  <div className="flex items-center justify-center bg-gradient-to-r from-[#0036ab] to-[#12bf23] text-white px-8 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[200px] group">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Icon name="Clock" size={24} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-blue-100">Application mobile</div>
                        <div className="font-bold text-lg text-white">Bientôt disponible</div>
                      </div>
                    </div>
                  </div>
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
                <span className="text-sm font-medium text-white">Nos chiffres</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                HAVITAM vise à accompagner
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                Découvrez notre ambition pour transformer le secteur du bâtiment
              </p>
                  </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">500</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                  </div>
                <p className="text-white/90 text-lg">Artisans</p>
                </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">10,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
              </div>
                <p className="text-white/90 text-lg">Devis créés</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">4.9</span>
                  <span className="text-yellow-300 text-3xl">★</span>
                </div>
                <p className="text-white/90 text-lg">Stars</p>
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
                Profils métiers
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez comment HAVITAM accompagne les professionnels du bâtiment dans leur développement
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Plombier */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/plumber.jpg" 
                    alt="Plombier en action" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Plombier</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Wrench" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Installation, dépannage & maintenance sanitaire
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+35% de rentabilité</span>
                  </div>
                </div>
              </div>

              {/* Maçon */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/mason.jpg" 
                    alt="Maçon posant des briques" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Maçon</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Building" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Construction, rénovation, fondations
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+40% d'efficacité</span>
                  </div>
                </div>
              </div>
              
              {/* Nettoyeur professionnel */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/Cleaner.jpg" 
                    alt="Nettoyeur avec équipement industriel" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Nettoyeur</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Droplets" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Entretien de chantiers, nettoyage fin de travaux
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+50% de clients satisfaits</span>
                  </div>
                </div>
              </div>

              {/* Installateur en énergies */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/Solar fit.jpg" 
                    alt="Pose de panneaux solaires" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Installateur énergies</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Zap" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Énergies renouvelables, panneaux photovoltaïques
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+45% de CA</span>
                  </div>
                </div>
              </div>
              
              {/* Peintre décorateur */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/Painter.jpg" 
                    alt="Peintre appliquant une couche murale" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Peintre décorateur</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Palette" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Intérieur, extérieur, finition, décoration
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+50% de visibilité client</span>
                  </div>
                  </div>
                </div>

              {/* Menuisier */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/Carpenter.jpg" 
                    alt="Menuisier utilisant une scie circulaire" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Menuisier</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Hammer" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Création sur mesure, agencement & mobilier
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+40% de productivité</span>
                  </div>
                </div>
              </div>

              {/* Électricien */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/Electrician.jpg" 
                    alt="Électricien en train d'installer un tableau" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Électricien</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Zap" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Installation résidentielle & commerciale
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>+45% d'optimisation du temps</span>
                  </div>
                </div>
              </div>

              {/* Autres métiers du bâtiment */}
              <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src="/assets/images/craftman/multi tools.png" 
                    alt="Artisan générique multi-outil" 
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Autres métiers</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Tool" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    Sélectionnez cette option si votre activité ne figure pas ci-dessus
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>Havitam s'adapte à toutes les spécialités</span>
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
                Prêt à booster votre activité ?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                Rejoignez 500+ artisans qui ont automatisé leur gestion et augmenté leur rentabilité.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-white/90">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">Essai gratuit 14 jours</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Globe" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">FR, NL, EN</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">Configuration en 5 minutes</span>
                </div>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">+45%</div>
                  <div className="text-white/80 text-sm">CA moyen</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">-60%</div>
                  <div className="text-white/80 text-sm">Temps admin</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">98%</div>
                  <div className="text-white/80 text-sm">Satisfaction</div>
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
                            <span><strong>Starter (19€/mois) :</strong> Fonctionnalités essentielles pour débuter</span>
                          </li>
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>Pro (39€/mois) :</strong> Fonctionnalités avancées + support prioritaire</span>
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
                          Notre application mobile arrive bientôt ! Elle sera disponible sur iOS et Android.
                        </p>
                        <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-xl p-6 mb-4">
                          <div className="flex items-center mb-3">
                            <Icon name="Clock" size={24} className="text-[#0036ab] mr-3" />
                            <span className="font-semibold text-gray-900">Bientôt disponible</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Nous travaillons actuellement sur l'application mobile pour vous offrir une expérience optimale sur mobile. Soyez notifié dès sa sortie !
                          </p>
                        </div>
                        <p className="text-gray-600">
                          En attendant, vous pouvez accéder à HAVITAM depuis votre navigateur mobile.
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
                        </div>
                        <p className="text-gray-600">
                          Notre équipe d'experts est là pour vous aider à tirer le meilleur parti de HAVITAM !
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ Item 6 - Leads */}
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
                        Puis-je recevoir des leads qualifiés automatiquement ?
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
                          Oui, si vous activez la fonctionnalité "recevoir des demandes", vous recevrez des projets clients proches de chez vous.
                        </p>
                        <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-xl p-6 mb-4">
                          <div className="flex items-center mb-3">
                            <Icon name="MapPin" size={20} className="text-[#0036ab] mr-3" />
                            <span className="font-semibold text-gray-900">Leads géolocalisés</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Recevez automatiquement les demandes de projets dans votre zone géographique selon vos spécialités.
                          </p>
                        </div>
                        <p className="text-gray-600">
                          Répondez avec un devis en 1 clic, ou passez au suivant selon vos disponibilités.
                        </p>
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