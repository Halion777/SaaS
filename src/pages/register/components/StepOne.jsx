import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const StepOne = ({ formData, updateFormData, errors }) => {
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
    if (passwordStrength < 25) return 'Faible';
    if (passwordStrength < 50) return 'Moyen';
    if (passwordStrength < 75) return 'Bon';
    return 'Excellent';
  };
  
  // Country options
  const countries = [
    { value: 'FR', label: 'France' },
    { value: 'BE', label: 'Belgique' },
    { value: 'CH', label: 'Suisse' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'Royaume-Uni' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'IT', label: 'Italie' },
    { value: 'ES', label: 'Espagne' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Créez votre compte
        </h2>
        <p className="text-muted-foreground">
          Commencez votre essai gratuit de 14 jours dès aujourd'hui
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nom complet"
          type="text"
          placeholder="Jean Dupont"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          error={errors.fullName}
          required
        />
        
        <Input
          label="Nom de l'entreprise"
          type="text"
          placeholder="Dupont Plomberie"
          value={formData.companyName}
          onChange={(e) => updateFormData('companyName', e.target.value)}
          error={errors.companyName}
          required
        />
        
        <Select
          label="Profession / Type d'activité"
          placeholder="Sélectionnez votre métier"
          options={[
            { value: 'electrician', label: 'Électricien' },
            { value: 'plumber', label: 'Plombier' },
            { value: 'painter', label: 'Peintre' },
            { value: 'other', label: 'Autre' }
          ]}
          value={formData.profession}
          onChange={(e) => updateFormData('profession', e.target.value)}
          error={errors.profession}
          required
        />

        <Input
          label="Adresse email"
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
              label="Mot de passe"
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
                <span className="text-muted-foreground">Force du mot de passe:</span>
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
          label="Numéro de téléphone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          error={errors.phone}
          required
        />
        
        <Select
          label="Pays"
          placeholder="Sélectionnez votre pays"
          options={countries}
          value={formData.country || 'FR'}
          onChange={(e) => updateFormData('country', e.target.value)}
          error={errors.country}
          required
        />
      </div>

      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Icon name="Zap" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Boostez vos signatures de 40%
            </h3>
            <p className="text-sm text-muted-foreground">
              Notre IA optimise automatiquement vos devis pour maximiser vos chances de signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;