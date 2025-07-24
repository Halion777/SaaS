import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const DashboardTour = ({ run, onFinish }) => {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Define tour steps once the component is mounted
    // This ensures all DOM elements are available
    setSteps([
      {
        target: '.dashboard-metrics',
        content: 'Vos indicateurs clés : devis, taux de signature, chiffre d\'affaires et gains IA.',
        placement: 'bottom',
        title: 'Indicateurs Principaux'
      },
      {
        target: '.dashboard-new-quote-button',
        content: 'Créez un nouveau devis en un clic depuis n\'importe quelle page.',
        placement: 'bottom',
        title: 'Créer un Devis'
      },
      {
        target: '.dashboard-recent-quotes',
        content: 'Suivez vos devis récents et leur statut (envoyé, vu, signé, refusé).',
        placement: 'top',
        title: 'Devis Récents'
      },
      {
        target: '.dashboard-quick-actions',
        content: 'Accès rapide aux actions les plus utilisées.',
        placement: 'top',
        title: 'Actions Rapides'
      },
      {
        target: '.dashboard-analytics-button',
        content: 'Analyses détaillées pour approfondir vos performances.',
        placement: 'bottom',
        title: 'Analyses Détaillées'
      }
    ]);
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    
    // Tour is finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#1E40AF', // Blue color matching the UI
          zIndex: 10000,
        },
        tooltip: {
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: '#1E40AF',
        },
        buttonBack: {
          color: '#1E40AF',
        }
      }}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer'
      }}
    />
  );
};

export default DashboardTour; 