import React, { useEffect } from "react";
import Routes from "./Routes";
import { TranslationProvider } from "./context/TranslationContext";

function App() {
  useEffect(() => {
    // Ensure default language is set when app loads
    const savedLanguage = localStorage.getItem('language');
    if (!savedLanguage) {
      localStorage.setItem('language', 'fr');
      document.documentElement.setAttribute('lang', 'fr');
    } else {
      document.documentElement.setAttribute('lang', savedLanguage);
    }
  }, []);
  
  return (
    <TranslationProvider>
      <Routes />
    </TranslationProvider>
  );
}

export default App;
