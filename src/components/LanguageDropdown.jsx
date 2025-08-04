import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Icon from './AppIcon';

const LanguageDropdown = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, updateUserProfile } = useAuth();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  // Load language preference on component mount
  useEffect(() => {
    // First, check user's stored preference
    const storedLanguage = user?.user_metadata?.language;
    
    // If user has a stored preference, use it
    if (storedLanguage && languages.some(lang => lang.code === storedLanguage)) {
      i18n.changeLanguage(storedLanguage);
      document.documentElement.setAttribute('lang', storedLanguage);
    } else {
      // Otherwise, check localStorage
      const localStorageLanguage = localStorage.getItem('language');
      
      if (localStorageLanguage && languages.some(lang => lang.code === localStorageLanguage)) {
        i18n.changeLanguage(localStorageLanguage);
        document.documentElement.setAttribute('lang', localStorageLanguage);
      }
    }
  }, [user, i18n]);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode) => {
    // Change language in i18n
    i18n.changeLanguage(languageCode);
    
    // Save to localStorage
    localStorage.setItem('language', languageCode);
    
    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', languageCode);
    
    // If user is logged in, update their profile
    if (user) {
      await updateUserProfile({ 
        data: { 
          language: languageCode 
        } 
      });
    }
    
    // Close dropdown
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors duration-150"
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {currentLanguage.name}
        </span>
        <Icon name="ChevronDown" size={14} color="var(--color-muted-foreground)" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-lg shadow-professional-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors duration-150 flex items-center space-x-2 ${
                  i18n.language === language.code ? 'bg-muted text-primary' : 'text-popover-foreground'
                }`}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {i18n.language === language.code && (
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