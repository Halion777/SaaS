import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const { t } = useTranslation();
  
  const signals = [
    {
      icon: 'Shield',
      title: t('registerForm.trustSignals.gdpr.title'),
      description: t('registerForm.trustSignals.gdpr.description')
    },
    {
      icon: 'Lock',
      title: t('registerForm.trustSignals.ssl.title'),
      description: t('registerForm.trustSignals.ssl.description')
    },
    {
      icon: 'Users',
      title: t('registerForm.trustSignals.artisans.title'),
      description: t('registerForm.trustSignals.artisans.description')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {signals.map((signal, index) => (
        <div key={index} className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Icon name={signal.icon} size={20} color="var(--color-primary)" />
          </div>
          <h3 className="font-semibold text-foreground text-sm mb-1">
            {signal.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {signal.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TrustSignals;