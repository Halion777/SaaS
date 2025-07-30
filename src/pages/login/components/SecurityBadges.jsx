import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const SecurityBadges = () => {
  const { t } = useTranslation();
  
  const securityFeatures = [
    {
      icon: 'Shield',
      text: t('login.security.secureData')
    },
    {
      icon: 'Lock',
      text: t('login.security.gdprCompliant')
    },
    {
      icon: 'Server',
      text: t('login.security.frenchHosting')
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {securityFeatures.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name={feature.icon} size={14} color="var(--color-success)" />
            <span>{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBadges;