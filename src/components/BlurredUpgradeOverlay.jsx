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
 * Centered regardless of sidebar state
 * 
 * @param {Object} props
 * @param {string} props.title - Main title (centered)
 * @param {string|ReactNode} props.message - Marketing message text
 * @param {string} props.ctaText - CTA button text (default: "Upgrade to Premium")
 * @param {boolean} props.showIcon - Whether to show icon (default: true)
 * @param {string} props.iconName - Icon name (default: "Sparkles")
 * @param {number} props.sidebarOffset - Sidebar offset in pixels (default: 0)
 * @param {boolean} props.isMobile - Whether on mobile (default: false)
 */
const BlurredUpgradeOverlay = ({ 
  title, 
  message, 
  ctaText,
  showIcon = true,
  iconName = "Sparkles",
  sidebarOffset = 0,
  isMobile = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  // Calculate left offset to center in main content area
  const leftOffset = isMobile ? 0 : sidebarOffset;
  const contentWidth = `calc(100% - ${leftOffset}px)`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      style={{
        left: `${leftOffset}px`,
        width: contentWidth
      }}
    >
      <div className="relative w-full max-w-3xl mx-6 sm:mx-8">
        {/* Content Card */}
        <div className="relative bg-card border border-border/50 rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 text-center backdrop-blur-sm bg-gradient-to-b from-card to-card/95">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10">
            {showIcon && (
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="relative">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  {/* Icon container */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                    <Icon name={iconName} size={40} className="text-white" />
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              {title}
            </h2>
            
            <div className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto space-y-2">
              {typeof message === 'string' ? (
                <p className="px-2">{message}</p>
              ) : (
                message
              )}
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 sm:px-10 py-3 sm:py-3.5 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg"
                iconName="ArrowUp"
                iconPosition="left"
              >
                {ctaText || t('limitedAccess.blocked.upgradeButton', 'Upgrade to Premium')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlurredUpgradeOverlay;

