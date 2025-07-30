import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TrialCallToAction = () => {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    navigate('/register');
  };

  return (
    <div className="mt-8 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>Pas encore de compte ?</span>
        </div>

        <Button
          variant="trial"
          size="lg"
          fullWidth
          onClick={handleStartTrial}
          iconName="Sparkles"
          iconPosition="left"
        >
          Commencer l'essai gratuit
        </Button>

        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Check" size={14} color="var(--color-success)" />
            <span>Sans engagement</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Check" size={14} color="var(--color-success)" />
            <span>Configuration en 5 min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialCallToAction;