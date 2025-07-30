import React from 'react';

const ProgressIndicator = ({ currentStep, totalSteps }) => {
  
  // Calculate percentage based on current step (step 1 = 33%, step 2 = 66%, step 3 = 100%)
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  // Format the step text
  const getStepText = () => {
    return `Étape ${currentStep} sur ${totalSteps}`;
  };
  
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {getStepText()}
        </span>
        <span className="text-sm text-muted-foreground">
          {percentage}% terminé
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