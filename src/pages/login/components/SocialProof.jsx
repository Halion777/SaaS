import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from '../../../context/TranslationContext';

const SocialProof = () => {
  const { t } = useTranslation();
  
  const icons = [
    'Users',
    'TrendingUp',
    'Clock'
  ];

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-foreground mb-4">
          {t('login.socialProof.title')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {t('login.socialProof.stats').map((stat, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={icons[index]} size={16} color="var(--color-primary)" />
              </div>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialProof;