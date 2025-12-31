// =====================================================
// PEPPOL WEBHOOK HANDLER
// Supabase Edge Function to receive Peppol webhook events
// =====================================================
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { XMLParser } from 'npm:fast-xml-parser';
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
    
    // Extract message ID (for all events). Fallbacks: payload field -> UBL message identifiers -> instance identifier
    let messageId = digitealPayload?.messageId || digitealPayload?.peppolMessageId || '';
    if (ublXml) {
      try {
        const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
        const obj = parser.parse(ublXml);
        const findKey = (node: any, key: string): string => {
          if (!node || typeof node !== 'object') return '';
          if (key in node && node[key]) return String(node[key]).trim();
          for (const val of Object.values(node)) {
            const found = findKey(val, key);
            if (found) return found;
          }
          return '';
        };
        // Try known identifiers
        const fromUAMessageId = findKey(obj?.StandardBusinessDocument || obj, 'UAMessageIdentifier');
        const fromMessageId = findKey(obj?.StandardBusinessDocument || obj, 'MessageIdentifier');
        const fromInstanceId = findKey(obj?.StandardBusinessDocument?.StandardBusinessDocumentHeader?.DocumentIdentification || obj?.StandardBusinessDocument?.DocumentIdentification || obj, 'InstanceIdentifier');
        messageId = messageId || fromUAMessageId || fromMessageId || fromInstanceId || '';
        if (!messageId) {
          console.warn('[Peppol Webhook] Could not find message ID in XML');
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
        const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
        const obj = parser.parse(payload.data.ublXml);
        const invoiceNode = obj?.StandardBusinessDocument?.Invoice || obj?.Invoice;
        const accCustomer = invoiceNode?.AccountingCustomerParty;
        const party = accCustomer?.Party;
        const endpoint = party?.EndpointID;
        // endpoint may be object with attributes or string
        const endpointValue = (() => {
          if (!endpoint) return '';
          if (typeof endpoint === 'string') return endpoint;
          if (Array.isArray(endpoint)) return endpoint[0];
          if (endpoint['#text']) return endpoint['#text'];
          return '';
        })().trim();
        const schemeId = (() => {
          if (!endpoint || typeof endpoint !== 'object') return '';
          if (endpoint['@_schemeID']) return endpoint['@_schemeID'];
          return '';
        })();
        if (schemeId && endpointValue) {
          receiverPeppolId = `${schemeId}:${endpointValue}`;
        }
      } catch (parseError) {
        // If XML parsing fails, continue with other methods
      }
    }
    
    
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
      
      return new Response(
        JSON.stringify({ 
          error: 'User not found for this Peppol identifier',
          attemptedId: receiverPeppolId,
          details: 'Make sure your Peppol ID is registered in Peppol settings. The receiver ID in the invoice must match the Peppol ID in your settings.'
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

   

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
    // Parse XML using fast-xml-parser (Deno-friendly)
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
    const obj = parser.parse(ublXml);
    const invoice = obj?.StandardBusinessDocument?.Invoice || obj?.Invoice;
    if (!invoice) {
      throw new Error('Invoice node not found in UBL XML');
    }

    // Helpers for safe extraction from parsed object
    const asArray = (v: any) => (Array.isArray(v) ? v : [v]).filter(Boolean);
    const pickRaw = (node: any, key: string) => {
      if (!node) return undefined;
      const v = node[key];
      if (Array.isArray(v)) return v[0];
      return v;
    };
    const scalar = (val: any) => {
      if (val && typeof val === 'object') {
        if ('#text' in val) return val['#text'];
      }
      return val;
    };
    const txt = (node: any, key: string) => {
      const v = scalar(pickRaw(node, key));
      return v === undefined || v === null ? '' : String(v).trim();
    };
    const num = (node: any, key: string) => {
      const v = txt(node, key);
      if (!v) return 0;
      // Extract first number from string (handles cases like "1 11" -> "1", "10 11" -> "10")
      // Match: optional sign, digits, optional decimal part
      const numberMatch = v.match(/^[-+]?(\d+(?:[.,]\d+)?)/);
      if (numberMatch) {
        const cleaned = numberMatch[1].replace(',', '.');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };
    const attrCurrency = (node: any, key: string, fallback: string) => {
      const raw = pickRaw(node, key);
      if (raw && typeof raw === 'object' && raw['@_currencyID']) return raw['@_currencyID'];
      return fallback;
    };
    
    // Helpers below replaced by fast-xml-parser extraction (txt/num/asArray above)

    // Extract Document Identifiers (Mandatory)
    const invoiceId = txt(invoice, 'ID');
    const issueDate = txt(invoice, 'IssueDate');
    const dueDate = txt(invoice, 'DueDate');
    const invoiceTypeCode = txt(invoice, 'InvoiceTypeCode');
    const documentCurrencyCode = txt(invoice, 'DocumentCurrencyCode');
    const buyerReference = txt(invoice, 'BuyerReference');

    // Extract Supplier Party
    const supplierParty = pickRaw(pickRaw(invoice, 'AccountingSupplierParty'), 'Party');
    const supplierEndpointId = txt(supplierParty, 'EndpointID');
    const supplierEndpointScheme = (() => {
      const raw = pickRaw(supplierParty, 'EndpointID');
      if (raw && typeof raw === 'object' && raw['@_schemeID']) return raw['@_schemeID'];
      return '';
    })();
    const supplierName = txt(pickRaw(supplierParty, 'PartyName'), 'Name') || txt(supplierParty, 'Name');
    const supplierVatNumber = txt(pickRaw(supplierParty, 'PartyTaxScheme'), 'CompanyID');
    const supplierCompanyId = txt(pickRaw(supplierParty, 'PartyLegalEntity'), 'CompanyID');
    const supplierAddressNode = pickRaw(supplierParty, 'PostalAddress');
    const supplierStreet = txt(supplierAddressNode, 'StreetName');
    const supplierCity = txt(supplierAddressNode, 'CityName');
    const supplierPostalCode = txt(supplierAddressNode, 'PostalZone');
    const supplierCountry = txt(pickRaw(supplierAddressNode, 'Country'), 'IdentificationCode');
    const supplierContact = pickRaw(supplierParty, 'Contact');
    const supplierEmail = txt(supplierContact, 'ElectronicMail');
    const supplierContactName = txt(supplierContact, 'Name');
    const supplierPhone = txt(supplierContact, 'Telephone');

    // Extract Customer Party
    const customerParty = pickRaw(pickRaw(invoice, 'AccountingCustomerParty'), 'Party');
    const customerEndpointId = txt(customerParty, 'EndpointID');
    const customerEndpointScheme = (() => {
      const raw = pickRaw(customerParty, 'EndpointID');
      if (raw && typeof raw === 'object' && raw['@_schemeID']) return raw['@_schemeID'];
      return '';
    })();
    const customerName = txt(pickRaw(customerParty, 'PartyName'), 'Name') || txt(customerParty, 'Name');
    const customerVatNumber = txt(pickRaw(customerParty, 'PartyTaxScheme'), 'CompanyID');
    const customerContact = pickRaw(customerParty, 'Contact');
    const customerEmail = txt(customerContact, 'ElectronicMail');
    const customerPhone = txt(customerContact, 'Telephone');

    // Extract Tax Information
    const taxTotal = pickRaw(invoice, 'TaxTotal');
    const totalTaxAmount = num(taxTotal, 'TaxAmount');
    const taxCurrency = attrCurrency(taxTotal, 'TaxAmount', documentCurrencyCode);
    const taxSubtotals = asArray(pickRaw(taxTotal, 'TaxSubtotal')).map((subtotal: any) => {
      const taxCategoryId = txt(pickRaw(subtotal, 'TaxCategory'), 'ID');
      const taxPercent = num(pickRaw(subtotal, 'TaxCategory'), 'Percent');
      return {
        taxableAmount: num(subtotal, 'TaxableAmount'),
        taxAmount: num(subtotal, 'TaxAmount'),
        taxCategoryId,
        taxPercent,
        // UI-friendly fields
        category: taxCategoryId,
        percent: taxPercent
      };
      });

    // Extract Monetary Totals
    const monetaryTotal = pickRaw(invoice, 'LegalMonetaryTotal');
    const lineExtensionAmount = num(monetaryTotal, 'LineExtensionAmount');
    const taxExclusiveAmount = num(monetaryTotal, 'TaxExclusiveAmount');
    const taxInclusiveAmount = num(monetaryTotal, 'TaxInclusiveAmount');
    const payableAmount = num(monetaryTotal, 'PayableAmount');
    const payableCurrency = attrCurrency(monetaryTotal, 'PayableAmount', documentCurrencyCode);

    // Extract Invoice Lines
    const invoiceLines = asArray(invoice.InvoiceLine).map((line: any, index: number) => {
      const lineId = txt(line, 'ID') || String(index + 1);
      const quantity = num(line, 'InvoicedQuantity');
      const unitCode = (() => {
        const raw = pickRaw(line, 'InvoicedQuantity');
        if (raw && typeof raw === 'object' && raw['@_unitCode']) return raw['@_unitCode'];
        return '';
      })();
      const lineExtensionAmount = num(line, 'LineExtensionAmount');
      const itemName = txt(pickRaw(line, 'Item'), 'Name');
      const priceAmount = num(pickRaw(line, 'Price'), 'PriceAmount');
      const taxCategoryId = txt(pickRaw(pickRaw(line, 'Item'), 'ClassifiedTaxCategory'), 'ID');
      const taxPercent = num(pickRaw(pickRaw(line, 'Item'), 'ClassifiedTaxCategory'), 'Percent');
      return {
        lineId,
        quantity,
        unitCode,
        lineExtensionAmount,
        itemName,
        priceAmount,
        taxCategoryId,
        taxPercent,
        // UI-friendly fields
        id: lineId,
        description: itemName,
        unit_price: priceAmount,
        unitPrice: priceAmount,
        amount: lineExtensionAmount
      };
    });

    // Extract Payment Information
    const paymentMeans = pickRaw(invoice, 'PaymentMeans');
    const paymentMeansCode = txt(paymentMeans, 'PaymentMeansCode');
    const paymentMeansName = (() => {
      const raw = pickRaw(paymentMeans, 'PaymentMeansCode');
      if (raw && typeof raw === 'object' && raw['@_name']) return raw['@_name'];
      return '';
    })();
    const paymentId = txt(paymentMeans, 'PaymentID');
    const payeeFinancialAccount = pickRaw(paymentMeans, 'PayeeFinancialAccount');
    const iban = txt(payeeFinancialAccount, 'ID');

    // Extract Payment Terms
    const paymentTermsNote = txt(pickRaw(invoice, 'PaymentTerms'), 'Note');

    // Extract invoice_type from Note field if present
    // Format: "Net within X days | INVOICE_TYPE:deposit" or "Net within X days | INVOICE_TYPE:final"
    let invoiceType = 'final'; // Default to final
    if (paymentTermsNote) {
      const invoiceTypeMatch = paymentTermsNote.match(/INVOICE_TYPE:(deposit|final)/i);
      if (invoiceTypeMatch && invoiceTypeMatch[1]) {
        invoiceType = invoiceTypeMatch[1].toLowerCase();
      }
    }

    // Extract Delivery Information
    const deliveryDate = txt(pickRaw(invoice, 'Delivery'), 'ActualDeliveryDate');

    // Extract Order Reference
    const orderReference = pickRaw(invoice, 'OrderReference');
    const orderRefId = txt(orderReference, 'ID');
    const salesOrderId = txt(orderReference, 'SalesOrderID');

    // If monetary totals are all zero, attempt a regex fallback to extract key amounts and supplier name
    const numbersAreZero = (val: number | undefined | null) => !val || Math.abs(val) < 1e-9;
    const allTotalsZero = numbersAreZero(payableAmount) && numbersAreZero(taxInclusiveAmount) && numbersAreZero(taxExclusiveAmount) && numbersAreZero(totalTaxAmount);

    const regexValue = (tag: string): number => {
      const re = new RegExp(`<[^>]*${tag}[^>]*>([^<]+)</[^>]*${tag}>`, 'i');
      const m = ublXml.match(re);
      if (m && m[1]) {
        const parsed = parseFloat(m[1].replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const regexText = (tag: string): string => {
      const re = new RegExp(`<[^>]*${tag}[^>]*>([^<]+)</[^>]*${tag}>`, 'i');
      const m = ublXml.match(re);
      return m?.[1]?.trim() || '';
    };

    const fallbackPayable = allTotalsZero ? regexValue('PayableAmount') : payableAmount;
    const fallbackTaxInclusive = allTotalsZero ? regexValue('TaxInclusiveAmount') : taxInclusiveAmount;
    const fallbackTaxExclusive = allTotalsZero ? regexValue('TaxExclusiveAmount') : taxExclusiveAmount;
    const fallbackTax = allTotalsZero ? regexValue('TaxAmount') : totalTaxAmount;

    const fallbackSupplierName = (() => {
      if (!supplierName || supplierName.toLowerCase().includes('unknown')) {
        // Prefer PartyName > Name near Supplier block
        const nameFromRegex = regexText('Name');
        if (nameFromRegex) return nameFromRegex;
      }
      return supplierName;
    })();

    // Fallback for invoice ID if extraction failed
    const fallbackInvoiceId = (() => {
      if (!invoiceId || invoiceId.trim() === '') {
        // Try regex extraction from UBL XML
        const idFromRegex = regexText('ID');
        if (idFromRegex) return idFromRegex;
        // Try to extract from cbc:ID tag
        const cbcIdMatch = ublXml.match(/<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/i);
        if (cbcIdMatch?.[1]) return cbcIdMatch[1].trim();
      }
      return invoiceId;
    })();

    return {
      // Document Identifiers
      invoiceId: fallbackInvoiceId,
      issueDate,
      dueDate,
      invoiceTypeCode,
      documentCurrencyCode,
      buyerReference,
      
      // Supplier Information
      supplier: {
        peppolId: supplierEndpointScheme && supplierEndpointId ? `${supplierEndpointScheme}:${supplierEndpointId}` : '',
        name: fallbackSupplierName || supplierName,
        vatNumber: supplierVatNumber || supplierCompanyId,
        companyId: supplierCompanyId,
        contactName: supplierContactName,
        contactPhone: supplierPhone,
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
        vatNumber: customerVatNumber,
        email: customerEmail,
        phone: customerPhone
      },
      
      // Tax Information
      tax: {
        totalTaxAmount: fallbackTax,
        taxCurrency,
        subtotals: taxSubtotals
      },
      
      // Monetary Totals
      totals: {
        lineExtensionAmount,
        taxExclusiveAmount: fallbackTaxExclusive || taxExclusiveAmount,
        taxInclusiveAmount: fallbackTaxInclusive || taxInclusiveAmount,
        payableAmount: fallbackPayable || payableAmount,
        currency: payableCurrency
      },
      
      // Invoice Lines
      invoiceLines,
      
      // Payment Information
      payment: {
        meansCode: paymentMeansCode,
        meansName: paymentMeansName,
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
 * Extract PDF attachments from AdditionalDocumentReference elements
 * Returns array of PDF attachments with base64 data and filename
 */
function extractPDFAttachments(ublXml: string): Array<{ filename: string; base64: string; mimeCode: string }> {
  const attachments: Array<{ filename: string; base64: string; mimeCode: string }> = [];
  
  try {
    // Parse XML to extract AdditionalDocumentReference elements
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
    const obj = parser.parse(ublXml);
    const invoice = obj?.StandardBusinessDocument?.Invoice || obj?.Invoice;
    
    if (!invoice) return attachments;
    
    // Get AdditionalDocumentReference elements (can be array or single object)
    const additionalDocs = invoice.AdditionalDocumentReference;
    if (!additionalDocs) return attachments;
    
    const docsArray = Array.isArray(additionalDocs) ? additionalDocs : [additionalDocs];
    
    for (const doc of docsArray) {
      const attachment = doc.Attachment;
      if (!attachment) continue;
      
      const embeddedDoc = attachment.EmbeddedDocumentBinaryObject;
      if (!embeddedDoc) continue;
      
      // Check if it's a PDF
      const mimeCode = embeddedDoc['@_mimeCode'] || embeddedDoc.mimeCode || '';
      if (mimeCode.toLowerCase() !== 'application/pdf') continue;
      
      const filename = embeddedDoc['@_filename'] || embeddedDoc.filename || doc.ID || 'invoice.pdf';
      const base64Data = embeddedDoc['#text'] || embeddedDoc || '';
      
      if (base64Data && filename) {
        attachments.push({
          filename: String(filename),
          base64: String(base64Data),
          mimeCode: 'application/pdf'
        });
      }
    }
  } catch (error) {
    console.error('[Peppol Webhook] Error extracting PDF attachments:', error);
  }
  
  return attachments;
}

/**
 * Store PDF attachment in Supabase Storage
 * Returns the storage path if successful, null otherwise
 */
async function storePDFAttachment(
  supabase: any,
  userId: string,
  invoiceNumber: string,
  pdfData: { filename: string; base64: string }
): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const pdfBuffer = Uint8Array.from(atob(pdfData.base64), c => c.charCodeAt(0));
    
    // Generate storage path: expense-invoice-pdfs/{userId}/{invoiceNumber}_{filename}
    const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFilename = pdfData.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `expense-invoice-pdfs/${userId}/${sanitizedInvoiceNumber}_${sanitizedFilename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('expense-invoice-attachments')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('[Peppol Webhook] Error storing PDF attachment:', error);
      return null;
    }
    
    return storagePath;
  } catch (error) {
    console.error('[Peppol Webhook] Exception storing PDF attachment:', error);
    return null;
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
    let pdfAttachmentPath: string | null = null;
    
    if (data.ublXml) {
      try {
        parsedInvoice = parseUBLInvoice(data.ublXml);
        
        // Extract PDF attachments from AdditionalDocumentReference (will store after we have invoice number)
        const pdfAttachments = extractPDFAttachments(data.ublXml);
        
      } catch (parseError: any) {
        console.error('[Peppol Webhook] Failed to parse UBL XML:', parseError?.message || parseError);
        console.error('[Peppol Webhook] XML snippet:', data.ublXml?.substring(0, 500));
        // Fallback to webhook payload data if parsing fails
      }
    }

    // Use parsed data if available, otherwise fallback to webhook payload
    // Note: invoiceId should come from UBL XML <cbc:ID> which is the original client invoice number (INV-000010)
    const invoiceData = parsedInvoice || {
      invoiceId: data.invoiceNumber || null, // Don't generate datetime-based numbers
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

    // Use EXACT amounts from UBL XML - NO calculations, NO fallbacks
    // Prioritize parsed invoice data which comes directly from UBL XML
    const totalAmount = parsedInvoice 
      ? (parsedInvoice.totals?.payableAmount || parsedInvoice.totals?.taxInclusiveAmount || 0)
      : (invoiceData.totals?.payableAmount || invoiceData.totals?.taxInclusiveAmount || 0);
    
    // Use EXACT tax amount from UBL XML <cac:TaxTotal>/<cbc:TaxAmount>
    const taxAmount = parsedInvoice
      ? (parsedInvoice.tax?.totalTaxAmount || 0)
      : (invoiceData.tax?.totalTaxAmount || 0);
    
    // Use EXACT net amount from UBL XML <cac:LegalMonetaryTotal>/<cbc:TaxExclusiveAmount>
    // DO NOT calculate (totalAmount - taxAmount) as this can be wrong due to rounding
    const netAmount = parsedInvoice
      ? (parsedInvoice.totals?.taxExclusiveAmount || parsedInvoice.totals?.lineExtensionAmount || 0)
      : (invoiceData.totals?.taxExclusiveAmount || invoiceData.totals?.lineExtensionAmount || 0);
    

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
            contact_name: invoiceData.supplier?.contactName || '',
            contact_email: invoiceData.supplier?.email || '',
            contact_phone: invoiceData.supplier?.contactPhone || '',
            street_address: invoiceData.supplier?.address?.street || '',
            city: invoiceData.supplier?.address?.city || '',
            zip_code: invoiceData.supplier?.address?.postalCode || '',
            country: invoiceData.supplier?.address?.country || supplierCountry,
            supported_document_types: invoiceData.invoiceTypeCode ? [String(invoiceData.invoiceTypeCode)] : [],
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

    // Build notes with extracted information (without Message ID)
    const notesParts = [
      `Received via Peppol network (${documentTypeLabel}).`,
      invoiceData.buyerReference ? `Buyer Reference: ${invoiceData.buyerReference}` : '',
      invoiceData.orderReference ? `Order Reference: ${invoiceData.orderReference}` : '',
      invoiceData.payment?.terms ? `Payment Terms: ${invoiceData.payment.terms}` : '',
      isSelfBilling ? 'Self-billing document' : ''
    ].filter(Boolean);
    const notes = notesParts.join('\n');

    // Determine invoice number
    // Priority: parsed UBL XML invoice ID (cbc:ID) > buyerReference (original client invoice number) > webhook payload
    // The invoice ID from UBL XML should be the original client invoice number (INV-000010 format)
    // buyerReference also contains the original client invoice number
    const baseInvoiceNumber = parsedInvoice?.invoiceId || 
                              invoiceData.buyerReference || 
                              invoiceData.invoiceId || 
                              data.invoiceNumber;
    
    if (!baseInvoiceNumber) {
      console.error('[Peppol Webhook] No invoice number found in UBL XML or webhook payload');
      return { success: false, error: 'Invoice number is required but not found in UBL XML' };
    }
    
    // Check if invoice number already exists (handle duplicates)
    // NOTE: expense_invoices has a GLOBAL unique constraint on invoice_number (not per user)
    // So we must check globally, not just for the current user
    let invoiceNumber = baseInvoiceNumber;
      const { data: existingInvoice } = await supabase
        .from('expense_invoices')
        .select('id, invoice_number')
        .eq('invoice_number', baseInvoiceNumber)
        .single();
      
      if (existingInvoice) {
      // Invoice number already exists globally - append sequence number instead of timestamp
      // This preserves the original invoice number format
      let sequence = 1;
      let newInvoiceNumber = `${baseInvoiceNumber}-${sequence}`;
      
      // Find next available sequence number (check globally, not per user)
      while (true) {
        const { data: existing } = await supabase
          .from('expense_invoices')
          .select('id')
          .eq('invoice_number', newInvoiceNumber)
          .single();
        
        if (!existing) {
          invoiceNumber = newInvoiceNumber;
          break;
        }
        sequence++;
        newInvoiceNumber = `${baseInvoiceNumber}-${sequence}`;
        
        // Safety limit
        if (sequence > 1000) {
          console.error('[Peppol Webhook] Too many duplicate invoice numbers');
          return { success: false, error: 'Unable to generate unique invoice number' };
        }
      }
    }

    // Extract invoice_type, deposit/balance amounts, and sender user ID from payment terms Note field if present
    // Format: "Net within X days | INVOICE_TYPE:deposit | DEPOSIT_AMOUNT:100 | BALANCE_AMOUNT:200 | SENDER_USER_ID:uuid"
    let invoiceType: string = 'final'; // Default to final
    let depositAmount: number = 0;
    let balanceAmount: number = 0;
    let senderUserId: string | null = null;
    const paymentTermsNote = invoiceData.payment?.terms || '';
    if (paymentTermsNote) {
      const invoiceTypeMatch = paymentTermsNote.match(/INVOICE_TYPE:(deposit|final)/i);
      if (invoiceTypeMatch && invoiceTypeMatch[1]) {
        invoiceType = invoiceTypeMatch[1].toLowerCase();
      }
      
      // Extract deposit amount if present
      const depositMatch = paymentTermsNote.match(/DEPOSIT_AMOUNT:([\d.,]+)/i);
      if (depositMatch && depositMatch[1]) {
        depositAmount = parseFloat(depositMatch[1].replace(',', '.')) || 0;
      }
      
      // Extract balance amount if present
      const balanceMatch = paymentTermsNote.match(/BALANCE_AMOUNT:([\d.,]+)/i);
      if (balanceMatch && balanceMatch[1]) {
        balanceAmount = parseFloat(balanceMatch[1].replace(',', '.')) || 0;
      }
      
      // Extract sender user ID if present
      const senderUserIdMatch = paymentTermsNote.match(/SENDER_USER_ID:([a-f0-9-]+)/i);
      if (senderUserIdMatch && senderUserIdMatch[1]) {
        senderUserId = senderUserIdMatch[1];
      }
      
      // If invoice_type is deposit but no deposit amount extracted, use totalAmount as deposit
      if (invoiceType === 'deposit' && depositAmount === 0) {
        depositAmount = totalAmount;
      }
      
      // If invoice_type is final but no balance amount extracted, use totalAmount as balance
      if (invoiceType === 'final' && balanceAmount === 0 && depositAmount > 0) {
        balanceAmount = totalAmount;
      }
    }

    // Create expense invoice record (supplier invoice) with all extracted mandatory fields
    const insertPayload = {
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
        invoice_type: invoiceType, // Set invoice_type extracted from Note field
        issue_date: invoiceData.issueDate || data.issueDate || new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || data.dueDate || new Date().toISOString().split('T')[0],
      payment_method: invoiceData.payment?.meansName || invoiceData.payment?.meansCode || '',
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
          tax: invoiceData.tax || {}, // Store full tax object including totalTaxAmount
          taxSubtotals: invoiceData.tax?.subtotals || [],
          invoiceLines: invoiceData.invoiceLines || [],
          messageId: data.messageId || null,
          supplierName,
          supplierVatNumber,
          supplier: invoiceData.supplier || {},
          supplierAddress: invoiceData.supplier?.address || {},
          customer: invoiceData.customer || {},
          totals: invoiceData.totals || {},
          // Store PDF attachment path if available
          pdfAttachmentPath: pdfAttachmentPath || null,
          // Store invoice_type and deposit/balance amounts for PDF generation
          invoice_type: invoiceType,
          deposit_amount: depositAmount > 0 ? depositAmount : null,
          balance_amount: balanceAmount > 0 ? balanceAmount : null,
          // Store sender user ID if extracted from Note field
          sender_user_id: senderUserId || null
        }
    };
    let expenseInvoice: any = null;
    let expenseError: any = null;
    
    const { data: insertedInvoice, error: insertError } = await supabase
      .from('expense_invoices')
      .insert(insertPayload)
      .select('id')
      .single();

    expenseInvoice = insertedInvoice;
    expenseError = insertError;

    if (expenseError) {
      // Handle unique constraint violation (invoice_number already exists globally)
      // This can happen due to race conditions even after our duplicate check
      if (expenseError.code === '23505' || expenseError.message?.includes('duplicate key') || expenseError.message?.includes('unique constraint')) {
        console.warn('[Peppol Webhook] Invoice number conflict detected, retrying with sequence number:', invoiceNumber);
        
        // Retry with sequence number appended
        let sequence = 1;
        let retryInvoiceNumber = `${invoiceNumber}-${sequence}`;
        let retrySuccess = false;
        
        // Try up to 10 times to find an available number
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data: retryExisting } = await supabase
            .from('expense_invoices')
            .select('id')
            .eq('invoice_number', retryInvoiceNumber)
            .single();
          
          if (!retryExisting) {
            // This number is available, try inserting with it
            insertPayload.invoice_number = retryInvoiceNumber;
            const { data: retryInvoice, error: retryError } = await supabase
              .from('expense_invoices')
              .insert(insertPayload)
              .select('id')
              .single();
            
            if (!retryError && retryInvoice) {
              // Success! Use this invoice
              expenseInvoice = retryInvoice;
              retrySuccess = true;
              invoiceNumber = retryInvoiceNumber; // Update invoiceNumber for PDF storage
              break;
            }
          }
          
          sequence++;
          retryInvoiceNumber = `${invoiceNumber}-${sequence}`;
        }
        
        if (!retrySuccess) {
          return { success: false, error: `Failed to create invoice: invoice number ${invoiceNumber} already exists and unable to generate unique alternative` };
        }
      } else {
        // Other errors
        return { success: false, error: expenseError.message };
      }
    }
    
    // Store PDF attachment after invoice is created (now we have the actual invoice number)
    if (data.ublXml && expenseInvoice) {
      const pdfAttachments = extractPDFAttachments(data.ublXml);
      if (pdfAttachments.length > 0) {
        const pdfAttachment = pdfAttachments[0];
        pdfAttachmentPath = await storePDFAttachment(
          supabase,
          userId,
          invoiceNumber,
          pdfAttachment
        );
        
        if (pdfAttachmentPath) {
          // Update the invoice with the PDF path
          await supabase
            .from('expense_invoices')
            .update({
              peppol_metadata: {
                ...insertPayload.peppol_metadata,
                pdfAttachmentPath: pdfAttachmentPath
              }
            })
            .eq('id', expenseInvoice.id);
          
          console.log('[Peppol Webhook] PDF attachment stored:', pdfAttachmentPath);
        } else {
          console.warn('[Peppol Webhook] Failed to store PDF attachment');
        }
      }
    }

    // Also create a record in peppol_invoices for tracking (optional)
    const { data: peppolInvoice, error: peppolError } = await supabase
      .from('peppol_invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        document_type: data.documentType || documentType || invoiceData.invoiceTypeCode || 'INVOICE',
        direction: 'inbound',
        reference_number: invoiceData.buyerReference || invoiceNumber,
        sender_id: senderId,
        sender_peppol_id: supplierPeppolId,
        sender_name: invoiceData.supplier.name || data.senderName,
        sender_vat_number: invoiceData.supplier.vatNumber || data.senderVatNumber || supplierPeppolId.split(':')[1],
        sender_email: invoiceData.supplier.email || data.senderEmail,
        receiver_peppol_id: invoiceData.customer?.peppolId || data.receiverPeppolId || data.peppolIdentifier,
        receiver_name: invoiceData.customer?.name || data.receiverName || '',
        receiver_vat_number: invoiceData.customer?.vatNumber || data.receiverVatNumber || '',
        receiver_email: invoiceData.customer?.email || data.receiverEmail || '',
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
        peppol_message_id: data.messageId || invoiceData.invoiceId || invoiceNumber,
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
    const nowIso = new Date().toISOString();
    const updateData: any = {
      peppol_status: peppolStatus,
      updated_at: nowIso
    };

    if (peppolStatus === 'delivered') {
      updateData.peppol_delivered_at = nowIso;
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

    // Also update peppol_invoices tracking if present
    const trackingUpdate: any = {
      status: peppolStatus,
      updated_at: nowIso
    };
    if (peppolStatus !== 'delivered' && peppolStatus !== 'failed') {
      trackingUpdate.sent_at = trackingUpdate.sent_at || nowIso;
    }

    const { error: peppolUpdateError } = await supabase
      .from('peppol_invoices')
      .update(trackingUpdate)
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