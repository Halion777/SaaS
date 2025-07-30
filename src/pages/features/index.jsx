import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const FeaturesPage = () => {
  const { t, i18n } = useTranslation();
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
      description: t('features.list.feature1.description'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'Clock',
      title: t('features.list.feature2.title'),
      description: t('features.list.feature2.description'),
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'Bell',
      title: t('features.list.feature3.title'),
      description: t('features.list.feature3.description'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'Users',
      title: t('features.list.feature4.title'),
      description: t('features.list.feature4.description'),
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'MapPin',
      title: t('features.list.feature5.title'),
      description: t('features.list.feature5.description'),
      color: 'from-red-500 to-red-600'
    },
    {
      icon: 'Mic',
      title: t('features.list.feature6.title'),
      description: t('features.list.feature6.description'),
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: 'Brain',
      title: t('features.list.feature7.title'),
      description: t('features.list.feature7.description'),
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: 'BarChart3',
      title: t('features.list.feature8.title'),
      description: t('features.list.feature8.description'),
      color: 'from-teal-500 to-teal-600'
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
            <div className="text-center mb-16">
              <div className={`inline-flex items-center bg-[#0036ab]/10 rounded-full px-6 py-3 shadow-lg border border-[#0036ab]/20 mb-6 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="Grid" size={20} className="text-[#0036ab] mr-2" />
                <span className="text-sm font-medium text-[#0036ab]">{t('features.section.badge')}</span>
              </div>
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 transition-all duration-1000 delay-300 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.section.title')}
              </h2>
              <p className={`text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.section.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 transition-all duration-1000 delay-${index * 100} ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon name={feature.icon} size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
            <div className="text-center mb-16">
              <div className={`inline-flex items-center bg-[#12bf23]/10 rounded-full px-6 py-3 shadow-lg border border-[#12bf23]/20 mb-6 transition-all duration-1000 ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="TrendingUp" size={20} className="text-[#12bf23] mr-2" />
                <span className="text-sm font-medium text-[#12bf23]">{t('features.benefits.badge')}</span>
              </div>
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 transition-all duration-1000 delay-300 ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.benefits.title')}
              </h2>
              <p className={`text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.benefits.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 text-center transition-all duration-1000 delay-${index * 200} ${isVisible.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0036ab] to-[#12bf23] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Icon name={benefit.icon} size={32} className="text-white" />
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
          className="py-20 bg-gradient-to-br from-[#0036ab] to-[#12bf23] relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-32 bg-white/20 transform -skew-y-6"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -top-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              <h2 className={`text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.cta.title')}
              </h2>
              <p className={`text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('features.cta.subtitle')}
              </p>
              <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-500 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white text-[#0036ab] border-white shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-white/50 group"
                  >
                    <span className="flex items-center">
                      <Icon name="ArrowRight" size={20} className="mr-2 group-hover:animate-pulse text-[#0036ab]" />
                      {t('features.cta.primaryButton')}
                    </span>
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-transparent text-white border-white shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-white/50"
                  >
                    {t('features.cta.secondaryButton')}
                  </Button>
                </Link>
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