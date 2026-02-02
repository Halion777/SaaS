import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useBookDemo } from '../../context/BookDemoContext';

const FeaturesPage = () => {
  const { t, i18n } = useTranslation();
  const { openBookDemo } = useBookDemo();
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    benefits: false,
    cta: false
  });

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.dataset.section]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const refs = [heroRef, featuresRef, benefitsRef, ctaRef];
    refs.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: 'FileText',
      title: t('features.list.feature1.title'),
      description: t('features.list.feature1.description')
    },
    {
      icon: 'Clock',
      title: t('features.list.feature2.title'),
      description: t('features.list.feature2.description')
    },
    {
      icon: 'Bell',
      title: t('features.list.feature3.title'),
      description: t('features.list.feature3.description')
    },
    {
      icon: 'Users',
      title: t('features.list.feature4.title'),
      description: t('features.list.feature4.description')
    },
    {
      icon: 'MapPin',
      title: t('features.list.feature5.title'),
      description: t('features.list.feature5.description')
    },
    {
      icon: 'Mic',
      title: t('features.list.feature6.title'),
      description: t('features.list.feature6.description')
    },
    {
      icon: 'Brain',
      title: t('features.list.feature7.title'),
      description: t('features.list.feature7.description')
    },
    {
      icon: 'BarChart3',
      title: t('features.list.feature8.title'),
      description: t('features.list.feature8.description')
    }
  ];

  const benefits = [
    {
      icon: 'TrendingUp',
      title: t('features.benefits.benefit1.title'),
      description: t('features.benefits.benefit1.description'),
      stat: '+45%'
    },
    {
      icon: 'Clock',
      title: t('features.benefits.benefit2.title'),
      description: t('features.benefits.benefit2.description'),
      stat: '-60%'
    },
    {
      icon: 'Smile',
      title: t('features.benefits.benefit3.title'),
      description: t('features.benefits.benefit3.description'),
      stat: '98%'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('meta.features.title')}</title>
        <meta name="description" content={t('meta.features.description')} />
        <html lang={i18n.language} />
      </Helmet>
      
      <Header />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section 
          ref={heroRef}
          data-section="hero"
          className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-[#12bf23]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              {/* Badge */}
              <div className={`inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="Zap" size={16} className="mr-2" />
                {t('features.hero.badge')}
              </div>
              
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.hero.title.prefix')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  {t('features.hero.title.highlight')}
                </span>{' '}
                {t('features.hero.title.suffix')}
              </h1>
              <p className={`text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.hero.subtitle')}
              </p>
              
              {/* Key Benefits */}
              <div className={`flex flex-wrap justify-center gap-4 mb-8 transition-all duration-1000 delay-500 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('features.hero.benefits.simple')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('features.hero.benefits.fast')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('features.hero.benefits.intelligent')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section 
          ref={featuresRef}
          data-section="features"
          className="py-20 bg-white relative overflow-hidden"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6">
                <Icon name="Settings" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">{t('features.section.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('features.section.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('features.section.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${index > 0 ? `delay-${index * 100}` : ''}`}
                >
                  <div className={`w-12 h-12 ${index % 2 === 0 ? 'bg-[#0036ab]/10' : 'bg-[#12bf23]/10'} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon name={feature.icon} size={24} className={index % 2 === 0 ? 'text-[#0036ab]' : 'text-[#12bf23]'} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section 
          ref={benefitsRef}
          data-section="benefits"
          className="py-20 bg-gray-50 relative overflow-hidden"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-[#12bf23]/10 rounded-full px-6 py-3 shadow-lg border border-[#12bf23]/20 mb-6">
                <Icon name="TrendingUp" size={20} className="text-[#12bf23] mr-2" />
                <span className="text-sm font-medium text-[#12bf23]">{t('features.benefits.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('features.benefits.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t('features.benefits.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 text-center ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${index > 0 ? `delay-${index * 200}` : ''}`}
                >
                  <div className={`w-16 h-16 ${index % 2 === 0 ? 'bg-[#0036ab]/10' : 'bg-[#12bf23]/10'} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg`}>
                    <Icon name={benefit.icon} size={32} className={index % 2 === 0 ? 'text-[#0036ab]' : 'text-[#12bf23]'} />
                  </div>
                  <div className="text-4xl font-bold text-[#0036ab] mb-4">{benefit.stat}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          ref={ctaRef}
          data-section="cta"
          className="py-20 bg-[#0036ab] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {t('features.cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('features.cta.subtitle')}
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-white/90">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('features.cta.trust.freeTrial')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Globe" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('features.cta.trust.languages')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2 text-[#12bf23]" />
                  <span className="font-medium">{t('features.cta.trust.setup')}</span>
                </div>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">+45%</div>
                  <div className="text-white/80 text-sm">{t('features.cta.metrics.revenue')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">-60%</div>
                  <div className="text-white/80 text-sm">{t('features.cta.metrics.adminTime')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-white mb-2">98%</div>
                  <div className="text-white/80 text-sm">{t('features.cta.metrics.satisfaction')}</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link to="/register">
                  <button className="bg-white text-[#0036ab] px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-gray-50 group">
                    <span className="flex items-center justify-center">
                      <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse" />
                      {t('features.cta.primaryButton')}
                    </span>
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={openBookDemo}
                  className="bg-[#12bf23] text-white px-10 py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto hover:bg-[#12bf23]/90"
                >
                  <span className="flex items-center justify-center">
                    <Icon name="CalendarCheck" size={20} className="mr-2" />
                    {t('ui.buttons.bookADemo')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FeaturesPage; 