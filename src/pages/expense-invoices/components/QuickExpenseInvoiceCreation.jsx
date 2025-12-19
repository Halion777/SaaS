import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import { OCRService } from '../../../services/ocrService';
// Removed expenseInvoiceCalculator - using direct values from UBL XML or database

const QuickExpenseInvoiceCreation = ({ isOpen, onClose, onCreateExpenseInvoice, onUpdateExpenseInvoice, invoiceToEdit = null }) => {
  const { t } = useTranslation();
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
    invoiceType: 'final',
    issueDate: '',
    dueDate: '',
    paymentMethod: '',
    notes: '',
    invoiceFile: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

  // Helper function to round VAT up (ceiling) to 2 decimal places
  // Example: 72.975 -> 72.98 (not 72.97)
  // This ensures VAT always rounds up when calculated
  const roundVatUp = (vatAmount) => {
    if (!vatAmount || isNaN(vatAmount)) return 0;
    // Multiply by 100, round up (ceiling), then divide by 100
    return Math.ceil(vatAmount * 100) / 100;
  };

  // Helper function to normalize amount (convert dot to comma for decimal separator, keep comma as default)
  const normalizeAmount = (value) => {
    if (!value || typeof value !== 'string') return value;
    // Keep comma as decimal separator, convert dot to comma
    // Handle European format: "1.234,56" -> "1234,56" or "60,45" -> "60,45"
    // Handle US format: "1,234.56" -> "1234,56"
    let normalized = value.trim();
    
    // If there's both comma and dot, determine which is decimal separator
    if (normalized.includes(',') && normalized.includes('.')) {
      // Find positions
      const commaPos = normalized.lastIndexOf(',');
      const dotPos = normalized.lastIndexOf('.');
      // The one that comes last is likely the decimal separator
      if (commaPos > dotPos) {
        // European format: "1.234,56" -> remove dots (thousands), keep comma
        normalized = normalized.replace(/\./g, '');
      } else {
        // US format: "1,234.56" -> remove commas (thousands), convert dot to comma
        normalized = normalized.replace(/,/g, '').replace('.', ',');
      }
    } else if (normalized.includes('.')) {
      // Only dot - convert to comma for decimal separator
      normalized = normalized.replace('.', ',');
    }
    // Remove any remaining spaces
    normalized = normalized.replace(/\s/g, '');
    return normalized;
  };

  // Helper function to parse amount (handles both comma and dot, converts to number)
  const parseAmount = (value) => {
    if (!value || typeof value !== 'string') return 0;
    // Convert comma to dot for parsing (JavaScript parseFloat uses dot)
    const normalized = value.trim().replace(',', '.');
    return parseFloat(normalized) || 0;
  };
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Track file paths in storage for deletion
  const [fileStoragePaths, setFileStoragePaths] = useState({}); // { fileIndex: storagePath }

  // Populate form when editing
  useEffect(() => {
    if (invoiceToEdit && isOpen) {
      setFormData({
        supplierName: invoiceToEdit.supplier_name || '',
        supplierEmail: invoiceToEdit.supplier_email || '',
        supplierVatNumber: invoiceToEdit.supplier_vat_number || '',
        invoiceNumber: invoiceToEdit.invoice_number || '',
        amount: invoiceToEdit.amount?.toString() || '',
        netAmount: invoiceToEdit.net_amount?.toString() || '',
        vatAmount: invoiceToEdit.vat_amount?.toString() || '',
        category: invoiceToEdit.category || '',
        source: invoiceToEdit.source || 'manual',
        invoiceType: invoiceToEdit.invoice_type || 'final',
        issueDate: invoiceToEdit.issue_date || '',
        dueDate: invoiceToEdit.due_date || '',
        paymentMethod: invoiceToEdit.payment_method || '',
        notes: invoiceToEdit.notes || '',
        invoiceFile: null
      });
    } else if (!invoiceToEdit && isOpen) {
      // Reset form when opening for create
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
        invoiceType: 'final',
        issueDate: '',
        dueDate: '',
        paymentMethod: '',
        notes: '',
        invoiceFile: null
      });
    }
  }, [invoiceToEdit, isOpen]);

  const categoryOptions = [
    { value: '', label: t('expenseInvoices.createModal.category.select', 'Select a category') },
    { value: 'fuel', label: t('expenseInvoices.categories.fuel', 'Fuel') + ' (' + t('expenseInvoices.createModal.category.fuelDescription', 'vehicles, machinery, transport') + ')' },
    { value: 'it_software', label: t('expenseInvoices.categories.itSoftware', 'IT/Software') + ' / ' + t('expenseInvoices.createModal.category.itDescription', 'Software Services') },
    { value: 'energy', label: t('expenseInvoices.categories.energy', 'Energy') + ' (' + t('expenseInvoices.createModal.category.energyDescription', 'electricity, gas, water, heating') + ')' },
    { value: 'materials_supplies', label: t('expenseInvoices.categories.materialsSupplies', 'Materials/Supplies') },
    { value: 'telecommunications', label: t('expenseInvoices.categories.telecommunications', 'Telecommunications') },
    { value: 'rent_property', label: t('expenseInvoices.categories.rentProperty', 'Rent & Property') + ' ' + t('expenseInvoices.createModal.category.rentDescription', 'Costs') },
    { value: 'professional_services', label: t('expenseInvoices.categories.professionalServices', 'Professional Services') },
    { value: 'insurance', label: t('expenseInvoices.categories.insurance', 'Insurance') },
    { value: 'travel_accommodation', label: t('expenseInvoices.categories.travelAccommodation', 'Travel & Accommodation') },
    { value: 'banking_financial', label: t('expenseInvoices.categories.bankingFinancial', 'Banking & Financial') + ' ' + t('expenseInvoices.createModal.category.bankingDescription', 'Costs') },
    { value: 'marketing_advertising', label: t('expenseInvoices.categories.marketingAdvertising', 'Marketing & Advertising') },
    { value: 'other_professional', label: t('expenseInvoices.categories.otherProfessional', 'Other Professional Costs') }
  ];

  const paymentMethodOptions = [
    { value: '', label: t('expenseInvoices.createModal.paymentMethod.select', 'Select a method') },
    { value: 'Virement bancaire', label: t('expenseInvoices.createModal.paymentMethod.bankTransfer', 'Bank Transfer') },
    { value: 'Chèque', label: t('expenseInvoices.createModal.paymentMethod.check', 'Check') },
    { value: 'Prélèvement', label: t('expenseInvoices.createModal.paymentMethod.directDebit', 'Direct Debit') },
    { value: 'Espèces', label: t('expenseInvoices.createModal.paymentMethod.cash', 'Cash') },
    { value: 'Carte bancaire', label: t('expenseInvoices.createModal.paymentMethod.card', 'Bank Card') }
  ];

  const sourceOptions = [
    { value: 'manual', label: t('expenseInvoices.createModal.source.manual', 'Manual (OCR)') },
    { value: 'peppol', label: t('expenseInvoices.createModal.source.peppol', 'Peppol (automatic)') }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (files) => {
    // Find the index of the newly uploaded file
    const newFileIndex = files.length - 1;
    
    setUploadedFiles(files);
    
    // Automatically process OCR when a file is uploaded
    if (files && files.length > 0 && newFileIndex >= 0) {
      await handleOCRProcess(files[newFileIndex], newFileIndex);
    }
  };

  const handleFileRemove = async (files, removedIndex) => {
    // Remove file from storage if it exists
    if (removedIndex !== undefined && fileStoragePaths[removedIndex]) {
      const storagePath = fileStoragePaths[removedIndex];
      try {
        const result = await OCRService.removeFileFromStorage(storagePath, 'expense-invoice-attachments');
        if (result.success) {
          console.log('File successfully removed from storage:', storagePath);
        } else {
          console.error('Failed to remove file from storage:', result.error);
        }
      } catch (error) {
        console.error('Error removing file from storage:', error);
        // Continue with UI update even if storage deletion fails
      }
      
      // Remove from storage paths tracking
      const newStoragePaths = { ...fileStoragePaths };
      delete newStoragePaths[removedIndex];
      
      // Re-index remaining files
      const reindexedPaths = {};
      Object.keys(newStoragePaths).forEach((key, newIndex) => {
        reindexedPaths[newIndex] = newStoragePaths[key];
      });
      setFileStoragePaths(reindexedPaths);
    }
    
    setUploadedFiles(files);
  };

  const handleOCRProcess = async (file, fileIndex) => {
    setIsOCRProcessing(true);
    setOcrStatus(t('expenseInvoices.createModal.ocr.processing', 'Analyzing invoice...'));
    
    try {
      // Keep file in storage until user removes it
      const result = await OCRService.extractExpenseInvoiceData(file, true);
      
      if (result.success && result.data) {
        const extractedData = result.data;
        
        // Store the file path in storage for later deletion
        if (result.storagePath && fileIndex !== undefined) {
          setFileStoragePaths(prev => ({
            ...prev,
            [fileIndex]: result.storagePath
          }));
        }
        
        // Auto-fill form with extracted data (only fill fields that are empty or have extracted data)
        setFormData(prev => ({
          ...prev,
          supplierName: extractedData.supplier_name || prev.supplierName || '',
          supplierEmail: extractedData.supplier_email || prev.supplierEmail || '',
          supplierVatNumber: extractedData.supplier_vat_number || prev.supplierVatNumber || '',
          invoiceNumber: extractedData.invoice_number || prev.invoiceNumber || '',
          amount: extractedData.amount ? normalizeAmount(extractedData.amount.toString()) : (prev.amount || ''),
          netAmount: extractedData.net_amount ? normalizeAmount(extractedData.net_amount.toString()) : (prev.netAmount || ''),
          vatAmount: extractedData.vat_amount ? normalizeAmount(extractedData.vat_amount.toString()) : (prev.vatAmount || ''),
          category: extractedData.category || prev.category || '',
          issueDate: extractedData.issue_date || prev.issueDate || new Date().toISOString().split('T')[0],
          dueDate: extractedData.due_date || prev.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentMethod: extractedData.payment_method || prev.paymentMethod || '',
          notes: extractedData.notes || extractedData.description || prev.notes || ''
        }));

        setOcrStatus(t('expenseInvoices.createModal.ocr.success', 'Data extracted successfully!'));
        
        // Keep the file in storage - it will be removed when user clicks cross icon
      } else {
        // Extraction failed - delete file from storage and remove from UI
        setOcrStatus('error');
        const errorMessage = result.error || t('expenseInvoices.createModal.ocr.extractionFailed', 'Data extraction failed');
        
        // Delete file from storage if it exists (OCRService should have already deleted it, but ensure it's gone)
        const existingStoragePath = fileStoragePaths[fileIndex] || result.storagePath;
        if (existingStoragePath) {
          try {
            const deleteResult = await OCRService.removeFileFromStorage(existingStoragePath, 'expense-invoice-attachments');
            if (deleteResult.success) {
              console.log('File deleted from storage due to extraction failure:', existingStoragePath);
            } else {
              console.error('Failed to delete file from storage:', deleteResult.error);
            }
          } catch (deleteError) {
            console.error('Error deleting file from storage:', deleteError);
          }
        }
        
        // Remove file from uploaded files list
        setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
        
        // Remove from storage paths if it exists
        if (fileIndex !== undefined) {
          setFileStoragePaths(prev => {
            const newPaths = { ...prev };
            delete newPaths[fileIndex];
            // Re-index remaining files
            const reindexedPaths = {};
            Object.keys(newPaths).forEach((key, newIndex) => {
              reindexedPaths[newIndex] = newPaths[key];
            });
            return reindexedPaths;
          });
        }
        
        // Log error (removed alert as per user request)
        console.error('OCR extraction failed:', errorMessage);
      }
    } catch (error) {
      // Critical error - delete file from storage and remove from UI
      setOcrStatus('error');
      
      // Try to get storage path from fileStoragePaths if available
      const existingStoragePath = fileStoragePaths[fileIndex];
      
      // Delete file from storage if it was uploaded
      if (existingStoragePath) {
        try {
          const deleteResult = await OCRService.removeFileFromStorage(existingStoragePath, 'expense-invoice-attachments');
          if (deleteResult.success) {
            console.log('File deleted from storage due to processing error:', existingStoragePath);
          } else {
            console.error('Failed to delete file from storage:', deleteResult.error);
          }
        } catch (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
        }
      }
      
      // Remove file from uploaded files list
      setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
      
      // Remove from storage paths if it exists
      if (fileIndex !== undefined) {
        setFileStoragePaths(prev => {
          const newPaths = { ...prev };
          delete newPaths[fileIndex];
          // Re-index remaining files
          const reindexedPaths = {};
          Object.keys(newPaths).forEach((key, newIndex) => {
            reindexedPaths[newIndex] = newPaths[key];
          });
          return reindexedPaths;
        });
      }
      
      // Log error (removed alert as per user request)
      const errorMessage = error.message || t('expenseInvoices.createModal.ocr.processingError', 'Error processing document');
      console.error('OCR processing failed:', error);
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.supplierName || !formData.amount) {
      alert(t('expenseInvoices.createModal.errors.requiredFields', 'Please fill in at least the supplier name and amount.'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare invoice data for the service
      // Note: Files are already uploaded to Supabase Storage during OCR processing
      // User has verified and edited the extracted data before clicking "Add Invoice"
      const invoiceData = {
        supplierName: formData.supplierName,
        supplierEmail: formData.supplierEmail,
        supplierVatNumber: formData.supplierVatNumber,
        invoiceNumber: formData.invoiceNumber,
        amount: parseAmount(formData.amount),
        netAmount: parseAmount(formData.netAmount) || parseAmount(formData.amount),
        // Round VAT up (ceiling) when saving to ensure proper rounding
        vatAmount: roundVatUp(parseAmount(formData.vatAmount) || 0),
        category: formData.category,
        source: formData.source,
        invoiceType: formData.invoiceType || 'final',
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
        // Files are already in Supabase Storage from OCR - no need to pass file object
      };

      // Call the parent handler - update if editing, create if new
      if (invoiceToEdit && onUpdateExpenseInvoice) {
        await onUpdateExpenseInvoice(invoiceToEdit.id, invoiceData);
      } else {
        await onCreateExpenseInvoice(invoiceData);
      }
      
      // Reset form before closing to avoid state updates during unmount
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
      setFileStoragePaths({}); // Clear storage paths
      setOcrStatus('');
      
      // Use setTimeout to ensure state updates complete before closing
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 0);
    } catch (error) {
      console.error('Error creating expense invoice:', error);
      alert(t('expenseInvoices.createModal.errors.createError', 'Error creating invoice. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!isSubmitting) {
      // Clean up: Remove all files from storage before closing
      if (Object.keys(fileStoragePaths).length > 0) {
        const storagePaths = Object.values(fileStoragePaths);
        console.log('Removing files from storage on modal close:', storagePaths);
        
        for (const storagePath of storagePaths) {
          try {
            const result = await OCRService.removeFileFromStorage(storagePath, 'expense-invoice-attachments');
            if (result.success) {
              console.log('File successfully removed from storage on close:', storagePath);
            } else {
              console.error('Failed to remove file from storage on close:', result.error);
            }
          } catch (error) {
            console.error('Error removing file from storage on close:', error);
          }
        }
      }
      
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
      setFileStoragePaths({}); // Clear storage paths
      setOcrStatus('');
      
      // Close modal after cleanup
      onClose();
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
                <h2 className="text-xl font-semibold text-foreground">
                  {invoiceToEdit ? t('expenseInvoices.createModal.title.edit', 'Edit Invoice') : t('expenseInvoices.createModal.title.create', 'Quick Invoice Creation')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {invoiceToEdit ? t('expenseInvoices.createModal.subtitle.edit', 'Edit invoice information') : t('expenseInvoices.createModal.subtitle.create', 'Create a new invoice in a few clicks')}
                </p>
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
                  <h4 className="text-sm font-medium text-blue-900 mb-1">{t('expenseInvoices.createModal.ocr.title', 'Automatic Invoice Scanner')}</h4>
                  <p className="text-sm text-blue-700">{t('expenseInvoices.createModal.ocr.description', 'Upload an invoice to automatically extract data')}</p>
                </div>
              </div>
              
                <FileUpload
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFiles={uploadedFiles}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp"
                  maxSize={10 * 1024 * 1024}
                  showOCRButton={false}
                />
                
                {isOCRProcessing && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-blue-700">
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    <span>{t('expenseInvoices.createModal.ocr.processing', 'Analyzing invoice...')}</span>
                  </div>
                )}
                
                {ocrStatus && !isOCRProcessing && ocrStatus !== 'error' && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-green-700">
                    <Icon name="CheckCircle" size={16} />
                    <span>{ocrStatus}</span>
                  </div>
                )}
                
                {ocrStatus === 'error' && !isOCRProcessing && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-red-700">
                    <Icon name="AlertCircle" size={16} />
                    <span>{t('expenseInvoices.createModal.ocr.extractionFailedMessage', 'Extraction failed - Document structure not supported. Please fill in manually.')}</span>
                  </div>
                )}
            </div>

            {/* Supplier Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                {t('expenseInvoices.createModal.sections.supplierInfo', 'Supplier Information')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.supplierName', 'Supplier Name')} *
                  </label>
                  <Input
                    value={formData.supplierName}
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                    placeholder={t('expenseInvoices.createModal.placeholders.supplierName', 'Ex: Materials Pro')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.supplierEmail', 'Supplier Email')}
                  </label>
                  <Input
                    type="email"
                    value={formData.supplierEmail}
                    onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                    placeholder={t('expenseInvoices.createModal.placeholders.supplierEmail', 'contact@supplier.com')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.supplierVatNumber', 'Supplier VAT Number')}
                  </label>
                  <Input
                    value={formData.supplierVatNumber}
                    onChange={(e) => handleInputChange('supplierVatNumber', e.target.value)}
                    placeholder={t('expenseInvoices.createModal.placeholders.supplierVatNumber', 'Ex: BE0123456789')}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                {t('expenseInvoices.createModal.sections.invoiceDetails', 'Invoice Details')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.invoiceNumber', 'Invoice Number')}
                  </label>
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder={t('expenseInvoices.createModal.placeholders.invoiceNumber', 'Ex: INV-2024-001')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.totalAmount', 'Total Amount incl. VAT (€)')} *
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow digits, comma, dot, and spaces (for formatting)
                      value = value.replace(/[^\d,.\s]/g, '');
                      // Allow only one decimal separator (comma or dot)
                      const hasComma = value.includes(',');
                      const hasDot = value.includes('.');
                      if (hasComma && hasDot) {
                        // Keep the last one as decimal separator
                        const lastComma = value.lastIndexOf(',');
                        const lastDot = value.lastIndexOf('.');
                        if (lastComma > lastDot) {
                          value = value.replace(/\./g, '');
                        } else {
                          value = value.replace(/,/g, '');
                        }
                      }
                      
                      handleInputChange('amount', value);
                      
                      // Simple calculation: total = net + vat
                      const total = parseAmount(value);
                      const net = parseAmount(formData.netAmount);
                      const vat = parseAmount(formData.vatAmount);
                      
                      // Auto-calculate: if net + vat = total, keep them; otherwise recalculate
                      if (net > 0 && vat > 0 && Math.abs((net + vat) - total) < 0.01) {
                        // Keep existing values
                      } else if (net > 0) {
                        // Calculate VAT from total and net: VAT = Total - Net
                        // Round VAT up (ceiling) to ensure proper rounding
                        const newVat = roundVatUp(total - net);
                        if (newVat >= 0) {
                          handleInputChange('vatAmount', newVat.toFixed(2).replace('.', ','));
                        }
                      } else if (vat > 0) {
                        // Calculate net from total and VAT: Net = Total - VAT
                        const newNet = total - vat;
                        if (newNet >= 0) {
                          handleInputChange('netAmount', newNet.toFixed(2).replace('.', ','));
                        }
                      }
                    }}
                    placeholder="0,00"
                    required
                  />
                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.netAmount', 'Net Amount (€)')}
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.netAmount}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow digits, comma, dot, and spaces
                      value = value.replace(/[^\d,.\s]/g, '');
                      // Allow only one decimal separator
                      const hasComma = value.includes(',');
                      const hasDot = value.includes('.');
                      if (hasComma && hasDot) {
                        const lastComma = value.lastIndexOf(',');
                        const lastDot = value.lastIndexOf('.');
                        if (lastComma > lastDot) {
                          value = value.replace(/\./g, '');
                        } else {
                          value = value.replace(/,/g, '');
                        }
                      }
                      
                      handleInputChange('netAmount', value);
                      
                      // Simple calculation: total = net + vat
                      const net = parseAmount(value);
                      const vat = parseAmount(formData.vatAmount);
                      const total = net + vat;
                      
                      // Update total when net amount changes
                      // Use the newly calculated total, not the stale formData.amount
                      if (total > 0) {
                        handleInputChange('amount', total.toFixed(2).replace('.', ','));
                      }
                      
                      // Note: No need to recalculate VAT here since we're using net + vat to calculate total
                      // If VAT needs to be adjusted, the user should change the VAT field directly
                    }}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.vatAmount', 'VAT Amount (€)')}
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.vatAmount}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow digits, comma, dot, and spaces
                      value = value.replace(/[^\d,.\s]/g, '');
                      // Allow only one decimal separator
                      const hasComma = value.includes(',');
                      const hasDot = value.includes('.');
                      if (hasComma && hasDot) {
                        const lastComma = value.lastIndexOf(',');
                        const lastDot = value.lastIndexOf('.');
                        if (lastComma > lastDot) {
                          value = value.replace(/\./g, '');
                        } else {
                          value = value.replace(/,/g, '');
                        }
                      }
                      
                      handleInputChange('vatAmount', value);
                      
                      // Simple calculation: total = net + vat
                      const vat = parseAmount(value);
                      const total = parseAmount(formData.amount);
                      const net = parseAmount(formData.netAmount);
                      
                      if (total > 0) {
                        // Calculate net from total and VAT: Net = Total - VAT
                        const newNet = total - vat;
                        if (newNet >= 0) {
                          handleInputChange('netAmount', newNet.toFixed(2).replace('.', ','));
                        }
                      } else if (net > 0) {
                        // Calculate total from net and VAT: Total = Net + VAT
                        const newTotal = net + vat;
                        if (newTotal > 0) {
                          handleInputChange('amount', newTotal.toFixed(2).replace('.', ','));
                        }
                      }
                    }}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.category', 'Category')}
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    options={categoryOptions}
                    placeholder={t('expenseInvoices.createModal.category.select', 'Select a category')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.paymentMethod', 'Payment Method')}
                  </label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    options={paymentMethodOptions}
                    placeholder={t('expenseInvoices.createModal.paymentMethod.select', 'Select a method')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.invoiceType', 'Invoice Type')}
                  </label>
                  <Select
                    value={formData.invoiceType}
                    onValueChange={(value) => handleInputChange('invoiceType', value)}
                    options={[
                      { value: 'final', label: t('expenseInvoices.createModal.invoiceType.final', 'Final Invoice') },
                      { value: 'deposit', label: t('expenseInvoices.createModal.invoiceType.deposit', 'Deposit Invoice') }
                    ]}
                    placeholder={t('expenseInvoices.createModal.invoiceType.select', 'Select invoice type')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.issueDate', 'Issue Date')}
                  </label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('expenseInvoices.createModal.fields.dueDate', 'Due Date')}
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
                {t('expenseInvoices.createModal.sections.additionalInfo', 'Additional Information')}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('expenseInvoices.createModal.fields.notes', 'Notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t('expenseInvoices.createModal.placeholders.notes', 'Add notes or comments about this invoice...')}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
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
                {t('expenseInvoices.createModal.buttons.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                iconName={isSubmitting ? "Loader2" : (invoiceToEdit ? "Save" : "Plus")}
                iconPosition="left"
              >
                {isSubmitting ? (invoiceToEdit ? t('expenseInvoices.createModal.buttons.updating', 'Updating...') : t('expenseInvoices.createModal.buttons.creating', 'Creating...')) : (invoiceToEdit ? t('expenseInvoices.createModal.buttons.update', 'Update Invoice') : t('expenseInvoices.createModal.buttons.create', 'Create Invoice'))}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickExpenseInvoiceCreation; 