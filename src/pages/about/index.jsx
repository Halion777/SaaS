import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
const AboutPage = () => {
  const [isVisible, setIsVisible] = useState({});
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const valuesRef = useRef(null);
  const founderRef = useRef(null);
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

    const elements = [heroRef.current, storyRef.current, valuesRef.current, founderRef.current, ctaRef.current];
    elements.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
  
  // Company values
  const getCompanyValues = () => [
    {
      icon: "Zap",
      title: "Simplicité",
      description: "Nous créons des outils simples et intuitifs pour que vous puissiez vous concentrer sur votre métier sans complexité inutile."
    },
    {
      icon: "Settings",
      title: "Automatisation",
      description: "Nous automatisons les tâches répétitives pour vous faire gagner du temps et augmenter votre productivité."
    },
    {
      icon: "Users",
      title: "Accompagnement",
      description: "Nous vous accompagnons à chaque étape avec un support personnalisé et des solutions adaptées à vos besoins."
    },
    {
      icon: "Target",
      title: "Notre mission",
      description: "Notre mission est de devenir la vitamine digitale du bâtiment, en facilitant la gestion quotidienne des artisans."
    }
  ];
  

  
  const companyValues = getCompanyValues();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>À propos - HAVITAM</title>
        <meta name="description" content="Découvrez l'histoire et les valeurs d'HAVITAM, la plateforme innovante pour les artisans du bâtiment." />
        <html lang="fr" />
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
                  <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 animate-fadeIn">
                    <Icon name="Building" size={16} className="mr-2" />
                    À propos de nous • Simplifier le bâtiment
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Havitam, votre{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      partenaire digital
                    </span>{' '}
                    dans le bâtiment
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Des outils simples, rapides et puissants pour automatiser vos devis, factures et paiements – tout en vous concentrant sur votre métier.
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>500+ artisans nous font confiance</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>Support en FR / NL / EN</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link to="/register">
                      <Button variant="default" size="lg" className="bg-[#0036ab] hover:bg-[#0036ab]/90 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        Commencer l'essai gratuit
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline" size="lg" className="border-2 border-gray-200 hover:border-[#0036ab] px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        Nous contacter
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
                         <Icon name="Zap" size={20} className="text-[#12bf23]" />
                         <span className="text-sm font-medium text-gray-700">Rapide</span>
                       </div>
                     </div>
                     
                     <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6">
                       <div className="flex items-center space-x-2">
                         <Icon name="Shield" size={20} className="text-[#0036ab]" />
                         <span className="text-sm font-medium text-gray-700">Qualifié</span>
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
                Notre histoire
                </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez comment HAVITAM est né et comment nous aidons les artisans à réussir
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={`transition-all duration-1000 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                 <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                   <p>
                     L'idée de Havitam est née d'un constat simple : les artisans perdent énormément de temps sur les tâches administratives alors qu'ils devraient pouvoir se concentrer sur leur savoir-faire.
                   </p>
                   <p>
                     Après avoir discuté avec de nombreux indépendants, nous avons réalisé qu'il manquait une solution simple, moderne et intuitive, pensée spécialement pour eux.
                   </p>
                   <p>
                     Le nom HAVITAM vient de HA (les initiales du fondateur) et vitam, en référence à la "vitamine" qui donne un coup de boost à l'activité des artisans.
                   </p>
                   <p>
                     Notre mission est de devenir la vitamine digitale du bâtiment, en facilitant la gestion quotidienne, en réduisant le temps administratif et en augmentant la rentabilité des professionnels du secteur.
                   </p>
                 </div>
              </div>
              <div className={`transition-all duration-1000 delay-300 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden">
                    <img 
                      src="/assets/images/our story.png" 
                      alt="L'histoire de Havitam - Transformation digitale du bâtiment" 
                      className="w-full h-auto object-cover rounded-xl"
                    />
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
                Nos valeurs
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Les principes qui guident nos actions et notre engagement envers la communauté des artisans
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
                Notre Fondateur
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez la vision qui a donné naissance à HAVITAM
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
                    alt="Haitam A." 
                          className="w-full h-full object-cover"
                  />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#12bf23] text-white px-3 py-1 rounded-full text-sm font-medium">
                        Fondateur & CEO
                      </div>
                </div>
              </div>
              <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Haitam A.
                </h3>
                    <p className="text-[#0036ab] font-medium mb-6">
                  Fondateur & CEO
                </p>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                  <p>
                        Haitam A. est passionné par la technologie et l'entrepreneuriat. Après des études en commerce international et plusieurs expériences dans la création d'entreprise, il a été confronté à la complexité de la gestion administrative, des devis, et de la facturation.
                  </p>
                      <p>
                        C'est en discutant avec des amis artisans qu'il a compris que ce problème était largement partagé dans le secteur. Il a donc décidé de créer une solution simple et complète pour répondre à leurs besoins spécifiques.
                  </p>
                      <p>
                        Sans venir du bâtiment, il a su s'entourer, observer, écouter — et bâtir une plateforme utile et efficace. Havitam est née de cette vision : offrir aux artisans les outils numériques qu'ils méritent.
                  </p>
                    </div>
                  </div>
                </div>
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
                Rejoignez la révolution du bâtiment
            </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                Découvrez comment HAVITAM peut transformer votre activité et vous permettre de vous concentrer sur ce que vous faites de mieux.
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
                  <span className="font-medium">Support en FR / NL / EN</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                  <Button variant="default" size="lg" className="bg-white text-[#0036ab] hover:bg-gray-50 px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    Commencer l'essai gratuit
                </Button>
              </Link>
              <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    Parler à un expert
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