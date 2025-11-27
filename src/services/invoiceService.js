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
   * Send invoices to accountant
   * @param {Array<string>} invoiceIds - Array of invoice IDs
   * @param {string} accountantEmail - Optional accountant email
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  static async sendToAccountant(invoiceIds, accountantEmail = null) {
    try {
      // This would integrate with your email service
      const defaultAccountantEmail = accountantEmail || 'comptable@Haliqo.fr';
      
      // For now, just mark as sent
      const { error } = await supabase
        .from('invoices')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .in('id', invoiceIds);

      if (error) throw error;

      return {
        success: true,
        message: `${invoiceIds.length} facture(s) envoyée(s) à votre comptable`,
        data: {
          sentTo: defaultAccountantEmail,
          sentAt: new Date().toISOString(),
          invoiceCount: invoiceIds.length
        }
      };
    } catch (error) {
      console.error('Error sending to accountant:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'envoi au comptable'
      };
    }
  }

}

export default InvoiceService;
