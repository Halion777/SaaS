import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const QuickExpenseInvoiceCreation = ({ isOpen, onClose, onCreateExpenseInvoice }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierEmail: '',
    supplierVatNumber: '',
    invoiceNumber: '',
    amount: '',
    netAmount: '',
    vatAmount: '',
    category: '',
    source: 'manual',
    issueDate: '',
    dueDate: '',
    paymentMethod: '',
    notes: '',
    invoiceFile: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

  const categoryOptions = [
    { value: '', label: 'Sélectionner une catégorie' },
    { value: 'fuel', label: 'Fuel (véhicules, machines, transport)' },
    { value: 'it_software', label: 'IT / Services logiciels' },
    { value: 'energy', label: 'Énergie (électricité, gaz, eau, chauffage)' },
    { value: 'materials_supplies', label: 'Matériaux / Fournitures' },
    { value: 'telecommunications', label: 'Télécommunications' },
    { value: 'rent_property', label: 'Loyer & Coûts immobiliers' },
    { value: 'professional_services', label: 'Services professionnels' },
    { value: 'insurance', label: 'Assurance' },
    { value: 'travel_accommodation', label: 'Voyage & Hébergement' },
    { value: 'banking_financial', label: 'Coûts bancaires & financiers' },
    { value: 'marketing_advertising', label: 'Marketing & Publicité' },
    { value: 'other_professional', label: 'Autres coûts professionnels' }
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Sélectionner une méthode' },
    { value: 'Virement bancaire', label: 'Virement bancaire' },
    { value: 'Chèque', label: 'Chèque' },
    { value: 'Prélèvement', label: 'Prélèvement' },
    { value: 'Espèces', label: 'Espèces' },
    { value: 'Carte bancaire', label: 'Carte bancaire' }
  ];

  const sourceOptions = [
    { value: 'manual', label: 'Manuel (OCR)' },
    { value: 'peppol', label: 'Peppol (automatique)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, invoiceFile: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierName || !formData.amount) {
      alert('Veuillez remplir au minimum le nom du fournisseur et le montant.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare invoice data for the service
      const invoiceData = {
        supplierName: formData.supplierName,
        supplierEmail: formData.supplierEmail,
        supplierVatNumber: formData.supplierVatNumber,
        invoiceNumber: formData.invoiceNumber,
        amount: parseFloat(formData.amount),
        netAmount: parseFloat(formData.netAmount) || parseFloat(formData.amount),
        vatAmount: parseFloat(formData.vatAmount) || 0,
        category: formData.category,
        source: formData.source,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        invoiceFile: formData.invoiceFile
      };

      // Call the parent handler which will use the service
      await onCreateExpenseInvoice(invoiceData);
      
      onClose();
      
      // Reset form
      setFormData({
        supplierName: '',
        supplierEmail: '',
        supplierVatNumber: '',
        invoiceNumber: '',
        amount: '',
        netAmount: '',
        vatAmount: '',
        category: '',
        source: 'manual',
        issueDate: '',
        dueDate: '',
        paymentMethod: '',
        notes: '',
        invoiceFile: null
      });
    } catch (error) {
      alert('Erreur lors de la création de la facture. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form on close
      setFormData({
        supplierName: '',
        supplierEmail: '',
        supplierVatNumber: '',
        invoiceNumber: '',
        amount: '',
        netAmount: '',
        vatAmount: '',
        category: '',
        source: 'manual',
        issueDate: '',
        dueDate: '',
        paymentMethod: '',
        notes: '',
        invoiceFile: null
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Nouvelle facture fournisseur</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Créez une nouvelle facture fournisseur manuellement
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supplier Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Informations fournisseur
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du fournisseur *
                  </label>
                  <Input
                    value={formData.supplierName}
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                    placeholder="Ex: Materiaux Pro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email du fournisseur
                  </label>
                  <Input
                    type="email"
                    value={formData.supplierEmail}
                    onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                    placeholder="contact@fournisseur.fr"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Détails de la facture
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Numéro de facture
                  </label>
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder="Ex: FACT-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Montant (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Catégorie
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    options={categoryOptions}
                    placeholder="Sélectionner une catégorie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Méthode de paiement
                  </label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    options={paymentMethodOptions}
                    placeholder="Sélectionner une méthode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date d'émission
                  </label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date d'échéance
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fichier de facture
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="invoice-file-upload"
                  />
                  <label htmlFor="invoice-file-upload" className="cursor-pointer">
                    <Icon name="Upload" size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {formData.invoiceFile ? formData.invoiceFile.name : 'Cliquez pour sélectionner un fichier ou glissez-déposez'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formats acceptés: PDF, JPG, PNG, XML
                    </p>
                  </label>
                </div>
                {formData.invoiceFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="FileText" size={16} />
                    <span>{formData.invoiceFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, invoiceFile: null }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                )}
                
                {/* OCR Status Display */}
                {formData.invoiceFile && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Scan" size={16} className="text-primary" />
                      <span className="font-medium">Traitement OCR</span>
                      {isOCRProcessing && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          <span>Analyse en cours...</span>
                        </div>
                      )}
                    </div>
                    {ocrStatus && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ocrStatus}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Les informations seront automatiquement extraites du fichier lors de la création
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Informations supplémentaires
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires sur cette facture..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Actions rapides</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      issueDate: new Date().toISOString().split('T')[0],
                      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }));
                  }}
                >
                  Dates par défaut
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      paymentMethod: 'Virement bancaire',
                      category: 'Services'
                    }));
                  }}
                >
                  Valeurs par défaut
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                iconName={isSubmitting ? "Loader2" : "Plus"}
                iconPosition="left"
              >
                {isSubmitting ? 'Création...' : 'Créer la facture'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickExpenseInvoiceCreation; 