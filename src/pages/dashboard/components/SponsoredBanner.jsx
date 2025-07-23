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
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6 shadow-professional relative overflow-hidden">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-background/50 transition-colors duration-150"
      >
        <Icon name="X" size={16} color="var(--color-muted-foreground)" />
      </button>
      
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={bannerData.image}
            alt="Premium features"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-semibold text-foreground">{bannerData.title}</h4>
            <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
              {bannerData.discount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{bannerData.description}</p>
          
          <div className="flex items-center justify-between">
            <Button
              variant="default"
              size="sm"
              onClick={handleCTAClick}
              iconName="Sparkles"
              iconPosition="left"
            >
              {bannerData.cta}
            </Button>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Icon name="Star" size={12} color="var(--color-warning)" />
              <span>Sponsorisé</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent/5 rounded-full translate-y-8 -translate-x-8"></div>
    </div>
  );
};

export default SponsoredBanner;