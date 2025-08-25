import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';

const StepIndicator = ({ currentStep, totalSteps = 4, onStepChange }) => {
  const { t } = useTranslation();
  const steps = [
    { id: 1, title: t('quoteCreation.steps.client'), icon: 'User' },
    { id: 2, title: t('quoteCreation.steps.tasks'), icon: 'Calculator' },
    { id: 3, title: t('quoteCreation.steps.files'), icon: 'Image' },
    { id: 4, title: t('quoteCreation.steps.preview'), icon: 'Eye' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => onStepChange && onStepChange(step.id)}
            >
              <div className={`
                w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
                ${currentStep >= step.id 
                  ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-background border-border text-muted-foreground hover:bg-muted/30'
                }
              `}>
                {currentStep > step.id ? (
                  <Icon name="Check" size={16} className="sm:w-5 sm:h-5" />
                ) : (
                  <Icon name={step.icon} size={16} className="sm:w-5 sm:h-5" />
                )}
              </div>
              <span className={`
                text-xs sm:text-sm font-medium mt-1 sm:mt-2 transition-colors duration-200
                ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-200
                ${currentStep > step.id ? 'bg-primary' : 'bg-border'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;