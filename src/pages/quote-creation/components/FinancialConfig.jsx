import React, { useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';

const FinancialConfig = ({ 
  vatConfig, 
  onVATConfigChange, 
  advanceConfig, 
  onAdvanceConfigChange,
  marketingBannerConfig,
  onMarketingBannerConfigChange,
  defaultConditions,
  onDefaultConditionsChange,
  materialPriceDisplay,
  onMaterialPriceDisplayChange
}) => {
  const { t } = useTranslation();
  const getDefaultText = (language) => {
    switch(language) {
      case 'FR':
        return 'CONDITIONS GÉNÉRALES:\n\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an';
      case 'NL':
        return 'ALGEMENE VOORWAARDEN:\n\n• Offerte geldig voor 30 dagen\n• Voorschot van 30% bij bestelling\n• Saldo bij levering\n• Betalingstermijn: 30 dagen\n• BTW inbegrepen\n• Materialen en arbeid gegarandeerd 1 jaar';
      case 'EN':
        return 'GENERAL CONDITIONS:\n\n• Quote valid for 30 days\n• 30% deposit upon order\n• Balance upon delivery\n• Payment term: 30 days\n• VAT included\n• Materials and labor guaranteed for 1 year';
      default:
        return 'CONDITIONS GÉNÉRALES:\n\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an';
    }
  };

  const handleLanguageChange = (language) => {
    onDefaultConditionsChange(language, getDefaultText(language));
  };

  // Detect app language from localStorage and sync default conditions once
  const getAppLanguageCode = () => {
    try {
      const raw = (localStorage.getItem('language') || 'fr').toLowerCase();
      if (raw.startsWith('en')) return 'EN';
      if (raw.startsWith('nl')) return 'NL';
      return 'FR';
    } catch {
      return 'FR';
    }
  };

  useEffect(() => {
    const appLang = getAppLanguageCode();
    if (defaultConditions?.language !== appLang) {
      handleLanguageChange(appLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* VAT Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon name="Calculator" size={16} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('quoteCreation.financialConfig.vatDisplay', 'Affichage de la TVA')}</h3>
              <p className="text-xs text-gray-600">{t('quoteCreation.financialConfig.vatDisplayDesc', 'Afficher le calcul de TVA sur les devis')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={vatConfig.display}
              onChange={(e) => onVATConfigChange('display', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {vatConfig.display && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('quoteCreation.financialConfig.vatRate', 'Taux de TVA')}: <span className="text-blue-600 font-semibold">{vatConfig.rate}%</span>
            </label>
            <div className="relative">
              <input 
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={vatConfig.rate}
                onChange={(e) => onVATConfigChange('rate', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advance Payment Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="CreditCard" size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('quoteCreation.financialConfig.deposit', 'Acompte')}</h3>
              <p className="text-xs text-gray-600">{t('quoteCreation.financialConfig.depositDesc', 'Demander un acompte à la commande')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={advanceConfig.enabled}
              onChange={(e) => onAdvanceConfigChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {advanceConfig.enabled && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('quoteCreation.financialConfig.depositAmount', "Montant de l'acompte")} (€)
            </label>
            <div className="relative">
              <input 
                type="number"
                value={advanceConfig.amount}
                onChange={(e) => onAdvanceConfigChange('amount', parseFloat(e.target.value))}
                min="0"
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">€</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marketing Banner Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="Megaphone" size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('quoteCreation.financialConfig.marketingBanner', 'Bannière marketing')}</h3>
              <p className="text-xs text-gray-600">{t('quoteCreation.financialConfig.marketingBannerDesc', 'Afficher une offre promotionnelle')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={marketingBannerConfig.enabled}
              onChange={(e) => onMarketingBannerConfigChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {marketingBannerConfig.enabled && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('quoteCreation.financialConfig.promotionalMessage', 'Message promotionnel')}
            </label>
            <input 
              type="text"
              value={marketingBannerConfig.message}
              onChange={(e) => onMarketingBannerConfigChange('message', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
              placeholder={t('quoteCreation.financialConfig.promotionalMessagePlaceholder', "Ex: -10% si signé avant 48h")}
            />
          </div>
        )}
      </div>

      {/* Material Price Display Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Icon name="Package" size={16} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Afficher les prix des matériaux</h3>
              <p className="text-xs text-gray-600">Contrôle l'affichage des prix matériaux dans l'aperçu du devis</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={materialPriceDisplay ?? (localStorage.getItem('include-materials-prices') ?? 'true') === 'true'}
              onChange={(e) => {
                const value = e.target.checked;
                localStorage.setItem('include-materials-prices', String(value));
                window.dispatchEvent(new StorageEvent('storage', { key: 'include-materials-prices', newValue: String(value) }));
                if (onMaterialPriceDisplayChange) {
                  onMaterialPriceDisplayChange(value);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Default Conditions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Icon name="FileText" size={16} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('quoteCreation.financialConfig.generalConditions', 'Conditions générales')}</h3>
            <p className="text-xs text-gray-600">{t('quoteCreation.financialConfig.predefinedTemplates', 'Modèles prédéfinis par langue')}</p>
          </div>
        </div>
        
        {/* Single language tab based on selected app language */}
        <div className="mb-4">
          <div
            className={
              `inline-flex items-center px-3 py-2 rounded-lg border-2 text-xs ` +
              `border-blue-500 bg-blue-50 text-blue-700`
            }
          >
            <Icon name="Flag" size={12} className="mr-1" />
            <span className="font-medium">
              {defaultConditions.language === 'EN' ? 'English' : defaultConditions.language === 'NL' ? 'Nederlands' : 'Français'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg border border-gray-100">
          <textarea
            value={defaultConditions.text}
            onChange={(e) => onDefaultConditionsChange(defaultConditions.language, e.target.value)}
            rows={6}
            className="w-full p-3 bg-transparent border-0 rounded-lg resize-none focus:outline-none focus:ring-0 text-xs leading-relaxed"
            placeholder={t('quoteCreation.financialConfig.enterConditions', "Entrez vos conditions générales...")}
          />
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default FinancialConfig; 