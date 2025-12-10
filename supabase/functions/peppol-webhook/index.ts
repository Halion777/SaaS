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

// Digiteal webhook payload structure (actual format)
interface DigitealWebhookPayload {
  recipientPeppolIdentifier: string;
  changeType: string;
  peppolFileContent: string; // Base64 encoded UBL XML
  integratorVAT?: string;
  executionTimestamp?: string;
  [key: string]: any;
}

// Internal normalized payload structure
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

    // Parse webhook payload (Digiteal format)
    const digitealPayload: DigitealWebhookPayload = await req.json();
    
    // Normalize Digiteal payload to internal format
    // Map changeType to eventType
    const changeTypeToEventType: { [key: string]: string } = {
      'INVOICE_RECEIVED': PEPPOL_EVENT_TYPES.INVOICE_RECEIVED,
      'CREDIT_NOTE_RECEIVED': PEPPOL_EVENT_TYPES.CREDIT_NOTE_RECEIVED,
      'SELF_BILLING_INVOICE_RECEIVED': PEPPOL_EVENT_TYPES.SELF_BILLING_INVOICE_RECEIVED,
      'SELF_BILLING_CREDIT_NOTE_RECEIVED': PEPPOL_EVENT_TYPES.SELF_BILLING_CREDIT_NOTE_RECEIVED,
      'TRANSPORT_ACK_RECEIVED': PEPPOL_EVENT_TYPES.TRANSPORT_ACK_RECEIVED,
      'MLR_RECEIVED': PEPPOL_EVENT_TYPES.MLR_RECEIVED,
      'SEND_PROCESSING_OUTCOME': PEPPOL_EVENT_TYPES.SEND_PROCESSING_OUTCOME,
      'INVOICE_RESPONSE_RECEIVED': PEPPOL_EVENT_TYPES.INVOICE_RESPONSE_RECEIVED,
      'FUTURE_VALIDATION_FAILED': PEPPOL_EVENT_TYPES.FUTURE_VALIDATION_FAILED,
      'AUTOPAY_CONFIGURATION_ACTIVATED': PEPPOL_EVENT_TYPES.AUTOPAY_CONFIGURATION_ACTIVATED
    };
    
    const eventType = changeTypeToEventType[digitealPayload.changeType] || digitealPayload.changeType;
    
    // Decode base64 peppolFileContent to get UBL XML
    let ublXml = '';
    if (digitealPayload.peppolFileContent) {
      try {
        ublXml = atob(digitealPayload.peppolFileContent);
      } catch (decodeError) {
        console.error('[Peppol Webhook] Failed to decode base64 peppolFileContent:', decodeError);
      }
    }
    
    // Extract message ID from XML for acknowledgment events
    let messageId = '';
    if (ublXml && (eventType === PEPPOL_EVENT_TYPES.TRANSPORT_ACK_RECEIVED || 
                   eventType === PEPPOL_EVENT_TYPES.MLR_RECEIVED ||
                   eventType === PEPPOL_EVENT_TYPES.SEND_PROCESSING_OUTCOME)) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(ublXml, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          console.error('[Peppol Webhook] XML parsing error:', parserError.textContent);
        } else {
          // Try to find UAMessageIdentifier (for transport acks) or MessageIdentifier
          const uaMessageId = xmlDoc.getElementsByTagName('UAMessageIdentifier')[0];
          if (uaMessageId && uaMessageId.textContent) {
            messageId = uaMessageId.textContent.trim();
            console.log('[Peppol Webhook] Extracted UAMessageIdentifier from XML:', messageId);
          } else {
            const messageIdEl = xmlDoc.getElementsByTagName('MessageIdentifier')[0];
            if (messageIdEl && messageIdEl.textContent) {
              messageId = messageIdEl.textContent.trim();
              console.log('[Peppol Webhook] Extracted MessageIdentifier from XML:', messageId);
            } else {
              console.warn('[Peppol Webhook] Could not find UAMessageIdentifier or MessageIdentifier in XML');
            }
          }
        }
      } catch (parseError) {
        console.error('[Peppol Webhook] Failed to extract message ID from XML:', parseError);
      }
    }
    
    // Normalize to internal payload format
    const payload: WebhookPayload = {
      eventType: eventType,
      timestamp: digitealPayload.executionTimestamp || new Date().toISOString(),
      data: {
        receiverPeppolId: digitealPayload.recipientPeppolIdentifier,
        peppolIdentifier: digitealPayload.recipientPeppolIdentifier,
        ublXml: ublXml,
        messageId: messageId || undefined,
        // Additional fields will be extracted from UBL XML if needed
      }
    };
    
    // Log for debugging
    console.log('[Peppol Webhook] Normalized payload:', {
      eventType: payload.eventType,
      receiverPeppolId: payload.data.receiverPeppolId,
      hasUblXml: !!payload.data.ublXml,
      messageId: payload.data.messageId || 'N/A',
      ublXmlLength: payload.data.ublXml?.length || 0
    });

    // Validate webhook authentication (basic validation)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine user based on Peppol identifier
    // Get receiver Peppol ID from normalized payload (from recipientPeppolIdentifier)
    let receiverPeppolId = payload.data?.receiverPeppolId || payload.data?.peppolIdentifier;
    
    // If not in payload, try to extract from UBL XML for inbound invoices
    if (!receiverPeppolId && payload.data?.ublXml) {
      try {
        // Parse UBL XML to extract receiver (customer) Peppol ID
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(payload.data.ublXml, 'text/xml');
        
        const accountingCustomerParty = xmlDoc.getElementsByTagName('AccountingCustomerParty')[0];
        if (accountingCustomerParty) {
          const party = accountingCustomerParty.getElementsByTagName('Party')[0];
          if (party) {
            const endpointId = party.getElementsByTagName('EndpointID')[0];
            if (endpointId) {
              const schemeId = endpointId.getAttribute('schemeID') || '';
              const idValue = endpointId.textContent?.trim() || '';
              if (schemeId && idValue) {
                receiverPeppolId = `${schemeId}:${idValue}`;
              }
            }
          }
        }
      } catch (parseError) {
        // If XML parsing fails, continue with other methods
      }
    }
    
    // Log for debugging
    console.log('[Peppol Webhook] Receiver Peppol ID:', receiverPeppolId || 'NOT FOUND');
    console.log('[Peppol Webhook] Event Type:', eventType);
    console.log('[Peppol Webhook] Has UBL XML:', !!ublXml);
    
    if (!receiverPeppolId) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing receiver identifier' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Peppol ID to extract scheme and VAT number for flexible matching
    // Format: "SCHEME:VATNUMBER" (e.g., "9925:BE0545744269" or "0208:1000000063")
    const parsePeppolId = (peppolId: string) => {
      const parts = peppolId.split(':');
      if (parts.length === 2) {
        const scheme = parts[0].trim();
        const vatNumber = parts[1].trim();
        // Normalize VAT number to uppercase for comparison (remove country prefix if present, then add it back)
        let normalizedVat = vatNumber.toUpperCase();
        // If VAT doesn't start with country code, try to infer from scheme
        if (!normalizedVat.match(/^[A-Z]{2}/)) {
          // For Belgian schemes, add BE prefix if missing
          if (scheme === '0208' || scheme === '9925') {
            normalizedVat = 'BE' + normalizedVat;
          }
        }
        return { scheme, vatNumber: normalizedVat, originalVat: vatNumber };
      }
      return null;
    };

    const parsedId = parsePeppolId(receiverPeppolId);
    
    if (!parsedId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Peppol ID format. Expected format: SCHEME:VATNUMBER' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by matching scheme and VAT number (flexible matching)
    // Check multiple fields: peppol_id, peppol_id_9925, peppol_id_0208
    // Match based on scheme + normalized VAT number
    let peppolSettings = null;
    let settingsError = null;

    // First, try exact match (case-insensitive)
    const normalizedReceiverIdLower = receiverPeppolId.toLowerCase();
    const normalizedReceiverIdUpper = receiverPeppolId.toUpperCase();
    
    const { data: exactMatch, error: exactError } = await supabase
      .from('peppol_settings')
      .select('user_id, peppol_id, peppol_id_9925, peppol_id_0208')
      .or(`peppol_id.eq.${normalizedReceiverIdLower},peppol_id.eq.${normalizedReceiverIdUpper},peppol_id.eq.${receiverPeppolId}`)
      .maybeSingle();

    if (exactMatch) {
      peppolSettings = exactMatch;
    } else {
      // If no exact match, try matching by scheme + VAT number
      // Get all peppol_settings and match manually
      const { data: allSettings, error: allError } = await supabase
        .from('peppol_settings')
        .select('user_id, peppol_id, peppol_id_9925, peppol_id_0208');

      if (!allError && allSettings) {
        // Find matching setting by comparing scheme and VAT number
        for (const setting of allSettings) {
          // Check primary peppol_id
          if (setting.peppol_id) {
            const settingParsed = parsePeppolId(setting.peppol_id);
            if (settingParsed && settingParsed.scheme === parsedId.scheme) {
              // Compare VAT numbers (case-insensitive, with or without country prefix)
              const settingVat = settingParsed.vatNumber.toUpperCase().replace(/^BE/, '');
              const incomingVat = parsedId.vatNumber.toUpperCase().replace(/^BE/, '');
              if (settingVat === incomingVat) {
                peppolSettings = setting;
                break;
              }
            }
          }
          
          // Check peppol_id_9925 (for Belgian VAT scheme)
          if (parsedId.scheme === '9925' && setting.peppol_id_9925) {
            const settingParsed = parsePeppolId(setting.peppol_id_9925);
            if (settingParsed) {
              const settingVat = settingParsed.vatNumber.toUpperCase().replace(/^BE/, '');
              const incomingVat = parsedId.vatNumber.toUpperCase().replace(/^BE/, '');
              if (settingVat === incomingVat) {
                peppolSettings = setting;
                break;
              }
            }
          }
          
          // Check peppol_id_0208 (for Belgian enterprise number)
          if (parsedId.scheme === '0208' && setting.peppol_id_0208) {
            const settingParsed = parsePeppolId(setting.peppol_id_0208);
            if (settingParsed) {
              const settingVat = settingParsed.vatNumber.toUpperCase().replace(/^BE/, '');
              const incomingVat = parsedId.vatNumber.toUpperCase().replace(/^BE/, '');
              if (settingVat === incomingVat) {
                peppolSettings = setting;
                break;
              }
            }
          }
        }
      } else {
        settingsError = allError;
      }
    }

    if (settingsError || !peppolSettings) {
      // Log the attempted match for debugging
      console.log('[Webhook] Failed to find user for receiver Peppol ID:', {
        attemptedId: receiverPeppolId,
        normalizedLower: normalizedReceiverIdLower,
        normalizedUpper: normalizedReceiverIdUpper,
        error: settingsError?.message,
        eventType: payload.eventType
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'User not found for this Peppol identifier',
          attemptedId: receiverPeppolId,
          details: 'Make sure your Peppol ID is registered in Peppol settings. The receiver ID in the invoice must match the Peppol ID in your settings.'
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful match
    console.log('[Webhook] Found user for receiver Peppol ID:', {
      receiverId: receiverPeppolId,
      matchedPeppolId: peppolSettings.peppol_id,
      userId: peppolSettings.user_id,
      eventType: payload.eventType
    });

    const userId = peppolSettings.user_id;

    // Process the webhook based on event type
    // According to Digiteal documentation: https://doc.digiteal.eu/docs/types-of-webhooks
    let processResult;
    switch (payload.eventType) {
      // Inbound invoices (expense invoices) - these create expense_invoices records
      case PEPPOL_EVENT_TYPES.INVOICE_RECEIVED:
      case PEPPOL_EVENT_TYPES.CREDIT_NOTE_RECEIVED:
      case PEPPOL_EVENT_TYPES.SELF_BILLING_INVOICE_RECEIVED:
      case PEPPOL_EVENT_TYPES.SELF_BILLING_CREDIT_NOTE_RECEIVED:
        processResult = await processInboundInvoice(supabase, userId, payload);
        break;

      // Send processing outcomes (status updates for sent invoices)
      case PEPPOL_EVENT_TYPES.SEND_PROCESSING_OUTCOME:
        processResult = await processSendOutcome(supabase, userId, payload);
        break;

      // Response events (acknowledgments)
      case PEPPOL_EVENT_TYPES.MLR_RECEIVED:
      case PEPPOL_EVENT_TYPES.TRANSPORT_ACK_RECEIVED:
        processResult = await processAcknowledgment(supabase, userId, payload);
        break;

      // Business response events
      case PEPPOL_EVENT_TYPES.INVOICE_RESPONSE_RECEIVED:
        processResult = await processInvoiceResponse(supabase, userId, payload);
        break;

      // Validation events
      case PEPPOL_EVENT_TYPES.FUTURE_VALIDATION_FAILED:
        processResult = await processFutureValidationFailed(supabase, userId, payload);
        break;

      // Configuration events
      case PEPPOL_EVENT_TYPES.AUTOPAY_CONFIGURATION_ACTIVATED:
        processResult = { success: true, message: 'AutoPay configuration event logged' };
        break;

      default:
        processResult = { success: true, message: 'Event logged but not processed' };
    }

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
 * Parse UBL XML to extract all mandatory fields from Peppol BIS Billing 3.0 invoice
 */
function parseUBLInvoice(ublXml: string): any {
  try {
    // Parse XML using DOMParser (Deno environment)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(ublXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML format: ' + parserError.textContent);
    }

    // Helper function to get text content by local name (works with namespaces)
    // UBL XML uses namespaces, so we search by local name
    // Try namespace-aware methods first, then fallback to prefix-based selectors
    const getTextByLocalName = (localName: string, parent?: any): string => {
      const searchRoot = parent || xmlDoc;
      
      // Method 1: Try getElementsByTagNameNS with UBL namespaces
      const ublNamespaces = [
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
      ];
      
      for (const ns of ublNamespaces) {
        try {
          const elements = searchRoot.getElementsByTagNameNS(ns, localName);
          if (elements.length > 0 && elements[0].textContent) {
            return elements[0].textContent.trim();
          }
        } catch (e) {
          // Namespace method not supported, continue to next method
        }
      }
      
      // Method 2: Try getElementsByTagName (works if namespaces are ignored)
      try {
        const elements = searchRoot.getElementsByTagName(localName);
        if (elements.length > 0 && elements[0].textContent) {
          return elements[0].textContent.trim();
        }
      } catch (e) {
        // Continue to next method
      }
      
      // Method 3: Try querySelector with namespace prefixes
      try {
        const prefixed = searchRoot.querySelector(`cbc\\:${localName}, cac\\:${localName}, Invoice > ${localName}`);
        if (prefixed && prefixed.textContent) {
          return prefixed.textContent.trim();
        }
      } catch (e) {
        // Continue to next method
      }
      
      // Method 4: Try XPath-like search (find by local name in all namespaces)
      try {
        const allElements = searchRoot.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.localName === localName && el.textContent) {
            return el.textContent.trim();
          }
        }
      } catch (e) {
        // Last resort
      }
      
      return '';
    };

    const getAttributeByLocalName = (localName: string, attr: string, parent?: any): string => {
      const searchRoot = parent || xmlDoc;
      
      // Method 1: Try namespace-aware methods
      const ublNamespaces = [
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
      ];
      
      for (const ns of ublNamespaces) {
        try {
          const elements = searchRoot.getElementsByTagNameNS(ns, localName);
          if (elements.length > 0 && elements[0].hasAttribute(attr)) {
            return elements[0].getAttribute(attr) || '';
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Method 2: Try getElementsByTagName
      try {
        const elements = searchRoot.getElementsByTagName(localName);
        if (elements.length > 0 && elements[0].hasAttribute(attr)) {
          return elements[0].getAttribute(attr) || '';
        }
      } catch (e) {
        // Continue
      }
      
      // Method 3: Try querySelector
      try {
        const prefixed = searchRoot.querySelector(`cbc\\:${localName}, cac\\:${localName}`);
        if (prefixed && prefixed.hasAttribute(attr)) {
          return prefixed.getAttribute(attr) || '';
        }
      } catch (e) {
        // Continue
      }
      
      // Method 4: Search by local name
      try {
        const allElements = searchRoot.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.localName === localName && el.hasAttribute(attr)) {
            return el.getAttribute(attr) || '';
          }
        }
      } catch (e) {
        // Last resort
      }
      
      return '';
    };

    // Helper to find element by local name within parent (namespace-aware)
    const findElement = (localName: string, parent?: any): any => {
      const searchRoot = parent || xmlDoc;
      
      // Try namespace-aware methods first
      const ublNamespaces = [
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
      ];
      
      for (const ns of ublNamespaces) {
        try {
          const elements = searchRoot.getElementsByTagNameNS(ns, localName);
          if (elements.length > 0) {
            return elements[0];
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Fallback to getElementsByTagName
      try {
        const elements = searchRoot.getElementsByTagName(localName);
        if (elements.length > 0) {
          return elements[0];
        }
      } catch (e) {
        // Continue
      }
      
      // Fallback to querySelector
      try {
        const prefixed = searchRoot.querySelector(`cbc\\:${localName}, cac\\:${localName}`);
        if (prefixed) {
          return prefixed;
        }
      } catch (e) {
        // Continue
      }
      
      // Last resort: search by local name
      try {
        const allElements = searchRoot.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.localName === localName) {
            return el;
          }
        }
      } catch (e) {
        // Return null if nothing found
      }
      
      return null;
    };
    
    const findAllElements = (localName: string, parent?: any): any[] => {
      const searchRoot = parent || xmlDoc;
      const results: any[] = [];
      
      // Try namespace-aware methods first
      const ublNamespaces = [
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
      ];
      
      for (const ns of ublNamespaces) {
        try {
          const elements = searchRoot.getElementsByTagNameNS(ns, localName);
          if (elements.length > 0) {
            return Array.from(elements);
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Fallback to getElementsByTagName
      try {
        const elements = searchRoot.getElementsByTagName(localName);
        if (elements.length > 0) {
          return Array.from(elements);
        }
      } catch (e) {
        // Continue
      }
      
      // Last resort: search by local name
      try {
        const allElements = searchRoot.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.localName === localName) {
            results.push(el);
          }
        }
      } catch (e) {
        // Return empty array
      }
      
      return results;
    };

    // Helper for simple text extraction (tries both approaches)
    const getText = (localName: string, parent?: any): string => {
      return getTextByLocalName(localName, parent);
    };

    const getAttribute = (localName: string, attr: string, parent?: any): string => {
      return getAttributeByLocalName(localName, attr, parent);
    };

    // Helper to get elements
    const querySelector = (selectors: string[] | string) => {
      const selectorList = Array.isArray(selectors) ? selectors : [selectors];
      for (const selector of selectorList) {
        try {
          const element = xmlDoc.querySelector(selector);
          if (element) return element;
        } catch (e) {
          // Invalid selector, try next
        }
      }
      return null;
    };
    
    const querySelectorAll = (selectors: string[] | string) => {
      const selectorList = Array.isArray(selectors) ? selectors : [selectors];
      for (const selector of selectorList) {
        try {
          const elements = xmlDoc.querySelectorAll(selector);
          if (elements.length > 0) return Array.from(elements);
        } catch (e) {
          // Invalid selector, try next
        }
      }
      return [];
    };

    // Extract Document Identifiers (Mandatory)
    const invoiceId = getText('ID');
    const issueDate = getText('IssueDate');
    const dueDate = getText('DueDate');
    const invoiceTypeCode = getText('InvoiceTypeCode');
    const documentCurrencyCode = getText('DocumentCurrencyCode');
    const buyerReference = getText('BuyerReference');

    // Extract Supplier Party (AccountingSupplierParty) - Mandatory
    const accountingSupplierParty = findElement('AccountingSupplierParty');
    const supplierParty = accountingSupplierParty ? findElement('Party', accountingSupplierParty) : null;
    
    const supplierEndpointId = supplierParty ? getText('EndpointID', supplierParty) : '';
    const supplierEndpointScheme = supplierParty ? getAttribute('EndpointID', 'schemeID', supplierParty) : '';
    
    const partyName = supplierParty ? findElement('PartyName', supplierParty) : null;
    const supplierName = partyName ? getText('Name', partyName) : '';
    
    const partyTaxScheme = supplierParty ? findElement('PartyTaxScheme', supplierParty) : null;
    const supplierVatNumber = partyTaxScheme ? getText('CompanyID', partyTaxScheme) : '';
    
    const partyLegalEntity = supplierParty ? findElement('PartyLegalEntity', supplierParty) : null;
    const supplierCompanyId = partyLegalEntity ? getText('CompanyID', partyLegalEntity) : '';
    
    const postalAddress = supplierParty ? findElement('PostalAddress', supplierParty) : null;
    const supplierStreet = postalAddress ? getText('StreetName', postalAddress) : '';
    const supplierCity = postalAddress ? getText('CityName', postalAddress) : '';
    const supplierPostalCode = postalAddress ? getText('PostalZone', postalAddress) : '';
    const country = postalAddress ? findElement('Country', postalAddress) : null;
    const supplierCountry = country ? getText('IdentificationCode', country) : '';
    
    const contact = supplierParty ? findElement('Contact', supplierParty) : null;
    const supplierEmail = contact ? getText('ElectronicMail', contact) : '';

    // Extract Customer Party (AccountingCustomerParty) - Mandatory
    const accountingCustomerParty = findElement('AccountingCustomerParty');
    const customerParty = accountingCustomerParty ? findElement('Party', accountingCustomerParty) : null;
    
    const customerEndpointId = customerParty ? getText('EndpointID', customerParty) : '';
    const customerEndpointScheme = customerParty ? getAttribute('EndpointID', 'schemeID', customerParty) : '';
    
    const customerPartyName = customerParty ? findElement('PartyName', customerParty) : null;
    const customerName = customerPartyName ? getText('Name', customerPartyName) : '';
    
    const customerPartyTaxScheme = customerParty ? findElement('PartyTaxScheme', customerParty) : null;
    const customerVatNumber = customerPartyTaxScheme ? getText('CompanyID', customerPartyTaxScheme) : '';

    // Extract Tax Information (Mandatory)
    const taxTotal = findElement('TaxTotal');
    const totalTaxAmount = taxTotal ? parseFloat(getText('TaxAmount', taxTotal)) || 0 : 0;
    const taxCurrency = taxTotal ? (getAttribute('TaxAmount', 'currencyID', taxTotal) || documentCurrencyCode) : documentCurrencyCode;

    // Extract tax subtotals
    const taxSubtotals: any[] = [];
    if (taxTotal) {
      const taxSubtotalElements = findAllElements('TaxSubtotal', taxTotal);
      taxSubtotalElements.forEach((subtotal) => {
        const taxableAmount = parseFloat(getText('TaxableAmount', subtotal)) || 0;
        const taxAmount = parseFloat(getText('TaxAmount', subtotal)) || 0;
        const taxCategory = findElement('TaxCategory', subtotal);
        const taxCategoryId = taxCategory ? getText('ID', taxCategory) : '';
        const taxPercent = taxCategory ? parseFloat(getText('Percent', taxCategory)) || 0 : 0;
        taxSubtotals.push({ taxableAmount, taxAmount, taxCategoryId, taxPercent });
      });
    }

    // Extract Monetary Totals (Mandatory)
    const monetaryTotal = findElement('LegalMonetaryTotal');
    const lineExtensionAmount = monetaryTotal ? parseFloat(getText('LineExtensionAmount', monetaryTotal)) || 0 : 0;
    const taxExclusiveAmount = monetaryTotal ? parseFloat(getText('TaxExclusiveAmount', monetaryTotal)) || 0 : 0;
    const taxInclusiveAmount = monetaryTotal ? parseFloat(getText('TaxInclusiveAmount', monetaryTotal)) || 0 : 0;
    const payableAmount = monetaryTotal ? parseFloat(getText('PayableAmount', monetaryTotal)) || 0 : 0;
    const payableCurrency = monetaryTotal ? (getAttribute('PayableAmount', 'currencyID', monetaryTotal) || documentCurrencyCode) : documentCurrencyCode;

    // Extract Invoice Lines (Mandatory)
    const invoiceLines: any[] = [];
    const lineElements = findAllElements('InvoiceLine');
    lineElements.forEach((line, index) => {
      const lineId = getText('ID', line) || String(index + 1);
      const invoicedQuantity = findElement('InvoicedQuantity', line);
      const quantity = invoicedQuantity ? parseFloat(invoicedQuantity.textContent?.trim() || '0') : 0;
      const unitCode = invoicedQuantity ? (invoicedQuantity.getAttribute('unitCode') || '') : '';
      const lineExtensionAmount = parseFloat(getText('LineExtensionAmount', line)) || 0;
      
      const item = findElement('Item', line);
      const itemName = item ? getText('Name', item) : '';
      
      const classifiedTaxCategory = item ? findElement('ClassifiedTaxCategory', item) : null;
      const taxCategoryId = classifiedTaxCategory ? getText('ID', classifiedTaxCategory) : '';
      const taxPercent = classifiedTaxCategory ? parseFloat(getText('Percent', classifiedTaxCategory)) || 0 : 0;
      
      const price = findElement('Price', line);
      const priceAmount = price ? parseFloat(getText('PriceAmount', price)) || 0 : 0;
      
      invoiceLines.push({
        lineId,
        quantity,
        unitCode,
        lineExtensionAmount,
        itemName,
        priceAmount,
        taxCategoryId,
        taxPercent
      });
    });

    // Extract Payment Information (Optional but important)
    const paymentMeans = findElement('PaymentMeans');
    const paymentMeansCode = paymentMeans ? getText('PaymentMeansCode', paymentMeans) : '';
    const paymentId = paymentMeans ? getText('PaymentID', paymentMeans) : '';
    const payeeFinancialAccount = paymentMeans ? findElement('PayeeFinancialAccount', paymentMeans) : null;
    const iban = payeeFinancialAccount ? getText('ID', payeeFinancialAccount) : '';

    // Extract Payment Terms
    const paymentTerms = findElement('PaymentTerms');
    const paymentTermsNote = paymentTerms ? getText('Note', paymentTerms) : '';

    // Extract Delivery Information (Optional)
    const delivery = findElement('Delivery');
    const deliveryDate = delivery ? getText('ActualDeliveryDate', delivery) : '';

    // Extract Order Reference (Optional)
    const orderReference = findElement('OrderReference');
    const orderRefId = orderReference ? getText('ID', orderReference) : '';
    const salesOrderId = orderReference ? getText('SalesOrderID', orderReference) : '';

    return {
      // Document Identifiers
      invoiceId,
      issueDate,
      dueDate,
      invoiceTypeCode,
      documentCurrencyCode,
      buyerReference,
      
      // Supplier Information
      supplier: {
        peppolId: supplierEndpointScheme && supplierEndpointId ? `${supplierEndpointScheme}:${supplierEndpointId}` : '',
        name: supplierName,
        vatNumber: supplierVatNumber || supplierCompanyId,
        companyId: supplierCompanyId,
        address: {
          street: supplierStreet,
          city: supplierCity,
          postalCode: supplierPostalCode,
          country: supplierCountry
        },
        email: supplierEmail
      },
      
      // Customer Information (should be your company)
      customer: {
        peppolId: customerEndpointScheme && customerEndpointId ? `${customerEndpointScheme}:${customerEndpointId}` : '',
        name: customerName,
        vatNumber: customerVatNumber
      },
      
      // Tax Information
      tax: {
        totalTaxAmount,
        taxCurrency,
        subtotals: taxSubtotals
      },
      
      // Monetary Totals
      totals: {
        lineExtensionAmount,
        taxExclusiveAmount,
        taxInclusiveAmount,
        payableAmount,
        currency: payableCurrency
      },
      
      // Invoice Lines
      invoiceLines,
      
      // Payment Information
      payment: {
        meansCode: paymentMeansCode,
        paymentId,
        iban,
        terms: paymentTermsNote
      },
      
      // Additional Information
      deliveryDate,
      orderReference: orderRefId,
      salesOrderId
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Process inbound invoice (received from Peppol network)
 * Creates expense invoice in the existing expense_invoices table
 * Extracts all mandatory fields from UBL XML according to Peppol BIS Billing 3.0
 * Handles: Regular invoices, Credit notes, Self-billing invoices, Self-billing credit notes
 */
async function processInboundInvoice(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    
    // Determine document type from webhook event type
    const isSelfBilling = payload.eventType === PEPPOL_EVENT_TYPES.SELF_BILLING_INVOICE_RECEIVED || 
                         payload.eventType === PEPPOL_EVENT_TYPES.SELF_BILLING_CREDIT_NOTE_RECEIVED;
    const isCreditNote = payload.eventType === PEPPOL_EVENT_TYPES.CREDIT_NOTE_RECEIVED || 
                         payload.eventType === PEPPOL_EVENT_TYPES.SELF_BILLING_CREDIT_NOTE_RECEIVED;
    const documentType = isCreditNote ? 'CREDIT_NOTE' : 'INVOICE';
    const documentTypeLabel = isSelfBilling 
      ? (isCreditNote ? 'Self-Billing Credit Note' : 'Self-Billing Invoice')
      : (isCreditNote ? 'Credit Note' : 'Invoice');
    
    // Parse UBL XML to extract all mandatory fields
    let parsedInvoice: any = null;
    if (data.ublXml) {
      try {
        parsedInvoice = parseUBLInvoice(data.ublXml);
        console.log('[Peppol Webhook] Successfully parsed invoice:', {
          invoiceId: parsedInvoice?.invoiceId,
          payableAmount: parsedInvoice?.totals?.payableAmount,
          taxAmount: parsedInvoice?.tax?.totalTaxAmount,
          supplierName: parsedInvoice?.supplier?.name
        });
      } catch (parseError: any) {
        console.error('[Peppol Webhook] Failed to parse UBL XML:', parseError?.message || parseError);
        console.error('[Peppol Webhook] XML snippet:', data.ublXml?.substring(0, 500));
        // Fallback to webhook payload data if parsing fails
      }
    }

    // Use parsed data if available, otherwise fallback to webhook payload
    const invoiceData = parsedInvoice || {
      invoiceId: data.invoiceNumber || `PEPPOL-${Date.now()}`,
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      supplier: {
        peppolId: data.senderPeppolId || '',
        name: data.senderName || 'Unknown Supplier',
        vatNumber: data.senderVatNumber || '',
        email: data.senderEmail || ''
      },
      customer: {
        peppolId: data.receiverPeppolId || data.peppolIdentifier || '',
        name: data.receiverName || '',
        vatNumber: data.receiverVatNumber || ''
      },
      totals: {
        payableAmount: data.totalAmount || data.amount || 0,
        taxExclusiveAmount: (data.totalAmount || data.amount || 0) - (data.taxAmount || 0),
        currency: data.currency || 'EUR'
      },
      tax: {
        totalTaxAmount: data.taxAmount || 0,
        subtotals: []
      },
      payment: {
        terms: data.paymentTerms || null,
        meansCode: data.paymentMeansCode || null,
        paymentId: null,
        iban: null
      },
      invoiceLines: [],
      buyerReference: data.buyerReference || null,
      orderReference: data.orderReference || null,
      salesOrderId: data.salesOrderId || null,
      deliveryDate: data.deliveryDate || null,
      invoiceTypeCode: data.invoiceTypeCode || '380',
      documentCurrencyCode: data.currency || 'EUR'
    };

    // Calculate amounts - prioritize parsed invoice data
    const totalAmount = parsedInvoice 
      ? (parsedInvoice.totals?.payableAmount || parsedInvoice.totals?.taxInclusiveAmount || 0)
      : (invoiceData.totals?.payableAmount || invoiceData.totals?.taxInclusiveAmount || 0);
    const taxAmount = parsedInvoice
      ? (parsedInvoice.tax?.totalTaxAmount || 0)
      : (invoiceData.tax?.totalTaxAmount || 0);
    const netAmount = parsedInvoice
      ? (parsedInvoice.totals?.taxExclusiveAmount || parsedInvoice.totals?.lineExtensionAmount || (totalAmount - taxAmount))
      : (invoiceData.totals?.taxExclusiveAmount || invoiceData.totals?.lineExtensionAmount || (totalAmount - taxAmount));
    
    // Log amounts for debugging
    console.log('[Peppol Webhook] Calculated amounts:', {
      parsedInvoice: !!parsedInvoice,
      totalAmount,
      taxAmount,
      netAmount,
      totals: invoiceData.totals,
      tax: invoiceData.tax
    });

    // Extract supplier Peppol ID (format: schemeID:identifier)
    const supplierPeppolId = invoiceData.supplier?.peppolId || data.senderPeppolId || '';
    const supplierVatNumber = invoiceData.supplier?.vatNumber || data.senderVatNumber || (supplierPeppolId ? supplierPeppolId.split(':')[1] || '' : '');
    const supplierName = invoiceData.supplier?.name || data.senderName || supplierPeppolId || 'Unknown Supplier';

    // Check if sender exists as participant, if not create one
    let senderId = null;
    if (supplierPeppolId) {
      const { data: existingParticipant } = await supabase
        .from('peppol_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('peppol_identifier', supplierPeppolId)
        .single();

      if (existingParticipant) {
        senderId = existingParticipant.id;
      } else {
        // Create new participant with extracted information
        const supplierVatNumber = invoiceData.supplier?.vatNumber || supplierPeppolId.split(':')[1] || '';
        const supplierCountry = invoiceData.supplier?.address?.country || 
                                (supplierPeppolId.split(':')[0] === '0208' ? 'BE' : 
                                 supplierPeppolId.split(':')[0] === '0002' ? 'FR' : 'NL');
        
        const { data: newParticipant, error: participantError } = await supabase
          .from('peppol_participants')
          .insert({
            user_id: userId,
            peppol_identifier: supplierPeppolId,
            business_name: invoiceData.supplier?.name || 'Unknown Sender',
            vat_number: supplierVatNumber,
            country_code: supplierCountry,
            contact_email: invoiceData.supplier?.email || '',
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

    // Build notes with extracted information
    const notesParts = [
      `Received via Peppol network (${documentTypeLabel}). Message ID: ${data.messageId || 'N/A'}`,
      invoiceData.buyerReference ? `Buyer Reference: ${invoiceData.buyerReference}` : '',
      invoiceData.orderReference ? `Order Reference: ${invoiceData.orderReference}` : '',
      invoiceData.payment?.terms ? `Payment Terms: ${invoiceData.payment.terms}` : '',
      isSelfBilling ? 'Self-billing document' : ''
    ].filter(Boolean);
    const notes = notesParts.join('\n');

    // Determine invoice number (handle duplicates)
    const baseInvoiceNumber = invoiceData.invoiceId || data.invoiceNumber;
    let invoiceNumber = baseInvoiceNumber || `PEPPOL-${Date.now()}`;
    
    // Check if invoice number already exists (handle duplicates)
    if (baseInvoiceNumber) {
      const { data: existingInvoice } = await supabase
        .from('expense_invoices')
        .select('id, invoice_number')
        .eq('user_id', userId)
        .eq('invoice_number', baseInvoiceNumber)
        .single();
      
      if (existingInvoice) {
        // Invoice already exists - append timestamp to make unique
        invoiceNumber = `${baseInvoiceNumber}-${Date.now()}`;
      }
    }

    // Create expense invoice record (supplier invoice) with all extracted mandatory fields
    const { data: expenseInvoice, error: expenseError } = await supabase
      .from('expense_invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        supplier_name: supplierName,
        supplier_email: invoiceData.supplier.email || data.senderEmail || '',
        supplier_vat_number: supplierVatNumber,
        amount: totalAmount,
        net_amount: netAmount,
        vat_amount: taxAmount,
        status: 'pending',
        category: data.category || 'General',
        source: 'peppol',
        issue_date: invoiceData.issueDate || data.issueDate || new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || data.dueDate || new Date().toISOString().split('T')[0],
        payment_method: invoiceData.payment?.meansCode || '',
        notes: notes,
        peppol_enabled: true,
        peppol_message_id: data.messageId,
        peppol_received_at: new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19), // Format: YYYY-MM-DD HH:mm:ss
        sender_peppol_id: supplierPeppolId,
        ubl_xml: data.ublXml,
        // Store additional parsed data in metadata
        peppol_metadata: {
          documentType: documentType,
          documentTypeLabel: documentTypeLabel,
          isSelfBilling: isSelfBilling,
          isCreditNote: isCreditNote,
          webhookEventType: payload.eventType,
          invoiceTypeCode: invoiceData.invoiceTypeCode,
          documentCurrencyCode: invoiceData.documentCurrencyCode,
          buyerReference: invoiceData.buyerReference,
          orderReference: invoiceData.orderReference,
          salesOrderId: invoiceData.salesOrderId,
          deliveryDate: invoiceData.deliveryDate,
          payment: invoiceData.payment || {},
          taxSubtotals: invoiceData.tax?.subtotals || [],
          invoiceLines: invoiceData.invoiceLines || [],
          supplierName,
          supplierVatNumber,
          supplierAddress: invoiceData.supplier?.address || {},
          totals: invoiceData.totals || {}
        }
      })
      .select('id')
      .single();

    if (expenseError) {
      return { success: false, error: expenseError.message };
    }

    // Also create a record in peppol_invoices for tracking (optional)
    const { data: peppolInvoice, error: peppolError } = await supabase
      .from('peppol_invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        document_type: data.documentType || documentType || invoiceData.invoiceTypeCode || 'INVOICE',
        direction: 'inbound',
        sender_id: senderId,
        sender_peppol_id: supplierPeppolId,
        sender_name: invoiceData.supplier.name || data.senderName,
        sender_vat_number: invoiceData.supplier.vatNumber || data.senderVatNumber || supplierPeppolId.split(':')[1],
        sender_email: invoiceData.supplier.email || data.senderEmail,
        receiver_peppol_id: invoiceData.customer?.peppolId || data.receiverPeppolId || data.peppolIdentifier,
        receiver_name: invoiceData.customer?.name || data.receiverName || '',
        receiver_vat_number: invoiceData.customer?.vatNumber || data.receiverVatNumber || '',
        issue_date: invoiceData.issueDate || data.issueDate || new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || data.dueDate,
        delivery_date: invoiceData.deliveryDate || null,
        payment_terms: invoiceData.payment?.terms || null,
        buyer_reference: invoiceData.buyerReference || null,
        currency: invoiceData.totals?.currency || invoiceData.documentCurrencyCode || data.currency || 'EUR',
        subtotal_amount: netAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        ubl_xml: data.ublXml,
        status: 'received',
        peppol_message_id: data.messageId,
        received_at: new Date().toISOString(),
        supplier_invoice_id: expenseInvoice.id,
        metadata: {
          documentTypeLabel: documentTypeLabel,
          isSelfBilling: isSelfBilling,
          isCreditNote: isCreditNote,
          webhookEventType: payload.eventType,
          invoiceLines: invoiceData.invoiceLines || [],
          taxSubtotals: invoiceData.tax?.subtotals || [],
          payment: invoiceData.payment || {},
          orderReference: invoiceData.orderReference || null,
          salesOrderId: invoiceData.salesOrderId || null
        }
      })
      .select('id')
      .single();

    if (peppolError) {
      // Don't fail the whole process if this fails
    }

    return { success: true, invoiceId: expenseInvoice.id, peppolInvoiceId: peppolInvoice?.id, documentType: documentType };

  } catch (error) {
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
      // Don't fail if this update fails
    }

    return { success: true, invoiceId: invoice.id };

  } catch (error) {
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

    // Check if this acknowledgment indicates successful delivery
    // TRANSPORT_ACK_RECEIVED and MLR_RECEIVED both indicate successful delivery
    const isMLR = payload.eventType === PEPPOL_EVENT_TYPES.MLR_RECEIVED;
    const isTransportAck = payload.eventType === PEPPOL_EVENT_TYPES.TRANSPORT_ACK_RECEIVED;
    const isDelivered = (isMLR || isTransportAck) && 
                       (data.status === 'delivered' || data.status === 'success' || !data.status || data.status === 'accepted');

    // Find invoice in invoices table (client invoices) by messageId
    let clientInvoice = null;
    if ((isMLR || isTransportAck) && isDelivered) {
      const { data: invoice, error: findInvoiceError } = await supabase
        .from('invoices')
        .select('id, peppol_status')
        .eq('user_id', userId)
        .eq('peppol_message_id', messageId)
        .single();

      if (!findInvoiceError && invoice) {
        clientInvoice = invoice;
        
        // Update invoice status to delivered if not already delivered
        if (invoice.peppol_status !== 'delivered') {
          const { error: updateInvoiceError } = await supabase
            .from('invoices')
            .update({
              peppol_status: 'delivered',
              peppol_delivered_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id);

          if (updateInvoiceError) {
            // Failed to update invoice status
          }
        }
      }
    }

    // Also update peppol_invoices metadata (for tracking)
    const { data: peppolInvoice, error: findPeppolError } = await supabase
      .from('peppol_invoices')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('peppol_message_id', messageId)
      .single();

    if (!findPeppolError && peppolInvoice) {
      // Update metadata with acknowledgment info
      const metadata = peppolInvoice.metadata || {};
      metadata.acknowledgments = metadata.acknowledgments || [];
      metadata.acknowledgments.push({
        type: payload.eventType,
        receivedAt: new Date().toISOString(),
        data: data
      });

      // If MLR or Transport ACK indicates delivery, also update status in peppol_invoices
      if ((isMLR || isTransportAck) && isDelivered) {
        metadata.deliveredAt = new Date().toISOString();
        metadata.status = 'delivered';
      }

      const { error: updateError } = await supabase
        .from('peppol_invoices')
        .update({ 
          metadata,
          status: (isMLR || isTransportAck) && isDelivered ? 'delivered' : peppolInvoice.status,
          delivered_at: (isMLR || isTransportAck) && isDelivered ? new Date().toISOString() : peppolInvoice.delivered_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', peppolInvoice.id);

      if (updateError) {
        // Failed to update peppol_invoices metadata
      }
    } else if (!clientInvoice && !peppolInvoice) {
      // Neither invoice nor peppol_invoice found
      return { success: false, error: 'Invoice not found' };
    }

    return { 
      success: true, 
      invoiceId: clientInvoice?.id || peppolInvoice?.id,
      updated: true 
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process invoice response (buyer response to invoice)
 */
async function processInvoiceResponse(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    const messageId = data.messageId;

    if (!messageId) {
      return { success: false, error: 'No message ID provided' };
    }

    // Find invoice and update metadata with response
    const { data: invoice, error: findError } = await supabase
      .from('peppol_invoices')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('peppol_message_id', messageId)
      .single();

    if (findError || !invoice) {
      return { success: true, message: 'Invoice response logged but invoice not found' };
    }

    // Update metadata with invoice response info
    const metadata = invoice.metadata || {};
    metadata.invoiceResponse = {
      type: payload.eventType,
      receivedAt: new Date().toISOString(),
      data: data
    };

    const { error: updateError } = await supabase
      .from('peppol_invoices')
      .update({ metadata })
      .eq('id', invoice.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, invoiceId: invoice.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process future validation failed
 * According to Digiteal documentation: https://doc.digiteal.eu/docs/types-of-webhooks
 * This webhook notifies you about sent documents that do not comply with the latest warning validations.
 * This allows you to be prepared and react before the rule is enforced in the API.
 */
async function processFutureValidationFailed(supabase: any, userId: string, payload: WebhookPayload) {
  try {
    const data = payload.data;
    const messageId = data.messageId;

    if (!messageId) {
      return { success: false, error: 'No message ID provided' };
    }

    // Find invoice by message ID (could be in invoices or expense_invoices)
    let invoice = null;
    let invoiceType = null;

    // Try to find in client invoices first
    const { data: clientInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, peppol_metadata')
      .eq('user_id', userId)
      .eq('peppol_message_id', messageId)
      .single();

    if (clientInvoice) {
      invoice = clientInvoice;
      invoiceType = 'client';
    } else {
      // Try to find in expense invoices
      const { data: expenseInvoice } = await supabase
        .from('expense_invoices')
        .select('id, invoice_number, peppol_metadata')
        .eq('user_id', userId)
        .eq('peppol_message_id', messageId)
        .single();

      if (expenseInvoice) {
        invoice = expenseInvoice;
        invoiceType = 'expense';
      }
    }

    if (invoice) {
      // Update invoice metadata with validation warning
      const metadata = invoice.peppol_metadata || {};
      metadata.futureValidationFailed = {
        timestamp: new Date().toISOString(),
        errorMessage: data.errorMessage || 'Document does not comply with latest validation rules',
        data: data
      };

      const updateData: any = {
        peppol_metadata: metadata,
        updated_at: new Date().toISOString()
      };

      if (invoiceType === 'client') {
        await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', invoice.id);
      } else {
        await supabase
          .from('expense_invoices')
          .update(updateData)
          .eq('id', invoice.id);
      }

      // Also update peppol_invoices if it exists
      await supabase
        .from('peppol_invoices')
        .update({
          metadata: {
            ...metadata,
            futureValidationFailed: metadata.futureValidationFailed
          },
          updated_at: new Date().toISOString()
        })
        .eq('peppol_message_id', messageId)
        .eq('user_id', userId);

      return { success: true, invoiceId: invoice.id, type: invoiceType };
    }

    return { success: true, message: 'Validation warning logged but invoice not found' };

  } catch (error) {
    return { success: false, error: error.message };
  }
}