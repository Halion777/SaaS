import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const QuickSupplierInvoiceUpload = ({ isOpen, onClose, onUploadSupplierInvoice }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierEmail: '',
    invoiceNumber: '',
    amount: '',
    category: '',
    issueDate: '',
    dueDate: '',
    paymentMethod: '',
    invoiceFile: null
  });

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const categoryOptions = [
    { value: '', label: 'Sélectionner une catégorie' },
    { value: 'Matériaux', label: 'Matériaux' },
    { value: 'Outillage', label: 'Outillage' },
    { value: 'Services', label: 'Services' },
    { value: 'Fournitures', label: 'Fournitures' },
    { value: 'Assurance', label: 'Assurance' },
    { value: 'Transport', label: 'Transport' },
    { value: 'Marketing', label: 'Marketing' }
  ];

  const paymentMethodOptions = [
    { value: '', label: 'Sélectionner une méthode' },
    { value: 'Virement bancaire', label: 'Virement bancaire' },
    { value: 'Chèque', label: 'Chèque' },
    { value: 'Prélèvement', label: 'Prélèvement' },
    { value: 'Espèces', label: 'Espèces' },
    { value: 'Carte bancaire', label: 'Carte bancaire' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file) => {
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setFormData(prev => ({ ...prev, invoiceFile: file }));
    } else {
      alert('Veuillez sélectionner un fichier PDF ou une image.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierName || !formData.amount || !formData.invoiceFile) {
      alert('Veuillez remplir tous les champs obligatoires et télécharger un fichier.');
      return;
    }

    setIsUploading(true);

    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newInvoice = {
        id: Date.now(),
        number: formData.invoiceNumber || `FOURN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        supplierName: formData.supplierName,
        supplierEmail: formData.supplierEmail,
        amount: parseFloat(formData.amount),
        status: 'pending',
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod,
        category: formData.category,
        invoiceFile: formData.invoiceFile.name
      };

      onUploadSupplierInvoice(newInvoice);
      onClose();
      
      // Reset form
      setFormData({
        supplierName: '',
        supplierEmail: '',
        invoiceNumber: '',
        amount: '',
        category: '',
        issueDate: '',
        dueDate: '',
        paymentMethod: '',
        invoiceFile: null
      });
    } catch (error) {
      alert('Erreur lors de l\'upload. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Importer une facture fournisseur</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez une nouvelle facture fournisseur à votre système
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fichier de facture *
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.invoiceFile ? (
                  <div className="space-y-2">
                    <Icon name="FileText" size={32} color="var(--color-primary)" className="mx-auto" />
                    <p className="text-sm font-medium text-foreground">{formData.invoiceFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, invoiceFile: null }))}
                    >
                      Changer de fichier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon name="Upload" size={32} color="var(--color-muted-foreground)" className="mx-auto" />
                    <p className="text-sm font-medium text-foreground">
                      Glissez-déposez votre facture ici
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou cliquez pour sélectionner un fichier (PDF, JPG, PNG)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Sélectionner un fichier</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
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

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                iconName={isUploading ? "Loader2" : "Upload"}
                iconPosition="left"
              >
                {isUploading ? 'Upload en cours...' : 'Importer la facture'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickSupplierInvoiceUpload; 