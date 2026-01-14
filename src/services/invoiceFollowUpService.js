import { supabase } from './supabaseClient';
import { generateInvoicePDF } from './pdfService';
import { loadCompanyInfo } from './companyInfoService';
import { formatCurrency } from '../utils/numberFormat';

/**
 * Invoice Follow-Up Service
 * Handles all invoice follow-up related operations
 */
export class InvoiceFollowUpService {
  
  /**
   * Trigger follow-up creation for an invoice
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  static async triggerFollowUpCreation(invoiceId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/invoice-followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'create_followup_for_invoice',
          invoice_id: invoiceId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create follow-up');
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Follow-up created successfully',
        data: result
      };
    } catch (error) {
      console.error('Error triggering follow-up creation:', error);
      return {
        success: false,
        error: error.message || 'Failed to create follow-up'
      };
    }
  }

  /**
   * Stop all follow-ups for an invoice
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  static async stopFollowUpsForInvoice(invoiceId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/invoice-followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'cleanup_finalized_invoice',
          invoice_id: invoiceId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop follow-ups');
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Follow-ups stopped successfully',
        data: result
      };
    } catch (error) {
      console.error('Error stopping follow-ups:', error);
      return {
        success: false,
        error: error.message || 'Failed to stop follow-ups'
      };
    }
  }

  /**
   * Fetch all invoice follow-ups for a user
   * @param {string} userId - The user ID
   * @param {Object} filters - Optional filters (status, stage, etc.)
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  static async fetchInvoiceFollowUps(userId, filters = {}) {
    try {
      let query = supabase
        .from('invoice_follow_ups')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            title,
            status,
            due_date,
            final_amount,
            client:clients(id, name, email)
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }

      if (filters.follow_up_type) {
        query = query.eq('meta->>follow_up_type', filters.follow_up_type);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch invoice follow-ups: ${error.message}`);
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching invoice follow-ups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get invoice follow-up statistics
   * @param {string} userId - The user ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async getFollowUpStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_follow_ups')
        .select('status, stage, meta')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch follow-up statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        pending: 0,
        scheduled: 0,
        sent: 0,
        failed: 0,
        stopped: 0,
        stage1: 0,
        stage2: 0,
        stage3: 0,
        approaching_deadline: 0,
        overdue: 0
      };

      data.forEach(followUp => {
        stats[followUp.status] = (stats[followUp.status] || 0) + 1;
        stats[`stage${followUp.stage}`] = (stats[`stage${followUp.stage}`] || 0) + 1;
        
        const followUpType = followUp.meta?.follow_up_type;
        if (followUpType === 'approaching_deadline') {
          stats.approaching_deadline++;
        } else if (followUpType === 'overdue') {
          stats.overdue++;
        }
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting follow-up statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Trigger manual follow-up for an invoice
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  static async triggerManualFollowUp(invoiceId) {
    try {
      // First, get the invoice details with all necessary data for PDF generation
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id, 
          user_id, 
          client_id, 
          invoice_number, 
          title, 
          status, 
          due_date, 
          issue_date,
          final_amount,
          amount,
          net_amount,
          tax_amount,
          discount_amount,
          description,
          notes,
          quote_id,
          invoice_type,
          peppol_metadata,
          quote:quotes(
            id,
            quote_tasks(
              id,
              name,
              description,
              quantity,
              unit,
              unit_price,
              total_price
            ),
            quote_materials(
              id,
              quote_task_id,
              name,
              description,
              quantity,
              unit,
              unit_price,
              total_price,
              order_index
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice is valid for follow-up
      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new Error('Cannot send follow-up for paid or cancelled invoice');
      }

      // Get client details including language preference
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email, name, language_preference')
        .eq('id', invoice.client_id)
        .single();

      if (clientError || !client || !client.email) {
        throw new Error('Client not found or no email address');
      }

      // Get client's language preference (default to 'fr')
      const clientLanguage = (client.language_preference || 'fr').split('-')[0] || 'fr';

      // Get full client data for PDF generation
      const { data: fullClient, error: fullClientError } = await supabase
        .from('clients')
        .select('name, email, phone, address, city, postal_code, country, vat_number, client_type')
        .eq('id', invoice.client_id)
        .single();

      // Get company info (needed for both PDF generation and email template)
      const { data: { user } } = await supabase.auth.getUser();
      let companyInfo = null;
      if (user?.id) {
        try {
          companyInfo = await loadCompanyInfo(user.id);
        } catch (error) {
          console.warn('Error loading company info:', error);
        }
      }

      // Try to use pre-generated PDF from Supabase Storage
      // This is the same PDF used for automatic follow-ups (stored during invoice creation/sending)
      let pdfBase64 = null;
      
      // Check if invoice has stored PDF in peppol_metadata
      if (invoice.peppol_metadata) {
        const pdfStoragePath = invoice.peppol_metadata.pdf_storage_path;
        const pdfStorageBucket = invoice.peppol_metadata.pdf_storage_bucket || 'invoice-attachments';
        
        if (pdfStoragePath && pdfStorageBucket) {
          try {
            // Download PDF from Supabase Storage
            const { data: pdfData, error: downloadError } = await supabase.storage
              .from(pdfStorageBucket)
              .download(pdfStoragePath);
            
            if (!downloadError && pdfData) {
              // Convert blob to base64 for email attachment
              pdfBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64String = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
                  resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfData);
              });
            } else {
              console.warn('Failed to download PDF from storage, will generate new PDF:', downloadError?.message);
            }
          } catch (storageError) {
            console.warn('Error downloading PDF from storage, will generate new PDF:', storageError);
          }
        }
      }
      
      // Fallback: Generate PDF if not found in storage
      if (!pdfBase64) {
        try {
          // Check if deposit invoice is paid for the same quote (for final invoices)
          let depositInvoiceStatus = null;
          if (invoice.invoice_type === 'final' && invoice.quote_id) {
            // Fetch deposit invoice status from database
            const { data: depositInvoice } = await supabase
              .from('invoices')
              .select('status')
              .eq('user_id', invoice.user_id)
              .eq('quote_id', invoice.quote_id)
              .eq('invoice_type', 'deposit')
              .maybeSingle();
            
            depositInvoiceStatus = depositInvoice?.status || null;
          }

          // Prepare invoice data for PDF generation (matching download button structure)
          const invoiceDataForPDF = {
            companyInfo: companyInfo || {},
            client: fullClient || {
              name: client.name,
              email: client.email,
              phone: client.phone,
              address: client.address,
              postal_code: client.postal_code,
              city: client.city,
              country: client.country,
              vat_number: client.vat_number,
              client_type: client.client_type
            },
            invoice: {
              issue_date: invoice.issue_date,
              due_date: invoice.due_date,
              amount: invoice.amount,
              net_amount: invoice.net_amount,
              tax_amount: invoice.tax_amount,
              discount_amount: invoice.discount_amount,
              final_amount: invoice.final_amount,
              description: invoice.description,
              title: invoice.title,
              notes: invoice.notes,
              invoice_type: invoice.invoice_type || 'final',
              peppol_metadata: invoice.peppol_metadata || null
            },
            quote: invoice.quote || null,
            depositInvoiceStatus: depositInvoiceStatus // Pass deposit invoice status for PDF generation
          };

          // Generate PDF blob
          const invoiceType = invoice.invoice_type || 'final';
          // Show warning for professional clients in email attachments
          const isProfessionalClient = client.client_type === 'company' || client.client_type === 'professional';
          const pdfBlob = await generateInvoicePDF(invoiceDataForPDF, invoice.invoice_number, null, clientLanguage, false, invoiceType, isProfessionalClient);
          
          // Convert PDF blob to base64 for email attachment
          pdfBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
              resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });
        } catch (pdfError) {
          console.error('Error generating PDF for follow-up:', pdfError);
          // Continue without PDF attachment if generation fails
        }
      }

      // Calculate days overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Intelligently determine template type based on invoice status
      // If overdue (daysOverdue > 0), use overdue reminder
      // If not overdue (due soon), use payment reminder
      const isOverdue = daysOverdue > 0;
      const templateType = isOverdue ? 'invoice_overdue_reminder' : 'invoice_payment_reminder';

      // Get company name for email
      const companyName = companyInfo?.name || 'Votre entreprise';

      // Format dates and amounts based on client language
      const dateLocale = clientLanguage === 'fr' ? 'fr-FR' : clientLanguage === 'nl' ? 'nl-NL' : 'en-US';
      const invoiceDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString(dateLocale) : new Date().toLocaleDateString(dateLocale);
      const formattedDueDate = dueDate.toLocaleDateString(dateLocale);
      const invoiceAmount = parseFloat(invoice.final_amount || invoice.amount || 0);
      // Use formatCurrency utility to ensure comma as decimal separator (European format)
      const formattedAmount = formatCurrency(invoiceAmount, { showCurrency: true });

      // Prepare variables object for template rendering (edge function will handle the replacement)
      const templateVariables = {
        invoice_number: invoice.invoice_number || '',
        client_name: client.name || 'Madame, Monsieur',
        invoice_amount: formattedAmount,
        issue_date: invoiceDate,
        due_date: formattedDueDate,
        days_overdue: daysOverdue > 0 ? daysOverdue.toString() : '0',
        days_until_due: daysUntilDue > 0 ? daysUntilDue.toString() : '0',
        invoice_link: `${window.location.origin}/invoice/${invoice.id}`,
        company_name: companyName
      };

      // Send email via send-emails edge function
      // The edge function will fetch the template and render it with the variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          emailType: 'templated_email',
          emailData: {
            client_email: client.email,
            client_id: invoice.client_id, // Required for language preference lookup
            template_type: templateType, // Intelligently selected based on invoice status
            user_id: invoice.user_id, // Required for template lookup
            variables: templateVariables, // Pass variables for template rendering
            attachments: pdfBase64 ? [{
              filename: `facture-${invoice.invoice_number}.pdf`,
              content: pdfBase64
            }] : undefined
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      // Log the manual follow-up event
      await supabase
        .from('invoice_events')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          type: 'manual_followup',
          meta: {
            manual: true,
            invoice_number: invoice.invoice_number,
            client_email: client.email,
            template_type: templateType, // Log the template type used
            days_overdue: daysOverdue,
            days_until_due: daysUntilDue,
            is_overdue: isOverdue,
            timestamp: new Date().toISOString()
          }
        });

      return {
        success: true,
        message: 'Manual follow-up sent successfully'
      };
    } catch (error) {
      console.error('Error triggering manual follow-up:', error);
      return {
        success: false,
        error: error.message || 'Failed to send manual follow-up'
      };
    }
  }

  /**
   * Trigger dispatcher to process due follow-ups immediately
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  static async triggerFollowUpDispatching() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/invoice-followups-dispatcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger dispatcher');
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Dispatcher triggered successfully',
        data: result
      };
    } catch (error) {
      console.error('Error triggering dispatcher:', error);
      return {
        success: false,
        error: error.message || 'Failed to trigger dispatcher'
      };
    }
  }

  /**
   * Trigger scheduler to process invoices and create follow-ups
   * @returns {Promise<{success: boolean, message: string, error: string}>}
   */
  static async triggerFollowUpScheduling() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/invoice-followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger scheduler');
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Scheduler triggered successfully',
        data: result
      };
    } catch (error) {
      console.error('Error triggering scheduler:', error);
      return {
        success: false,
        error: error.message || 'Failed to trigger scheduler'
      };
    }
  }
}

export default InvoiceFollowUpService;

