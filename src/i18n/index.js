import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import nlTranslations from './locales/nl.json';

const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  },
  nl: {
    translation: nlTranslations
  }
};

// Detect initial language
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('language');
    
    // If no language is set in localStorage, set it to French by default
    if (!savedLanguage) {
      localStorage.setItem('language', 'fr');
      return 'fr';
    }
    
    const navigatorLanguage = navigator.language.split('-')[0];
    const validLanguages = ['fr', 'en', 'nl'];
    
    if (validLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
    
    if (validLanguages.includes(navigatorLanguage)) {
      return navigatorLanguage;
    }
    
    return 'fr'; // Default to French
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return 'fr'; // Default to French on error
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Dynamically set initial language
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'nl'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Add language change listener to update localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n; 