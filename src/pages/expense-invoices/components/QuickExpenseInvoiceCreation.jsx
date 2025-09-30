import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import { OCRService } from '../../../services/ocrService';

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
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

  const handleFileUpload = (files) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (files) => {
    setUploadedFiles(files);
  };

  const handleOCRProcess = async (file) => {
    setIsOCRProcessing(true);
    setOcrStatus('Analyse de la facture en cours...');
    
    try {
      const result = await OCRService.extractInvoiceData(file);
      
      if (result.success) {
        const extractedData = result.data;
        
        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          supplierName: extractedData.supplier_name || '',
          supplierEmail: extractedData.supplier_email || '',
          supplierVatNumber: extractedData.supplier_vat_number || '',
          invoiceNumber: extractedData.invoice_number || '',
          amount: extractedData.amount?.toString() || '',
          netAmount: extractedData.net_amount?.toString() || '',
          vatAmount: extractedData.vat_amount?.toString() || '',
          issueDate: extractedData.issue_date || new Date().toISOString().split('T')[0],
          dueDate: extractedData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: extractedData.notes || ''
        }));

        setOcrStatus('Données extraites avec succès !');
        
        // Remove the file after successful OCR
        setUploadedFiles([]);
      } else {
        setOcrStatus('Échec de l\'extraction. Veuillez remplir manuellement.');
        console.error('OCR failed:', result.error);
      }
    } catch (error) {
      setOcrStatus('Erreur lors de l\'extraction. Veuillez remplir manuellement.');
      console.error('OCR error:', error);
    } finally {
      setIsOCRProcessing(false);
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
      setUploadedFiles([]);
      setOcrStatus('');
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
      setUploadedFiles([]);
      setOcrStatus('');
    }
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
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
              disabled={isSubmitting}
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OCR File Upload */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Scan" size={16} color="var(--color-blue-600)" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Scanner automatique de facture</h4>
                  <p className="text-sm text-blue-700">Téléchargez une facture pour extraire automatiquement les données</p>
                </div>
              </div>
              
              <FileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                uploadedFiles={uploadedFiles}
                acceptedTypes=".pdf,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024}
                showOCRButton={true}
                onOCRProcess={handleOCRProcess}
              />
              
              {isOCRProcessing && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-blue-700">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  <span>Analyse de la facture en cours...</span>
                </div>
              )}
              
              {ocrStatus && !isOCRProcessing && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                  {ocrStatus}
                </div>
              )}
            </div>

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