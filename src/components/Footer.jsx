import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './AppIcon';
import { useTranslation } from '../context/TranslationContext';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border bg-card py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img 
                src="/assets/logo/logo.png" 
                alt="Havitam Logo" 
                className="w-auto h-14 object-contain"
              />
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('footer.description') || 'La solution tout-en-un pour les artisans qui souhaitent simplifier leur gestion administrative et développer leur clientèle.'}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/havitam" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Facebook" size={20} />
              </a>
              <a href="https://twitter.com/havitam" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Twitter" size={20} />
              </a>
              <a href="https://linkedin.com/company/havitam" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Linkedin" size={20} />
              </a>
              <a href="https://instagram.com/havitam" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Instagram" size={20} />
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t('footer.product') || 'Produit'}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.features') || 'Fonctionnalités'}
                </Link>
              </li>
              <li>
                <Link to="/find-artisan" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.findArtisan')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t('footer.company') || 'Entreprise'}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.blog')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">{t('footer.legal.title') || 'Légal'}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.legal.cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="pt-12 mt-12 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-sm text-muted-foreground">
                © {currentYear} Havitam. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-4">
              <Link to="/sitemap" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 