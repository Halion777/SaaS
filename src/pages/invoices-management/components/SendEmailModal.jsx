import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { loadCompanyInfo } from '../../../services/companyInfoService';
import { EmailService } from '../../../services/emailService';
import { createProcessingOverlay } from '../../../components/ui/ProcessingOverlay';
import { generateInvoicePDF } from '../../../services/pdfService';
import { supabase } from '../../../services/supabaseClient';

const SendEmailModal = ({ invoice, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [emailData, setEmailData] = useState({
    clientEmail: '',
    sendCopy: false,
    subject: '',
    message: ''
  });

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
      const defaultSubject = `Facture ${invoice.number || invoice.invoice_number || ''} - ${company?.name || 'Votre entreprise'}`;
      const defaultMessage = `Bonjour,\n\nVeuillez trouver ci-joint notre facture ${invoice.number || invoice.invoice_number || ''}.\n\nCordialement,\n${company?.name || 'Votre équipe'}`;

      setEmailData({
        clientEmail,
        sendCopy: false,
        subject: defaultSubject,
        message: defaultMessage
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!emailData.clientEmail) {
      setError('Veuillez saisir l\'adresse email du client');
      return;
    }

    if (!emailData.subject) {
      setError('Veuillez saisir l\'objet de l\'email');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // Create and show the processing overlay
      const overlay = createProcessingOverlay('Envoi de la facture...', 'invoice-email-overlay');
      overlay.show();

      // Prepare email HTML content
      const invoiceNumber = invoice.number || invoice.invoice_number || '';
      const invoiceAmount = invoice.final_amount || invoice.amount || 0;
      const invoiceDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '';
      const clientName = invoice.client?.name || invoice.clientName || 'Client';
      const companyName = companyInfo?.name || 'Votre entreprise';
      
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

      // Generate PDF blob
      const pdfBlob = await generateInvoicePDF(invoiceData, invoiceNumber);
      
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

      // Generate email HTML
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Facture ${invoiceNumber}</h2>
          <p>Bonjour ${clientName},</p>
          <p>${emailData.message || `Veuillez trouver ci-joint notre facture ${invoiceNumber}.`}</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${invoiceDate}</p>
            ${dueDate ? `<p style="margin: 5px 0;"><strong>Date d'échéance:</strong> ${dueDate}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Montant:</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoiceAmount)}</p>
          </div>
          <p>Cordialement,<br>${companyName}</p>
        </div>
      `;

      // Send email to client via Resend using EmailService with PDF attachment
      const result = await EmailService.sendEmailViaEdgeFunction('templated_email', {
        client_email: emailData.clientEmail,
        subject: emailData.subject,
        html: emailHtml,
        text: emailData.message || `Facture ${invoiceNumber} - Montant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoiceAmount)}`,
        attachments: [{
          filename: `facture-${invoiceNumber}.pdf`,
          content: pdfBase64
        }]
      });

      // If sendCopy is enabled, send a copy to the user with PDF attachment
      if (emailData.sendCopy && user?.email && result.success) {
        await EmailService.sendEmailViaEdgeFunction('templated_email', {
          client_email: user.email,
          subject: `[Copie] ${emailData.subject}`,
          html: emailHtml,
          text: emailData.message || `Facture ${invoiceNumber} - Montant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoiceAmount)}`,
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
          setError('Email envoyé mais erreur lors de la mise à jour: ' + updateError.message);
        } else {
          overlay.hide();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }
      } else {
        overlay.hide();
        setError(result.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      console.error('Error sending invoice via email:', err);
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
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
          <h2 className="text-xl font-bold text-foreground">Envoyer la facture par email</h2>
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
              <p className="text-muted-foreground">Chargement...</p>
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
                  Email du client *
                </label>
                <Input
                  type="email"
                  value={emailData.clientEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full"
                  disabled={isSending}
                />
              </div>

              {/* Send Copy Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Envoyer une copie à mon email
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
                  Objet de l'email *
                </label>
                <Input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Objet de l'email"
                  className="w-full"
                  disabled={isSending}
                />
              </div>

              {/* Email Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Message personnalisé..."
                  disabled={isSending}
                />
              </div>

              {/* Invoice Info Preview */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Facture: {invoice.number || invoice.invoice_number || 'N/A'}</p>
                  <p>Client: {invoice.client?.name || invoice.clientName || 'N/A'}</p>
                  <p>Montant: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoice.final_amount || invoice.amount || 0)}</p>
                </div>
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
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isLoading || !emailData.clientEmail || !emailData.subject}
            iconName={isSending ? "Loader2" : "Send"}
          >
            {isSending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;

