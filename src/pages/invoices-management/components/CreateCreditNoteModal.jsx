import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { formatCurrency } from '../../../utils/numberFormat';
import InvoiceService from '../../../services/invoiceService';
import { useAuth } from '../../../context/AuthContext';

const CreateCreditNoteModal = ({ invoice, isOpen, onClose, onCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setReason('');
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) {
      setError(t('invoicesManagement.creditNote.reasonRequired', 'Reason for credit note is required'));
      return;
    }
    if (!user?.id) {
      setError(t('invoicesManagement.creditNote.notAuthenticated', 'You must be logged in'));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await InvoiceService.createCreditNoteFromInvoice(user.id, invoice.id, {
        reason: reason.trim(),
        notes: notes.trim() || undefined
      });
      if (result.success) {
        handleClose();
        onCreated?.();
      } else {
        setError(result.error || t('invoicesManagement.creditNote.createFailed', 'Failed to create credit note'));
      }
    } catch (err) {
      setError(err.message || t('invoicesManagement.creditNote.createFailed', 'Failed to create credit note'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !invoice) return null;

  const invoiceNumber = invoice.invoice_number || invoice.number || invoice.invoiceNumber || '';
  const totalAmount = invoice.final_amount ?? invoice.amount ?? 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('invoicesManagement.creditNote.title', 'Create Credit Note')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('invoicesManagement.creditNote.subtitle', 'For invoice {{number}}', { number: invoiceNumber })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
              disabled={isSubmitting}
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">{t('invoicesManagement.creditNote.invoiceTotal', 'Invoice total')}: </span>
            <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('invoicesManagement.creditNote.reason', 'Reason for credit note')} *
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('invoicesManagement.creditNote.reasonPlaceholder', 'e.g. Correction, duplicate, returned goods')}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('invoicesManagement.creditNote.notes', 'Notes')}
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('invoicesManagement.creditNote.notesPlaceholder', 'Optional additional notes')}
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                iconName="FileText"
                iconPosition="left"
              >
                {t('invoicesManagement.creditNote.create', 'Create Credit Note')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCreditNoteModal;
