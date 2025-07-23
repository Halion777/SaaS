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
  
  // Team members data with translations
  const getTeamMembers = () => [
    {
      name: t('about.team.member1.name') || "Pierre Durand",
      role: t('about.team.member1.role') || "Fondateur & CEO",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      bio: t('about.team.member1.bio') || "Ancien artisan avec 15 ans d'expérience dans le bâtiment, Pierre a créé HAVITAM pour simplifier le quotidien des artisans."
    },
    {
      name: t('about.team.member2.name') || "Marie Lefevre",
      role: t('about.team.member2.role') || "Directrice Produit",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      bio: t('about.team.member2.bio') || "Expert en UX/UI, Marie travaille à rendre l'application intuitive et adaptée aux besoins spécifiques des artisans."
    },
    {
      name: t('about.team.member3.name') || "Thomas Bernard",
      role: t('about.team.member3.role') || "CTO",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      bio: t('about.team.member3.bio') || "Ingénieur en informatique passionné par les nouvelles technologies, Thomas dirige le développement technique de la plateforme."
    },
    {
      name: t('about.team.member4.name') || "Julie Moreau",
      role: t('about.team.member4.role') || "Responsable Marketing",
      image: "https://randomuser.me/api/portraits/women/17.jpg",
      bio: t('about.team.member4.bio') || "Avec une solide expérience en marketing digital, Julie aide les artisans à se faire connaître et à développer leur activité."
    }
  ];

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
  
  const teamMembers = getTeamMembers();
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
                  src="/public/assets/images/about-story.jpg" 
                  alt={t('about.story.imageAlt')} 
                  className="w-full h-auto"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
                  }}
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
        
        {/* Meet the Team */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('about.team.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('about.team.description')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-80 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = "/assets/images/no_image.png";
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Stats */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">5,000+</p>
                <p className="text-white/80">{t('about.stats.artisans')}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">120,000+</p>
                <p className="text-white/80">{t('about.stats.devis')}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">30M€+</p>
                <p className="text-white/80">{t('about.stats.chiffreAffaires')}</p>
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