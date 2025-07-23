import React from 'react';
import { useTranslation } from '../../../context/TranslationContext';

const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const { t, language } = useTranslation();
  
  // Calculate percentage based on current step (step 1 = 33%, step 2 = 66%, step 3 = 100%)
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  // Format the step text based on language
  const getStepText = () => {
    if (language === 'fr') {
      return `Étape ${currentStep} sur ${totalSteps}`;
    } else if (language === 'nl') {
      return `Stap ${currentStep} van ${totalSteps}`;
    } else {
      return `Step ${currentStep} of ${totalSteps}`;
    }
  };
  
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {getStepText()}
        </span>
        <span className="text-sm text-muted-foreground">
          {percentage}% {t('register.completed') || 'completed'}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;