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
      console.error('📝 Webhook event failed:', {
        eventType: payload.eventType,
        receiverPeppolId,
        error: 'User not found for this Peppol identifier',
        messageId: payload.data.messageId
      });
      
      return new Response(
        JSON.stringify({ error: 'User not found for this Peppol identifier' }), 
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
        console.log('ℹ️ AutoPay configuration activated:', payload.data);
        processResult = { success: true, message: 'AutoPay configuration event logged' };
        break;

      default:
        console.log('ℹ️ Unhandled event type:', payload.eventType);
        processResult = { success: true, message: 'Event logged but not processed' };
    }

    // Log webhook event to console (for debugging)
    console.log('📝 Webhook event processed:', {
      eventType: payload.eventType,
      userId,
      success: processResult.success,
      invoiceId: processResult.invoiceId,
      messageId: payload.data.messageId
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
    const getTextByLocalName = (localName: string, parent?: Element | null): string => {
      const searchRoot = parent || xmlDoc;
      const elements = searchRoot.getElementsByTagName(localName);
      if (elements.length > 0) {
        return elements[0].textContent?.trim() || '';
      }
      // Also try with namespace prefix if available
      const prefixed = searchRoot.querySelector(`cbc\\:${localName}, cac\\:${localName}`);
      return prefixed?.textContent?.trim() || '';
    };

    const getAttributeByLocalName = (localName: string, attr: string, parent?: Element | null): string => {
      const searchRoot = parent || xmlDoc;
      const elements = searchRoot.getElementsByTagName(localName);
      if (elements.length > 0) {
        return elements[0].getAttribute(attr) || '';
      }
      const prefixed = searchRoot.querySelector(`cbc\\:${localName}, cac\\:${localName}`);
      return prefixed?.getAttribute(attr) || '';
    };

    // Helper to find element by local name within parent
    const findElement = (localName: string, parent?: Element | null): Element | null => {
      const searchRoot = parent || xmlDoc;
      const elements = searchRoot.getElementsByTagName(localName);
      return elements.length > 0 ? elements[0] : null;
    };
    
    const findAllElements = (localName: string, parent?: Element | null): Element[] => {
      const searchRoot = parent || xmlDoc;
      return Array.from(searchRoot.getElementsByTagName(localName));
    };

    // Helper for simple text extraction (tries both approaches)
    const getText = (localName: string, parent?: Element | null): string => {
      return getTextByLocalName(localName, parent);
    };

    const getAttribute = (localName: string, attr: string, parent?: Element | null): string => {
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
    console.error('❌ Error parsing UBL XML:', error);
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
        console.log(`✅ Successfully parsed UBL XML for ${documentTypeLabel}`);
      } catch (parseError) {
        console.error('⚠️ Failed to parse UBL XML, using webhook payload data:', parseError);
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

    // Calculate amounts
    const totalAmount = invoiceData.totals?.payableAmount || invoiceData.totals?.taxInclusiveAmount || 0;
    const taxAmount = invoiceData.tax?.totalTaxAmount || 0;
    const netAmount = invoiceData.totals?.taxExclusiveAmount || invoiceData.totals?.lineExtensionAmount || (totalAmount - taxAmount);

    // Extract supplier Peppol ID (format: schemeID:identifier)
    const supplierPeppolId = invoiceData.supplier?.peppolId || data.senderPeppolId || '';

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
        console.log('⚠️ Invoice number already exists:', baseInvoiceNumber);
        invoiceNumber = `${baseInvoiceNumber}-${Date.now()}`;
      }
    }

    // Create expense invoice record (supplier invoice) with all extracted mandatory fields
    const { data: expenseInvoice, error: expenseError } = await supabase
      .from('expense_invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        supplier_name: invoiceData.supplier.name || data.senderName || 'Unknown Supplier',
        supplier_email: invoiceData.supplier.email || data.senderEmail || '',
        supplier_vat_number: invoiceData.supplier.vatNumber || data.senderVatNumber || supplierPeppolId.split(':')[1] || '',
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
          supplierAddress: invoiceData.supplier?.address || {},
          totals: invoiceData.totals || {}
        }
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
      console.log('⚠️ Warning: Could not create peppol_invoices record:', peppolError.message);
      // Don't fail the whole process if this fails
    }

    console.log(`✅ Expense invoice created successfully (${documentTypeLabel}):`, expenseInvoice.id);
    return { success: true, invoiceId: expenseInvoice.id, peppolInvoiceId: peppolInvoice?.id, documentType: documentType };

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

    // Check if MLR indicates successful delivery
    // MLR_RECEIVED typically indicates successful delivery of the invoice
    const isMLR = payload.eventType === PEPPOL_EVENT_TYPES.MLR_RECEIVED;
    const isDelivered = isMLR && (data.status === 'delivered' || data.status === 'success' || !data.status || data.status === 'accepted');

    // Find invoice in invoices table (client invoices) by messageId
    let clientInvoice = null;
    if (isMLR && isDelivered) {
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
            console.error('⚠️ Failed to update invoice status:', updateInvoiceError);
          } else {
            console.log('✅ Invoice status updated to delivered:', invoice.id);
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

      // If MLR indicates delivery, also update status in peppol_invoices
      if (isMLR && isDelivered) {
        metadata.deliveredAt = new Date().toISOString();
        metadata.status = 'delivered';
      }

      const { error: updateError } = await supabase
        .from('peppol_invoices')
        .update({ 
          metadata,
          status: isMLR && isDelivered ? 'delivered' : peppolInvoice.status,
          delivered_at: isMLR && isDelivered ? new Date().toISOString() : peppolInvoice.delivered_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', peppolInvoice.id);

      if (updateError) {
        console.error('⚠️ Failed to update peppol_invoices metadata:', updateError);
      } else {
        console.log('✅ Acknowledgment processed:', peppolInvoice.id);
      }
    } else if (!clientInvoice && !peppolInvoice) {
      // Neither invoice nor peppol_invoice found
      console.log('⚠️ Invoice not found for acknowledgment:', messageId);
      return { success: false, error: 'Invoice not found' };
    }

    return { 
      success: true, 
      invoiceId: clientInvoice?.id || peppolInvoice?.id,
      updated: true 
    };

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
      console.log('⚠️ Invoice not found for invoice response:', messageId);
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
      console.error('❌ Failed to update invoice response:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Invoice response processed:', invoice.id);
    return { success: true, invoiceId: invoice.id };

  } catch (error) {
    console.error('❌ Error processing invoice response:', error);
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
      console.log(`⚠️ Future validation failed for ${invoiceType} invoice:`, invoice.id);
      
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

    console.log('⚠️ Future validation failed - invoice not found:', messageId);
    return { success: true, message: 'Validation warning logged but invoice not found' };

  } catch (error) {
    console.error('❌ Error processing future validation failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('🚀 Peppol webhook handler is running');

