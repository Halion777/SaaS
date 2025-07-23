import React from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const StepTwo = ({ formData, updateFormData, errors }) => {
  const businessSizes = [
    { value: 'solo', label: 'Artisan seul' },
    { value: 'small', label: '2-5 employés' },
    { value: 'medium', label: '6-20 employés' },
    { value: 'large', label: '20+ employés' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Quelques informations supplémentaires
        </h2>
        <p className="text-muted-foreground">
          Personnalisez Havitam selon votre activité
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label="Taille de l'entreprise"
          placeholder="Nombre d'employés"
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
                Gain de temps
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatisez vos relances et optimisez vos devis en quelques clics.
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
                Plus de signatures
              </h3>
              <p className="text-sm text-muted-foreground">
                Notre IA analyse et améliore vos devis pour maximiser les conversions.
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
                Vos données sont sécurisées
              </h3>
              <p className="text-sm text-muted-foreground">
                Toutes vos informations sont cryptées et stockées en toute sécurité conformément au RGPD.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTwo;