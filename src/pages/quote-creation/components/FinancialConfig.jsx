import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const FinancialConfig = ({ financialConfig, onFinancialConfigChange }) => {
  const handleToggle = (field) => {
    onFinancialConfigChange(field, !financialConfig[field]);
  };

  const handleInputChange = (field, value) => {
    onFinancialConfigChange(field, value);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Icon name="Euro" size={20} className="mr-2" />
        Configuration financière
      </h3>

      <div className="space-y-6">
        {/* VAT Display */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Afficher la TVA
            </label>
            <p className="text-xs text-muted-foreground">
              Calcul automatique TVA {financialConfig.vatRate || 21}%
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={financialConfig.showVAT || false}
              onChange={() => handleToggle('showVAT')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Advance Payment */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Acompte
            </label>
            <p className="text-xs text-muted-foreground">
              Demander un acompte
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={financialConfig.advancePayment || false}
              onChange={() => handleToggle('advancePayment')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Advance Payment Amount */}
        {financialConfig.advancePayment && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Montant de l'acompte (€)
            </label>
            <Input
              type="number"
              value={financialConfig.advanceAmount || ''}
              onChange={(e) => handleInputChange('advanceAmount', e.target.value)}
              min="0"
              step="0.01"
              placeholder="45"
            />
          </div>
        )}

        {/* Marketing Banner */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Bannière marketing
            </label>
            <p className="text-xs text-muted-foreground">
              Offre promotionnelle
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={financialConfig.marketingBanner || false}
              onChange={() => handleToggle('marketingBanner')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Marketing Message */}
        {financialConfig.marketingBanner && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message marketing
            </label>
            <textarea
              value={financialConfig.marketingMessage || ''}
              onChange={(e) => handleInputChange('marketingMessage', e.target.value)}
              rows={3}
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: -10% si signé avant 48h"
            />
          </div>
        )}

        {/* Default General Conditions */}
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-foreground mb-3">Conditions générales par défaut</h4>
          
          <div className="flex space-x-2 mb-4">
            <button className="px-3 py-1 text-sm border border-blue-500 bg-blue-50 text-blue-700 rounded">
              Modèle FR
            </button>
            <button className="px-3 py-1 text-sm border border-border text-muted-foreground rounded hover:border-blue-300">
              Modèle NL
            </button>
            <button className="px-3 py-1 text-sm border border-border text-muted-foreground rounded hover:border-blue-300">
              Modèle EN
            </button>
          </div>

          <textarea
            value={financialConfig.defaultConditions || 'Devis valable 30 jours. Paiement à 30 jours. TVA en sus si applicable.'}
            onChange={(e) => handleInputChange('defaultConditions', e.target.value)}
            rows={4}
            className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Conditions générales par défaut..."
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialConfig; 