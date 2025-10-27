// =====================================================
// PEPPOL WEBHOOK CONFIGURATION SERVICE
// Manages webhook configuration with Digiteal API
// =====================================================

import { supabase } from './supabaseClient';

// Digiteal API Configuration
const PEPPOL_CONFIG = {
  test: {
    baseUrl: 'https://test.digiteal.eu',
    username: 'haliqo-test',
    password: 'Haliqo123'
  },
  production: {
    baseUrl: 'https://app.digiteal.eu',
    username: 'haliqo-test', // Replace with production credentials
    password: 'Haliqo123'    // Replace with production credentials
  }
};

// Peppol webhook event types
export const PEPPOL_WEBHOOK_TYPES = [
  {
    value: 'PEPPOL_INVOICE_RECEIVED',
    label: 'Invoice Received',
    description: 'Triggered when a Peppol invoice is received'
  },
  {
    value: 'PEPPOL_CREDIT_NOTE_RECEIVED',
    label: 'Credit Note Received',
    description: 'Triggered when a Peppol credit note is received'
  },
  {
    value: 'PEPPOL_INVOICE_RESPONSE_RECEIVED',
    label: 'Invoice Response Received',
    description: 'Triggered when an invoice response is received'
  },
  {
    value: 'PEPPOL_MLR_RECEIVED',
    label: 'MLR Received',
    description: 'Message Level Response received'
  },
  {
    value: 'PEPPOL_TRANSPORT_ACK_RECEIVED',
    label: 'Transport ACK Received',
    description: 'Transport acknowledgment received'
  },
  {
    value: 'PEPPOL_SELF_BILLING_INVOICE_RECEIVED',
    label: 'Self-Billing Invoice Received',
    description: 'Self-billing invoice received'
  },
  {
    value: 'PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED',
    label: 'Self-Billing Credit Note Received',
    description: 'Self-billing credit note received'
  },
  {
    value: 'PEPPOL_SEND_PROCESSING_OUTCOME',
    label: 'Send Processing Outcome',
    description: 'Processing outcome for sent documents'
  },
  {
    value: 'PEPPOL_FUTURE_VALIDATION_FAILED',
    label: 'Future Validation Failed',
    description: 'Future validation check failed'
  },
  {
    value: 'AUTOPAY_CONFIGURATION_ACTIVATED',
    label: 'AutoPay Configuration Activated',
    description: 'AutoPay configuration has been activated'
  }
];

// Utility functions
const createAuthHeader = (username, password) => {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
};

export class PeppolWebhookService {
  constructor(isTest = true) {
    this.config = isTest ? PEPPOL_CONFIG.test : PEPPOL_CONFIG.production;
  }

