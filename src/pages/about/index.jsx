import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase } from '../../services/supabaseClient';

const AboutPage = () => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState({});
  const [mediaSettings, setMediaSettings] = useState({
    about: {
      heroImage: '',
      ourStoryLeft: '',
      ourStoryRight: '',
      ourFounder: '',
      multiPlatformDesktop: { fr: '', en: '', nl: '' },
      multiPlatformMobile: { fr: '', en: '', nl: '' }
    }
  });
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const valuesRef = useRef(null);
  const founderRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Load media settings
  useEffect(() => {
    const loadMediaSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('setting_key', 'media_settings')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading media settings:', error);
        } else if (data && data.setting_value) {
          const loadedMedia = data.setting_value;
          setMediaSettings({
            about: {
              heroImage: loadedMedia.about?.heroImage || '',
              ourStoryLeft: loadedMedia.about?.ourStoryLeft || '',
              ourStoryRight: loadedMedia.about?.ourStoryRight || '',
              ourFounder: loadedMedia.about?.ourFounder || '',
              multiPlatformDesktop: loadedMedia.about?.multiPlatformDesktop || { fr: '', en: '', nl: '' },
              multiPlatformMobile: loadedMedia.about?.multiPlatformMobile || { fr: '', en: '', nl: '' }
            }
          });
        }
      } catch (error) {
        console.error('Error loading media settings:', error);
      }
    };
    loadMediaSettings();
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
      title: t('about.values.simplicity.title'),
      description: t('about.values.simplicity.description')
    },
    {
      icon: "Settings",
      title: t('about.values.automation.title'),
      description: t('about.values.automation.description')
    },
    {
      icon: "Users",
      title: t('about.values.support.title'),
      description: t('about.values.support.description')
    },
    {
      icon: "Target",
      title: t('about.values.mission.title'),
      description: t('about.values.mission.description')
    }
  ];
  

  
  const companyValues = getCompanyValues();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('meta.about.title')}</title>
        <meta name="description" content={t('meta.about.description')} />
        <meta name="keywords" content="about, haliqo, company, story, values, construction management, artisan platform" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={t('meta.about.title')} />
        <meta property="og:description" content={t('meta.about.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://haliqo.com/about`} />
        <meta property="og:image" content="https://haliqo.com/assets/images/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('meta.about.title')} />
        <meta name="twitter:description" content={t('meta.about.description')} />
        
        {/* Canonical */}
        <link rel="canonical" href="https://haliqo.com/about" />
        
        <html lang={i18n.language} />
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
                    {t('about.hero.badge')}
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    {t('about.hero.title.prefix')}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      {t('about.hero.title.highlight')}
                    </span>
                    {t('about.hero.title.suffix')}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {t('about.hero.subtitle')}
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('about.hero.benefits.trust')}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('about.hero.benefits.support')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link to="/register">
                      <Button variant="default" size="lg" className="bg-[#0036ab] hover:bg-[#0036ab]/90 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        {t('ui.buttons.startTrial')}
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline" size="lg" className="border-2 border-gray-200 hover:border-[#0036ab] px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                        {t('ui.buttons.contactUs')}
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Right Column - Image */}
                <div className={`transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="relative">
                    {/* Main Workshop Image */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      {mediaSettings.about?.heroImage ? (
                        <img 
                          src={mediaSettings.about.heroImage} 
                          alt="Atelier d'artisan Haliqo" 
                          className="w-full h-auto rounded-xl"
                          onError={(e) => {
                            e.target.src = '/assets/images/craftsman-workshop.jpg';
                          }}
                        />
                      ) : (
                        <img 
                          src="/assets/images/craftsman-workshop.jpg" 
                          alt="Atelier d'artisan Haliqo" 
                          className="w-full h-auto rounded-xl"
                        />
                      )}
                    </div>
                    
                                         {/* Floating Elements */}
                     <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6">
                       <div className="flex items-center space-x-2">
                         <Icon name="Zap" size={20} className="text-[#12bf23]" />
                         <span className="text-sm font-medium text-gray-700">{t('about.hero.floating.rapid')}</span>
                       </div>
                     </div>
                     
                     <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6">
                       <div className="flex items-center space-x-2">
                         <Icon name="Shield" size={20} className="text-[#0036ab]" />
                         <span className="text-sm font-medium text-gray-700">{t('about.hero.floating.qualified')}</span>
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
                <span className="text-sm font-medium text-[#0036ab]">{t('about.story.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.story.title')}
                </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('about.story.subtitle')}
              </p>
            </div>
            
            {/* First Row: 2 paragraphs on left, image on right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div className={`transition-all duration-1000 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="space-y-8 text-gray-700 leading-relaxed">
                  <div className="relative pl-8 border-l-4 border-[#0036ab] bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-r-xl">
                    <p className="text-lg">
                      {t('about.story.paragraph1')}
                    </p>
                  </div>
                  
                  <div className="relative pl-8 border-l-4 border-[#12bf23] bg-gradient-to-r from-green-50 to-transparent p-6 rounded-r-xl">
                    <p className="text-lg">
                      {t('about.story.paragraph2')}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`transition-all duration-1000 delay-300 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative group">
                  {/* Decorative background elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#0036ab] to-[#12bf23] rounded-full opacity-10 animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-[#12bf23] to-[#0036ab] rounded-full opacity-10 animate-pulse delay-1000"></div>
                  
                  {/* Main image container with tilt effect */}
                  <div className="bg-white rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-200 overflow-hidden transform hover:rotate-2 hover:scale-105 group-hover:rotate-1">
                    <div className="relative overflow-hidden rounded-xl">
                      {mediaSettings.about?.ourStoryRight ? (
                        <img 
                          src={mediaSettings.about.ourStoryRight} 
                          alt="L'histoire de Haliqo - Transformation digitale du bâtiment" 
                          className="w-full h-64 sm:h-80 md:h-96 object-cover object-top rounded-xl transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = '/assets/images/our story 2.png';
                          }}
                        />
                      ) : (
                        <img 
                          src="/assets/images/our story 2.png" 
                          alt="L'histoire de Haliqo - Transformation digitale du bâtiment" 
                          className="w-full h-64 sm:h-80 md:h-96 object-cover object-top rounded-xl transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row: 2 paragraphs on right, image on left */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={`transition-all duration-1000 delay-300 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} order-2 lg:order-1`}>
                <div className="relative group">
                  {/* Decorative background elements */}
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-[#12bf23] to-[#0036ab] rounded-full opacity-10 animate-pulse"></div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#0036ab] to-[#12bf23] rounded-full opacity-10 animate-pulse delay-1000"></div>
                  
                  {/* Main image container with opposite tilt effect */}
                  <div className="bg-white rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-200 overflow-hidden transform hover:-rotate-2 hover:scale-105 group-hover:-rotate-1">
                    <div className="relative overflow-hidden rounded-xl">
                      {mediaSettings.about?.ourStoryLeft ? (
                        <img 
                          src={mediaSettings.about.ourStoryLeft} 
                          alt="L'histoire de Haliqo - Transformation digitale du bâtiment" 
                          className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = '/assets/images/our story.png';
                          }}
                        />
                      ) : (
                        <img 
                          src="/assets/images/our story.png" 
                          alt="L'histoire de Haliqo - Transformation digitale du bâtiment" 
                          className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`transition-all duration-1000 ${isVisible.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} order-1 lg:order-2`}>
                <div className="space-y-8 text-gray-700 leading-relaxed">
                  <div className="relative pl-8 border-l-4 border-[#12bf23] bg-gradient-to-r from-green-50 to-transparent p-6 rounded-r-xl">
                    <p className="text-lg" dangerouslySetInnerHTML={{ __html: t('about.story.paragraph3') }}>
                    </p>
                  </div>
                  
                  <div className="relative pl-8 border-l-4 border-[#0036ab] bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-r-xl shadow-sm">
                    <p className="text-lg" dangerouslySetInnerHTML={{ __html: t('about.story.paragraph4') }}>
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
                <span className="text-sm font-medium text-[#0036ab]">{t('about.values.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.values.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('about.values.subtitle')}
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
                <span className="text-sm font-medium text-[#0036ab]">{t('about.founder.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('about.founder.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('about.founder.subtitle')}
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                    <div className="relative">
                      <div className="w-48 h-48 rounded-2xl mx-auto overflow-hidden shadow-xl">
                  {mediaSettings.about?.ourFounder ? (
                    <img 
                      src={mediaSettings.about.ourFounder} 
                      alt="Haitam A."
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/images/CEO.jpeg';
                      }}
                    />
                  ) : (
                    <img 
                      src="/assets/images/CEO.jpeg" 
                      alt="Haitam A."
                      className="w-full h-full object-cover"
                    />
                  )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#12bf23] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {t('about.founder.role')}
                      </div>
                </div>
              </div>
              <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('about.founder.name')}
                </h3>
                    <p className="text-[#0036ab] font-medium mb-6">
                  {t('about.founder.role')}
                </p>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                  <p>
                        {t('about.founder.bio.paragraph1')}
                  </p>
                      <p>
                        {t('about.founder.bio.paragraph2')}
                  </p>
                      <p>
                        {t('about.founder.bio.paragraph3')}
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
                {t('about.cta.title')}
            </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('about.cta.subtitle')}
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-white/90">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('about.cta.trust.trial')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Shield" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('about.cta.trust.noCommitment')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('about.cta.trust.setup')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Users" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('about.cta.trust.support')}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                  <Button variant="default" size="lg" className="bg-white text-[#0036ab] hover:bg-gray-50 px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    {t('about.cta.primaryButton')}
                </Button>
              </Link>
              <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    {t('about.cta.secondaryButton')}
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