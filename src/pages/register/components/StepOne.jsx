import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { useTranslation } from '../../../context/TranslationContext';

const StepOne = ({ formData, updateFormData, errors }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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
    if (passwordStrength < 25) return t('register.step1.weak') || 'Faible';
    if (passwordStrength < 50) return t('register.step1.medium') || 'Moyen';
    if (passwordStrength < 75) return t('register.step1.good') || 'Bon';
    return t('register.step1.excellent') || 'Excellent';
  };
  
  // Profession options with icons
  const professionOptions = [
    { 
      value: 'electrician', 
      label: t('register.step1.professions.electrician') || 'Électricien',
      icon: <Icon name="Zap" size={16} />
    },
    { 
      value: 'plumber', 
      label: t('register.step1.professions.plumber') || 'Plombier',
      icon: <Icon name="Wrench" size={16} />
    },
    { 
      value: 'painter', 
      label: t('register.step1.professions.painter') || 'Peintre',
      icon: <Icon name="Brush" size={16} />
    },
    { 
      value: 'carpenter', 
      label: t('register.step1.professions.carpenter') || 'Menuisier',
      icon: <Icon name="Hammer" size={16} />
    },
    { 
      value: 'mason', 
      label: t('register.step1.professions.mason') || 'Maçon',
      icon: <Icon name="Building" size={16} />
    },
    { 
      value: 'tiling', 
      label: t('register.step1.professions.tiling') || 'Carreleur',
      icon: <Icon name="Grid" size={16} />
    },
    { 
      value: 'roofing', 
      label: t('register.step1.professions.roofing') || 'Couvreur',
      icon: <Icon name="Home" size={16} />
    },
    { 
      value: 'heating', 
      label: t('register.step1.professions.heating') || 'Chauffagiste',
      icon: <Icon name="Thermometer" size={16} />
    },
    { 
      value: 'gardening', 
      label: t('register.step1.professions.gardening') || 'Paysagiste',
      icon: <Icon name="Flower" size={16} />
    },
    { 
      value: 'locksmith', 
      label: t('register.step1.professions.locksmith') || 'Serrurier',
      icon: <Icon name="Lock" size={16} />
    },
    { 
      value: 'other', 
      label: t('register.step1.professions.other') || 'Autre',
      icon: <Icon name="Tool" size={16} />
    }
  ];
  
  // Country options
  const countries = [
    { value: 'FR', label: 'France', icon: <Icon name="Flag" size={16} /> },
    { value: 'BE', label: 'Belgique', icon: <Icon name="Flag" size={16} /> },
    { value: 'CH', label: 'Suisse', icon: <Icon name="Flag" size={16} /> },
    { value: 'LU', label: 'Luxembourg', icon: <Icon name="Flag" size={16} /> },
    { value: 'CA', label: 'Canada', icon: <Icon name="Flag" size={16} /> },
    { value: 'GB', label: 'Royaume-Uni', icon: <Icon name="Flag" size={16} /> },
    { value: 'DE', label: 'Allemagne', icon: <Icon name="Flag" size={16} /> },
    { value: 'IT', label: 'Italie', icon: <Icon name="Flag" size={16} /> },
    { value: 'ES', label: 'Espagne', icon: <Icon name="Flag" size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('register.step1.title') || 'Créez votre compte'}
        </h2>
        <p className="text-muted-foreground">
          {t('register.step1.subtitle') || 'Commencez votre essai gratuit de 14 jours dès aujourd\'hui'}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t('register.step1.fullName') || 'Nom complet'}
          type="text"
          placeholder="Jean Dupont"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          error={errors.fullName}
          required
        />
        
        <Input
          label={t('register.step1.businessName') || 'Nom de l\'entreprise'}
          type="text"
          placeholder="Dupont Plomberie"
          value={formData.companyName}
          onChange={(e) => updateFormData('companyName', e.target.value)}
          error={errors.companyName}
          required
        />
        
        <Select
          label={t('register.step1.profession') || 'Profession / Type d\'activité'}
          placeholder="Sélectionnez votre métier"
          options={professionOptions}
          value={formData.profession}
          onChange={(e) => updateFormData('profession', e.target.value)}
          error={errors.profession}
          required
        />

        <Input
          label={t('register.step1.email') || 'Adresse email'}
          type="email"
          placeholder="jean@exemple.fr"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          error={errors.email}
          required
        />

        <div className="space-y-2">
          <div className="relative">
            <Input
              label={t('register.step1.password') || 'Mot de passe'}
              type={showPassword ? "text" : "password"}
              placeholder="Créez un mot de passe sécurisé"
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
                <span className="text-muted-foreground">{t('register.step1.passwordStrength') || 'Force du mot de passe:'}</span>
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

        <Input
          label={t('register.step1.phone') || 'Numéro de téléphone'}
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          error={errors.phone}
          required
        />
        
        <Select
          label={t('register.step1.country') || 'Pays'}
          placeholder="Sélectionnez votre pays"
          options={countries}
          value={formData.country || 'FR'}
          onChange={(e) => updateFormData('country', e.target.value)}
          error={errors.country}
          required
        />
      </div>

      <div className="bg-muted rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Icon name="Zap" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              {t('register.boostSignatures.title') || 'Boostez vos signatures de 40%'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('register.step1.aiOptimization') || 'Notre IA optimise automatiquement vos devis pour maximiser vos chances de signature.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;