  /**
   * Get webhook configuration from Digiteal
   */
  async getWebhookConfiguration() {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/webhook/configuration`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.error('Failed to get webhook configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update webhook configuration credentials
   * @param {string} login - Webhook login (username)
   * @param {string} password - Webhook password
   */
  async updateWebhookCredentials(login, password) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/webhook/configuration`, {
        method: 'PUT',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: login || '',
          password: password || ''
        })
      });

      if (response.ok) {
        return { success: true, message: 'Webhook credentials updated successfully' };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.error('Failed to update webhook credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update webhook configuration
   * @param {Array} webhooks - Array of webhook configurations
   */
  async updateWebhookConfiguration(webhooks) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/webhook/configuration`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhooks: webhooks.map(webhook => ({
            type: webhook.type,
            url: webhook.url
          }))
        })
      });

      if (response.ok) {
        return { success: true, message: 'Webhook configuration updated successfully' };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.error('Failed to update webhook configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add or update a single webhook
   * @param {string} type - Webhook type (e.g., 'AUTOPAY_CONFIGURATION_ACTIVATED')
   * @param {string} url - Webhook URL
   */
  async updateWebhook(type, url) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/webhook`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          url
        })
      });

      if (response.ok) {
        return { success: true, message: 'Webhook added/updated successfully' };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a webhook
   * @param {string} type - Webhook type to delete
   */
  async deleteWebhook(type) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/webhook`, {
        method: 'DELETE',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type
        })
      });

      if (response.ok) {
        return { success: true, message: 'Webhook deleted successfully' };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Supabase webhook URL for this environment
   */
  getSupabaseWebhookUrl() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.error('Supabase URL not found in environment');
      return '';
    }
    
    // Construct the Edge Function URL
    const baseUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
    return `${baseUrl}/peppol-webhook`;
  }

  /**
   * Configure all webhooks automatically to point to Supabase Edge Function
   */
  async setupAllWebhooks() {
    try {
      const webhookUrl = this.getSupabaseWebhookUrl();
      if (!webhookUrl) {
        return { success: false, error: 'Could not determine Supabase webhook URL' };
      }

      console.log('🔗 Setting up webhooks to:', webhookUrl);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Configure webhooks in Digiteal
      const webhooks = PEPPOL_WEBHOOK_TYPES.map(type => ({
        type: type.value,
        url: webhookUrl
      }));

      const result = await this.updateWebhookConfiguration(webhooks);
      
      if (result.success) {
        // Store webhook configurations in database
        const webhookRecords = PEPPOL_WEBHOOK_TYPES.map(type => ({
          user_id: user.id,
          webhook_type: type.value,
          webhook_url: webhookUrl,
          is_active: true,
          description: type.description
        }));

        // Upsert webhook records
        const { error: dbError } = await supabase
          .from('peppol_webhooks')
          .upsert(webhookRecords, { 
            onConflict: 'user_id,webhook_type',
            ignoreDuplicates: false 
          });

        if (dbError) {
          console.error('Failed to save webhooks to database:', dbError);
        }

        return { 
          success: true, 
          message: `Successfully configured ${webhooks.length} webhooks`,
          webhookUrl
        };
      }

      return result;

    } catch (error) {
      console.error('Failed to setup webhooks:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get webhook events from database
   */
  async getWebhookEvents(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('peppol_webhook_events')
        .select(`
          *,
          invoice:peppol_invoices(
            id,
            invoice_number,
            total_amount,
            currency,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Failed to get webhook events:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStatistics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get total events
      const { count: totalEvents } = await supabase
        .from('peppol_webhook_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get processed events
      const { count: processedEvents } = await supabase
        .from('peppol_webhook_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'processed');

      // Get failed events
      const { count: failedEvents } = await supabase
        .from('peppol_webhook_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed');

      // Get recent events
      const { data: recentEvents } = await supabase
        .from('peppol_webhook_events')
        .select('event_type, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        data: {
          totalEvents: totalEvents || 0,
          processedEvents: processedEvents || 0,
          failedEvents: failedEvents || 0,
          successRate: totalEvents > 0 ? Math.round((processedEvents / totalEvents) * 100) : 0,
          recentEvents: recentEvents || []
        }
      };

    } catch (error) {
      console.error('Failed to get webhook statistics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test webhook by sending a test event
   */
  async testWebhook(webhookType) {
    try {
      const webhookUrl = this.getSupabaseWebhookUrl();
      if (!webhookUrl) {
        return { success: false, error: 'Could not determine webhook URL' };
      }

      // Create test payload
      const testPayload = {
        eventType: webhookType,
        timestamp: new Date().toISOString(),
        data: {
          messageId: `TEST-${Date.now()}`,
          peppolIdentifier: '0208:0630675588',
          invoiceNumber: `TEST-INV-${Date.now()}`,
          senderName: 'Test Sender',
          senderPeppolId: '0208:1234567890',
          receiverPeppolId: '0208:0630675588',
          totalAmount: 1000.00,
          currency: 'EUR',
          issueDate: new Date().toISOString().split('T')[0],
          status: 'delivered'
        }
      };

      // Send test webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': createAuthHeader(this.config.username, this.config.password)
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, message: 'Test webhook sent successfully', data: result };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }

    } catch (error) {
      console.error('Failed to test webhook:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PeppolWebhookService;

