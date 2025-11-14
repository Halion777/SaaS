import { supabase } from './supabaseClient';

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
      // First, get the invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, user_id, client_id, invoice_number, title, status, due_date, final_amount')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice is valid for follow-up
      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new Error('Cannot send follow-up for paid or cancelled invoice');
      }

      // Get client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email, name')
        .eq('id', invoice.client_id)
        .single();

      if (clientError || !client || !client.email) {
        throw new Error('Client not found or no email address');
      }

      // Get template (use overdue template for manual follow-ups)
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('id, subject, html_content, text_content')
        .eq('template_type', 'invoice_overdue_reminder')
        .eq('is_active', true)
        .maybeSingle();

      if (templateError || !template) {
        throw new Error('Email template not found');
      }

      // Calculate days overdue
      const today = new Date();
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Replace template variables
      const subject = template.subject
        .replace('{invoice_number}', invoice.invoice_number)
        .replace('{client_name}', client.name || 'Madame, Monsieur')
        .replace('{days_overdue}', daysOverdue > 0 ? daysOverdue.toString() : '0');

      const text = template.text_content
        .replace('{invoice_number}', invoice.invoice_number)
        .replace('{client_name}', client.name || 'Madame, Monsieur')
        .replace('{invoice_amount}', invoice.final_amount?.toString() || '0')
        .replace('{days_overdue}', daysOverdue > 0 ? daysOverdue.toString() : '0')
        .replace('{due_date}', dueDate.toLocaleDateString('fr-FR'))
        .replace('{invoice_link}', `${window.location.origin}/invoice/${invoice.id}`);

      const html = template.html_content
        .replace(/{invoice_number}/g, invoice.invoice_number)
        .replace(/{client_name}/g, client.name || 'Madame, Monsieur')
        .replace(/{invoice_amount}/g, invoice.final_amount?.toString() || '0')
        .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
        .replace(/{due_date}/g, dueDate.toLocaleDateString('fr-FR'))
        .replace(/{invoice_link}/g, `${window.location.origin}/invoice/${invoice.id}`);

      // Send email via send-emails edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          to: client.email,
          subject: subject,
          html: html,
          text: text
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
            template_type: 'invoice_overdue_reminder',
            days_overdue: daysOverdue,
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

