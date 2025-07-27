import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const QuickInvoiceCreation = ({ isOpen, onClose, onCreateInvoice }) => {
  const [invoiceData, setInvoiceData] = useState({
    type: 'manual',
    clientId: '',
    quoteId: '',
    amount: '',
    description: '',
    dueDate: '',
    paymentMethod: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const clientOptions = [
    { value: '1', label: 'Jean Martin - Plomberie' },
    { value: '2', label: 'Sophie Dubois - Électricité' },
    { value: '3', label: 'Pierre Moreau - Peinture' },
    { value: '4', label: 'Marie Leroy - Carrelage' },
    { value: '5', label: 'Paul Bernard - Menuiserie' }
  ];

  const signedQuoteOptions = [
    { value: '1', label: 'DEVIS-2024-001 - Jean Martin (1 250€)' },
    { value: '2', label: 'DEVIS-2024-003 - Sophie Dubois (2 800€)' },
    { value: '3', label: 'DEVIS-2024-007 - Pierre Moreau (950€)' },
    { value: '4', label: 'DEVIS-2024-012 - Marie Leroy (3 200€)' }
  ];

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte bancaire' }
  ];

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newInvoice = {
        id: Date.now(),
        number: `FACT-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        ...invoiceData,
        issueDate: new Date().toISOString(),
        status: 'pending'
      };

      onCreateInvoice(newInvoice);
      onClose();
      
      // Reset form
      setInvoiceData({
        type: 'manual',
        clientId: '',
        quoteId: '',
        amount: '',
        description: '',
        dueDate: '',
        paymentMethod: ''
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Création rapide de facture</h2>
                <p className="text-sm text-muted-foreground">Créez une nouvelle facture en quelques clics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'manual')}
                className={`p-4 border-2 rounded-lg transition-all duration-150 ${
                  invoiceData.type === 'manual' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon name="Edit" size={20} color="var(--color-primary)" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Facture manuelle</p>
                    <p className="text-sm text-muted-foreground">Créer une facture personnalisée</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange('type', 'from_quote')}
                className={`p-4 border-2 rounded-lg transition-all duration-150 ${
                  invoiceData.type === 'from_quote' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon name="FileCheck" size={20} color="var(--color-primary)" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Depuis un devis</p>
                    <p className="text-sm text-muted-foreground">Convertir un devis signé</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Form Fields */}
            {invoiceData.type === 'from_quote' ? (
              <Select
                label="Devis signé à convertir"
                placeholder="Sélectionner un devis"
                options={signedQuoteOptions}
                value={invoiceData.quoteId}
                onChange={(value) => handleInputChange('quoteId', value)}
                required
              />
            ) : (
              <>
                <Select
                  label="Client"
                  placeholder="Sélectionner un client"
                  options={clientOptions}
                  value={invoiceData.clientId}
                  onChange={(value) => handleInputChange('clientId', value)}
                  required
                />

                <Input
                  label="Montant (€)"
                  type="number"
                  placeholder="0.00"
                  value={invoiceData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />

                <Input
                  label="Description"
                  type="text"
                  placeholder="Description des travaux réalisés"
                  value={invoiceData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date d'échéance"
                type="date"
                value={invoiceData.dueDate || getDefaultDueDate()}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />

              <Select
                label="Moyen de paiement préféré"
                placeholder="Sélectionner"
                options={paymentMethodOptions}
                value={invoiceData.paymentMethod}
                onChange={(value) => handleInputChange('paymentMethod', value)}
              />
            </div>

            {/* AI Suggestions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Sparkles" size={16} color="var(--color-primary)" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Suggestions IA</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Délai de paiement optimal : 30 jours pour ce type de client</li>
                    <li>• Probabilité de paiement à temps : 85%</li>
                    <li>• Recommandation : Ajouter une remise de 2% pour paiement anticipé</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                iconName="Plus"
                iconPosition="left"
              >
                Créer la facture
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickInvoiceCreation;