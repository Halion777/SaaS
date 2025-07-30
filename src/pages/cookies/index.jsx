import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const CookiesPage = () => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState({
    hero: false,
    content: false
  });

  const heroRef = useRef(null);
  const contentRef = useRef(null);

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

    const refs = [heroRef, contentRef];
    refs.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const cookieTypes = [
    {
      type: 'essential',
      title: t('cookies.types.essential.title'),
      description: t('cookies.types.essential.description'),
      examples: t('cookies.types.essential.examples'),
      color: 'from-red-500 to-red-600'
    },
    {
      type: 'functional',
      title: t('cookies.types.functional.title'),
      description: t('cookies.types.functional.description'),
      examples: t('cookies.types.functional.examples'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      type: 'analytics',
      title: t('cookies.types.analytics.title'),
      description: t('cookies.types.analytics.description'),
      examples: t('cookies.types.analytics.examples'),
      color: 'from-green-500 to-green-600'
    },
    {
      type: 'marketing',
      title: t('cookies.types.marketing.title'),
      description: t('cookies.types.marketing.description'),
      examples: t('cookies.types.marketing.examples'),
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const sections = [
    {
      id: 'what',
      title: t('cookies.sections.what.title'),
      content: t('cookies.sections.what.content')
    },
    {
      id: 'types',
      title: t('cookies.sections.types.title'),
      content: t('cookies.sections.types.content')
    },
    {
      id: 'management',
      title: t('cookies.sections.management.title'),
      content: t('cookies.sections.management.content')
    },
    {
      id: 'thirdparty',
      title: t('cookies.sections.thirdparty.title'),
      content: t('cookies.sections.thirdparty.content')
    },
    {
      id: 'updates',
      title: t('cookies.sections.updates.title'),
      content: t('cookies.sections.updates.content')
    },
    {
      id: 'contact',
      title: t('cookies.sections.contact.title'),
      content: t('cookies.sections.contact.content')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('meta.cookies.title')}</title>
        <meta name="description" content={t('meta.cookies.description')} />
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
                <Icon name="Cookie" size={16} className="mr-2" />
                {t('cookies.hero.badge')}
              </div>
              
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('cookies.hero.title')}
              </h1>
              <p className={`text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('cookies.hero.subtitle')}
              </p>
              
              {/* Last Updated */}
              <div className={`inline-flex items-center text-sm text-gray-500 transition-all duration-1000 delay-500 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="Calendar" size={16} className="mr-2" />
                {t('cookies.hero.lastUpdated')}: {t('cookies.hero.updateDate')}
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Types Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className={`inline-flex items-center bg-[#12bf23]/10 rounded-full px-6 py-3 shadow-lg border border-[#12bf23]/20 mb-6 transition-all duration-1000 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="Grid" size={20} className="text-[#12bf23] mr-2" />
                <span className="text-sm font-medium text-[#12bf23]">{t('cookies.types.badge')}</span>
              </div>
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 transition-all duration-1000 delay-300 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('cookies.types.title')}
              </h2>
              <p className={`text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('cookies.types.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cookieTypes.map((cookieType, index) => (
                <div 
                  key={cookieType.type}
                  className={`bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 transition-all duration-1000 delay-${index * 200} ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${cookieType.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon name="Cookie" size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{cookieType.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{cookieType.description}</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('cookies.types.examples')}:</h4>
                    <p className="text-sm text-gray-600">{cookieType.examples}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section 
          ref={contentRef}
          data-section="content"
          className="py-20 bg-gray-50 relative overflow-hidden"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Table of Contents */}
              <div className={`bg-white rounded-2xl p-8 mb-12 shadow-lg border border-gray-200 transition-all duration-1000 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('cookies.toc.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center text-gray-600 hover:text-[#0036ab] transition-colors p-3 rounded-lg hover:bg-gray-50"
                    >
                      <span className="w-6 h-6 bg-[#0036ab]/10 text-[#0036ab] rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Cookies Content */}
              <div className="space-y-12">
                {sections.map((section, index) => (
                  <div 
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-20 transition-all duration-1000 delay-${index * 100} ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-[#0036ab] to-[#12bf23] text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                          {index + 1}
                        </span>
                        {section.title}
                      </h2>
                      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: section.content }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Section */}
              <div className={`mt-16 bg-gradient-to-br from-[#0036ab]/5 to-[#12bf23]/5 rounded-2xl p-8 text-center transition-all duration-1000 delay-1000 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="MessageCircle" size={48} className="text-[#0036ab] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('cookies.contact.title')}</h3>
                <p className="text-gray-600 mb-6">{t('cookies.contact.description')}</p>
                <Link to="/contact">
                  <button className="bg-[#0036ab] hover:bg-[#0036ab]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    {t('cookies.contact.button')}
                  </button>
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

export default CookiesPage; 