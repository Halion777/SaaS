import { supabase } from './supabaseClient';
import InvoiceFollowUpService from './invoiceFollowUpService';

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
        // Stop all follow-ups when invoice is paid
        await InvoiceFollowUpService.stopFollowUpsForInvoice(invoiceId);
      }

      // If status is 'cancelled', stop all follow-ups
      if (status === 'cancelled') {
        await InvoiceFollowUpService.stopFollowUpsForInvoice(invoiceId);
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

      // Trigger follow-up creation if status changed to unpaid/overdue
      if ((status === 'unpaid' || status === 'overdue') && 
          currentInvoice && 
          currentInvoice.status !== 'unpaid' && 
          currentInvoice.status !== 'overdue') {
        // Invoice status changed to unpaid/overdue, trigger follow-up creation
        await InvoiceFollowUpService.triggerFollowUpCreation(invoiceId);
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

}

export default InvoiceService;
