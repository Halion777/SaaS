import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import { OCRService } from '../../../services/ocrService';
import InvoiceService from '../../../services/invoiceService';
import { fetchClients, createClient } from '../../../services/clientsService';
import { supabase } from '../../../services/supabaseClient';
import ClientModal from '../../client-management/components/ClientModal';

const parseAmount = (value) => {
  if (value === '' || value == null) return 0;
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().replace(',', '.');
  return parseFloat(normalized) || 0;
};

const normalizeAmount = (value) => {
  if (!value && value !== 0) return value;
  if (typeof value === 'number') return String(value).replace('.', ',');
  let v = String(value).trim();
  if (v.includes('.')) v = v.replace('.', ',');
  return v;
};

const createEmptyLineItem = () => ({
  id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  description: '',
  quantity: '',
  unit: 'unit',
  unit_price: '',
  total: ''
});

const AddClientInvoiceModal = ({ isOpen, onClose, onCreated }) => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: '',
    title: '',
    description: '',
    net_amount: '',
    tax_amount: '',
    discount_amount: '',
    final_amount: '',
    vat_percent: '21',
    issue_date: '',
    due_date: '',
    payment_terms: 'Paiement à 30 jours',
    payment_method: 'À définir',
    notes: '',
    invoice_type: 'final',
    deposit_amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileStoragePaths, setFileStoragePaths] = useState({});
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchClients().then(({ data }) => setClients(Array.isArray(data) ? data : []));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const loadNextNumber = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: num, error: e } = await supabase.rpc('generate_invoice_number', { user_id: user.id });
        if (!e && num) setFormData(prev => ({ ...prev, invoice_number: num }));
      } catch (_) {}
    };
    loadNextNumber();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      issue_date: prev.issue_date || today,
      due_date: prev.due_date || due
    }));
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = async (files) => {
    const newIndex = files.length - 1;
    setUploadedFiles(files);
    if (files?.length > 0 && newIndex >= 0) await runOCR(files[newIndex], newIndex);
  };

  const handleFileRemove = async (files, removedIndex) => {
    if (removedIndex !== undefined && fileStoragePaths[removedIndex]) {
      try {
        await OCRService.removeFileFromStorage(fileStoragePaths[removedIndex], 'expense-invoice-attachments');
      } catch (_) {}
      const next = { ...fileStoragePaths };
      delete next[removedIndex];
      setFileStoragePaths(next);
    }
    setUploadedFiles(files);
  };

  // Extraction only pre-fills the form. Invoice is created only when the user clicks "Create Invoice" (user must review first).
  const runOCR = async (file, fileIndex) => {
    setIsOCRProcessing(true);
    setOcrStatus(t('invoicesManagement.addInvoice.ocr.processing', 'Analyzing invoice...'));
    try {
      const result = await OCRService.extractExpenseInvoiceData(file, true);
      if (result.success && result.data) {
        const d = result.data;
        if (result.storagePath != null) setFileStoragePaths(prev => ({ ...prev, [fileIndex]: result.storagePath }));
        setFormData(prev => ({
          ...prev,
          invoice_number: d.invoice_number || prev.invoice_number,
          title: d.supplier_name ? (prev.title || d.supplier_name) : prev.title,
          net_amount: d.net_amount != null ? normalizeAmount(String(d.net_amount)) : prev.net_amount,
          tax_amount: d.vat_amount != null ? normalizeAmount(String(d.vat_amount)) : prev.tax_amount,
          final_amount: d.amount != null ? normalizeAmount(String(d.amount)) : prev.final_amount,
          description: d.description || prev.description,
          notes: d.notes || d.description || prev.notes,
          issue_date: d.issue_date || prev.issue_date,
          due_date: d.due_date || prev.due_date,
          payment_terms: d.payment_terms || prev.payment_terms,
          payment_method: d.payment_method || prev.payment_method
        }));
        if (d.line_items && Array.isArray(d.line_items) && d.line_items.length > 0) {
          setLineItems(d.line_items.map((item, i) => ({
            id: `li-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            description: item.description ?? '',
            quantity: item.quantity ?? '',
            unit: item.unit || 'unit',
            unit_price: item.unit_price != null ? normalizeAmount(String(item.unit_price)) : '',
            total: item.total != null ? normalizeAmount(String(item.total)) : ''
          })));
        } else {
          setLineItems([]);
        }
        setOcrStatus(t('invoicesManagement.addInvoice.ocr.success', 'Data extracted. Review and create.'));
      } else {
        setOcrStatus('error');
        setUploadedFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    } catch (err) {
      setOcrStatus('error');
      setUploadedFiles(prev => prev.filter((_, i) => i !== fileIndex));
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Peppol-required fields: same as quote→invoice so send works. Block create if any missing.
    if (!formData.client_id) {
      setError(t('invoicesManagement.addInvoice.errors.clientRequired', 'Please select a client'));
      return;
    }
    if (!(formData.invoice_number || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.invoiceNumberRequired', 'Invoice number is required for Peppol'));
      return;
    }
    if (!(formData.title || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.titleRequired', 'Title is required for Peppol'));
      return;
    }
    const net = lineItemsSubtotal != null ? lineItemsSubtotal : (parseAmount(formData.net_amount) || 0);
    const tax = Math.round(net * (vatPercent / 100) * 100) / 100;
    const discountVal = parseAmount(formData.discount_amount) || 0;
    const finalAmt = Math.round((net + tax - discountVal) * 100) / 100;
    if (finalAmt <= 0) {
      setError(t('invoicesManagement.addInvoice.errors.finalAmountRequired', 'Final amount (or net + VAT) is required and must be greater than 0'));
      return;
    }
    if (!(formData.issue_date || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.issueDateRequired', 'Issue date is required for Peppol'));
      return;
    }
    if (!(formData.due_date || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.dueDateRequired', 'Due date is required for Peppol'));
      return;
    }
    if (!(formData.payment_terms || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.paymentTermsRequired', 'Payment terms are required for Peppol'));
      return;
    }
    if (!(formData.payment_method || '').trim()) {
      setError(t('invoicesManagement.addInvoice.errors.paymentMethodRequired', 'Payment method is required for Peppol'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('invoicesManagement.addInvoice.errors.notAuthenticated', 'You must be logged in'));
        setIsSubmitting(false);
        return;
      }
      const payload = {
        client_id: formData.client_id,
        invoice_number: formData.invoice_number || undefined,
        title: formData.title || 'Facture',
        description: formData.description || null,
        net_amount: net,
        tax_amount: tax,
        discount_amount: discountVal,
        final_amount: finalAmt,
        issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
        due_date: formData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: formData.payment_terms || 'Paiement à 30 jours',
        payment_method: formData.payment_method || 'À définir',
        notes: formData.notes || null,
        invoice_type: formData.invoice_type || 'final'
      };
      const peppolMeta = {};
      if (formData.invoice_type === 'deposit' && parseAmount(formData.deposit_amount) > 0) {
        peppolMeta.deposit_amount = parseAmount(formData.deposit_amount);
      }
      const validLineItems = lineItems
        .map(li => ({
          description: (li.description || '').trim(),
          quantity: parseAmount(li.quantity),
          unit: (li.unit || 'unit').trim() || 'unit',
          unit_price: parseAmount(li.unit_price),
          total_price: parseAmount(li.total) || (parseAmount(li.quantity) * parseAmount(li.unit_price))
        }))
        .filter(li => li.description || li.quantity > 0 || li.unit_price > 0);
      if (validLineItems.length > 0) {
        peppolMeta.line_items = validLineItems;
      }
      if (Object.keys(peppolMeta).length > 0) {
        payload.peppol_metadata = peppolMeta;
      }
      const result = await InvoiceService.createClientInvoice(user.id, payload);
      if (!result.success) {
        setError(result.error || t('invoicesManagement.addInvoice.errors.createFailed', 'Failed to create invoice'));
        setIsSubmitting(false);
        return;
      }
      setFormData({ client_id: '', invoice_number: '', title: '', description: '', net_amount: '', tax_amount: '', discount_amount: '', final_amount: '', vat_percent: '21', issue_date: '', due_date: '', payment_terms: 'Paiement à 30 jours', payment_method: 'À définir', notes: '', invoice_type: 'final', deposit_amount: '' });
      setLineItems([]);
      setUploadedFiles([]);
      setFileStoragePaths({});
      setOcrStatus('');
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err.message || t('invoicesManagement.addInvoice.errors.createFailed', 'Failed to create invoice'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (isSubmitting) return;
    for (const path of Object.values(fileStoragePaths)) {
      try { await OCRService.removeFileFromStorage(path, 'expense-invoice-attachments'); } catch (_) {}
    }
    setFileStoragePaths({});
    setUploadedFiles([]);
    setLineItems([]);
    setOcrStatus('');
    setError('');
    onClose?.();
  };

  const handleClientSelect = (v) => {
    if (v === '__add_client__') {
      setShowAddClientModal(true);
      return;
    }
    handleInputChange('client_id', v);
  };

  const addLineItem = () => setLineItems(prev => [...prev, createEmptyLineItem()]);
  const removeLineItem = (id) => setLineItems(prev => prev.filter(li => li.id !== id));
  const updateLineItem = (id, field, value) => {
    setLineItems(prev => prev.map(li => {
      if (li.id !== id) return li;
      const next = { ...li, [field]: value };
      if ((field === 'quantity' || field === 'unit_price') && next.quantity !== '' && next.unit_price !== '') {
        const q = parseAmount(next.quantity);
        const p = parseAmount(next.unit_price);
        next.total = normalizeAmount(q * p);
      }
      return next;
    }));
  };

  // Subtotal (net) from line items when any line has values
  const lineItemsSubtotal = React.useMemo(() => {
    if (!lineItems.length) return null;
    const sum = lineItems.reduce((acc, li) => {
      const total = parseAmount(li.total);
      if (total > 0) return acc + total;
      const q = parseAmount(li.quantity);
      const p = parseAmount(li.unit_price);
      return acc + (q * p);
    }, 0);
    return sum;
  }, [lineItems]);

  const vatPercent = parseAmount(formData.vat_percent) || 21;
  const discount = parseAmount(formData.discount_amount) || 0;
  // When we have line items, net = lineItemsSubtotal; otherwise use formData.net_amount
  const effectiveNet = lineItemsSubtotal != null ? lineItemsSubtotal : parseAmount(formData.net_amount) || 0;
  const computedTax = Math.round(effectiveNet * (vatPercent / 100) * 100) / 100;
  const computedTotal = Math.round((effectiveNet + computedTax - discount) * 100) / 100;

  const handleAddClientSave = async (clientData) => {
    const { data, error: err } = await createClient(clientData);
    if (err) {
      const msg = err.message || (err.code === 'DUPLICATE_EMAIL' ? t('clientManagement.errors.duplicateEmail', { email: clientData.email }) : t('clientManagement.errors.createFailed'));
      throw new Error(msg);
    }
    const { data: refreshed } = await fetchClients();
    setClients(Array.isArray(refreshed) ? refreshed : []);
    if (data?.id) handleInputChange('client_id', data.id);
  };

  if (!isOpen) return null;

  const clientOptions = [
    { value: '', label: t('invoicesManagement.addInvoice.fields.selectClient', 'Select client') },
    ...clients.map(c => ({ value: c.id, label: c.name || c.email || c.id })),
    { value: '__add_client__', label: `+ ${t('invoicesManagement.addInvoice.addClient.shortcut', 'Add client')}` }
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t('invoicesManagement.addInvoice.title', 'Create Invoice')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('invoicesManagement.addInvoice.subtitle', 'Create a client invoice without a quote')}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="p-2 hover:bg-muted rounded-lg" disabled={isSubmitting}>
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Optional upload – same style as expense invoice Add Invoice (bg-blue-50, border-blue-200, text-blue-900/700) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Scan" size={16} color="var(--color-blue-600)" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    {t('invoicesManagement.addInvoice.ocr.title', 'Automatic Invoice Scanner')}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {t('invoicesManagement.addInvoice.ocr.description', 'Upload an invoice to pre-fill fields')}
                  </p>
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
                  <span>{t('invoicesManagement.addInvoice.ocr.processing', 'Analyzing invoice...')}</span>
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
                  <span>{t('invoicesManagement.addInvoice.ocr.failed', 'Extraction failed. Fill in manually.')}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                {t('invoicesManagement.addInvoice.sections.client', 'Client & document')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('invoicesManagement.addInvoice.fields.client', 'Client')} <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.client_id}
                    onValueChange={handleClientSelect}
                    options={clientOptions}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('invoicesManagement.addInvoice.fields.invoiceNumber', 'Invoice number')} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    placeholder="INV-0001"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.title', 'Title')} <span className="text-destructive">*</span></label>
                  <Input value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder={t('invoicesManagement.addInvoice.placeholders.title', 'Facture')} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.description', 'Description')}</label>
                  <Input value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t('invoicesManagement.addInvoice.placeholders.descriptionWhole', 'Description of whole invoice')} />
                </div>
              </div>
            </div>

            {/* Line items first, then totals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground border-b border-border pb-2 flex-1">
                  {t('invoicesManagement.addInvoice.sections.lineItems', 'Line items (optional)')}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="ml-2 shrink-0">
                  <Icon name="Plus" size={14} className="mr-1" />
                  {t('invoicesManagement.addInvoice.lineItems.addLine', 'Add line')}
                </Button>
              </div>
              {lineItems.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <div className="col-span-4">{t('invoicesManagement.addInvoice.lineItems.description', 'Description')}</div>
                    <div className="col-span-1">{t('invoicesManagement.addInvoice.lineItems.quantity', 'Qty')}</div>
                    <div className="col-span-2">{t('invoicesManagement.addInvoice.lineItems.unit', 'Unit')}</div>
                    <div className="col-span-2">{t('invoicesManagement.addInvoice.lineItems.unitPrice', 'Unit price')}</div>
                    <div className="col-span-2">{t('invoicesManagement.addInvoice.lineItems.total', 'Total')}</div>
                    <div className="col-span-1" />
                  </div>
                  {lineItems.map((li) => (
                    <div key={li.id} className="grid grid-cols-12 gap-2 p-2 border-t border-border items-center">
                      <div className="col-span-4">
                        <Input
                          value={li.description}
                          onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                          placeholder={t('invoicesManagement.addInvoice.lineItems.descriptionLinePlaceholder', 'Description of line item')}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={li.quantity}
                          onChange={(e) => updateLineItem(li.id, 'quantity', e.target.value.replace(/[^\d,.\s]/g, ''))}
                          placeholder="0"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={li.unit}
                          onChange={(e) => updateLineItem(li.id, 'unit', e.target.value)}
                          placeholder="unit"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={li.unit_price}
                          onChange={(e) => updateLineItem(li.id, 'unit_price', e.target.value.replace(/[^\d,.\s]/g, ''))}
                          placeholder="0,00"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={li.total}
                          onChange={(e) => updateLineItem(li.id, 'total', e.target.value.replace(/[^\d,.\s]/g, ''))}
                          placeholder="0,00"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(li.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                          aria-label={t('common.remove', 'Remove')}
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal, VAT %, VAT amount, Total (after line items) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                {t('invoicesManagement.addInvoice.sections.amounts', 'Amounts')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.netAmount', 'Subtotal (net, excl. VAT)')}</label>
                  {lineItemsSubtotal != null ? (
                    <Input type="text" inputMode="decimal" value={normalizeAmount(lineItemsSubtotal)} readOnly className="bg-muted/50" />
                  ) : (
                    <Input type="text" inputMode="decimal" value={formData.net_amount} onChange={(e) => handleInputChange('net_amount', e.target.value.replace(/[^\d,.\s]/g, ''))} placeholder="0,00" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.vatPercent', 'VAT %')}</label>
                  <Input type="text" inputMode="decimal" value={formData.vat_percent} onChange={(e) => handleInputChange('vat_percent', e.target.value.replace(/[^\d,.\s]/g, ''))} placeholder="21" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.taxAmount', 'VAT amount')}</label>
                  <Input type="text" inputMode="decimal" value={normalizeAmount(computedTax)} readOnly className="bg-muted/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.discountAmount', 'Discount')}</label>
                  <Input type="text" inputMode="decimal" value={formData.discount_amount} onChange={(e) => handleInputChange('discount_amount', e.target.value.replace(/[^\d,.\s]/g, ''))} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.finalAmount', 'Total (incl. VAT)')} <span className="text-destructive">*</span></label>
                  <Input type="text" inputMode="decimal" value={normalizeAmount(computedTotal)} readOnly className="bg-muted/50 font-medium" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                {t('invoicesManagement.addInvoice.sections.datesTerms', 'Dates & terms')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.issueDate', 'Issue date')} <span className="text-destructive">*</span></label>
                  <Input type="date" value={formData.issue_date} onChange={(e) => handleInputChange('issue_date', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.dueDate', 'Due date')} <span className="text-destructive">*</span></label>
                  <Input type="date" value={formData.due_date} onChange={(e) => handleInputChange('due_date', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.paymentTerms', 'Payment terms')} <span className="text-destructive">*</span></label>
                  <Input value={formData.payment_terms} onChange={(e) => handleInputChange('payment_terms', e.target.value)} placeholder="Paiement à 30 jours" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.paymentMethod', 'Payment method')} <span className="text-destructive">*</span></label>
                  <Input value={formData.payment_method} onChange={(e) => handleInputChange('payment_method', e.target.value)} placeholder="À définir" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.invoiceType', 'Invoice type')}</label>
                  <Select
                    value={formData.invoice_type}
                    onValueChange={(v) => handleInputChange('invoice_type', v)}
                    options={[
                      { value: 'final', label: t('invoicesManagement.addInvoice.invoiceType.final', 'Final') },
                      { value: 'deposit', label: t('invoicesManagement.addInvoice.invoiceType.deposit', 'Deposit') }
                    ]}
                  />
                </div>
                {formData.invoice_type === 'deposit' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.depositAmount', 'Deposit amount (excl. VAT)')}</label>
                    <Input type="text" inputMode="decimal" value={formData.deposit_amount} onChange={(e) => handleInputChange('deposit_amount', e.target.value.replace(/[^\d,.\s]/g, ''))} placeholder="0,00" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t('invoicesManagement.addInvoice.fields.notes', 'Notes')}</label>
                  <Input value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder={t('invoicesManagement.addInvoice.placeholders.notes', 'Optional notes')} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('invoicesManagement.addInvoice.creating', 'Creating...') : t('invoicesManagement.addInvoice.create', 'Create Invoice')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Client modal (same as Client Management) – opened from dropdown shortcut */}
      {showAddClientModal && (
        <ClientModal
          client={null}
          onSave={handleAddClientSave}
          onClose={() => setShowAddClientModal(false)}
        />
      )}
    </div>
  );
};

export default AddClientInvoiceModal;
