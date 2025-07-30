import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mr-3">
          <Icon name="Hammer" size={36} color="white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Havitam</h1>
          <p className="text-sm text-muted-foreground">{t('login.logoSubtitle')}</p>
        </div>
      </div>


    </div>
  );
};

export default LoginHeader;