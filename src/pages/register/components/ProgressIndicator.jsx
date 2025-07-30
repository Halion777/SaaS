import React from 'react';
import { useTranslation } from 'react-i18next';

const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const { t, i18n } = useTranslation();
  
  // Calculate percentage based on current step (step 1 = 33%, step 2 = 66%, step 3 = 100%)
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  // Debug: Check if i18n is ready and what language is active
  console.log('i18n ready:', i18n.isInitialized, 'language:', i18n.language);
  
  // Format the step text with explicit interpolation
  const getStepText = () => {
    // Try the translation first
    const stepText = t('registerForm.progress.step', { 
      current: currentStep, 
      total: totalSteps 
    });
    
    console.log('Raw translation key:', 'registerForm.progress.step');
    console.log('Translation result:', stepText);
    console.log('Interpolation values:', { current: currentStep, total: totalSteps });
    
    // If the translation returns the key itself, use fallback
    if (stepText === 'registerForm.progress.step') {
      console.log('Translation key not found, using fallback');
      // Fallback based on current language
      if (i18n.language === 'fr') {
        return `Étape ${currentStep} sur ${totalSteps}`;
      } else if (i18n.language === 'nl') {
        return `Stap ${currentStep} van ${totalSteps}`;
      } else {
        return `Step ${currentStep} of ${totalSteps}`;
      }
    }
    
    return stepText;
  };
  
  // Format the completed text with explicit interpolation
  const getCompletedText = () => {
    // Try the translation first
    const completedText = t('registerForm.progress.completed', { 
      percentage: percentage 
    });
    
    console.log('Raw translation key:', 'registerForm.progress.completed');
    console.log('Translation result:', completedText);
    console.log('Interpolation values:', { percentage });
    
    // If the translation returns the key itself, use fallback
    if (completedText === 'registerForm.progress.completed') {
      console.log('Translation key not found, using fallback');
      // Fallback based on current language
      if (i18n.language === 'fr') {
        return `${percentage}% terminé`;
      } else if (i18n.language === 'nl') {
        return `${percentage}% voltooid`;
      } else {
        return `${percentage}% completed`;
      }
    }
    
    return completedText;
  };
  
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {getStepText()}
        </span>
        <span className="text-sm text-muted-foreground">
          {getCompletedText()}
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