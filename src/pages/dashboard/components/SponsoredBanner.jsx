import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const SponsoredBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  const bannerData = {
    title: t('dashboard.sponsoredBanner.title'),
    description: t('dashboard.sponsoredBanner.description'),
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop',
    cta: t('dashboard.sponsoredBanner.cta'),
    sponsor: t('dashboard.sponsoredBanner.sponsor'),
    discount: t('dashboard.sponsoredBanner.discount')
  };

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCTAClick = () => {
    // Handle premium upgrade
    console.log('Premium upgrade clicked');
  };

  return (
    <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 border border-blue-600/30 rounded-lg p-4 sm:p-6 shadow-lg relative overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:shadow-blue-700/20 group">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-purple-500/10 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12 blur-xl"></div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 sm:w-6 sm:h-6 bg-yellow-300/20 rounded-full blur-md animate-pulse"></div>
      
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 z-10"
      >
        <Icon name="X" size={12} className="sm:w-4 sm:h-4" color="white" />
      </button>
      
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
        <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md transform transition-transform duration-300 group-hover:scale-105 mx-auto sm:mx-0">
          <Image
            src={bannerData.image}
            alt="Premium features"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-3 sm:mb-2 space-y-2 sm:space-y-0">
            <h4 className="text-base sm:text-base font-semibold text-white leading-tight">{bannerData.title}</h4>
            <span className="text-xs px-3 py-1 bg-yellow-500/90 text-white rounded-full animate-pulse w-fit mx-auto sm:mx-0 font-medium">
              {bannerData.discount}
            </span>
          </div>
          <p className="text-sm sm:text-sm text-white/90 mb-4 sm:mb-3 leading-relaxed px-2 sm:px-0">{bannerData.description}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <Button
              variant="default"
              size="sm"
              onClick={handleCTAClick}
              className="shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 group w-full sm:w-auto bg-white text-blue-700 hover:bg-gray-100 font-medium"
            >
              <span className="flex items-center justify-center sm:justify-start">
                <Icon name="Sparkles" size={14} className="sm:w-4 sm:h-4 mr-2 group-hover:animate-pulse" />
                {bannerData.cta}
              </span>
            </Button>
            
            <div className="flex items-center justify-end sm:justify-end space-x-1 text-xs text-white/80">
              <Icon name="Star" size={10} className="sm:w-3 sm:h-3" color="rgb(250, 204, 21)" />
              <span className="font-medium">{t('dashboard.sponsoredBanner.sponsoredLabel')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsoredBanner;