import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInternetConnection } from './InternetConnectionCheck';
import Icon from './AppIcon';

/**
 * Small, non-blocking internet status indicator
 * Shows a small capsule/badge with icon and red dot when offline
 * Does not block the entire application
 */
const InternetStatusIndicator = () => {
  const { t } = useTranslation();
  const { isOnline, isChecking } = useInternetConnection();

  // Don't show anything when online
  if (isOnline || isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-error/10 backdrop-blur-sm border border-error/30 rounded-full px-4 py-2 shadow-lg animate-pulse">
      {/* Red dot indicator */}
      <div className="relative w-2 h-2">
        <div className="absolute w-2 h-2 bg-error rounded-full animate-ping"></div>
        <div className="absolute w-2 h-2 bg-error rounded-full"></div>
      </div>
      
      {/* Icon */}
      <Icon name="WifiOff" size={16} className="text-error" />
      
      {/* Text */}
      <span className="text-sm font-medium text-error">
        {t('common.errors.noInternet', 'No Internet')}
      </span>
    </div>
  );
};

export default InternetStatusIndicator;

