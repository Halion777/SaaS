import React from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const StepTwo = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  
  const businessSizes = [
    { value: 'solo', label: t('registerForm.step2.solo') },
    { value: 'small', label: t('registerForm.step2.small') },
    { value: 'medium', label: t('registerForm.step2.medium') },
    { value: 'large', label: t('registerForm.step2.large') }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('registerForm.step2.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('registerForm.step2.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label={t('registerForm.step2.businessSize')}
          placeholder={t('registerForm.step2.businessSizePlaceholder')}
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
                {t('registerForm.step2.benefits.timeSaving.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('registerForm.step2.benefits.timeSaving.description')}
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
                {t('registerForm.step2.benefits.moreSignatures.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('registerForm.step2.benefits.moreSignatures.description')}
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
                {t('registerForm.step2.benefits.dataSecurity.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('registerForm.step2.benefits.dataSecurity.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTwo;