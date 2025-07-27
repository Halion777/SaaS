import React from 'react';

const FinancialConfig = ({ 
  vatConfig, 
  onVATConfigChange, 
  advanceConfig, 
  onAdvanceConfigChange,
  marketingBannerConfig,
  onMarketingBannerConfigChange,
  defaultConditions,
  onDefaultConditionsChange
}) => {
  const getDefaultText = (language) => {
    switch(language) {
      case 'FR':
        return 'Conditions générales:\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an';
      case 'NL':
        return 'Algemene voorwaarden:\n• Offerte geldig voor 30 dagen\n• Voorschot van 30% bij bestelling\n• Saldo bij levering\n• Betalingstermijn: 30 dagen\n• BTW inbegrepen\n• Materialen en arbeid gegarandeerd 1 jaar';
      case 'EN':
        return 'General conditions:\n• Quote valid for 30 days\n• 30% advance payment upon order\n• Balance upon delivery\n• Payment term: 30 days\n• VAT included\n• Materials and labor guaranteed for 1 year';
      default:
        return 'Conditions générales:\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an';
    }
  };

  const handleLanguageChange = (language) => {
    onDefaultConditionsChange(language, getDefaultText(language));
  };

  return (
    <div className="space-y-6">
      {/* VAT Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Affichage de la TVA</h3>
            <p className="text-sm text-gray-600">Afficher le calcul de TVA sur les devis</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={vatConfig.display}
              onChange={(e) => onVATConfigChange('display', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {vatConfig.display && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de TVA (%)
            </label>
            <input 
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={vatConfig.rate}
              onChange={(e) => onVATConfigChange('rate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>0%</span>
              <span>{vatConfig.rate}%</span>
              <span>25%</span>
            </div>
          </div>
        )}
      </div>

      {/* Advance Payment Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Acompte</h3>
            <p className="text-sm text-gray-600">Demander un acompte</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={advanceConfig.enabled}
              onChange={(e) => onAdvanceConfigChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {advanceConfig.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant de l'acompte (€)
            </label>
            <input 
              type="number"
              value={advanceConfig.amount}
              onChange={(e) => onAdvanceConfigChange('amount', parseFloat(e.target.value))}
              min="0"
              className="w-full p-2 border rounded-lg"
              placeholder="Montant de l'acompte"
            />
          </div>
        )}
      </div>

      {/* Marketing Banner Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Bannière marketing</h3>
            <p className="text-sm text-gray-600">Offre promotionnelle</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={marketingBannerConfig.enabled}
              onChange={(e) => onMarketingBannerConfigChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {marketingBannerConfig.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message marketing
            </label>
            <input 
              type="text"
              value={marketingBannerConfig.message}
              onChange={(e) => onMarketingBannerConfigChange('message', e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Ex: -10% si signé avant 48h"
            />
          </div>
        )}
      </div>

      {/* Default Conditions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Conditions générales par défaut</h3>
        <div className="flex space-x-2 mb-4">
          <button 
            className={`px-4 py-2 rounded-lg ${defaultConditions.language === 'FR' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => handleLanguageChange('FR')}
          >
            Modèle FR
          </button>
          <button 
            className={`px-4 py-2 rounded-lg ${defaultConditions.language === 'NL' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => handleLanguageChange('NL')}
          >
            Modèle NL
          </button>
          <button 
            className={`px-4 py-2 rounded-lg ${defaultConditions.language === 'EN' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => handleLanguageChange('EN')}
          >
            Modèle EN
          </button>
        </div>
        
        <textarea
          value={defaultConditions.text}
          onChange={(e) => onDefaultConditionsChange(defaultConditions.language, e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Entrez vos conditions générales..."
        />
      </div>
    </div>
  );
};

export default FinancialConfig; 