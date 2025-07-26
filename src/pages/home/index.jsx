import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import LanguageDropdown from '../../components/LanguageDropdown';
import { useTranslation } from '../../context/TranslationContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const HomePage = () => {
  const { t, language } = useTranslation();
  const [showNotification, setShowNotification] = useState(true);
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <>
      <Helmet>
        <title>{t('pageTitles.home')}</title>
        <meta name="description" content="HAVITAM simplifie la gestion administrative des artisans du bâtiment. Créez des devis, envoyez des factures et développez votre clientèle." />
        <meta name="keywords" content="artisan, bâtiment, devis, facture, gestion, électricien, plombier, peintre" />
        <meta property="og:title" content={t('pageTitles.home')} />
        <meta property="og:description" content="Simplifiez votre gestion administrative et développez votre clientèle" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://havitam.com" />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://havitam.com" />
        <html lang={language} />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        {/* Notification Banner */}
        {showNotification && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 relative">
            <div className="container mx-auto flex items-center justify-center text-center">
              <Icon name="CheckCircle" size={20} className="mr-3 text-white" />
              <span className="font-medium">
                ✅ {t('home.notification.peppolMessage')}
              </span>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowNotification(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              aria-label="Close notification"
            >
              <Icon name="X" size={16} className="text-white" />
            </button>
          </div>
        )}
        
        {/* Hero Section - Redesigned with enhanced UI but original colors */}
        <section className="py-28 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute top-[30%] right-[15%] w-96 h-96 rounded-full bg-accent/5 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Tagline in pill design */}
              <div className="inline-flex mb-6 bg-[#0f172a] text-white px-6 py-2.5 rounded-full items-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Icon name="Sparkles" size={20} className="mr-2 text-amber-400 animate-pulse" />
                <span className="font-medium">{t('ui.tagline')}</span>
              </div>
              
              {/* Title with highlighted word */}
              <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-8 leading-tight tracking-tight">
                {t('heroTitle.prefix')}
                <span className="text-blue-600">{t('heroTitle.highlight')}</span>
                {t('heroTitle.suffix') || ''}
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground mb-14 leading-relaxed max-w-3xl mx-auto">
                {t('home.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-14">
                {/* Primary action button - original dark color */}
                <Link to="/quote-creation" className="w-full sm:w-auto group">
                  <button className="flex items-center justify-center bg-[#0f172a] text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-[#1e293b] hover:translate-y-[-2px] transition-all duration-300 w-full sm:w-auto">
                    <Icon name="Sparkles" size={22} className="mr-3 group-hover:animate-pulse" />
                    {t('ui.buttons.createQuote')}
                  </button>
                </Link>
                
                {/* Secondary button - original white background */}
                <Link to="/register" className="w-full sm:w-auto group">
                  <button className="flex items-center justify-center bg-white text-[#0f172a] py-4 px-8 rounded-xl font-semibold text-lg border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 hover:translate-y-[-2px] transition-all duration-300 w-full sm:w-auto">
                    <Icon name="Zap" size={22} className="mr-3 text-[#0f172a] group-hover:scale-110 transition-transform" />
                    {t('ui.buttons.startTrial')}
                  </button>
                </Link>
              </div>
              
              {/* Third button - original subtle style */}
              <div className="mb-16">
                <Link to="/find-artisan" className="group">
                  <button className="flex items-center justify-center mx-auto bg-[#f8fafc] text-[#0f172a] py-3.5 px-7 rounded-xl font-medium border border-gray-100 hover:bg-gray-50 transition-all duration-300 group-hover:translate-y-[-1px]">
                    <Icon name="Users" size={20} className="mr-2" />
                    {t('ui.buttons.getClients')}
                    <Icon name="ArrowRight" size={18} className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </button>
                </Link>
              </div>
              
              {/* Benefits list with original styling */}
              <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-5 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={18} className="mr-2 text-success" />
                  <span className="font-medium">{t('ui.benefits.freeTrial')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={18} className="mr-2 text-success" />
                  <span className="font-medium">{t('ui.benefits.noCommitment')}</span>
                </div>
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={18} className="mr-2 text-success" />
                  <span className="font-medium">{t('ui.benefits.cancelAnytime')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Craftsmen Images Showcase */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('home.showcase.title') || "Artisans en action"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.showcase.subtitle') || "Découvrez le travail de qualité de nos artisans partenaires"}
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg">{t('home.showcase.card1.title') || "Travaux de construction"}</h3>
                    <p className="text-white/90 text-sm mt-1">{t('home.showcase.card1.description') || "Expertise et précision dans chaque projet"}</p>
                  </div>
                </div>
                <img 
                  src="/assets/images/craftsman-working-1.jpg" 
                  alt="Artisan au travail" 
                  className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg">{t('home.showcase.card2.title') || "Collaboration d'équipe"}</h3>
                    <p className="text-white/90 text-sm mt-1">{t('home.showcase.card2.description') || "Des professionnels qui travaillent ensemble"}</p>
                  </div>
                </div>
                <img 
                  src="/assets/images/craftsman-working-2.jpg" 
                  alt="Équipe d'artisans" 
                  className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg">{t('home.showcase.card3.title') || "Expertise professionnelle"}</h3>
                    <p className="text-white/90 text-sm mt-1">{t('home.showcase.card3.description') || "Des artisans qualifiés à votre service"}</p>
                  </div>
                </div>
                <img 
                  src="/assets/images/craftsman-working-3.jpg" 
                  alt="Artisan professionnel" 
                  className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg">{t('home.showcase.card4.title') || "Atelier de travail"}</h3>
                    <p className="text-white/90 text-sm mt-1">{t('home.showcase.card4.description') || "Des espaces équipés pour un travail de qualité"}</p>
                  </div>
                </div>
                <img 
                  src="/assets/images/craftsman-workshop.jpg" 
                  alt="Atelier d'artisan" 
                  className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link to="/find-artisan">
                <Button variant="outline" size="lg" className="hover:bg-primary hover:text-white transition-colors">
                  {t('home.showcase.findArtisan') || "Trouver un artisan"}
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section - Enhanced with more details */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">{t('home.features.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.features.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="FileText" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.quotes.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.quotes.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Templates professionnels personnalisables</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Suggestions IA pour descriptions et tarifs</span>
                  </li>
                </ul>
              </div>
              
              {/* Feature Card 2 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Receipt" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.invoices.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.invoices.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Conversion devis → facture en un clic</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Conforme aux réglementations fiscales</span>
                  </li>
                </ul>
              </div>
              
              {/* Feature Card 3 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="CreditCard" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.payments.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.payments.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Tableau de bord des paiements en temps réel</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Alertes automatiques par email/SMS</span>
                  </li>
                </ul>
              </div>
              
              {/* Feature Card 4 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Bell" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.reminders.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.reminders.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Séquences de relance personnalisables</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Suivi des factures impayées</span>
                  </li>
                </ul>
              </div>
              
              {/* Feature Card 5 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Users" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.clients.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.clients.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Mise en relation avec des clients locaux</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Profil professionnel personnalisable</span>
                  </li>
                </ul>
              </div>
              
              {/* Feature Card 6 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name="LayoutDashboard" size={24} color="var(--color-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{t('home.features.admin.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('home.features.admin.description')}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Rapports financiers mensuels</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle2" size={16} className="mr-2 text-success mt-0.5" />
                    <span>Organisation documentaire automatisée</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Features CTA */}
            <div className="text-center mt-12">
              {/* Removed broken link to /features */}
              <Button variant="outline" size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                {t('ui.buttons.viewFeatures') || 'Toutes nos fonctionnalités'}
                <Icon name="ChevronUp" size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </section>
        
        {/* Dashboard & Mobile App Preview Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('home.app.title') || "Gérez votre entreprise où que vous soyez"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.app.subtitle') || "Accédez à votre tableau de bord depuis votre ordinateur ou en déplacement avec notre application mobile"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Dashboard Preview */}
              <div className="rounded-lg overflow-hidden shadow-xl border border-gray-200 bg-white">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="mx-auto text-sm font-medium text-gray-500">Dashboard Preview</div>
                </div>
                <div className="p-6 bg-white flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Icon name="LayoutDashboard" size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Dashboard image will be placed here</p>
                  </div>
                </div>
              </div>
              
              {/* Mobile App Preview */}
              <div className="flex justify-center">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                  <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Icon name="Smartphone" size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Mobile app image will be placed here</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* App Store Buttons */}
                <div className="absolute mt-[620px] flex flex-col sm:flex-row gap-4">
                  {/* Google Play Button */}
                  <a 
                    href="#" 
                    className="flex items-center justify-center bg-black text-white px-6 py-3 rounded-full hover:bg-white hover:text-black border border-transparent hover:border-black transition-all duration-300 shadow-md hover:shadow-lg min-w-[160px]"
                    onClick={(e) => { e.preventDefault(); }}
                  >
                    <Icon name="Play" size={20} className="mr-2" />
                    <span className="font-medium">{t('home.app.googlePlay')}</span>
                  </a>
                  
                  {/* App Store Button */}
                  <a 
                    href="#" 
                    className="flex items-center justify-center bg-white text-black px-6 py-3 rounded-full hover:bg-black hover:text-white border border-black transition-all duration-300 shadow-md hover:shadow-lg min-w-[160px]"
                    onClick={(e) => { e.preventDefault(); }}
                  >
                    <Icon name="Apple" size={20} className="mr-2" />
                    <span className="font-medium">{t('home.app.appStore')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">{t('home.testimonials.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.testimonials.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('home.testimonials.testimonial1.quote')}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {t('home.testimonials.testimonial1.initials')}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{t('home.testimonials.testimonial1.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.testimonials.testimonial1.profession')}</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('home.testimonials.testimonial2.quote')}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {t('home.testimonials.testimonial2.initials')}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{t('home.testimonials.testimonial2.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.testimonials.testimonial2.profession')}</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                  <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('home.testimonials.testimonial3.quote')}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {t('home.testimonials.testimonial3.initials')}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{t('home.testimonials.testimonial3.name')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.testimonials.testimonial3.profession')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section id="cta" className="py-24 bg-gradient-to-br from-blue-700 to-blue-800 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-32 bg-white/20 transform -skew-y-6"></div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -top-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-full blur-md animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/3 w-8 h-8 bg-cyan-300/30 rounded-full blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                {t('home.cta.title')}
              </h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('home.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white text-blue-800 border-white shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-blue-900/50 group"
                  >
                    <span className="flex items-center">
                      <Icon name="Sparkles" size={20} className="mr-2 group-hover:animate-pulse text-blue-600" />
                      {t('home.cta.startTrial')}
                    </span>
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-transparent text-white border-white/70 transform transition-all duration-300 hover:scale-105"
                  >
                    <span className="flex items-center">
                      <Icon name="MessageCircle" size={20} className="mr-2" />
                      {t('home.cta.contactUs')}
                    </span>
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/80 mt-8 flex items-center justify-center">
                <Icon name="Info" size={16} className="mr-2 opacity-70" />
                {t('home.cta.trialNote')}
                {/* Temporary direct dashboard access */}
                <Link to="/dashboard" className="ml-4 underline text-white/90 hover:text-white">
                  Direct Dashboard Access (Dev)
                </Link>
              </p>
              
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">{t('home.faq.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.faq.subtitle')}
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {/* FAQ Items */}
              {t('home.faq.items').map((item, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            

          </div>
        </section>
        
        {/* Footer */}
        <Footer />
        
        {/* Schema.org JSON-LD for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://havitam.com",
            "logo": "https://havitam.com/assets/images/logo.png",
            "name": "Havitam",
            "description": "La plateforme tout-en-un pour artisans du bâtiment. Créez des devis, envoyez des factures, suivez les paiements et recevez des prospects.",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+33-1-23-45-67-89",
              "contactType": "customer service"
            },
            "sameAs": [
              "https://facebook.com/havitam",
              "https://twitter.com/havitam",
              "https://linkedin.com/company/havitam",
              "https://instagram.com/havitam"
            ]
          }
        `}} />
      </div>
    </>
  );
};

export default HomePage; 