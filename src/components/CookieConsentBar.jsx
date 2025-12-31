import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Icon from './AppIcon';
import Button from './ui/Button';
import cookieService, { COOKIE_CATEGORIES } from '../services/cookieService';

const CookieConsentBar = () => {
  const { t } = useTranslation();
  const [showBar, setShowBar] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    [COOKIE_CATEGORIES.ESSENTIAL]: true, // Always enabled
    [COOKIE_CATEGORIES.FUNCTIONAL]: false,
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.MARKETING]: false
  });

  useEffect(() => {
    // Check if user has already given consent
    if (!cookieService.hasCookieConsent()) {
      // Small delay to ensure smooth page load
      setTimeout(() => {
        setShowBar(true);
      }, 500);
    } else {
      // Load existing preferences
      const existingPreferences = cookieService.getCookiePreferences();
      setPreferences(existingPreferences);
    }
  }, []);

  const handleAcceptAll = () => {
    cookieService.acceptAllCookies();
    setShowBar(false);
  };

  const handleRejectAll = () => {
    cookieService.rejectAllCookies();
    setShowBar(false);
  };

  const handleSavePreferences = () => {
    cookieService.saveCustomPreferences(preferences);
    setShowBar(false);
  };

  const handleToggleCategory = (category) => {
    // Essential cookies cannot be disabled
    if (category === COOKIE_CATEGORIES.ESSENTIAL) {
      return;
    }
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (!showBar) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="bg-white border-t-2 border-gray-200 shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          {!showDetails ? (
            // Simple view
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="Cookie" size={24} className="text-[#0036ab] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {t('cookieConsent.title')}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t('cookieConsent.description')}{' '}
                      <Link 
                        to="/cookies" 
                        className="text-[#0036ab] hover:underline font-medium"
                      >
                        {t('cookieConsent.learnMore')}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  onClick={() => setShowDetails(true)}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {t('cookieConsent.customize')}
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="whitespace-nowrap border-red-300 text-red-600 hover:bg-red-50"
                >
                  {t('cookieConsent.rejectAll')}
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="whitespace-nowrap bg-[#0036ab] hover:bg-[#0036ab]/90 text-white"
                >
                  {t('cookieConsent.acceptAll')}
                </Button>
              </div>
            </div>
          ) : (
            // Detailed view with category toggles
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Icon name="Settings" size={24} className="text-[#0036ab] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {t('cookieConsent.customizeTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {t('cookieConsent.customizeDescription')}
                  </p>
                </div>
              </div>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {t('cookieConsent.categories.essential.title')}
                        </h4>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          {t('cookieConsent.required')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('cookieConsent.categories.essential.description')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('cookieConsent.categories.essential.examples')}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-6 bg-[#12bf23] rounded-full flex items-center justify-center cursor-not-allowed">
                        <Icon name="Check" size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t('cookieConsent.categories.functional.title')}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('cookieConsent.categories.functional.description')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('cookieConsent.categories.functional.examples')}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleToggleCategory(COOKIE_CATEGORIES.FUNCTIONAL)}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          preferences[COOKIE_CATEGORIES.FUNCTIONAL]
                            ? 'bg-[#12bf23]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            preferences[COOKIE_CATEGORIES.FUNCTIONAL]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t('cookieConsent.categories.analytics.title')}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('cookieConsent.categories.analytics.description')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('cookieConsent.categories.analytics.examples')}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleToggleCategory(COOKIE_CATEGORIES.ANALYTICS)}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          preferences[COOKIE_CATEGORIES.ANALYTICS]
                            ? 'bg-[#12bf23]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            preferences[COOKIE_CATEGORIES.ANALYTICS]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t('cookieConsent.categories.marketing.title')}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {t('cookieConsent.categories.marketing.description')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('cookieConsent.categories.marketing.examples')}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleToggleCategory(COOKIE_CATEGORIES.MARKETING)}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          preferences[COOKIE_CATEGORIES.MARKETING]
                            ? 'bg-[#12bf23]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            preferences[COOKIE_CATEGORIES.MARKETING]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                >
                  {t('cookieConsent.back')}
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {t('cookieConsent.rejectAll')}
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="bg-[#0036ab] hover:bg-[#0036ab]/90 text-white"
                >
                  {t('cookieConsent.savePreferences')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CookieConsentBar;

