import { supabase } from './supabaseClient';

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
          client:clients(id, name, email, phone, address, city, postal_code),
          company_profile:company_profiles(id, company_name, logo_path, address, city, postal_code, phone, email, website, vat_number),
          quote:quotes(id, quote_number, title, description)
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
      const updateData = {
        status,
        notes: notes || undefined,
        updated_at: new Date().toISOString()
      };

      // If status is 'paid', set paid_at timestamp
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

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
   * Create a new invoice manually
   * @param {Object} invoiceData - Invoice data
   * @param {string} userId - The current user ID
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async createInvoice(invoiceData, userId) {
    try {
      // Validate required fields
      const requiredFields = ['clientId', 'amount', 'description'];
      for (const field of requiredFields) {
        if (!invoiceData[field]) {
          throw new Error(`Le champ ${field} est obligatoire`);
        }
      }

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number', { user_id: userId });

      if (numberError) {
        throw new Error(`Failed to generate invoice number: ${numberError.message}`);
      }

      // Calculate due date (30 days from today by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Prepare invoice data
      const newInvoice = {
        user_id: userId,
        profile_id: invoiceData.profileId || null,
        company_profile_id: invoiceData.companyProfileId || null,
        client_id: invoiceData.clientId,
        quote_id: null, // No quote for manual invoices
        invoice_number: invoiceNumber,
        quote_number: null,
        title: invoiceData.title || `Facture pour ${invoiceData.description}`,
        description: invoiceData.description,
        status: 'unpaid',
        amount: parseFloat(invoiceData.amount),
        tax_amount: parseFloat(invoiceData.taxAmount || 0),
        discount_amount: parseFloat(invoiceData.discountAmount || 0),
        final_amount: parseFloat(invoiceData.amount) + parseFloat(invoiceData.taxAmount || 0) - parseFloat(invoiceData.discountAmount || 0),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || dueDate.toISOString().split('T')[0],
        payment_method: invoiceData.paymentMethod || 'À définir',
        payment_terms: invoiceData.paymentTerms || 'Paiement à 30 jours',
        notes: invoiceData.notes || ''
      };

      // Insert the invoice
      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select(`
          *,
          client:clients(id, name, email, phone, address, city, postal_code)
        `)
        .single();

      if (insertError) {
        console.error('Error inserting invoice:', insertError);
        throw new Error(`Failed to create invoice: ${insertError.message}`);
      }

      return {
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      };

    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default InvoiceService;
