// =====================================================
// PEPPOL WEBHOOK HANDLER
// Supabase Edge Function to receive Peppol webhook events
// =====================================================
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Peppol webhook event types from Digiteal API
const PEPPOL_EVENT_TYPES = {
  // Invoice events
  INVOICE_RECEIVED: 'PEPPOL_INVOICE_RECEIVED',
  CREDIT_NOTE_RECEIVED: 'PEPPOL_CREDIT_NOTE_RECEIVED',
  INVOICE_RESPONSE_RECEIVED: 'PEPPOL_INVOICE_RESPONSE_RECEIVED',
  
  // MLR (Message Level Response) events
  MLR_RECEIVED: 'PEPPOL_MLR_RECEIVED',
  
  // Transport acknowledgments
  TRANSPORT_ACK_RECEIVED: 'PEPPOL_TRANSPORT_ACK_RECEIVED',
  
  // Self-billing events
  SELF_BILLING_INVOICE_RECEIVED: 'PEPPOL_SELF_BILLING_INVOICE_RECEIVED',
  SELF_BILLING_CREDIT_NOTE_RECEIVED: 'PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED',
  
  // Send processing outcomes
  SEND_PROCESSING_OUTCOME: 'PEPPOL_SEND_PROCESSING_OUTCOME',
  
  // Future validation events
  FUTURE_VALIDATION_FAILED: 'PEPPOL_FUTURE_VALIDATION_FAILED',
  
  // Configuration events
  AUTOPAY_CONFIGURATION_ACTIVATED: 'AUTOPAY_CONFIGURATION_ACTIVATED'
};

