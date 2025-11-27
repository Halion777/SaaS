import React from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
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
          {t('registerForm.step2.businessInfo')}
        </h2>
        <p className="text-muted-foreground">
          {t('registerForm.step2.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-card rounded-lg border border-border p-6">
          {/* Company Information - Subcategory */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icon name="Briefcase" size={18} />
              {t('registerForm.step2.companyInfo')}
            </h4>
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

              <Input
                label={t('registerForm.step2.companyName')}
                type="text"
                placeholder={t('registerForm.step2.companyNamePlaceholder')}
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                error={errors.companyName}
                required
              />

              <Input
                label={t('registerForm.step2.vatNumber')}
                type="text"
                placeholder={t('registerForm.step2.vatNumberPlaceholder')}
                value={formData.vatNumber}
                onChange={(e) => updateFormData('vatNumber', e.target.value)}
                error={errors.vatNumber}
                required
              />

              <Input
                label={t('registerForm.step2.companyFullAddress')}
                type="text"
                placeholder={t('registerForm.step2.companyFullAddressPlaceholder')}
                value={formData.companyAddress}
                onChange={(e) => updateFormData('companyAddress', e.target.value)}
                error={errors.companyAddress}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('registerForm.step2.companyPostalCode')}
                  type="text"
                  placeholder={t('registerForm.step2.companyPostalCodePlaceholder')}
                  value={formData.companyPostalCode}
                  onChange={(e) => updateFormData('companyPostalCode', e.target.value)}
                  error={errors.companyPostalCode}
                  required
                />
                <Input
                  label={t('registerForm.step2.companyCity')}
                  type="text"
                  placeholder={t('registerForm.step2.companyCityPlaceholder')}
                  value={formData.companyCity}
                  onChange={(e) => updateFormData('companyCity', e.target.value)}
                  error={errors.companyCity}
                  required
                />
              </div>

              <Input
                label={t('registerForm.step2.companyState')}
                type="text"
                placeholder={t('registerForm.step2.companyStatePlaceholder')}
                value={formData.companyState}
                onChange={(e) => updateFormData('companyState', e.target.value)}
                error={errors.companyState}
                required
              />
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="CreditCard" size={20} />
            {t('registerForm.step2.bankingInfo')}
          </h3>
          <div className="space-y-4">
            <Input
              label={t('registerForm.step2.companyIban')}
              type="text"
              placeholder={t('registerForm.step2.companyIbanPlaceholder')}
              value={formData.companyIban}
              onChange={(e) => updateFormData('companyIban', e.target.value)}
              error={errors.companyIban}
              maxLength={34}
            />

            <Input
              label={t('registerForm.step2.companyAccountName')}
              type="text"
              placeholder={t('registerForm.step2.companyAccountNamePlaceholder')}
              value={formData.companyAccountName}
              onChange={(e) => updateFormData('companyAccountName', e.target.value)}
              error={errors.companyAccountName}
            />

            <Input
              label={t('registerForm.step2.companyBankName')}
              type="text"
              placeholder={t('registerForm.step2.companyBankNamePlaceholder')}
              value={formData.companyBankName}
              onChange={(e) => updateFormData('companyBankName', e.target.value)}
              error={errors.companyBankName}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icon name="Globe" size={20} />
            {t('registerForm.step2.additionalInfo')}
          </h3>
          <div className="space-y-4">
            <Input
              label={t('registerForm.step2.companyWebsite')}
              type="url"
              placeholder={t('registerForm.step2.companyWebsitePlaceholder')}
              value={formData.companyWebsite}
              onChange={(e) => updateFormData('companyWebsite', e.target.value)}
              error={errors.companyWebsite}
            />
          </div>
        </div>
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