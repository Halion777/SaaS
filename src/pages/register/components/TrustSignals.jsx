import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from '../../../context/TranslationContext';

const TrustSignals = () => {
  const { t } = useTranslation();
  
  const signals = [
    {
      icon: 'Shield',
      title: t('register.trustSignals.gdpr.title') || 'Conformité GDPR',
      description: t('register.trustSignals.gdpr.description') || 'Vos données sont protégées selon les standards européens'
    },
    {
      icon: 'Lock',
      title: t('register.trustSignals.ssl.title') || 'Sécurité SSL',
      description: t('register.trustSignals.ssl.description') || 'Chiffrement de bout en bout pour toutes vos informations'
    },
    {
      icon: 'Award',
      title: t('register.trustSignals.iso.title') || 'Certifié ISO',
      description: t('register.trustSignals.iso.description') || 'Standards de qualité et sécurité reconnus'
    },
    {
      icon: 'Users',
      title: t('register.trustSignals.users.title') || '2000+ Artisans',
      description: t('register.trustSignals.users.description') || 'Font déjà confiance à notre plateforme'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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