interface WebhookPayload {
  eventType: string;
  timestamp: string;
  data: {
    peppolIdentifier?: string;
    documentType?: string;
    messageId?: string;
    invoiceNumber?: string;
    senderPeppolId?: string;
    senderName?: string;
    receiverPeppolId?: string;
    receiverName?: string;
    totalAmount?: number;
    currency?: string;
    issueDate?: string;
    dueDate?: string;
    ublXml?: string;
    status?: string;
    errorMessage?: string;
    [key: string]: any;
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('📥 Received Peppol webhook:', payload.eventType);

    // Validate webhook authentication (basic validation)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('❌ Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract credentials and validate (you should verify against configured credentials)
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    // Basic credential check (replace with your actual validation)
    if (username !== 'haliqo-test' || password !== 'Haliqo123') {
      console.error('❌ Invalid credentials');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine user based on Peppol identifier
    const receiverPeppolId = payload.data.receiverPeppolId || payload.data.peppolIdentifier;
    
    if (!receiverPeppolId) {
      console.error('❌ No receiver Peppol identifier in payload');
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing receiver identifier' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by Peppol ID
    const { data: peppolSettings, error: settingsError } = await supabase
      .from('peppol_settings')
      .select('user_id, peppol_id')
      .eq('peppol_id', receiverPeppolId)
      .single();

    if (settingsError || !peppolSettings) {
      console.error('❌ No user found for Peppol ID:', receiverPeppolId);
      // Log the event anyway for debugging
      await supabase.from('peppol_webhook_events').insert({
        user_id: null,
        event_type: payload.eventType,
        event_data: payload.data,
        status: 'failed',
        error_message: `No user found for Peppol ID: ${receiverPeppolId}`,
        peppol_message_id: payload.data.messageId
      });
      
      return new Response(
        JSON.stringify({ error: 'User not found for this Peppol identifier' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = peppolSettings.user_id;

    // Process the webhook based on event type
    let processResult;
    switch (payload.eventType) {
      case PEPPOL_EVENT_TYPES.INVOICE_RECEIVED:
      case PEPPOL_EVENT_TYPES.CREDIT_NOTE_RECEIVED:
        processResult = await processInboundInvoice(supabase, userId, payload);
        break;

      case PEPPOL_EVENT_TYPES.SEND_PROCESSING_OUTCOME:
        processResult = await processSendOutcome(supabase, userId, payload);
        break;

      case PEPPOL_EVENT_TYPES.MLR_RECEIVED:
      case PEPPOL_EVENT_TYPES.TRANSPORT_ACK_RECEIVED:
        processResult = await processAcknowledgment(supabase, userId, payload);
        break;

      case PEPPOL_EVENT_TYPES.INVOICE_RESPONSE_RECEIVED:
        processResult = await processInvoiceResponse(supabase, userId, payload);
        break;

      default:
        console.log('ℹ️ Unhandled event type:', payload.eventType);
        processResult = { success: true, message: 'Event logged but not processed' };
    }

    // Log the webhook event
    const { error: eventLogError } = await supabase
      .from('peppol_webhook_events')
      .insert({
        user_id: userId,
        event_type: payload.eventType,
        event_data: payload.data,
        status: processResult.success ? 'processed' : 'failed',
        error_message: processResult.error,
        processed_at: processResult.success ? new Date().toISOString() : null,
        invoice_id: processResult.invoiceId,
        peppol_message_id: payload.data.messageId
      });

    if (eventLogError) {
      console.error('❌ Failed to log webhook event:', eventLogError);
    }

    // Log to audit trail
    await supabase.from('peppol_audit_log').insert({
      user_id: userId,
      action_type: `webhook_${payload.eventType}`,
      action_description: `Received webhook: ${payload.eventType}`,
      request_data: payload,
      response_data: processResult,
      status: processResult.success ? 'success' : 'failed',
      error_message: processResult.error
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        eventType: payload.eventType,
        result: processResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Process inbound invoice (received from Peppol network)
 * Creates expense invoice in the existing expense_invoices table
 */
async function processInboundInvoice(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;

    // Calculate amounts (support both formats)
    const totalAmount = data.totalAmount || data.amount || 0;
    const taxAmount = data.taxAmount || 0;
    const netAmount = totalAmount - taxAmount;

    // Check if sender exists as participant, if not create one
    let senderId = null;
    if (data.senderPeppolId) {
      const { data: existingParticipant } = await supabase
        .from('peppol_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('peppol_identifier', data.senderPeppolId)
        .single();

      if (existingParticipant) {
        senderId = existingParticipant.id;
      } else {
        // Create new participant
        const { data: newParticipant, error: participantError } = await supabase
          .from('peppol_participants')
          .insert({
            user_id: userId,
            peppol_identifier: data.senderPeppolId,
            business_name: data.senderName || 'Unknown Sender',
            vat_number: data.senderPeppolId?.split(':')[1] || '',
            country_code: data.senderPeppolId?.split(':')[0] === '0208' ? 'BE' : 'NL',
            is_active: true,
            verification_status: 'verified',
            last_verified: new Date().toISOString()
          })
          .select('id')
          .single();

        if (!participantError && newParticipant) {
          senderId = newParticipant.id;
        }
      }
    }

    // Create expense invoice record (supplier invoice)
    const { data: expenseInvoice, error: expenseError } = await supabase
      .from('expense_invoices')
      .insert({
        user_id: userId,
        invoice_number: data.invoiceNumber || `PEPPOL-${Date.now()}`,
        supplier_name: data.senderName || 'Unknown Supplier',
        supplier_email: data.senderEmail || '',
        supplier_vat_number: data.senderVatNumber || data.senderPeppolId?.split(':')[1] || '',
        amount: totalAmount,
        net_amount: netAmount,
        vat_amount: taxAmount,
        status: 'pending',
        category: data.category || 'General',
        source: 'peppol',
        issue_date: data.issueDate || new Date().toISOString().split('T')[0],
        due_date: data.dueDate || new Date().toISOString().split('T')[0],
        notes: `Received via Peppol network. Message ID: ${data.messageId || 'N/A'}`,
        peppol_enabled: true,
        peppol_message_id: data.messageId,
        peppol_received_at: new Date().toISOString(),
        sender_peppol_id: data.senderPeppolId,
        ubl_xml: data.ublXml
      })
      .select('id')
      .single();

    if (expenseError) {
      console.error('❌ Failed to create expense invoice:', expenseError);
      return { success: false, error: expenseError.message };
    }

    // Also create a record in peppol_invoices for tracking (optional)
    const { data: peppolInvoice, error: peppolError } = await supabase
      .from('peppol_invoices')
      .insert({
        user_id: userId,
        invoice_number: data.invoiceNumber || `PEPPOL-${Date.now()}`,
        document_type: data.documentType || 'INVOICE',
        direction: 'inbound',
        sender_id: senderId,
        sender_peppol_id: data.senderPeppolId,
        sender_name: data.senderName,
        sender_vat_number: data.senderVatNumber || data.senderPeppolId?.split(':')[1],
        receiver_peppol_id: data.receiverPeppolId,
        receiver_name: data.receiverName,
        issue_date: data.issueDate || new Date().toISOString().split('T')[0],
        due_date: data.dueDate,
        total_amount: totalAmount,
        currency: data.currency || 'EUR',
        ubl_xml: data.ublXml,
        status: 'received',
        peppol_message_id: data.messageId,
        received_at: new Date().toISOString(),
        supplier_invoice_id: expenseInvoice.id
      })
      .select('id')
      .single();

    if (peppolError) {
      console.log('⚠️ Warning: Could not create peppol_invoices record:', peppolError.message);
      // Don't fail the whole process if this fails
    }

    console.log('✅ Expense invoice created successfully:', expenseInvoice.id);
    return { success: true, invoiceId: expenseInvoice.id, peppolInvoiceId: peppolInvoice?.id };

  } catch (error) {
    console.error('❌ Error processing inbound invoice:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process send outcome (status update for sent invoices)
 * Updates status in the existing invoices table
 */
async function processSendOutcome(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    const messageId = data.messageId;

    if (!messageId) {
      return { success: false, error: 'No message ID provided' };
    }

    // Find invoice by message ID in the invoices table (client invoices)
    const { data: invoice, error: findError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('peppol_message_id', messageId)
      .single();

    if (findError || !invoice) {
      console.error('❌ Invoice not found for message ID:', messageId);
      return { success: false, error: 'Invoice not found' };
    }

    // Determine Peppol status
    const peppolStatus = data.status === 'delivered' ? 'delivered' : 
                         data.status === 'failed' ? 'failed' : 'sent';
    
    const updateData: any = {
      peppol_status: peppolStatus,
      updated_at: new Date().toISOString()
    };

    if (peppolStatus === 'delivered') {
      updateData.peppol_delivered_at = new Date().toISOString();
    } else if (peppolStatus === 'failed') {
      updateData.peppol_error_message = data.errorMessage || 'Delivery failed';
    }

    // Update the invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoice.id);

    if (updateError) {
      console.error('❌ Failed to update invoice:', updateError);
      return { success: false, error: updateError.message };
    }

    // Also update peppol_invoices if it exists (for tracking)
    const { error: peppolUpdateError } = await supabase
      .from('peppol_invoices')
      .update({
        status: peppolStatus,
        delivered_at: peppolStatus === 'delivered' ? new Date().toISOString() : null,
        failed_at: peppolStatus === 'failed' ? new Date().toISOString() : null,
        error_message: peppolStatus === 'failed' ? data.errorMessage : null,
        updated_at: new Date().toISOString()
      })
      .eq('peppol_message_id', messageId)
      .eq('user_id', userId);

    if (peppolUpdateError) {
      console.log('⚠️ Warning: Could not update peppol_invoices:', peppolUpdateError.message);
      // Don't fail if this update fails
    }

    console.log('✅ Invoice status updated:', invoice.id, peppolStatus);
    return { success: true, invoiceId: invoice.id };

  } catch (error) {
    console.error('❌ Error processing send outcome:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process acknowledgment (MLR, Transport ACK)
 */
async function processAcknowledgment(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    const messageId = data.messageId;

    if (!messageId) {
      return { success: false, error: 'No message ID provided' };
    }

    // Find invoice and update metadata
    const { data: invoice, error: findError } = await supabase
      .from('peppol_invoices')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('peppol_message_id', messageId)
      .single();

    if (findError || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Update metadata with acknowledgment info
    const metadata = invoice.metadata || {};
    metadata.acknowledgments = metadata.acknowledgments || [];
    metadata.acknowledgments.push({
      type: payload.eventType,
      receivedAt: new Date().toISOString(),
      data: data
    });

    const { error: updateError } = await supabase
      .from('peppol_invoices')
      .update({ metadata })
      .eq('id', invoice.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    console.log('✅ Acknowledgment processed:', invoice.id);
    return { success: true, invoiceId: invoice.id };

  } catch (error) {
    console.error('❌ Error processing acknowledgment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process invoice response (buyer response to invoice)
 */
async function processInvoiceResponse(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    
    // Similar to acknowledgment but might trigger different business logic
    console.log('ℹ️ Invoice response received:', data);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error processing invoice response:', error);
    return { success: false, error: error.message };
  }
}

console.log('🚀 Peppol webhook handler is running');

