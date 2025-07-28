import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const AboutPage = () => {
  const { t, language } = useTranslation();
  const [isVisible, setIsVisible] = useState({});
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const valuesRef = useRef(null);
  const teamRef = useRef(null);
  const founderRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);
  
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

    const elements = [heroRef.current, storyRef.current, valuesRef.current, teamRef.current, founderRef.current, statsRef.current, ctaRef.current];
    elements.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
  
  // Company values with translations
  const getCompanyValues = () => [
    {
      icon: "Heart",
      title: t('about.values.passion.title') || "Passion",
      description: t('about.values.passion.description') || "Nous sommes passionnés par notre mission d'aider les artisans à réussir et à se concentrer sur leur savoir-faire."
    },
    {
      icon: "Shield",
      title: t('about.values.trust.title') || "Confiance",
      description: t('about.values.trust.description') || "Nous construisons des relations de confiance avec nos utilisateurs en offrant des services fiables et transparents."
    },
    {
      icon: "Star",
      title: t('about.values.excellence.title') || "Excellence",
      description: t('about.values.excellence.description') || "Nous visons l'excellence dans tout ce que nous faisons, en améliorant constamment nos services pour nos utilisateurs."
    },
    {
      icon: "Users",
      title: t('about.values.community.title') || "Communauté",
      description: t('about.values.community.description') || "Nous croyons en la force de la communauté et au soutien mutuel entre artisans pour grandir ensemble."
    }
  ];
  
  // Team members data
  const teamMembers = [
    {
      name: "Marie Dubois",
      role: "Directrice Produit",
      image: "/assets/images/team1_w.jpg",
      expertise: "Gestion de produit & UX"
    },
    {
      name: "Thomas Leroy",
      role: "Lead Développeur",
      image: "/assets/images/team2_w.jpg",
      expertise: "Architecture technique"
    },
    {
      name: "Sophie Martin",
      role: "Responsable Marketing",
      image: "/assets/images/team3_w.jpg",
      expertise: "Stratégie marketing"
    },
    {
      name: "Alexandre Moreau",
      role: "Expert Technique",
      image: "/assets/images/team_4_w.jpg",
      expertise: "Solutions techniques"
    },
    {
      name: "Camille Rousseau",
      role: "Designer Senior",
      image: "/assets/images/team_5.jpg",
      expertise: "Design & Interface"
    },
    {
      name: "Lucas Bernard",
      role: "Chef de Projet",
      image: "/assets/images/team_6.jpg",
      expertise: "Gestion de projet"
    },
    {
      name: "Emma Petit",
      role: "Experte IA",
      image: "/assets/images/team_7.jpg",
      expertise: "Intelligence artificielle"
    },
    {
      name: "Nicolas Durand",
      role: "Responsable Support",
      image: "/assets/images/team_8.jpg",
      expertise: "Support client"
    }
  ];
  
  const companyValues = getCompanyValues();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('pageTitles.about')}</title>
        <meta name="description" content={t('about.metaDescription') || "Découvrez l'histoire et les valeurs d'HAVITAM, la plateforme innovante pour les artisans du bâtiment."} />
        <html lang={language} />
      </Helmet>
      
      <Header />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
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
                  <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn">
                    <Icon name="Building" size={16} className="mr-2" />
                    À propos de nous
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    Notre mission :{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      révolutionner
                    </span>{' '}
                    le bâtiment
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {t('about.hero.description') || "Nous aidons les artisans du bâtiment à se concentrer sur leur savoir-faire en simplifiant leur gestion administrative."}
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                    <div className="flex items-center text-sm text-gray-600">
                      <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                      <span>15 ans d'expérience</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                      <span>3,500+ artisans</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                      <span>Support français</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link to="/register">
                      <Button variant="default" size="lg" className="bg-[#0036ab] hover:bg-[#0036ab]/90 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        {t('about.hero.cta.freeTrial') || "Essai gratuit"}
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline" size="lg" className="border-2 border-gray-200 hover:border-[#0036ab] px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        {t('about.hero.cta.contactUs') || "Nous contacter"}
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Right Column - Image */}
                <div className={`transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="relative">
                    {/* Main Workshop Image */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <img 
                        src="/assets/images/craftsman-workshop.jpg" 
                        alt="Atelier d'artisan HAVITAM" 
                        className="w-full h-auto rounded-xl"
                      />
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6">
                      <div className="flex items-center space-x-2">
                        <Icon name="Users" size={20} className="text-[#12bf23]" />
                        <span className="text-sm font-medium text-gray-700">110+ experts</span>
                      </div>
                    </div>
                    
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6">
                      <div className="flex items-center space-x-2">
                        <Icon name="Award" size={20} className="text-[#0036ab]" />
                        <span className="text-sm font-medium text-gray-700">15 ans exp</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Story */}
        <section ref={storyRef} id="story" className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="BookOpen" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Notre histoire</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.story.title') || "Notre histoire"}
                </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez comment HAVITAM est né et comment nous aidons les artisans à réussir
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={`transition-all duration-1000 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                  <p>
                    {t('about.story.description1') || "HAVITAM est né d'une vision simple : permettre aux artisans du bâtiment de se concentrer sur leur passion et leur expertise technique, plutôt que sur des tâches administratives chronophages."}
                  </p>
                  <p>
                    {t('about.story.description2') || "Fondée par d'anciens artisans qui ont vécu les difficultés du terrain, notre plateforme combine expérience pratique et innovation technologique pour offrir une solution complète et intuitive."}
                  </p>
                  <p>
                    {t('about.story.description3') || "Aujourd'hui, nous accompagnons plus de 3,500 entreprises dans leur transformation digitale, en leur permettant de gagner du temps, d'améliorer leur rentabilité et de développer leur activité."}
                  </p>
                </div>
              </div>
              <div className={`transition-all duration-1000 delay-300 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#0036ab] to-[#12bf23] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                      <Icon name="Building" size={48} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                      Une solution créée par des artisans, pour des artisans
                    </h3>
                    <p className="text-gray-600 text-center">
                      Notre équipe comprend les défis quotidiens du secteur du bâtiment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section ref={valuesRef} id="values" className="py-20 bg-gray-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Heart" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Nos valeurs</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.values.title') || "Nos valeurs"}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('about.values.description') || "Les principes qui guident nos actions et notre engagement envers la communauté des artisans"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyValues.map((value, index) => (
                <div key={index} className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: `${index * 200}ms`}}>
                  <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon name={value.icon} size={32} className="text-[#0036ab]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{value.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section ref={teamRef} id="team" className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.team ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Users" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Notre équipe</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Notre équipe d'experts
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Une équipe de plus de 110 personnes passionnées par l'innovation et dédiées à votre réussite
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.team ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: `${index * 100}ms`}}>
                  <div className="relative mb-4">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-56 object-cover object-top rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-[#0036ab] font-medium text-sm mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.expertise}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Rejoignez notre équipe
                </h3>
                <p className="text-gray-600 mb-6">
                  Nous cherchons constamment des talents passionnés pour nous aider à révolutionner le secteur du bâtiment
                </p>
                <Link to="/contact">
                  <Button variant="default" size="lg" className="bg-[#0036ab] hover:bg-[#0036ab]/90">
                    Voir nos offres d'emploi
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Founder Section */}
        <section ref={founderRef} id="founder" className="py-20 bg-gray-50 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.founder ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="User" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">Notre fondateur</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.founder.title') || "Notre Fondateur"}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('about.founder.subtitle') || "Découvrez la vision qui a donné naissance à HAVITAM"}
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                    <div className="relative">
                      <div className="w-48 h-48 rounded-2xl mx-auto overflow-hidden shadow-xl">
                  <img 
                    src="/assets/images/CEO.jpeg" 
                    alt={t('about.founder.name') || "Pierre Durand"} 
                          className="w-full h-full object-cover"
                  />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#12bf23] text-white px-3 py-1 rounded-full text-sm font-medium">
                        CEO & Fondateur
                      </div>
                </div>
              </div>
              <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('about.founder.name') || "Pierre Durand"}
                </h3>
                    <p className="text-[#0036ab] font-medium mb-6">
                  {t('about.founder.role') || "Fondateur & CEO"}
                </p>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                  <p>
                        {t('about.founder.bio') || "Ancien artisan avec 15 ans d'expérience dans le bâtiment, Pierre a créé HAVITAM pour répondre aux défis quotidiens rencontrés par les professionnels du secteur."}
                  </p>
                      <p>
                    {t('about.founder.vision') || "Sa vision est de permettre aux artisans de se concentrer sur leur cœur de métier tout en bénéficiant d'outils modernes pour développer leur activité et améliorer leur rentabilité."}
                  </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats */}
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
                <p className="text-white/90 text-lg">{t('about.stats.artisans') || "Artisans nous font confiance"}</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">120,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </div>
                <p className="text-white/90 text-lg">{t('about.stats.devis') || "Devis créés"}</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">30M€</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </div>
                <p className="text-white/90 text-lg">{t('about.stats.chiffreAffaires') || "Chiffre d'affaires généré"}</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section ref={ctaRef} id="cta" className="py-20 bg-[#0036ab] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {t('about.cta.title') || "Rejoignez la révolution du bâtiment"}
            </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('about.cta.description') || "Découvrez comment HAVITAM peut transformer votre activité et vous permettre de vous concentrer sur ce que vous faites de mieux."}
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
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                  <Button variant="default" size="lg" className="bg-white text-[#0036ab] hover:bg-gray-50 px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    {t('about.cta.ctaButton') || "Commencer l'essai gratuit"}
                </Button>
              </Link>
              <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    {t('about.cta.contactButton') || "Parler à un expert"}
                </Button>
              </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage; 