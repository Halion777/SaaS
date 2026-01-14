import { supabase } from './supabaseClient';
import InvoiceFollowUpService from './invoiceFollowUpService';
import EmailService from './emailService';
import { formatCurrency, formatNumber } from '../utils/numberFormat';
import { generateInvoicePDF } from './pdfService';
import { loadCompanyInfo } from './companyInfoService';

export class InvoiceService {
  
  /**
   * Fetch all invoices for the current user
   * @param {string} userId - The current user ID
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  static async fetchInvoices(userId) {
    try {
      // Try to fetch all invoices including peppol_metadata
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, email, phone, address, city, postal_code, country, vat_number, peppol_id, peppol_enabled, client_type),
          quote:quotes(
            id, 
            quote_number, 
            title, 
            description,
            deposit_amount,
            balance_amount,
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      // Validate and sanitize JSONB fields to prevent JSON parsing errors
      const sanitizedInvoices = (data || []).map(invoice => {
        // Validate peppol_metadata
        if (invoice.peppol_metadata) {
          try {
            // Try to stringify and parse to validate JSON
            JSON.stringify(invoice.peppol_metadata);
          } catch (jsonError) {
            console.warn(`Invalid JSON in peppol_metadata for invoice ${invoice.invoice_number || invoice.id}, setting to null:`, jsonError);
            invoice.peppol_metadata = null;
          }
        }
        return invoice;
      });

      return {
        success: true,
        data: sanitizedInvoices
      };

    } catch (error) {
      console.error('Error fetching invoices:', error);
      
      // If it's a JSON parsing error, try fetching without JSONB columns
      if (error.message && (error.message.includes('JSON') || error.message.includes('Unterminated string'))) {
        console.warn('JSON parsing error detected, attempting to fetch invoices without JSONB columns...');
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
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
              amount,
              net_amount,
              tax_amount,
              discount_amount,
              final_amount,
              description,
              notes,
              quote_id,
              invoice_type,
              created_at,
              updated_at,
              paid_at,
              client:clients(id, name, email, phone, address, city, postal_code, country, vat_number, peppol_id, peppol_enabled, client_type),
              quote:quotes(
                id, 
                quote_number, 
                title, 
                description,
                deposit_amount,
                balance_amount,
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
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          if (!fallbackError && fallbackData) {
            // Set peppol_metadata to null for all invoices
            const invoicesWithoutMetadata = (fallbackData || []).map(inv => ({
              ...inv,
              peppol_metadata: null
            }));
            
            return {
              success: true,
              data: invoicesWithoutMetadata,
              warning: 'Some invoice metadata could not be loaded due to JSON parsing errors'
            };
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - The invoice ID
   * @param {string} status - The new status
   * @param {string} notes - Optional notes
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async updateInvoiceStatus(invoiceId, status, notes = '') {
    try {
      // Get current invoice status before updating
      const { data: currentInvoice } = await supabase
        .from('invoices')
        .select('status, user_id')
        .eq('id', invoiceId)
        .single();

      const updateData = {
        status,
        notes: notes || undefined,
        updated_at: new Date().toISOString()
      };

      // If status is 'paid', set paid_at timestamp
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      // Update invoice status first
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

      // After status is updated, stop all follow-ups if invoice is paid or cancelled
      if (status === 'paid' || status === 'cancelled') {
        await InvoiceFollowUpService.stopFollowUpsForInvoice(invoiceId);
      }

      // Only trigger follow-up creation if:
      // 1. Status changed FROM paid/cancelled TO unpaid/overdue (invoice reactivated)
      // 2. No existing follow-ups already exist for this invoice
      // 3. Don't create if just switching between unpaid and overdue (scheduler handles this)
      if ((status === 'unpaid' || status === 'overdue') && 
          currentInvoice && 
          (currentInvoice.status === 'paid' || currentInvoice.status === 'cancelled')) {
        // Invoice was reactivated from paid/cancelled, check if follow-ups already exist
        const { data: existingFollowUps } = await supabase
          .from('invoice_follow_ups')
          .select('id, status')
          .eq('invoice_id', invoiceId)
          .in('status', ['pending', 'scheduled', 'ready_for_dispatch'])
          .limit(1);
        
        // Only create follow-up if none exist
        if (!existingFollowUps || existingFollowUps.length === 0) {
          await InvoiceFollowUpService.triggerFollowUpCreation(invoiceId);
        }
      }
      // Note: We don't create follow-ups when switching between unpaid <-> overdue
      // The scheduler will handle follow-up creation and progression automatically

      return {
        success: true,
        data,
        message: 'Invoice status updated successfully'
      };

    } catch (error) {
      console.error('Error updating invoice status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get invoice statistics
   * @param {string} userId - The current user ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async getInvoiceStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, final_amount')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch invoice statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        unpaid: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalAmount: 0,
        unpaidAmount: 0,
        paidAmount: 0
      };

      data.forEach(invoice => {
        stats[invoice.status]++;
        stats.totalAmount += parseFloat(invoice.final_amount || 0);
        
        if (invoice.status === 'unpaid' || invoice.status === 'overdue') {
          stats.unpaidAmount += parseFloat(invoice.final_amount || 0);
        } else if (invoice.status === 'paid') {
          stats.paidAmount += parseFloat(invoice.final_amount || 0);
        }
      });

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('Error getting invoice statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate CSV content from invoices
   * @param {Array} invoices - Array of invoice objects
   * @returns {string} CSV content
   */
  static generateInvoiceCSV(invoices) {
    const headers = [
      'Invoice Number',
      'Quote Number',
      'Invoice Type',
      'Client Name',
      'Client Email',
      'Client Phone',
      'Client Address',
      'Client City',
      'Client Postal Code',
      'Client Country',
      'Client VAT',
      'Client Type',
      'Total Amount',
      'Net Amount',
      'Tax Amount',
      'Status',
      'Issue Date',
      'Due Date',
      'Title',
      'Peppol Status',
      'Peppol Sent Date',
      'Receiver Peppol ID'
    ];

    const rows = invoices.map(invoice => [
      invoice.number || invoice.invoice_number || '',
      invoice.quoteNumber || invoice.quote?.quote_number || '',
      invoice.invoiceType || invoice.invoice_type || 'final',
      invoice.clientName || invoice.client?.name || '',
      invoice.clientEmail || invoice.client?.email || '',
      invoice.client?.phone || '',
      invoice.client?.address || '',
      invoice.client?.city || '',
      invoice.client?.postal_code || '',
      invoice.client?.country || '',
      invoice.client?.vat_number || '',
      invoice.client?.client_type || '',
      formatNumber(invoice.amount || invoice.final_amount || 0),
      formatNumber(invoice.netAmount || invoice.net_amount || 0),
      formatNumber(invoice.taxAmount || invoice.tax_amount || 0),
      invoice.status || '',
      invoice.issueDate || invoice.issue_date || '',
      invoice.dueDate || invoice.due_date || '',
      invoice.title || '',
      invoice.peppolStatus || invoice.peppol_status || '',
      invoice.peppolSentAt ? new Date(invoice.peppolSentAt).toLocaleDateString() : '',
      invoice.receiverPeppolId || ''
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Send invoices to accountant
   * @param {Array<string>} invoiceIds - Array of invoice IDs
   * @param {string} accountantEmail - Accountant email (required)
   * @param {string} userId - User ID for template lookup
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async sendToAccountant(invoiceIds, accountantEmail, userId = null) {
    try {
      if (!accountantEmail || !accountantEmail.trim()) {
        throw new Error('Accountant email is required');
      }

      // Fetch full invoice data
      const { data: invoicesData, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, email, phone, address, city, postal_code, country, vat_number, client_type),
          quote:quotes(quote_number, title)
        `)
        .in('id', invoiceIds);

      if (fetchError) throw fetchError;
      if (!invoicesData || invoicesData.length === 0) {
        throw new Error('No invoices found');
      }

      // Transform invoices for CSV generation
      const invoices = invoicesData.map(invoice => ({
        number: invoice.invoice_number,
        invoice_number: invoice.invoice_number,
        quoteNumber: invoice.quote?.quote_number,
        invoiceType: invoice.invoice_type || 'final',
        invoice_type: invoice.invoice_type || 'final',
        clientName: invoice.client?.name,
        clientEmail: invoice.client?.email,
        client: invoice.client, // Keep full client object for CSV generation
        amount: parseFloat(invoice.final_amount || 0),
        netAmount: parseFloat(invoice.net_amount || 0),
        taxAmount: parseFloat(invoice.tax_amount || 0),
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        title: invoice.title,
        peppolStatus: invoice.peppol_status || 'not_sent',
        peppolSentAt: invoice.peppol_sent_at,
        receiverPeppolId: invoice.receiver_peppol_id
      }));

      // Generate CSV content
      const csvContent = this.generateInvoiceCSV(invoices);
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Convert to base64 for email attachment
      const csvBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(csvBlob);
      });

      // Get company profile for email template
      const companyProfile = await EmailService.getCurrentUserCompanyProfile(userId);
      const companyName = companyProfile?.company_name || 'Notre entreprise';

      // Prepare variables for template (edge function will load and render template)
      // Use centralized formatCurrency for European formatting
      const totalAmount = formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0));
      const invoiceDate = new Date().toLocaleDateString('fr-FR');

      // Send email via edge function with attachment
      // Edge function will load template from database and render it
      const emailData = {
        to_email: accountantEmail.trim(),
        invoice_count: invoiceIds.length.toString(),
        total_amount: totalAmount,
        date: invoiceDate,
        company_name: companyName,
        language: null, // Will be fetched from user's language_preference in edge function
        user_id: userId,
        attachments: [
          {
            filename: `factures-${new Date().toISOString().split('T')[0]}.csv`,
            content: csvBase64,
            type: 'text/csv',
            disposition: 'attachment'
          }
        ],
        meta: {
          invoice_count: invoiceIds.length,
          invoice_ids: invoiceIds,
          sent_at: new Date().toISOString()
        }
      };

      const emailResult = await EmailService.sendEmailViaEdgeFunction('invoice_to_accountant', emailData);

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Update invoices as sent
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .in('id', invoiceIds);

      if (updateError) {
        console.warn('Failed to update invoices:', updateError);
      }

      return {
        success: true,
        message: `${invoiceIds.length} facture(s) envoyée(s) à ${accountantEmail}`,
        data: {
          sentTo: accountantEmail,
          sentAt: new Date().toISOString(),
          invoiceCount: invoiceIds.length
        }
      };
    } catch (error) {
      console.error('Error sending to accountant:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi au comptable'
      };
    }
  }

  /**
   * Generate and store invoice PDF in Supabase Storage
   * This PDF will be used for automatic follow-up emails
   * @param {string} invoiceId - The invoice ID
   * @param {string} userId - The user ID
   * @returns {Promise<{success: boolean, storagePath: string, error: string}>}
   */
  static async generateAndStoreInvoicePDF(invoiceId, userId) {
    try {
      // Fetch full invoice data with client and quote
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
          invoice_type,
          quote_id,
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
          ),
          client:clients(
            id,
            name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            vat_number,
            client_type,
            language_preference
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Get company info
      const companyInfo = await loadCompanyInfo(userId);
      if (!companyInfo) {
        throw new Error('Company information not found');
      }

      // Check if deposit invoice is paid for the same quote (for final invoices)
      let depositInvoiceStatus = null;
      if (invoice.invoice_type === 'final' && invoice.quote_id) {
        // Fetch deposit invoice status from database
        const { data: depositInvoice } = await supabase
          .from('invoices')
          .select('status')
          .eq('user_id', userId)
          .eq('quote_id', invoice.quote_id)
          .eq('invoice_type', 'deposit')
          .maybeSingle();
        
        depositInvoiceStatus = depositInvoice?.status || null;
      }

      // Prepare invoice data for PDF generation (matching download button structure)
      const invoiceDataForPDF = {
        companyInfo: companyInfo,
        client: invoice.client || {},
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
      const isProfessionalClient = invoice.client?.client_type === 'company' || invoice.client?.client_type === 'professional';
      // Use client's language preference, fallback to 'fr' if not available
      const clientLanguage = invoice.client?.language_preference 
        ? invoice.client.language_preference.split('-')[0] || 'fr' 
        : 'fr';
      const pdfBlob = await generateInvoicePDF(
        invoiceDataForPDF,
        invoice.invoice_number,
        null,
        clientLanguage,
        false,
        invoice.invoice_type || 'final',
        isProfessionalClient
      );

      // Convert blob to base64
      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Convert base64 to Uint8Array for storage
      const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

      // Generate storage path: invoice-pdfs/{userId}/{invoiceNumber}.pdf
      const sanitizedInvoiceNumber = invoice.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `invoice-pdfs/${userId}/${sanitizedInvoiceNumber}.pdf`;

      // Upload to Supabase Storage
      const bucketName = 'invoice-attachments';
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true // Overwrite if exists
        });

      if (uploadError) {
        console.error(`❌ Error uploading PDF to storage (bucket: ${bucketName}, path: ${storagePath}):`, uploadError);
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

     
      // Store PDF path in invoice metadata
      const currentMetadata = invoice.peppol_metadata || {};
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          peppol_metadata: {
            ...currentMetadata,
            pdf_storage_path: storagePath,
            pdf_storage_bucket: bucketName,
            pdf_generated_at: new Date().toISOString()
          }
        })
        .eq('id', invoiceId);

     
      return {
        success: true,
        storagePath: storagePath,
        bucket: bucketName
      };
    } catch (error) {
      console.error('Error generating and storing invoice PDF:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate and store PDF'
      };
    }
  }
}

export default InvoiceService;
