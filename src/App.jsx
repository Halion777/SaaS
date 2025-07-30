import React, { useEffect } from "react";
import Routes from "./Routes";
import { MultiUserProvider } from "./context/MultiUserContext";
import './i18n'; // Import i18n configuration

function App() {
  useEffect(() => {
    // Set French as the default language
    localStorage.setItem('language', 'fr');
    document.documentElement.setAttribute('lang', 'fr');
  }, []);
  
  return (
    <MultiUserProvider>
      <Routes />
    </MultiUserProvider>
  );
}

export default App;
