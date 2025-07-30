import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mr-3">
          <Icon name="Hammer" size={36} color="white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Havitam</h1>
          <p className="text-sm text-muted-foreground">Artisan Pro</p>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Bon retour !
        </h2>
        <p className="text-muted-foreground">
          Connectez-vous à votre espace artisan pour gérer vos devis et factures
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;