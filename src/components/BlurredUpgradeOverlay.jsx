import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from './AppIcon';
import Button from './ui/Button';

/**
 * BlurredUpgradeOverlay Component
 * 
 * Displays a blurred overlay on top of page content for Starter plan users
 * Shows compelling marketing message and upgrade CTA
 * 
 * @param {Object} props
 * @param {string} props.title - Main title (centered)
 * @param {string|ReactNode} props.message - Marketing message text
 * @param {string} props.ctaText - CTA button text (default: "Upgrade to Premium")
 * @param {boolean} props.showIcon - Whether to show icon (default: true)
 * @param {string} props.iconName - Icon name (default: "Sparkles")
 */
const BlurredUpgradeOverlay = ({ 
  title, 
  message, 
  ctaText,
  showIcon = true,
  iconName = "Sparkles"
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Blurred content behind overlay */}
        <div className="absolute inset-0 backdrop-blur-md opacity-50 pointer-events-none" />
        
        {/* Content Card */}
        <div className="relative bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
          {showIcon && (
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <Icon name={iconName} size={32} className="text-white" />
              </div>
            </div>
          )}
          
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            {title}
          </h2>
          
          <div className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-8 space-y-3">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
          
          <Button
            onClick={handleUpgrade}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            iconName="ArrowUp"
            iconPosition="left"
          >
            {ctaText || t('limitedAccess.blocked.upgradeButton', 'Upgrade to Premium')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlurredUpgradeOverlay;

