import React, { useEffect } from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Routes from "./Routes";
import { AuthProvider } from "./context/AuthContext";
import { MultiUserProvider } from "./context/MultiUserContext";
import ProfileSelectionModal from "./components/ui/ProfileSelectionModal";
import { useAuth } from "./context/AuthContext";
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

  function AppContent() {
    const { showProfileSelection, handleProfileSelect, closeProfileSelection } = useAuth();

    return (
      <>
        <Routes />
        <ProfileSelectionModal
          isOpen={showProfileSelection}
          onProfileSelect={handleProfileSelect}
          onClose={closeProfileSelection}
        />
      </>
    );
  }
  
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <AuthProvider>
          <MultiUserProvider>
            <AppContent />
          </MultiUserProvider>
        </AuthProvider>
      </Router>
    </I18nextProvider>
  );
}

export default App;
