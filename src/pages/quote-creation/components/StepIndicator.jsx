import React from 'react';
import Icon from '../../../components/AppIcon';

const StepIndicator = ({ currentStep, totalSteps = 4 }) => {
  const steps = [
    { id: 1, title: 'Client', icon: 'Users' },
    { id: 2, title: 'Tâches', icon: 'Wrench' },
    { id: 3, title: 'Fichiers', icon: 'Upload' },
    { id: 4, title: 'Aperçu', icon: 'Eye' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
                ${currentStep >= step.id 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'bg-background border-border text-muted-foreground'
                }
              `}>
                {currentStep > step.id ? (
                  <Icon name="Check" size={20} color="currentColor" />
                ) : (
                  <Icon name={step.icon} size={20} color="currentColor" />
                )}
              </div>
              <span className={`
                text-sm font-medium mt-2 transition-colors duration-200
                ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-colors duration-200
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