import React, { useEffect } from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Routes from "./Routes";
import { AuthProvider } from "./context/AuthContext";
import { MultiUserProvider } from "./context/MultiUserContext";
import ProfileSelectionModal from "./components/ui/ProfileSelectionModal";
import ErrorBoundary from "./components/ErrorBoundary";
import InternetConnectionCheck from "./components/InternetConnectionCheck";
import { useAuth } from "./context/AuthContext";
import './i18n'; // Import i18n configuration

function App() {
  useEffect(() => {
    try {
      // Set language from localStorage or default to French
      let savedLanguage = localStorage.getItem('language');
      
      // If no language is set in localStorage, set it to French by default
      if (!savedLanguage) {
        localStorage.setItem('language', 'fr');
        savedLanguage = 'fr';
      }
      
      // Validate language
      const validLanguages = ['fr', 'en', 'nl'];
      const language = validLanguages.includes(savedLanguage) ? savedLanguage : 'fr';
      
      // Change language and set document attribute
      i18n.changeLanguage(language);
      document.documentElement.setAttribute('lang', language);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Default to French on error
      i18n.changeLanguage('fr');
      document.documentElement.setAttribute('lang', 'fr');
    }
  }, []);

  function AppContent() {
    const { showProfileSelection, handleProfileSelect, closeProfileSelection } = useAuth();

    return (
      <InternetConnectionCheck>
      <MultiUserProvider>
        <Routes />
        <ProfileSelectionModal
          isOpen={showProfileSelection}
          onProfileSelect={handleProfileSelect}
          onClose={closeProfileSelection}
        />
      </MultiUserProvider>
      </InternetConnectionCheck>
    );
  }
  
  return (
    <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
