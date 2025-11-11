import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from './AppIcon';
import contactService from '../services/contactService';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [expandedSections, setExpandedSections] = useState({});
  const [companyDetails, setCompanyDetails] = useState({
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });

  useEffect(() => {
    const loadCompanyDetails = async () => {
      const result = await contactService.getCompanyDetails();
      if (result.success && result.data) {
        setCompanyDetails(result.data);
      }
    };
    loadCompanyDetails();
  }, []);
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <footer className="bg-gray-900 text-white py-12 lg:py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img 
                src="/assets/logo/logo.png" 
                alt="Haliqo Logo" 
                className="w-auto h-16 lg:h-20 object-contain brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-6 max-w-md text-sm lg:text-base leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              {companyDetails.socialLinks?.facebook && (
                <a href={companyDetails.socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Icon name="Facebook" size={20} />
                </a>
              )}
              {companyDetails.socialLinks?.twitter && (
                <a href={companyDetails.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Icon name="Twitter" size={20} />
                </a>
              )}
              {companyDetails.socialLinks?.linkedin && (
                <a href={companyDetails.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Icon name="Linkedin" size={20} />
                </a>
              )}
              {companyDetails.socialLinks?.instagram && (
                <a href={companyDetails.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Icon name="Instagram" size={20} />
                </a>
              )}
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <button 
              className="lg:hidden w-full flex items-center justify-between text-left mb-4"
              onClick={() => toggleSection('product')}
            >
              <h3 className="text-lg font-semibold text-white">{t('footer.product.title')}</h3>
              <Icon 
                name={expandedSections.product ? "ChevronUp" : "ChevronDown"} 
                size={20} 
                className="text-gray-400" 
              />
            </button>
            <h3 className="hidden lg:block text-lg font-semibold text-white mb-6">{t('footer.product.title')}</h3>
            <ul className={`space-y-3 lg:space-y-4 ${expandedSections.product ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.product.pricing')}
                </Link>
              </li>

              <li>
                <Link to="/features" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.product.features')}
                </Link>
              </li>
              <li>
                <Link to="/find-artisan" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.product.findArtisan')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <button 
              className="lg:hidden w-full flex items-center justify-between text-left mb-4"
              onClick={() => toggleSection('company')}
            >
              <h3 className="text-lg font-semibold text-white">{t('footer.company.title')}</h3>
              <Icon 
                name={expandedSections.company ? "ChevronUp" : "ChevronDown"} 
                size={20} 
                className="text-gray-400" 
              />
            </button>
            <h3 className="hidden lg:block text-lg font-semibold text-white mb-6">{t('footer.company.title')}</h3>
            <ul className={`space-y-3 lg:space-y-4 ${expandedSections.company ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.company.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.company.contact')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.company.blog')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <button 
              className="lg:hidden w-full flex items-center justify-between text-left mb-4"
              onClick={() => toggleSection('legal')}
            >
              <h3 className="text-lg font-semibold text-white">{t('footer.legal.title')}</h3>
              <Icon 
                name={expandedSections.legal ? "ChevronUp" : "ChevronDown"} 
                size={20} 
                className="text-gray-400" 
              />
            </button>
            <h3 className="hidden lg:block text-lg font-semibold text-white mb-6">{t('footer.legal.title')}</h3>
            <ul className={`space-y-3 lg:space-y-4 ${expandedSections.legal ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-300 hover:text-white transition-colors text-sm lg:text-base">
                  {t('footer.legal.cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="pt-8 lg:pt-12 mt-8 lg:mt-12 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <span className="text-sm text-gray-400">
                © {currentYear} Haliqo. {t('footer.copyright')}
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 lg:space-x-6">
              {/* Footer links removed - pages not implemented yet */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 