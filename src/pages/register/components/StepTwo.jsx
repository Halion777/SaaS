import React from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { useTranslation } from '../../../context/TranslationContext';

const StepTwo = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  
  const businessSizes = [
    { value: 'solo', label: t('register.step2.businessSizes.solo') || 'Artisan seul' },
    { value: 'small', label: t('register.step2.businessSizes.small') || '2-5 employés' },
    { value: 'medium', label: t('register.step2.businessSizes.medium') || '6-20 employés' },
    { value: 'large', label: t('register.step2.businessSizes.large') || '20+ employés' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('register.step2.title') || 'Quelques informations supplémentaires'}
        </h2>
        <p className="text-muted-foreground">
          {t('register.step2.subtitle') || 'Personnalisez Havitam selon votre activité'}
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label={t('register.step2.businessSizeLabel') || 'Taille de l\'entreprise'}
          placeholder={t('register.step2.businessSizePlaceholder') || 'Nombre d\'employés'}
          options={businessSizes}
          value={formData.businessSize}
          onChange={(e) => updateFormData('businessSize', e.target.value)}
          error={errors.businessSize}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Clock" size={16} color="white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('register.step2.timeSavingTitle') || 'Gain de temps'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('register.step2.timeSavingDescription') || 'Automatisez vos relances et optimisez vos devis en quelques clics.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="TrendingUp" size={16} color="white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('register.step2.moreSignaturesTitle') || 'Plus de signatures'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('register.step2.moreSignaturesDescription') || 'Notre IA analyse et améliore vos devis pour maximiser les conversions.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Shield" size={16} color="white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('register.step2.dataSecurityTitle') || 'Vos données sont sécurisées'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('register.step2.dataSecurityDescription') || 'Toutes vos informations sont cryptées et stockées en toute sécurité conformément au RGPD.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTwo;