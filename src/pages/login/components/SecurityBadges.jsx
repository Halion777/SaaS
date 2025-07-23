import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from '../../../context/TranslationContext';

const SecurityBadges = () => {
  const { t } = useTranslation();
  
  const securityFeatures = [
    {
      icon: 'Shield',
      text: t('login.security.secureData') || 'Secure data'
    },
    {
      icon: 'Lock',
      text: t('login.security.gdprCompliant') || 'GDPR compliant'
    },
    {
      icon: 'Server',
      text: t('login.security.frenchHosting') || 'French hosting'
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