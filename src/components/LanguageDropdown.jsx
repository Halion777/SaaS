import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './AppIcon';

const LanguageDropdown = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  
  // Only show language dropdown on the homepage
  const isHomePage = location.pathname === '/';
  
  // If not on homepage, don't render the component
  if (!isHomePage) {
    return null;
  }

  // Update the language setup to ensure French is default
  useEffect(() => {
    // If no language is set, force it to French
    if (!localStorage.getItem('language')) {
      localStorage.setItem('language', 'fr');
    }
    
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setCurrentLanguage(savedLanguage);
    
    // Set language on the HTML tag for potential CSS selectors
    document.documentElement.setAttribute('lang', savedLanguage);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ensure French is first and marked as default
  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', isDefault: true },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  const handleLanguageChange = (languageCode) => {
    if (languageCode === currentLanguage) return; // No change needed
    
    setCurrentLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    document.documentElement.setAttribute('lang', languageCode);
    setIsOpen(false);
    
    // Force a complete page reload to ensure all translations are applied
    window.location.href = window.location.pathname; // This triggers a full page reload
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center text-foreground hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-1">{currentLang?.flag}</span>
        <Icon name="ChevronDown" size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-popover border border-border rounded-lg shadow-professional-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors duration-150 flex items-center space-x-2 ${
                  currentLanguage === language.code ? 'bg-muted text-primary' : 'text-popover-foreground'
                }`}
              >
                <span>{language.flag}</span>
                <div className="flex flex-col">
                  <span>{language.name}</span>
                  {language.isDefault && <span className="text-xs text-muted-foreground">Langue par défaut</span>}
                </div>
                {currentLanguage === language.code && (
                  <Icon name="Check" size={14} color="var(--color-primary)" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown; 