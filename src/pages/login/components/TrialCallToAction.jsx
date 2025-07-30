import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TrialCallToAction = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartTrial = () => {
    navigate('/register');
  };

  return (
    <div className="mt-8 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>{t('login.noAccount')}</span>
        </div>

        <Button
          variant="trial"
          size="lg"
          fullWidth
          onClick={handleStartTrial}
          iconName="Sparkles"
          iconPosition="left"
        >
          {t('ui.buttons.startTrial')}
        </Button>

        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Check" size={14} color="var(--color-success)" />
            <span>{t('login.trial.noCommitment')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Check" size={14} color="var(--color-success)" />
            <span>{t('login.trial.setupTime')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialCallToAction;