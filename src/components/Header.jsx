import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './AppIcon';
import Button from './ui/Button';
import LanguageDropdown from './LanguageDropdown';
import { useTranslation } from '../context/TranslationContext';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <header className="sticky top-0 border-b border-border bg-card z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Hammer" size={24} color="white" />
          </div>
          <span className="text-xl font-bold text-foreground">Havitam</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.home')}
          </Link>
          <Link 
            to="/pricing" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/pricing') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.pricing')}
          </Link>
          <Link 
            to="/find-artisan" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/find-artisan') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.findArtisan')}
          </Link>
          <Link 
            to="/about" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/about') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.about')}
          </Link>
          <Link 
            to="/contact" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/contact') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.contact')}
          </Link>
          <Link 
            to="/blog" 
            className={`text-foreground hover:text-primary transition-colors ${isActive('/blog') ? 'text-primary font-medium' : ''}`}
          >
            {t('nav.blog')}
          </Link>
        </nav>
        
        {/* Language and Authentication */}
        <div className="flex items-center space-x-4">
          <LanguageDropdown />
          <Link to="/login" className="text-foreground hover:text-primary transition-colors px-3 py-2">
            {t('nav.login')}
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700 text-white">{t('nav.freeTrial')}</Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground hover:text-primary transition-colors">
          <Icon name="Menu" size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header; 