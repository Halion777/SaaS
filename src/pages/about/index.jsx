import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const AboutPage = () => {
  const { t, language } = useTranslation();
  
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
        <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {t('about.hero.title')}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-8">
                {t('about.hero.description')}
              </p>
              <div className="flex justify-center space-x-4">
                <Link to="/register">
                  <Button variant="default" size="lg">
                    {t('about.hero.cta.freeTrial')}
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    {t('about.hero.cta.contactUs')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  {t('about.story.title')}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    {t('about.story.description1')}
                  </p>
                  <p>
                    {t('about.story.description2')}
                  </p>
                  <p>
                    {t('about.story.description3')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="/assets/images/craftsman-working-invoice.jpg" 
                  alt={t('about.story.imageAlt')} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('about.values.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('about.values.description')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyValues.map((value, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name={value.icon} size={24} color="var(--color-primary)" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Founder Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('about.founder.title') || "Notre Fondateur"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('about.founder.subtitle') || "Découvrez la vision qui a donné naissance à Havitam"}
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src="/assets/images/CEO.jpeg" 
                    alt={t('about.founder.name') || "Pierre Durand"} 
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t('about.founder.name') || "Pierre Durand"}
                </h3>
                <p className="text-primary font-medium mb-4">
                  {t('about.founder.role') || "Fondateur & CEO"}
                </p>
                <div className="prose prose-lg text-muted-foreground">
                  <p>
                    {t('about.founder.bio') || "Ancien artisan avec 15 ans d'expérience dans le bâtiment, Pierre a créé HAVITAM pour répondre aux défis quotidiens rencontrés par les professionnels du secteur. Après avoir lui-même été confronté aux difficultés administratives et à la gestion complexe des devis et factures, il a décidé de développer une solution simple et efficace pour tous les artisans."}
                  </p>
                  <p className="mt-4">
                    {t('about.founder.vision') || "Sa vision est de permettre aux artisans de se concentrer sur leur cœur de métier tout en bénéficiant d'outils modernes pour développer leur activité et améliorer leur rentabilité."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats */}
        <section className="py-16 bg-gradient-to-br from-blue-700 to-blue-800 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-32 bg-white/20 transform -skew-y-6"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -top-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-full blur-md animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/3 w-8 h-8 bg-cyan-300/30 rounded-full blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <p className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">5,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </p>
                <p className="text-white/90">{t('about.stats.artisans')}</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <p className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">120,000</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </p>
                <p className="text-white/90">{t('about.stats.devis')}</p>
              </div>
              <div className="text-center transform transition-all duration-300 hover:scale-105">
                <p className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
                  <span className="mr-2">30M€</span>
                  <span className="text-yellow-300 animate-pulse">+</span>
                </p>
                <p className="text-white/90">{t('about.stats.chiffreAffaires')}</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t('about.cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('about.cta.description')}
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register">
                <Button variant="default" size="lg">
                  {t('about.cta.ctaButton')}
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  {t('about.cta.contactButton')}
                </Button>
              </Link>
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