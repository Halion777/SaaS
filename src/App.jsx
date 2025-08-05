import React, { useEffect } from "react";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Routes from "./Routes";
import { MultiUserProvider } from "./context/MultiUserContext";
import './i18n'; // Import i18n configuration

function App() {
  useEffect(() => {
    // Set language from localStorage or default to French
    const savedLanguage = localStorage.getItem('language') || 'fr';
    
    // Validate language
    const validLanguages = ['fr', 'en', 'nl'];
    const language = validLanguages.includes(savedLanguage) ? savedLanguage : 'fr';
    
    // Change language and set document attribute
    i18n.changeLanguage(language);
    document.documentElement.setAttribute('lang', language);
  }, []);
  
  return (
    <I18nextProvider i18n={i18n}>
      <MultiUserProvider>
        <Routes />
      </MultiUserProvider>
    </I18nextProvider>
  );
}

export default App;
