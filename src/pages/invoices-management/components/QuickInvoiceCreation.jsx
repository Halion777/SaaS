import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import { fetchClients } from '../../../services/clientsService';
import { OCRService } from '../../../services/ocrService';

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
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [clientOptions, setClientOptions] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Fetch clients when component mounts
  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const result = await fetchClients();
        if (result.data) {
          const options = result.data.map(client => ({
            value: client.id,
            label: `${client.name}${client.company_name ? ` - ${client.company_name}` : ''}`
          }));
          setClientOptions(options);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

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

  const handleFileUpload = (files) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (files) => {
    setUploadedFiles(files);
  };

  const handleOCRProcess = async (file) => {
    setIsOCRProcessing(true);
    try {
      const result = await OCRService.extractInvoiceData(file);
      
      if (result.success) {
        const extractedData = result.data;
        
        // Auto-fill form with extracted data
        setInvoiceData(prev => ({
          ...prev,
          amount: extractedData.amount?.toString() || '',
          description: extractedData.description || '',
          dueDate: extractedData.due_date || getDefaultDueDate(),
          notes: extractedData.notes || ''
        }));

        // Show success message
        console.log('OCR data extracted successfully:', extractedData);
        
        // Remove the file after successful OCR
        setUploadedFiles([]);
      } else {
        console.error('OCR failed:', result.error);
        alert('OCR processing failed. Please try again or fill the form manually.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      alert('OCR processing failed. Please try again or fill the form manually.');
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare invoice data for backend
      const invoiceDataForBackend = {
        clientId: invoiceData.clientId,
        amount: invoiceData.amount,
        description: invoiceData.description,
        dueDate: invoiceData.dueDate || getDefaultDueDate(),
        paymentMethod: invoiceData.paymentMethod,
        title: invoiceData.description, // Use description as title
        notes: invoiceData.notes || '', // Can be added later if needed
        taxAmount: 0, // Can be added later if needed
        discountAmount: 0 // Can be added later if needed
      };

      // Call the parent handler with the prepared data
      await onCreateInvoice(invoiceDataForBackend);
      
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
      setUploadedFiles([]);
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

            {/* OCR File Upload */}
            {invoiceData.type === 'manual' && (
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
              </div>
            )}

            {/* Form Fields */}
            {invoiceData.type === 'from_quote' ? (
              <Select
                label="Devis signé à convertir"
                placeholder="Sélectionner un devis"
                options={signedQuoteOptions}
                value={invoiceData.quoteId}
                onChange={(e) => handleInputChange('quoteId', e.target.value)}
                required
              />
            ) : (
              <>
                <Select
                  label="Client"
                  placeholder={isLoadingClients ? "Chargement des clients..." : "Sélectionner un client"}
                  options={clientOptions}
                  value={invoiceData.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  required
                  disabled={isLoadingClients}
                />
                {clientOptions.length === 0 && !isLoadingClients && (
                  <p className="text-sm text-muted-foreground">
                    Aucun client trouvé. Veuillez d'abord créer des clients.
                  </p>
                )}

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

                {invoiceData.notes && (
                  <Input
                    label="Notes (extrait par OCR)"
                    type="text"
                    placeholder="Notes additionnelles"
                    value={invoiceData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                )}
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
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
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