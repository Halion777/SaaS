import React from 'react';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const signals = [
    {
      icon: 'Shield',
      title: 'Conformité GDPR',
      description: 'Vos données sont protégées selon les standards européens'
    },
    {
      icon: 'Lock',
      title: 'Sécurité SSL',
      description: 'Chiffrement de bout en bout pour toutes vos informations'
    },
    {
      icon: 'Award',
      title: 'Certifié ISO',
      description: 'Standards de qualité et sécurité reconnus'
    },
    {
      icon: 'Users',
      title: '2000+ Artisans',
      description: 'Font déjà confiance à notre plateforme'
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