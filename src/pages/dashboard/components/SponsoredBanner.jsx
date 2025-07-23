import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const SponsoredBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  const bannerData = {
    title: 'Optimisez vos devis avec l\'IA Premium',
    description: 'Augmentez votre taux de signature de 40% avec nos suggestions intelligentes',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop',
    cta: 'Découvrir Premium',
    sponsor: 'Havitam Pro',
    discount: '30% de réduction'
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
    <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 border border-blue-600/30 rounded-lg p-6 shadow-lg relative overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:shadow-blue-700/20 group">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>
      <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-yellow-300/20 rounded-full blur-md animate-pulse"></div>
      
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 z-10"
      >
        <Icon name="X" size={16} color="white" />
      </button>
      
      <div className="flex items-center space-x-4 relative z-10">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md transform transition-transform duration-300 group-hover:scale-105">
          <Image
            src={bannerData.image}
            alt="Premium features"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-semibold text-white">{bannerData.title}</h4>
            <span className="text-xs px-2 py-1 bg-yellow-500/90 text-white rounded-full animate-pulse">
              {bannerData.discount}
            </span>
          </div>
          <p className="text-xs text-white/80 mb-3">{bannerData.description}</p>
          
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCTAClick}
              className="shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 group"
            >
              <span className="flex items-center">
                <Icon name="Sparkles" size={16} className="mr-2 group-hover:animate-pulse" />
                {bannerData.cta}
              </span>
            </Button>
            
            <div className="flex items-center space-x-1 text-xs text-white/70">
              <Icon name="Star" size={12} color="rgb(250, 204, 21)" />
              <span>Sponsorisé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsoredBanner;