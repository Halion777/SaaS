import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from './AppIcon';

const LanguageDropdown = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    document.documentElement.setAttribute('lang', languageCode);
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