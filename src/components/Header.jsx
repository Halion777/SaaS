import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './AppIcon';
import Button from './ui/Button';
import LanguageDropdown from './LanguageDropdown';
import { useTranslation } from '../context/TranslationContext';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationHidden, setIsNotificationHidden] = useState(false);

  // Check if current page should show the notification banner
  const shouldShowNotification = () => {
    return location.pathname === '/';
  };

  // Check if current page should show profile elements
  const isDashboardPage = () => {
    const dashboardPages = [
      '/dashboard', '/quotes-management', '/invoices-management', 
      '/client-management', '/analytics-dashboard', '/follow-up-management',
      '/leads-management', '/supplier-invoices', '/multi-user-profiles',
      '/quote-creation'
    ];
    return dashboardPages.some(page => location.pathname.startsWith(page));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Notification Bar - Only on home page */}
      {shouldShowNotification() && !isNotificationHidden && (
        <div className="bg-[#0036ab] text-white py-2 px-4 relative z-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center flex-1">
                <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23] flex-shrink-0" />
                <span className="font-medium text-sm">
                  Nouveau : Intégration PEPPOL pour la facturation électronique
                </span>
              </div>
              <button 
                onClick={() => setIsNotificationHidden(true)}
                className="text-white hover:text-gray-200 transition-colors p-1 ml-4"
                aria-label="Fermer la notification"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg' 
          : 'bg-white border-b border-gray-100'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/assets/logo/logo.png" 
                alt="Havitam Logo" 
                className="w-auto h-12 lg:h-16 object-contain"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                to="/about"
                className={`text-gray-700 hover:text-[#0036ab] transition-colors font-medium ${
                  isActive('/about') ? 'text-[#0036ab]' : ''
                }`}
              >
                {t('nav.about') || 'À propos'}
              </Link>
              <Link 
                to="/pricing"
                className={`text-gray-700 hover:text-[#0036ab] transition-colors font-medium ${
                  isActive('/pricing') ? 'text-[#0036ab]' : ''
                }`}
              >
                {t('nav.pricing') || 'Tarifs'}
              </Link>
              <Link 
                to="/find-artisan"
                className={`text-gray-700 hover:text-[#0036ab] transition-colors font-medium ${
                  isActive('/find-artisan') ? 'text-[#0036ab]' : ''
                }`}
              >
                {t('nav.findArtisan') || 'Trouver un artisan'}
              </Link>
              <Link 
                to="/contact"
                className={`text-gray-700 hover:text-[#0036ab] transition-colors font-medium ${
                  isActive('/contact') ? 'text-[#0036ab]' : ''
                }`}
              >
                {t('nav.contact') || 'Contact'}
              </Link>
              <Link 
                to="/blog"
                className={`text-gray-700 hover:text-[#0036ab] transition-colors font-medium ${
                  isActive('/blog') ? 'text-[#0036ab]' : ''
                }`}
              >
                {t('nav.blog') || 'Blog'}
              </Link>
            </nav>
            
            {/* Desktop Right Section */}
            <div className="hidden lg:flex items-center space-x-4">
              <LanguageDropdown />
              
              {/* Show profile only on dashboard pages */}
              {isDashboardPage() && (
                <div className="flex items-center space-x-3">
                  <button className="relative p-2 text-gray-700 hover:text-[#0036ab] transition-colors">
                    <Icon name="Bell" size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-[#12bf23] rounded-full"></span>
                  </button>
                  <div className="w-8 h-8 bg-[#0036ab] rounded-full flex items-center justify-center text-white font-medium text-sm">
                    JD
                  </div>
                </div>
              )}
              
              {/* Auth Buttons */}
              <Link to="/login" className="text-gray-700 hover:text-[#0036ab] transition-colors px-3 py-2 font-medium">
                {t('nav.login') || 'Connexion'}
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="bg-[#0036ab] hover:bg-[#0036ab]/90 text-white font-medium">
                  {t('nav.freeTrial') || 'Essai gratuit'}
                </Button>
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden text-gray-700 hover:text-[#0036ab] transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
          
          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="py-4 border-t border-gray-100">
              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-1 mb-4">
                <Link 
                  to="/about"
                  className={`px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ${
                    isActive('/about') ? 'bg-[#0036ab]/5 text-[#0036ab]' : ''
                  }`}
                >
                  {t('nav.about') || 'À propos'}
                </Link>
                <Link 
                  to="/pricing"
                  className={`px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ${
                    isActive('/pricing') ? 'bg-[#0036ab]/5 text-[#0036ab]' : ''
                  }`}
                >
                  {t('nav.pricing') || 'Tarifs'}
                </Link>
                <Link 
                  to="/find-artisan"
                  className={`px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ${
                    isActive('/find-artisan') ? 'bg-[#0036ab]/5 text-[#0036ab]' : ''
                  }`}
                >
                  {t('nav.findArtisan') || 'Trouver un artisan'}
                </Link>
                <Link 
                  to="/contact"
                  className={`px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ${
                    isActive('/contact') ? 'bg-[#0036ab]/5 text-[#0036ab]' : ''
                  }`}
                >
                  {t('nav.contact') || 'Contact'}
                </Link>
                <Link 
                  to="/blog"
                  className={`px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium ${
                    isActive('/blog') ? 'bg-[#0036ab]/5 text-[#0036ab]' : ''
                  }`}
                >
                  {t('nav.blog') || 'Blog'}
                </Link>
              </nav>
              
              {/* Mobile Language and Authentication */}
              <div className="flex flex-col space-y-3 px-4">
                <div className="flex items-center justify-between">
                  <LanguageDropdown />
                  <Link to="/login" className="text-gray-700 hover:text-[#0036ab] transition-colors font-medium">
                    {t('nav.login') || 'Connexion'}
                  </Link>
                </div>
                <Link to="/register" className="w-full">
                  <Button variant="primary" size="sm" className="w-full bg-[#0036ab] hover:bg-[#0036ab]/90 text-white font-medium">
                    {t('nav.freeTrial') || 'Essai gratuit'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header; 