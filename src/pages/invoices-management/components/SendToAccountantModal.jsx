import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SendToAccountantModal = ({ invoices, isOpen, onClose, onSuccess, isExpenseInvoice = false }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Store invoice count so it persists even if parent clears selections
      const count = invoices?.length || 0;
      setInvoiceCount(count);
      
      // Try to get email from first invoice's client or supplier
      if (invoices && invoices.length > 0) {
        const firstInvoice = invoices[0];
        const invoiceEmail = isExpenseInvoice 
          ? firstInvoice.supplier_email 
          : firstInvoice.client?.email || firstInvoice.clientEmail;
        
        if (invoiceEmail) {
          setEmail(invoiceEmail);
        } else {
          setEmail('');
        }
      }
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, invoices, isExpenseInvoice]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = async () => {
    if (!email || !email.trim()) {
      setError(t('invoicesManagement.sendToAccountant.emailRequired', 'Email is required'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('invoicesManagement.sendToAccountant.invalidEmail', 'Invalid email address'));
      return;
    }

    setIsSending(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (onSuccess) {
        await onSuccess(email.trim());
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || t('invoicesManagement.sendToAccountant.sendError', 'Error sending email'));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {t('invoicesManagement.sendToAccountant.title', 'Send to Accountant')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSending}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="FileText" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t('invoicesManagement.sendToAccountant.invoiceCount', {
                  count: invoiceCount
                }, `${invoiceCount} invoice(s) selected`)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('invoicesManagement.sendToAccountant.emailLabel', 'Accountant Email')} *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setIsSuccess(false);
              }}
              placeholder={t('invoicesManagement.sendToAccountant.emailPlaceholder', 'accountant@example.com')}
              disabled={isSending || isSuccess}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t('invoicesManagement.sendToAccountant.emailHelp', 'An Excel file with invoice details will be attached to the email')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          {!isSuccess && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button
            onClick={isSuccess ? onClose : handleSend}
            disabled={isSending && !isSuccess}
            iconName={isSuccess ? "Check" : "Send"}
            iconPosition="left"
            className={isSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {isSuccess 
              ? t('common.done', 'Done')
              : isSending 
                ? t('invoicesManagement.sendToAccountant.sending', 'Sending...')
                : t('invoicesManagement.sendToAccountant.send', 'Send')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendToAccountantModal;

