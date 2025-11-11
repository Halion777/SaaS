import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TestimonialCarousel from '../../components/TestimonialCarousel';
import appSettingsService from '../../services/appSettingsService';
import contactService from '../../services/contactService';
import { supabase } from '../../services/supabaseClient';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState({});
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showHomeServices, setShowHomeServices] = useState(false); // Default to false (hidden)
  const [companyDetails, setCompanyDetails] = useState({
    phone: '028846333'
  });
  const [mediaSettings, setMediaSettings] = useState({
    home: {
      heroImage: { fr: '', en: '', nl: '' },
      desktopImage: { fr: '', en: '', nl: '' },
      mobileImage: { fr: '', en: '', nl: '' },
      demoVideo: { fr: '', en: '', nl: '' }
    }
  });
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Testimonials data
  const testimonials = [
    {
      quote: t('home.testimonials.testimonial1.quote'),
      name: t('home.testimonials.testimonial1.name'),
      profession: t('home.testimonials.testimonial1.profession'),
      initials: "JD",
      color: "bg-blue-500"
    },
    {
      quote: t('home.testimonials.testimonial2.quote'),
      name: t('home.testimonials.testimonial2.name'),
      profession: t('home.testimonials.testimonial2.profession'),
      initials: "ML",
      color: "bg-green-500"
    },
    {
      quote: t('home.testimonials.testimonial3.quote'),
      name: t('home.testimonials.testimonial3.name'),
      profession: t('home.testimonials.testimonial3.profession'),
      initials: "PM",
      color: "bg-purple-500"
    },
    {
      quote: t('home.testimonials.testimonial4.quote'),
      name: t('home.testimonials.testimonial4.name'),
      profession: t('home.testimonials.testimonial4.profession'),
      initials: "SL",
      color: "bg-orange-500"
    },
    {
      quote: t('home.testimonials.testimonial5.quote'),
      name: t('home.testimonials.testimonial5.name'),
      profession: t('home.testimonials.testimonial5.profession'),
      initials: "AD",
      color: "bg-teal-500"
    },
    {
      quote: t('home.testimonials.testimonial6.quote'),
      name: t('home.testimonials.testimonial6.name'),
      profession: t('home.testimonials.testimonial6.profession'),
      initials: "CM",
      color: "bg-indigo-500"
    }
  ];
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load home page services visibility setting
  useEffect(() => {
    const loadHomeServicesVisibility = async () => {
      try {
        const result = await appSettingsService.getSetting('home_page_services_visibility');
        if (result.success && result.data !== null) {
          setShowHomeServices(result.data.enabled !== false); // Default to true if setting exists but enabled is not explicitly false
        } else {
          // If setting doesn't exist, default to false (hidden)
          setShowHomeServices(false);
        }
      } catch (error) {
        console.error('Error loading home services visibility setting:', error);
        setShowHomeServices(false); // Default to hidden on error
      }
    };
    loadHomeServicesVisibility();
  }, []);

  // Load company details
  useEffect(() => {
    const loadCompanyDetails = async () => {
      const result = await contactService.getCompanyDetails();
      if (result.success && result.data) {
        setCompanyDetails(result.data);
      }
    };
    loadCompanyDetails();
  }, []);

  // Load media settings - reload when language changes
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
          // Handle both old (string) and new (object) formats for backward compatibility
          setMediaSettings({
            home: {
              heroImage: typeof loadedMedia.home?.heroImage === 'object' 
                ? loadedMedia.home.heroImage 
                : { fr: '', en: '', nl: '' },
              desktopImage: typeof loadedMedia.home?.desktopImage === 'object'
                ? loadedMedia.home.desktopImage
                : { fr: '', en: '', nl: '' },
              mobileImage: typeof loadedMedia.home?.mobileImage === 'object'
                ? loadedMedia.home.mobileImage
                : { fr: '', en: '', nl: '' },
              demoVideo: loadedMedia.home?.demoVideo || { fr: '', en: '', nl: '' }
            }
          });
        }
      } catch (error) {
        console.error('Error loading media settings:', error);
      }
    };
    loadMediaSettings();
  }, [i18n.language]); // Reload when language changes

  // Listen for language changes and reload page to ensure all images update
  useEffect(() => {
    const handleLanguageChange = () => {
      // Small delay to ensure state updates, then reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    // Listen to i18n languageChanged event
    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener on unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
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
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="keywords" content={t('meta.keywords')} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="Haliqo" />
        
        {/* Open Graph */}
        <meta property="og:title" content={t('meta.ogTitle')} />
        <meta property="og:description" content={t('meta.ogDescription')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://haliqo.com" />
        <meta property="og:image" content="https://haliqo.com/assets/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={i18n.language === 'fr' ? 'fr_FR' : i18n.language === 'nl' ? 'nl_NL' : 'en_US'} />
        <meta property="og:locale:alternate" content="fr_FR" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="nl_NL" />
        <meta property="og:site_name" content="Haliqo" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('meta.ogTitle')} />
        <meta name="twitter:description" content={t('meta.ogDescription')} />
        <meta name="twitter:image" content="https://haliqo.com/assets/images/og-image.jpg" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://haliqo.com" />
        
        {/* Alternate language versions */}
        <link rel="alternate" hreflang="fr" href="https://haliqo.com/?lang=fr" />
        <link rel="alternate" hreflang="en" href="https://haliqo.com/?lang=en" />
        <link rel="alternate" hreflang="nl" href="https://haliqo.com/?lang=nl" />
        <link rel="alternate" hreflang="x-default" href="https://haliqo.com" />
        
        <html lang={i18n.language} />
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
                    {t('home.hero.badge')}
              </div>
              
                                    {/* Main Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    {t('home.hero.title.prefix')}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                      {t('home.hero.title.highlight')}
                    </span>
                  </h1>
              
                  {/* Subtitle */}
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {t('home.hero.subtitle')}
                  </p>
                  
                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mb-8">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('home.hero.benefits.quotes')}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('home.hero.benefits.clients')}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('home.hero.benefits.payments')}</span>
                    </div>
              </div>
              
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                    <Link to="/register" className="group">
                      <button className="bg-[#0036ab] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-[#0036ab]/90">
                        <span className="flex items-center justify-center">
                          <Icon name="Calendar" size={20} className="mr-2 group-hover:animate-pulse" />
                          {t('ui.buttons.startFreeTrial')}
                        </span>
                  </button>
                </Link>
              </div>
              
                  {/* Trust Indicators */}
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                      <Icon name="Users" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#0036ab]" />
                      <span>{t('home.hero.trust.artisans')}</span>
                </div>
                <div className="flex items-center">
                      <Icon name="Star" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                      <span>{t('home.hero.trust.rating')}</span>
                </div>
                </div>
              </div>
                
                {/* Right Column - Image */}
                <div className={`transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="relative">
                    {/* PEPPOL Logo - Floating Element */}
                    <div className="absolute -top-8 -left-8 bg-white rounded-full shadow-lg p-3 z-20">
                      <img 
                        src="/assets/logo/peppol_logo.png" 
                        alt="PEPPOL Logo" 
                        className="w-20 h-10 object-contain"
                      />
                    </div>
                    
                    {/* Main Dashboard Image - Language-specific */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      {/* Desktop Image - Hidden on mobile */}
                      <img 
                        key={`desktop-${i18n.language}`}
                        src={mediaSettings.home?.desktopImage?.[i18n.language] || mediaSettings.home?.heroImage?.[i18n.language] || '/assets/images/dashboard 1.png'}
                        alt="Haliqo Dashboard" 
                        className="hidden md:block w-full h-auto rounded-xl"
                        onError={(e) => {
                          e.target.src = '/assets/images/dashboard 1.png';
                        }}
                      />
                      {/* Mobile Image - Hidden on desktop */}
                      <img 
                        key={`mobile-${i18n.language}`}
                        src={mediaSettings.home?.mobileImage?.[i18n.language] || mediaSettings.home?.heroImage?.[i18n.language] || '/assets/images/dashboard 1.png'}
                        alt="Haliqo Dashboard Mobile" 
                        className="block md:hidden w-full h-auto rounded-xl"
                        onError={(e) => {
                          e.target.src = '/assets/images/dashboard 1.png';
                        }}
                      />
                      
                      {/* Floating Elements */}
                      <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6">
                        <div className="flex items-center space-x-2">
                          <Icon name="TrendingUp" size={20} className="text-[#12bf23]" />
                          <span className="text-sm font-medium text-gray-700">+45% {t('home.hero.floatingElements.turnover')}</span>
                        </div>
                      </div>
                      
                      <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6">
                        <div className="flex items-center space-x-2">
                          <Icon name="Clock" size={20} className="text-[#0036ab]" />
                          <span className="text-sm font-medium text-gray-700">-60% {t('home.hero.floatingElements.time')}</span>
                        </div>
                      </div>
                    </div>
                    

                    
                    <div className="absolute -bottom-8 -right-8 bg-white rounded-full shadow-lg p-4 transform -rotate-6">
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.demo.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('home.demo.title.prefix')}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  {t('home.demo.title.highlight')}
                </span>
                {t('home.demo.title.suffix')}
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-2xl p-8 relative overflow-hidden border border-[#0036ab]/20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0036ab]/5 to-[#12bf23]/5"></div>
                <div className="relative z-10 text-center">
                  <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
                    {mediaSettings.home?.demoVideo?.[i18n.language] ? (
                      <video
                        key={`video-${i18n.language}`}
                        src={mediaSettings.home.demoVideo[i18n.language]}
                        controls
                        className="w-full aspect-video"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                    <div className={`aspect-video bg-gray-800 flex items-center justify-center ${mediaSettings.home?.demoVideo?.[i18n.language] ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <Icon name="Play" size={64} className="text-white mx-auto mb-4" />
                        <p className="text-white text-lg font-medium">{t('home.demo.video.placeholder')}</p>
                        <p className="text-gray-400 text-sm mt-2">{t('home.demo.video.clickToPlay')}</p>
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.features.badge')}</span>
                </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('home.features.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('home.features.subtitle')}
              </p>
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="MousePointer" size={24} className="text-[#0036ab]" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature1.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature1.description')}
                </p>
                </div>
              
              {/* Feature 2 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Clock" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature2.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature2.description')}
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Bell" size={24} className="text-[#0036ab]" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature3.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature3.description')}
                </p>
                </div>
              
              {/* Feature 4 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Database" size={24} className="text-[#12bf23]" />
              </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature4.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature4.description')}
                </p>
            </div>
            
              {/* Feature 5 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-400' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Users" size={24} className="text-[#0036ab]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature5.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature5.description')}
                </p>
              </div>
              
              {/* Feature 6 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Mic" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature6.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature6.description')}
                </p>
              </div>
              
              {/* Feature 7 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-600' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#0036ab]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="Brain" size={24} className="text-[#0036ab]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature7.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature7.description')}
                </p>
              </div>
              
              {/* Feature 8 */}
              <div className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0 delay-700' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 bg-[#12bf23]/10 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Icon name="TrendingUp" size={24} className="text-[#12bf23]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('home.features.feature8.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('home.features.feature8.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Complementary Services Section */}
        {showHomeServices && (
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.services.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('home.services.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('home.services.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Recouvrement professionnel */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#12bf23]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="Handshake" size={32} className="text-[#12bf23]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('home.services.recovery.title')}
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.description')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet1')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet2')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet3')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet4')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet5')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.recovery.bullet6')}</span>
                  </li>
                </ul>
              </div>
              
              {/* Assurance crédit */}
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-[#0036ab]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Icon name="Shield" size={32} className="text-[#0036ab]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('home.services.insurance.title')}
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.description')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet1')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet2')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet3')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet4')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet5')}</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="text-[#0036ab] mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('home.services.insurance.bullet6')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}
        
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
                <span className="text-sm font-medium text-gray-700">{t('home.mobile.badge')}</span>
              </div>
                              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {t('home.mobile.title')}
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t('home.mobile.subtitle')}
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Dashboard Preview */}
              <div className="relative group">
                {/* Floating Elements for Dashboard */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                  <div className="flex items-center space-x-2">
                    <Icon name="TrendingUp" size={20} className="text-[#12bf23]" />
                    <span className="text-sm font-medium text-gray-700">{t('home.mobile.floatingElements.turnover')}</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                  <div className="flex items-center space-x-2">
                    <Icon name="Users" size={20} className="text-[#0036ab]" />
                    <span className="text-sm font-medium text-gray-700">{t('home.mobile.floatingElements.clients')}</span>
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
                      Dashboard Haliqo
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
                      alt="Haliqo Dashboard" 
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
                      <span className="text-xs font-bold text-gray-700">{t('home.mobile.floatingElements.mobileApp')}</span>
                      </div>
                    </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 z-20">
                    <div className="flex items-center space-x-2">
                      <Icon name="Zap" size={16} className="text-[#0036ab]" />
                      <span className="text-xs font-bold text-gray-700">{t('home.mobile.floatingElements.fast')}</span>
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
                          alt="Haliqo Mobile App" 
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
                        <div className="font-bold text-lg text-white">{t('home.mobile.comingSoon')}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced App Features */}
                <div className="text-center">
                  <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="CheckCircle" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">{t('home.mobile.tags.free')}</span>
              </div>
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="Shield" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">{t('home.mobile.tags.secure')}</span>
                    </div>
                    <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                      <Icon name="Zap" size={18} className="mr-2 text-[#12bf23]" />
                      <span className="font-medium">{t('home.mobile.tags.fast')}</span>
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
                <span className="text-sm font-medium text-white">{t('home.stats.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                {t('home.stats.title')}
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                {t('home.stats.subtitle')}
              </p>
                  </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">500</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                  </div>
                <p className="text-white/90 text-lg">{t('home.stats.artisans')}</p>
                </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">10,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
              </div>
                <p className="text-white/90 text-lg">{t('home.stats.quotes')}</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">4.9</span>
                  <span className="text-yellow-300 text-3xl">★</span>
                </div>
                <p className="text-white/90 text-lg">{t('home.stats.rating')}</p>
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.craftsmen.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                  {t('home.craftsmen.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('home.craftsmen.subtitle')}
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.plumber.title')}</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Wrench" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.plumber.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.plumber.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.mason.title')}</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Building" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.mason.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.mason.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.cleaner.title')}</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Droplets" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.cleaner.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.cleaner.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.energy.title')}</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Zap" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.energy.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.energy.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.painter.title')}</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Palette" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.painter.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.painter.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.carpenter.title')}</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Hammer" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.carpenter.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.carpenter.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.electrician.title')}</h3>
                    <div className="w-10 h-10 bg-[#0036ab]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Zap" size={20} className="text-[#0036ab]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.electrician.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.electrician.benefit')}</span>
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
                    <h3 className="text-lg font-bold text-gray-900">{t('home.craftsmen.others.title')}</h3>
                    <div className="w-10 h-10 bg-[#12bf23]/10 rounded-xl flex items-center justify-center">
                      <Icon name="Tool" size={20} className="text-[#12bf23]" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">
                    {t('home.craftsmen.others.description')}
                  </p>
                  <div className="flex items-center text-[#12bf23] font-semibold text-sm">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    <span>{t('home.craftsmen.others.benefit')}</span>
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.testimonials.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('home.testimonials.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('home.testimonials.subtitle')}
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
                {t('home.cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('home.cta.subtitle')}
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-white/90">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('home.cta.trust.freeTrial')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Globe" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('home.cta.trust.languages')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('home.cta.trust.setup')}</span>
                </div>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">+45%</div>
                  <div className="text-white/80 text-sm">{t('home.cta.metrics.revenue')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">-60%</div>
                  <div className="text-white/80 text-sm">{t('home.cta.metrics.adminTime')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">98%</div>
                  <div className="text-white/80 text-sm">{t('home.cta.metrics.satisfaction')}</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link to="/register">
                  <button className="bg-white text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-gray-50 group">
                    <span className="flex items-center justify-center">
                      <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse" />
                      {t('home.cta.primaryButton')}
                    </span>
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="bg-transparent text-white border-2 border-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white hover:text-[#0036ab] transition-all duration-300 w-full sm:w-auto group">
                    <span className="flex items-center justify-center">
                      <Icon name="Phone" size={20} className="mr-2" />
                      {t('home.cta.secondaryButton')}
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
                <span className="text-sm font-medium text-[#0036ab]">{t('home.faq.badge')}</span>
              </div>
                              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {t('home.faq.title')}
                </h2>
                              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t('home.faq.subtitle')}
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
                        {t('home.faq.pricing.question')}
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
                          {t('home.faq.pricing.intro')}
                        </p>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>{t('home.faq.pricing.starter.title')} :</strong> {t('home.faq.pricing.starter.description')}</span>
                          </li>
                          <li className="flex items-center">
                            <Icon name="CheckCircle" size={16} className="text-[#12bf23] mr-2" />
                            <span><strong>{t('home.faq.pricing.pro.title')} :</strong> {t('home.faq.pricing.pro.description')}</span>
                          </li>
                         
                        </ul>
                        <p className="text-gray-600 mt-4">
                          <strong>{t('home.faq.pricing.trial')}</strong> {t('home.faq.pricing.trialNote')}
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
                        {t('home.faq.setup.question')}
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
                          {t('home.faq.setup.intro')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-[#0036ab]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#0036ab] mb-2">5 min</div>
                            <div className="text-sm text-gray-600">{t('home.faq.setup.accountCreation')}</div>
                          </div>
                          <div className="bg-[#12bf23]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#12bf23] mb-2">10 min</div>
                            <div className="text-sm text-gray-600">{t('home.faq.setup.basicConfig')}</div>
                          </div>
                          <div className="bg-[#0036ab]/5 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#0036ab] mb-2">15 min</div>
                            <div className="text-sm text-gray-600">{t('home.faq.setup.firstQuote')}</div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {t('home.faq.setup.support')}
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
                        {t('home.faq.security.question')}
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
                          {t('home.faq.security.intro')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <Icon name="Lock" size={20} className="text-[#12bf23] mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Chiffrement SSL</div>
                              <div className="text-sm text-gray-600">{t('home.faq.security.encryptedData')}</div>
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
                              <div className="text-sm text-gray-600">{t('home.faq.security.compliance')}</div>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                            <Icon name="Server" size={20} className="text-orange-600 mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">Hébergement sécurisé en Europe</div>
                              <div className="text-sm text-gray-600">{t('home.faq.security.servers')}</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {t('home.faq.security.conclusion')}
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
                        {t('home.faq.mobile.question')}
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
                          {t('home.faq.mobile.intro')}
                        </p>
                        <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-xl p-6 mb-4">
                          <div className="flex items-center mb-3">
                            <Icon name="Clock" size={24} className="text-[#0036ab] mr-3" />
                            <span className="font-semibold text-gray-900">{t('home.faq.mobile.comingSoon')}</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {t('home.faq.mobile.description')}
                          </p>
                        </div>
                        <p className="text-gray-600">
                          {t('home.faq.mobile.browserAccess')}
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
                        {t('home.faq.support.question')}
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
                          {t('home.faq.support.intro')}
                        </p>
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center p-4 bg-green-50 rounded-xl">
                            <Icon name="Phone" size={24} className="text-[#12bf23] mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">{t('home.faq.support.phone.title')}</div>
                              <div className="text-sm text-gray-600">{t('home.faq.support.phone.hours')}</div>
                            </div>
                          </div>
                          <div className="flex items-center p-4 bg-purple-50 rounded-xl">
                            <Icon name="Mail" size={24} className="text-purple-600 mr-4" />
                            <div>
                              <div className="font-semibold text-gray-900">{t('home.faq.support.email.title')}</div>
                              <div className="text-sm text-gray-600">{t('home.faq.support.email.response')}</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {t('home.faq.support.conclusion')}
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
                        {t('home.faq.leads.question')}
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
                          {t('home.faq.leads.answer')}
                        </p>
                        <div className="bg-gradient-to-r from-[#0036ab]/10 to-[#12bf23]/10 rounded-xl p-6 mb-4">
                          <div className="flex items-center mb-3">
                            <Icon name="MapPin" size={20} className="text-[#0036ab] mr-3" />
                            <span className="font-semibold text-gray-900">{t('home.faq.leads.geolocated.title')}</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {t('home.faq.leads.geolocated.description')}
                          </p>
                        </div>
                        <p className="text-gray-600">
                          {t('home.faq.leads.conclusion')}
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
                    {t('home.faq.contact.title')}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    {t('home.faq.contact.subtitle')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/contact">
                      <button className="bg-[#0036ab] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0036ab]/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span className="flex items-center justify-center">
                          <Icon name="MessageCircle" size={20} className="mr-2" />
                          {t('home.faq.contact.supportButton')}
                        </span>
                      </button>
                    </Link>
                    <a href={`tel:${companyDetails.phone || '028846333'}`}>
                      <button className="bg-white text-[#0036ab] border-2 border-[#0036ab] px-8 py-4 rounded-xl font-semibold hover:bg-[#0036ab] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span className="flex items-center justify-center">
                          <Icon name="Phone" size={20} className="mr-2" />
                          {t('home.faq.contact.callButton')}
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "url": "https://haliqo.com",
          "logo": "https://haliqo.com/assets/logo/logo.png",
          "name": "Haliqo",
          "alternateName": "Haliqo - Your Professional Digital Vitamin",
          "description": t('meta.schemaDescription'),
          "foundingDate": "2024",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": companyDetails.phone || "+32-2-884-6333",
            "contactType": "customer service",
            "availableLanguage": ["French", "English", "Dutch"]
          },
          "sameAs": [
            "https://facebook.com/Haliqo",
            "https://twitter.com/Haliqo",
            "https://linkedin.com/company/Haliqo",
            "https://instagram.com/Haliqo"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Brussels",
            "addressCountry": "BE"
          },
          "offers": {
            "@type": "Offer",
            "name": "Haliqo Subscription Plans",
            "description": "Professional construction management platform with free trial",
            "priceCurrency": "EUR"
          }
        })}} />
        
        {/* SoftwareApplication Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Haliqo",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "description": "14-day free trial available"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "500"
          },
          "description": t('meta.schemaDescription')
        })}} />
        
        {/* WebSite Schema with SearchAction */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Haliqo",
          "url": "https://haliqo.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://haliqo.com/find-artisan?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "inLanguage": ["fr", "en", "nl"]
        })}} />
      </div>
      
      {/* Custom CSS for animations */}
      <style>{`
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