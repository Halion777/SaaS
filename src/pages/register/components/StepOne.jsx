import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { COUNTRY_PHONE_CODES } from '../../../utils/countryCodes';


const StepOne = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    COUNTRY_PHONE_CODES[formData.country] || '+32'
  );

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    updateFormData('password', password);
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-error';
    if (passwordStrength < 50) return 'bg-warning';
    if (passwordStrength < 75) return 'bg-accent';
    return 'bg-success';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return t('registerForm.step1.passwordWeak');
    if (passwordStrength < 50) return t('registerForm.step1.passwordMedium');
    if (passwordStrength < 75) return t('registerForm.step1.passwordGood');
    return t('registerForm.step1.passwordExcellent');
  };

  // Update phone country code when country changes
  useEffect(() => {
    const code = COUNTRY_PHONE_CODES[formData.country] || '+32';
    setPhoneCountryCode(code);
  }, [formData.country]);

  // Get the current unique value for the select
  const getCurrentSelectValue = () => {
    if (!phoneCountryCode) return '';
    // Find the country code that matches the current phone code and country
    const matchingCountry = Object.entries(COUNTRY_PHONE_CODES).find(
      ([countryCode, phoneCode]) => 
        phoneCode === phoneCountryCode && 
        (countryCode === formData.country || !formData.country)
    );
    if (matchingCountry) {
      return `${phoneCountryCode}_${matchingCountry[0]}`;
    }
    // Fallback: use first country with this phone code
    const firstMatch = Object.entries(COUNTRY_PHONE_CODES).find(
      ([, phoneCode]) => phoneCode === phoneCountryCode
    );
    return firstMatch ? `${phoneCountryCode}_${firstMatch[0]}` : '';
  };
  
  // Profession options with icons
  const professionOptions = [
    { 
      value: 'electrician', 
      label: t('registerForm.professions.electrician'),
      icon: <Icon name="Zap" size={16} />
    },
    { 
      value: 'plumber', 
      label: t('registerForm.professions.plumber'),
      icon: <Icon name="Wrench" size={16} />
    },
    { 
      value: 'painter', 
      label: t('registerForm.professions.painter'),
      icon: <Icon name="Brush" size={16} />
    },
    { 
      value: 'carpenter', 
      label: t('registerForm.professions.carpenter'),
      icon: <Icon name="Hammer" size={16} />
    },
    { 
      value: 'mason', 
      label: t('registerForm.professions.mason'),
      icon: <Icon name="Building" size={16} />
    },
    { 
      value: 'tiling', 
      label: t('registerForm.professions.tiling'),
      icon: <Icon name="Grid" size={16} />
    },
    { 
      value: 'roofing', 
      label: t('registerForm.professions.roofing'),
      icon: <Icon name="Home" size={16} />
    },
    { 
      value: 'heating', 
      label: t('registerForm.professions.heating'),
      icon: <Icon name="Thermometer" size={16} />
    },
    { 
      value: 'renovation', 
      label: t('registerForm.professions.renovation'),
      icon: <Icon name="Tool" size={16} />
    },
    { 
      value: 'cleaning', 
      label: t('registerForm.professions.cleaning'),
      icon: <Icon name="Sparkles" size={16} />
    },
    { 
      value: 'solar', 
      label: t('registerForm.professions.solar'),
      icon: <Icon name="Sun" size={16} />
    },
    { 
      value: 'gardening', 
      label: t('registerForm.professions.gardening'),
      icon: <Icon name="Flower" size={16} />
    },
    { 
      value: 'locksmith', 
      label: t('registerForm.professions.locksmith'),
      icon: <Icon name="Lock" size={16} />
    },
    { 
      value: 'glazing', 
      label: t('registerForm.professions.glazing'),
      icon: <Icon name="Square" size={16} />
    },
    { 
      value: 'insulation', 
      label: t('registerForm.professions.insulation'),
      icon: <Icon name="Shield" size={16} />
    },
    { 
      value: 'airConditioning', 
      label: t('registerForm.professions.airConditioning'),
      icon: <Icon name="Thermometer" size={16} />
    },
    { 
      value: 'other', 
      label: t('registerForm.professions.other'),
      icon: <Icon name="Tool" size={16} />
    }
  ];
  
  // Country options
  const countries = [
    
    { value: 'BE', label: t('registerForm.countries.BE'), icon: <Icon name="Flag" size={16} /> },
    { value: 'FR', label: t('registerForm.countries.FR'), icon: <Icon name="Flag" size={16} /> },
    { value: 'CH', label: t('registerForm.countries.CH'), icon: <Icon name="Flag" size={16} /> },
    { value: 'LU', label: t('registerForm.countries.LU'), icon: <Icon name="Flag" size={16} /> },
    { value: 'CA', label: t('registerForm.countries.CA'), icon: <Icon name="Flag" size={16} /> },
    { value: 'GB', label: t('registerForm.countries.GB'), icon: <Icon name="Flag" size={16} /> },
    { value: 'DE', label: t('registerForm.countries.DE'), icon: <Icon name="Flag" size={16} /> },
    { value: 'IT', label: t('registerForm.countries.IT'), icon: <Icon name="Flag" size={16} /> },
    { value: 'ES', label: t('registerForm.countries.ES'), icon: <Icon name="Flag" size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('registerForm.step1.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('registerForm.step1.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
        <Input
            label={t('registerForm.step1.firstName')}
          type="text"
            placeholder={t('registerForm.step1.firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            error={errors.firstName}
          required
        />
        <Input
            label={t('registerForm.step1.lastName')}
          type="text"
            placeholder={t('registerForm.step1.lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            error={errors.lastName}
          required
        />
        </div>
        
        <Select
          label={t('registerForm.step1.profession')}
          placeholder={t('registerForm.step1.professionPlaceholder')}
          options={professionOptions}
          value={formData.profession || []}
          onChange={(e) => updateFormData('profession', e.target.value)}
          error={errors.profession}
          multiple
          required
        />

        <Input
          label={t('registerForm.step1.email')}
          type="email"
          placeholder={t('registerForm.step1.emailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          error={errors.email}
          required
        />

        <div className="space-y-2">
          <div className="relative">
            <Input
              label={t('registerForm.step1.password')}
              type={showPassword ? "text" : "password"}
              placeholder={t('registerForm.step1.passwordPlaceholder')}
              value={formData.password}
              onChange={handlePasswordChange}
              error={errors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
            </button>
          </div>
          
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('registerForm.step1.passwordStrength')}</span>
                <span className={`font-medium ${
                  passwordStrength < 25 ? 'text-error' :
                  passwordStrength < 50 ? 'text-warning' :
                  passwordStrength < 75 ? 'text-accent' : 'text-success'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <Select
          label={t('registerForm.step1.country')}
          placeholder={t('registerForm.step1.countryPlaceholder')}
          options={countries}
          value={formData.country || 'BE'}
          onChange={(e) => updateFormData('country', e.target.value)}
          error={errors.country}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('registerForm.step1.phone')} <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-48 flex-shrink-0">
              <Select
                label=""
                placeholder="Code"
                options={useMemo(() => 
                  Object.entries(COUNTRY_PHONE_CODES)
                    .map(([countryCode, phoneCode]) => {
                      return {
                        value: `${phoneCode}_${countryCode}`, // Make value unique by combining phone code and country code
                        phoneCode: phoneCode, // Store phone code separately
                        countryCode: countryCode, // Store country code separately
                        label: `${phoneCode} ${countryCode}`
                      };
                    })
                    .sort((a, b) => {
                      // Sort by phone code, then by country code
                      const codeA = a.phoneCode;
                      const codeB = b.phoneCode;
                      if (codeA !== codeB) {
                        return codeA.localeCompare(codeB);
                      }
                      return a.label.localeCompare(b.label);
                    }), [])}
                value={getCurrentSelectValue()}
                onChange={(e) => {
                  // Extract phone code and country code from the unique value
                  const [phoneCode, countryCode] = e.target.value.split('_');
                  setPhoneCountryCode(phoneCode);
                  if (countryCode && countryCode !== formData.country) {
                    updateFormData('country', countryCode);
                  }
                }}
                error={errors.phoneCountryCode}
              />
            </div>
            <div className="flex-1">
              <Input
                label=""
                type="tel"
                placeholder={t('registerForm.step1.phonePlaceholder')}
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                error={errors.phone}
                required
              />
            </div>
          </div>
          {errors.phone && (
            <p className="text-sm text-error mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Icon name="Zap" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              {t('registerForm.step1.aiBoost.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('registerForm.step1.aiBoost.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;