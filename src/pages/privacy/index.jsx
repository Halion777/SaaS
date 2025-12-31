import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import contactService from '../../services/contactService';

const PrivacyPage = () => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState({
    hero: false,
    content: false
  });
  const [supportEmail, setSupportEmail] = useState('support@haliqo.com');

  const heroRef = useRef(null);
  const contentRef = useRef(null);

  // Load company email on mount and when language changes
  useEffect(() => {
    const loadCompanyEmail = async () => {
      const result = await contactService.getCompanyDetails(i18n.language);
      if (result.success && result.data?.email) {
        setSupportEmail(result.data.email);
      }
    };
    loadCompanyEmail();
  }, [i18n.language]);

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

  // Helper function to replace email in content
  const replaceEmailInContent = (content) => {
    if (!content) return '';
    // Replace any hardcoded privacy email with the dynamic one from database
    return content.replace(/privacy@[hH]aliqo\.com/gi, supportEmail);
  };

  const sections = [
    {
      id: 'introduction',
      title: t('privacy.sections.introduction.title'),
      content: replaceEmailInContent(t('privacy.sections.introduction.content'))
    },
    {
      id: 'collection',
      title: t('privacy.sections.collection.title'),
      content: replaceEmailInContent(t('privacy.sections.collection.content'))
    },
    {
      id: 'usage',
      title: t('privacy.sections.usage.title'),
      content: replaceEmailInContent(t('privacy.sections.usage.content'))
    },
    {
      id: 'sharing',
      title: t('privacy.sections.sharing.title'),
      content: replaceEmailInContent(t('privacy.sections.sharing.content'))
    },
    {
      id: 'security',
      title: t('privacy.sections.security.title'),
      content: replaceEmailInContent(t('privacy.sections.security.content'))
    },
    {
      id: 'cookies',
      title: t('privacy.sections.cookies.title'),
      content: replaceEmailInContent(t('privacy.sections.cookies.content'))
    },
    {
      id: 'rights',
      title: t('privacy.sections.rights.title'),
      content: replaceEmailInContent(t('privacy.sections.rights.content'))
    },
    {
      id: 'children',
      title: t('privacy.sections.children.title'),
      content: replaceEmailInContent(t('privacy.sections.children.content'))
    },
    {
      id: 'changes',
      title: t('privacy.sections.changes.title'),
      content: replaceEmailInContent(t('privacy.sections.changes.content'))
    },
    {
      id: 'contact',
      title: t('privacy.sections.contact.title'),
      content: replaceEmailInContent(t('privacy.sections.contact.content'))
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('meta.privacy.title')}</title>
        <meta name="description" content={t('meta.privacy.description')} />
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
                <Icon name="Shield" size={16} className="mr-2" />
                {t('privacy.hero.badge')}
              </div>
              
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('privacy.hero.title')}
              </h1>
              <p className={`text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 delay-300 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {t('privacy.hero.subtitle')}
              </p>
              
              {/* Last Updated */}
              <div className={`inline-flex items-center text-sm text-gray-500 transition-all duration-1000 delay-500 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Icon name="Calendar" size={16} className="mr-2" />
                {t('privacy.hero.lastUpdated')}: {t('privacy.hero.updateDate')}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section 
          ref={contentRef}
          data-section="content"
          className="py-20 bg-white relative overflow-hidden"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Table of Contents */}
              <div className={`bg-gray-50 rounded-2xl p-8 mb-12 transition-all duration-1000 ${isVisible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.toc.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center text-gray-600 hover:text-[#0036ab] transition-colors p-3 rounded-lg hover:bg-white"
                    >
                      <span className="w-6 h-6 bg-[#0036ab]/10 text-[#0036ab] rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Privacy Content */}
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.contact.title')}</h3>
                <p className="text-gray-600 mb-6">{t('privacy.contact.description')}</p>
                <Link to="/contact">
                  <button className="bg-[#0036ab] hover:bg-[#0036ab]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    {t('privacy.contact.button')}
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

export default PrivacyPage; 