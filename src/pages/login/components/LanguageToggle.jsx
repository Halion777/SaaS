import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../../components/AppIcon';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const { user, updateUserProfile } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || i18n.language || 'fr';
    setCurrentLanguage(savedLanguage);
  }, [i18n.language]);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  const handleLanguageChange = async (languageCode) => {
    try {
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Save to localStorage
      localStorage.setItem('language', languageCode);
      
      // Set HTML lang attribute
      document.documentElement.setAttribute('lang', languageCode);
      
      // Update local state
    setCurrentLanguage(languageCode);
      
      // If user is logged in, update their language_preference in database
      if (user) {
        try {
          await updateUserProfile({ 
            language_preference: languageCode 
          });
        } catch (error) {
          console.warn('Failed to update language preference in database:', error);
          // Continue anyway - localStorage and i18n are already updated
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="absolute top-4 right-4">
      <div className="relative group">
        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors duration-150">
          <span className="text-sm">{currentLang?.flag}</span>
          <span className="text-sm font-medium text-foreground hidden sm:block">
            {currentLang?.name}
          </span>
          <Icon name="ChevronDown" size={14} color="var(--color-muted-foreground)" />
        </button>

        <div className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-lg shadow-professional-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
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
                <span>{language.name}</span>
                {currentLanguage === language.code && (
                  <Icon name="Check" size={14} color="var(--color-primary)" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageToggle;