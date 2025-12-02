import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { loadCompanyInfo } from '../../../services/companyInfoService';
import { EmailService } from '../../../services/emailService';
import { createProcessingOverlay } from '../../../components/ui/ProcessingOverlay';
import { generateInvoicePDF } from '../../../services/pdfService';
import { supabase } from '../../../services/supabaseClient';
import { translateTextWithAI } from '../../../services/googleAIService';

const SendEmailModal = ({ invoice, isOpen, onClose, onSuccess, isProfessionalClient = false }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [clientLanguage, setClientLanguage] = useState('fr'); // Client's language preference
  const [emailData, setEmailData] = useState({
    clientEmail: '',
    sendCopy: false,
    subject: '',
    message: ''
  });
  const prevInvoiceIdRef = useRef(null);

  useEffect(() => {
    if (isOpen && invoice) {
      loadData();
    }
  }, [isOpen, invoice]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load company info
      const company = await loadCompanyInfo(user?.id);
      setCompanyInfo(company);

      // Auto-fill email data
      const clientEmail = invoice.client?.email || invoice.clientEmail || '';
      
      // Get client's language preference (for translating custom message before sending)
      let fetchedClientLanguage = 'fr'; // Default
      if (invoice.client_id) {
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('language_preference')
            .eq('id', invoice.client_id)
            .maybeSingle();
          
          if (clientData?.language_preference) {
            fetchedClientLanguage = clientData.language_preference.split('-')[0] || 'fr';
          }
        } catch (error) {
          console.warn('Error fetching client language preference:', error);
        }
      }
      
      setClientLanguage(fetchedClientLanguage);
      
      // Use user's language for UI (so user can understand and write the message)
      const defaultSubject = t('invoicesManagement.sendEmailModal.defaultSubject', {
        invoiceNumber: invoice.number || invoice.invoice_number || '',
        companyName: company?.name || t('invoicesManagement.sendEmailModal.yourCompany')
      });
      const defaultMessage = t('invoicesManagement.sendEmailModal.defaultMessage', {
        invoiceNumber: invoice.number || invoice.invoice_number || '',
        companyName: company?.name || t('invoicesManagement.sendEmailModal.yourTeam')
      });

      // Only reset if this is a different invoice or first time opening
      // Preserve sendCopy toggle state when reopening the same invoice
      const isSameInvoice = prevInvoiceIdRef.current === invoice.id;
      
      setEmailData(prev => ({
        clientEmail: isSameInvoice ? (prev.clientEmail || clientEmail) : clientEmail,
        sendCopy: isSameInvoice ? prev.sendCopy : false, // Preserve sendCopy for same invoice
        subject: isSameInvoice ? (prev.subject || defaultSubject) : defaultSubject,
        message: isSameInvoice ? (prev.message || defaultMessage) : defaultMessage
      }));
      
      prevInvoiceIdRef.current = invoice.id;
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t('invoicesManagement.sendEmailModal.errors.loadDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!emailData.clientEmail) {
      setError(t('invoicesManagement.sendEmailModal.errors.clientEmailRequired'));
      return;
    }

    if (!emailData.subject) {
      setError(t('invoicesManagement.sendEmailModal.errors.subjectRequired'));
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // Create and show the processing overlay
      const overlay = createProcessingOverlay(t('invoicesManagement.sendEmailModal.sending'), 'invoice-email-overlay');
      overlay.show();

      // Prepare email HTML content
      const invoiceNumber = invoice.number || invoice.invoice_number || '';
      const invoiceAmount = invoice.final_amount || invoice.amount || 0;
      const invoiceDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US') : new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US');
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US') : '';
      const clientName = invoice.client?.name || invoice.clientName || t('invoicesManagement.sendEmailModal.client');
      const companyName = companyInfo?.name || t('invoicesManagement.sendEmailModal.yourCompany');
      
      // Generate invoice PDF
      const invoiceData = {
        companyInfo,
        client: invoice.client || {
          name: invoice.clientName,
          email: invoice.clientEmail,
          phone: invoice.client?.phone,
          address: invoice.client?.address,
          postal_code: invoice.client?.postal_code,
          city: invoice.client?.city
        },
        invoice: {
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: invoice.amount,
          net_amount: invoice.net_amount,
          tax_amount: invoice.tax_amount,
          final_amount: invoice.final_amount,
          description: invoice.description,
          title: invoice.title,
          notes: invoice.notes
        },
        quote: invoice.quote || null
      };

      // Generate PDF blob (hide bank info for professional clients)
      const pdfBlob = await generateInvoicePDF(invoiceData, invoiceNumber, null, i18n.language, isProfessionalClient);
      
      // Convert PDF blob to base64 for email attachment
      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Get client ID - use direct client_id field first, then fallback to client relation
      const clientId = invoice.client_id || invoice.client?.id || null;
      
      // Translate custom message and subject to client's language if they exist and client language is different
      let translatedMessage = emailData.message || '';
      let translatedSubject = emailData.subject || '';
      
      if (clientLanguage && clientLanguage !== i18n.language.split('-')[0]) {
        // Translate message if it exists
        if (translatedMessage) {
          try {
            const messageTranslationResult = await translateTextWithAI(
              translatedMessage,
              clientLanguage,
              i18n.language.split('-')[0]
            );
            if (messageTranslationResult.success && messageTranslationResult.data) {
              translatedMessage = messageTranslationResult.data;
            } else {
              console.warn('Failed to translate custom message, using original:', messageTranslationResult.error);
            }
          } catch (translationError) {
            console.warn('Error translating custom message, using original:', translationError);
          }
        }
        
        // Translate subject if it exists and is different from default
        if (translatedSubject) {
          try {
            const subjectTranslationResult = await translateTextWithAI(
              translatedSubject,
              clientLanguage,
              i18n.language.split('-')[0]
            );
            if (subjectTranslationResult.success && subjectTranslationResult.data) {
              translatedSubject = subjectTranslationResult.data;
            } else {
              console.warn('Failed to translate custom subject, using original:', subjectTranslationResult.error);
            }
          } catch (translationError) {
            console.warn('Error translating custom subject, using original:', translationError);
          }
        }
      }
      
      // Format invoice amount (edge function will fetch client's language preference from database)
      const formattedAmount = new Intl.NumberFormat(
        'fr-FR', // Default format, edge function will use client's language preference
        { style: 'currency', currency: 'EUR' }
      ).format(invoiceAmount);
      
      // Send email to client using invoice_sent template from database
      // Edge function will fetch client's language preference from database using client_id
      const result = await EmailService.sendEmailViaEdgeFunction('invoice_sent', {
        client_email: emailData.clientEmail,
        client_id: clientId, // Pass client_id so edge function can fetch language preference from database
        invoice_number: invoiceNumber,
        invoice_title: invoice.title || invoiceNumber,
        client_name: clientName,
        invoice_amount: formattedAmount,
        issue_date: invoiceDate,
        due_date: dueDate || '',
        company_name: companyName,
        custom_subject: translatedSubject, // Use translated subject
        custom_message: translatedMessage, // Use translated message
        user_id: user?.id || null,
        attachments: [{
          filename: `facture-${invoiceNumber}.pdf`,
          content: pdfBase64
        }]
      });

      // If sendCopy is enabled, send a copy to the user with PDF attachment
      if (emailData.sendCopy && user?.email && result.success) {
        // Format invoice amount for user copy (edge function will fetch user's language preference from database)
        const userFormattedAmount = new Intl.NumberFormat(
          'fr-FR', // Default format, edge function will use user's language preference
          { style: 'currency', currency: 'EUR' }
        ).format(invoiceAmount);
        
        // Send copy to user - edge function will fetch user's language preference from database using user_id
        await EmailService.sendEmailViaEdgeFunction('invoice_sent', {
          client_email: user.email,
          invoice_number: invoiceNumber,
          invoice_title: invoice.title || invoiceNumber,
          client_name: user.full_name || user.email,
          invoice_amount: userFormattedAmount,
          issue_date: invoiceDate,
          due_date: dueDate || '',
          company_name: companyName,
          custom_message: emailData.message || '',
          user_id: user?.id || null, // Pass user_id so edge function can fetch language preference from database
          attachments: [{
            filename: `facture-${invoiceNumber}.pdf`,
            content: pdfBase64,
            type: 'application/pdf'
          }]
        });
      }

      if (result.success) {
        // Update invoice to mark as sent via email
        // Note: We only update updated_at since sent_at and sent_via_email columns don't exist
        // The updated_at will be automatically updated by the database trigger
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error('Error updating invoice:', updateError);
          setError(t('invoicesManagement.sendEmailModal.errors.updateError') + ': ' + updateError.message);
        } else {
          overlay.hide();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }
      } else {
        overlay.hide();
        setError(result.error || t('invoicesManagement.sendEmailModal.errors.sendError'));
      }
    } catch (err) {
      console.error('Error sending invoice via email:', err);
      setError(err.message || t('invoicesManagement.sendEmailModal.errors.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{t('invoicesManagement.sendEmailModal.title')}</h2>
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('invoicesManagement.sendEmailModal.loading')}</p>
            </div>
          ) : (
            <>
              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                </div>
              )}

              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('invoicesManagement.sendEmailModal.clientEmail')} *
                </label>
                <Input
                  type="email"
                  value={emailData.clientEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder={t('invoicesManagement.sendEmailModal.clientEmailPlaceholder')}
                  className="w-full"
                  disabled={isSending}
                />
              </div>

              {/* Send Copy Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {t('invoicesManagement.sendEmailModal.sendCopy')}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailData.sendCopy}
                    onChange={(e) => setEmailData(prev => ({ ...prev, sendCopy: e.target.checked }))}
                    disabled={isSending}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('invoicesManagement.sendEmailModal.subject')} *
                </label>
                <Input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder={t('invoicesManagement.sendEmailModal.subjectPlaceholder')}
                  className="w-full"
                  disabled={isSending}
                />
              </div>

              {/* Email Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('invoicesManagement.sendEmailModal.message')}
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder={t('invoicesManagement.sendEmailModal.messagePlaceholder')}
                  disabled={isSending}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            {t('invoicesManagement.sendEmailModal.cancel')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isLoading || !emailData.clientEmail || !emailData.subject}
            iconName={isSending ? "Loader2" : "Send"}
          >
            {isSending ? t('invoicesManagement.sendEmailModal.sending') : t('invoicesManagement.sendEmailModal.send')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;

