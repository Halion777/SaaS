import { supabase } from './supabaseClient';
import InvoiceFollowUpService from './invoiceFollowUpService';
import EmailService from './emailService';

export class InvoiceService {
  
  /**
   * Fetch all invoices for the current user
   * @param {string} userId - The current user ID
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  static async fetchInvoices(userId) {
    try {
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
            quote_tasks(
              id,
              name,
              description,
              quantity,
              unit,
              unit_price,
              total_price
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('Error fetching invoices:', error);
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
      'Client Name',
      'Client Email',
      'Total Amount',
      'Net Amount',
      'Tax Amount',
      'Discount Amount',
      'Status',
      'Issue Date',
      'Due Date',
      'Payment Method',
      'Title',
      'Peppol Status'
    ];

    const rows = invoices.map(invoice => [
      invoice.number || invoice.invoice_number || '',
      invoice.quoteNumber || invoice.quote?.quote_number || '',
      invoice.clientName || invoice.client?.name || '',
      invoice.clientEmail || invoice.client?.email || '',
      invoice.amount || invoice.final_amount || 0,
      invoice.netAmount || invoice.net_amount || 0,
      invoice.taxAmount || invoice.tax_amount || 0,
      invoice.discountAmount || invoice.discount_amount || 0,
      invoice.status || '',
      invoice.issueDate || invoice.issue_date || '',
      invoice.dueDate || invoice.due_date || '',
      invoice.paymentMethod || invoice.payment_method || '',
      invoice.title || '',
      invoice.peppolStatus || invoice.peppol_status || ''
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
          client:clients(id, name, email, phone, address, city, postal_code, country, vat_number),
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
        clientName: invoice.client?.name,
        clientEmail: invoice.client?.email,
        amount: parseFloat(invoice.final_amount || 0),
        netAmount: parseFloat(invoice.net_amount || 0),
        taxAmount: parseFloat(invoice.tax_amount || 0),
        discountAmount: parseFloat(invoice.discount_amount || 0),
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentMethod: invoice.payment_method,
        title: invoice.title,
        peppolStatus: invoice.peppol_status
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
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2) + '€';
      const invoiceDate = new Date().toLocaleDateString('fr-FR');

      // Send email via edge function with attachment
      // Edge function will load template from database and render it
      const emailData = {
        to_email: accountantEmail.trim(),
        invoice_count: invoiceIds.length.toString(),
        total_amount: totalAmount,
        date: invoiceDate,
        company_name: companyName,
        language: 'fr', // Can be made dynamic based on user preference
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

}

export default InvoiceService;
