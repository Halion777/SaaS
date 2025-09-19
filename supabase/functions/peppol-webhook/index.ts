// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    const { type, payload } = webhookData;

    console.log('Peppol webhook received:', { type, payload: JSON.stringify(payload).substring(0, 200) + '...' });

    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (type) {
      case 'PEPPOL_INVOICE_RECEIVED':
        await handleReceivedInvoice(supabaseClient, payload);
        break;
        
      case 'PEPPOL_CREDIT_NOTE_RECEIVED':
        await handleReceivedCreditNote(supabaseClient, payload);
        break;
        
      case 'PEPPOL_TRANSPORT_ACK_RECEIVED':
        await handleDeliveryConfirmation(supabaseClient, payload);
        break;
        
      case 'PEPPOL_MLR_RECEIVED':
        await handleMLRReceived(supabaseClient, payload);
        break;
        
      case 'PEPPOL_INVOICE_RESPONSE_RECEIVED':
        await handleInvoiceResponse(supabaseClient, payload);
        break;
        
      case 'PEPPOL_FUTURE_VALIDATION_FAILED':
        await handleValidationFailed(supabaseClient, payload);
        break;
        
      default:
        console.log('Unknown webhook type:', type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Peppol webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleReceivedInvoice(supabaseClient: any, payload: any) {
  try {
    console.log('Processing received invoice...');
    
    // Parse UBL invoice
    const invoiceData = parseUBLInvoice(payload.document);
    
    // Check if sender exists in participants
    let senderId = null;
    if (invoiceData.sender?.peppolIdentifier) {
      const { data: existingSender } = await supabaseClient
        .from('peppol_participants')
        .select('id')
        .eq('peppol_identifier', invoiceData.sender.peppolIdentifier)
        .single();
      
      if (existingSender) {
        senderId = existingSender.id;
      } else {
        // Create new participant
        const { data: newSender } = await supabaseClient
          .from('peppol_participants')
          .insert([{
            name: invoiceData.sender.name,
            vat_number: invoiceData.sender.vatNumber,
            peppol_identifier: invoiceData.sender.peppolIdentifier,
            address: invoiceData.sender.addressLine1,
            city: invoiceData.sender.city,
            zip_code: invoiceData.sender.zipCode,
            country: invoiceData.sender.countryCode,
            contact_name: invoiceData.sender.contact?.name,
            contact_phone: invoiceData.sender.contact?.phone,
            contact_email: invoiceData.sender.contact?.email,
            participant_type: 'sender',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        senderId = newSender?.id;
      }
    }
    
    // Store received invoice
    const { data: invoice, error } = await supabaseClient
      .from('peppol_invoices')
      .insert([{
        invoice_number: invoiceData.invoiceNumber,
        sender_id: senderId,
        receiver_id: null, // We are the receiver
        total_amount: invoiceData.totalAmount,
        currency: invoiceData.currency || 'EUR',
        status: 'received',
        document_type: 'invoice',
        ubl_document: payload.document,
        peppol_message_id: payload.messageId || null,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing received invoice:', error);
      throw error;
    }

    console.log('Invoice stored successfully:', invoice.id);
    
    // Store invoice lines
    if (invoiceData.invoiceLines && invoiceData.invoiceLines.length > 0) {
      const invoiceLines = invoiceData.invoiceLines.map((line: any) => ({
        invoice_id: invoice.id,
        line_number: line.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        taxable_amount: line.taxableAmount,
        tax_amount: line.taxAmount,
        total_amount: line.totalAmount,
        vat_code: line.vatCode,
        vat_percentage: line.taxPercentage,
        created_at: new Date().toISOString()
      }));

      await supabaseClient
        .from('peppol_invoice_lines')
        .insert(invoiceLines);
    }

  } catch (error) {
    console.error('Error handling received invoice:', error);
    throw error;
  }
}

async function handleReceivedCreditNote(supabaseClient: any, payload: any) {
  try {
    console.log('Processing received credit note...');
    
    const creditNoteData = parseUBLCreditNote(payload.document);
    
    // Similar logic to invoice but for credit notes
    const { data: creditNote, error } = await supabaseClient
      .from('peppol_invoices')
      .insert([{
        invoice_number: creditNoteData.creditNoteNumber,
        sender_id: null,
        receiver_id: null,
        total_amount: creditNoteData.totalAmount,
        currency: creditNoteData.currency || 'EUR',
        status: 'received',
        document_type: 'credit_note',
        ubl_document: payload.document,
        peppol_message_id: payload.messageId || null,
        issue_date: creditNoteData.issueDate,
        due_date: creditNoteData.dueDate,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing received credit note:', error);
      throw error;
    }

    console.log('Credit note stored successfully:', creditNote.id);
    
  } catch (error) {
    console.error('Error handling received credit note:', error);
    throw error;
  }
}

async function handleDeliveryConfirmation(supabaseClient: any, payload: any) {
  try {
    console.log('Processing delivery confirmation...');
    
    // Update invoice status to delivered
    const { error } = await supabaseClient
      .from('peppol_invoices')
      .update({ 
        status: 'delivered',
        peppol_delivery_ack: payload.document,
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('peppol_message_id', payload.messageId);

    if (error) {
      console.error('Error updating delivery confirmation:', error);
      throw error;
    }

    console.log('Delivery confirmation processed successfully');
    
  } catch (error) {
    console.error('Error handling delivery confirmation:', error);
    throw error;
  }
}

async function handleMLRReceived(supabaseClient: any, payload: any) {
  try {
    console.log('Processing MLR (Message Level Response)...');
    
    // Update invoice with MLR response
    const { error } = await supabaseClient
      .from('peppol_invoices')
      .update({ 
        status: 'mlr_received',
        peppol_mlr: payload.document,
        mlr_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('peppol_message_id', payload.messageId);

    if (error) {
      console.error('Error updating MLR response:', error);
      throw error;
    }

    console.log('MLR processed successfully');
    
  } catch (error) {
    console.error('Error handling MLR:', error);
    throw error;
  }
}

async function handleInvoiceResponse(supabaseClient: any, payload: any) {
  try {
    console.log('Processing invoice response...');
    
    // Parse response to determine if accepted or rejected
    const responseData = parseInvoiceResponse(payload.document);
    
    // Update invoice with response
    const { error } = await supabaseClient
      .from('peppol_invoices')
      .update({ 
        status: responseData.accepted ? 'accepted' : 'rejected',
        peppol_response: payload.document,
        response_received_at: new Date().toISOString(),
        response_notes: responseData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('peppol_message_id', payload.messageId);

    if (error) {
      console.error('Error updating invoice response:', error);
      throw error;
    }

    console.log('Invoice response processed successfully');
    
  } catch (error) {
    console.error('Error handling invoice response:', error);
    throw error;
  }
}

async function handleValidationFailed(supabaseClient: any, payload: any) {
  try {
    console.log('Processing validation failure...');
    
    // Log validation failure for debugging
    const { error } = await supabaseClient
      .from('peppol_validation_errors')
      .insert([{
        message_id: payload.messageId,
        validation_errors: payload.validationErrors,
        document: payload.document,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error storing validation failure:', error);
      throw error;
    }

    console.log('Validation failure logged successfully');
    
  } catch (error) {
    console.error('Error handling validation failure:', error);
    throw error;
  }
}

function parseUBLInvoice(document: string) {
  try {
    // Simple XML parsing - in production, use a proper XML parser
    const invoiceNumberMatch = document.match(/<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/);
    const issueDateMatch = document.match(/<cbc:IssueDate[^>]*>([^<]+)<\/cbc:IssueDate>/);
    const dueDateMatch = document.match(/<cbc:DueDate[^>]*>([^<]+)<\/cbc:DueDate>/);
    const currencyMatch = document.match(/<cbc:DocumentCurrencyCode[^>]*>([^<]+)<\/cbc:DocumentCurrencyCode>/);
    const payableAmountMatch = document.match(/<cbc:PayableAmount[^>]*>([^<]+)<\/cbc:PayableAmount>/);
    
    // Extract sender info
    const senderNameMatch = document.match(/<cac:AccountingSupplierParty[^>]*>[\s\S]*?<cbc:Name[^>]*>([^<]+)<\/cbc:Name>/);
    const senderVatMatch = document.match(/<cac:AccountingSupplierParty[^>]*>[\s\S]*?<cbc:CompanyID[^>]*>([^<]+)<\/cbc:CompanyID>/);
    const senderPeppolMatch = document.match(/<cac:AccountingSupplierParty[^>]*>[\s\S]*?<cbc:EndpointID[^>]*>([^<]+)<\/cbc:EndpointID>/);
    
    // Extract invoice lines
    const lineMatches = document.match(/<cac:InvoiceLine[^>]*>[\s\S]*?<\/cac:InvoiceLine>/g) || [];
    const invoiceLines = lineMatches.map((line, index) => {
      const descriptionMatch = line.match(/<cbc:Name[^>]*>([^<]+)<\/cbc:Name>/);
      const quantityMatch = line.match(/<cbc:InvoicedQuantity[^>]*>([^<]+)<\/cbc:InvoicedQuantity>/);
      const unitPriceMatch = line.match(/<cbc:PriceAmount[^>]*>([^<]+)<\/cbc:PriceAmount>/);
      const lineAmountMatch = line.match(/<cbc:LineExtensionAmount[^>]*>([^<]+)<\/cbc:LineExtensionAmount>/);
      const vatPercentMatch = line.match(/<cbc:Percent[^>]*>([^<]+)<\/cbc:Percent>/);
      
      return {
        id: index + 1,
        description: descriptionMatch?.[1] || `Item ${index + 1}`,
        quantity: parseFloat(quantityMatch?.[1] || '1'),
        unitPrice: parseFloat(unitPriceMatch?.[1] || '0'),
        taxableAmount: parseFloat(lineAmountMatch?.[1] || '0'),
        taxAmount: 0, // Calculate based on VAT percentage
        totalAmount: parseFloat(lineAmountMatch?.[1] || '0'),
        vatCode: 'S',
        taxPercentage: parseFloat(vatPercentMatch?.[1] || '21')
      };
    });

    return {
      invoiceNumber: invoiceNumberMatch?.[1] || 'UNKNOWN',
      issueDate: issueDateMatch?.[1] || new Date().toISOString().split('T')[0],
      dueDate: dueDateMatch?.[1] || new Date().toISOString().split('T')[0],
      currency: currencyMatch?.[1] || 'EUR',
      totalAmount: parseFloat(payableAmountMatch?.[1] || '0'),
      sender: {
        name: senderNameMatch?.[1] || 'Unknown Sender',
        vatNumber: senderVatMatch?.[1] || '',
        peppolIdentifier: senderPeppolMatch?.[1] || '',
        addressLine1: '',
        city: '',
        zipCode: '',
        countryCode: 'BE',
        contact: {
          name: '',
          phone: '',
          email: ''
        }
      },
      invoiceLines
    };
  } catch (error) {
    console.error('Error parsing UBL invoice:', error);
    return {
      invoiceNumber: 'PARSE_ERROR',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      currency: 'EUR',
      totalAmount: 0,
      sender: {
        name: 'Parse Error',
        vatNumber: '',
        peppolIdentifier: '',
        addressLine1: '',
        city: '',
        zipCode: '',
        countryCode: 'BE',
        contact: {
          name: '',
          phone: '',
          email: ''
        }
      },
      invoiceLines: []
    };
  }
}

function parseUBLCreditNote(document: string) {
  // Similar to parseUBLInvoice but for credit notes
  try {
    const creditNoteNumberMatch = document.match(/<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/);
    const issueDateMatch = document.match(/<cbc:IssueDate[^>]*>([^<]+)<\/cbc:IssueDate>/);
    const dueDateMatch = document.match(/<cbc:DueDate[^>]*>([^<]+)<\/cbc:DueDate>/);
    const currencyMatch = document.match(/<cbc:DocumentCurrencyCode[^>]*>([^<]+)<\/cbc:DocumentCurrencyCode>/);
    const payableAmountMatch = document.match(/<cbc:PayableAmount[^>]*>([^<]+)<\/cbc:PayableAmount>/);
    
    return {
      creditNoteNumber: creditNoteNumberMatch?.[1] || 'UNKNOWN',
      issueDate: issueDateMatch?.[1] || new Date().toISOString().split('T')[0],
      dueDate: dueDateMatch?.[1] || new Date().toISOString().split('T')[0],
      currency: currencyMatch?.[1] || 'EUR',
      totalAmount: parseFloat(payableAmountMatch?.[1] || '0')
    };
  } catch (error) {
    console.error('Error parsing UBL credit note:', error);
    return {
      creditNoteNumber: 'PARSE_ERROR',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      currency: 'EUR',
      totalAmount: 0
    };
  }
}

function parseInvoiceResponse(document: string) {
  try {
    // Parse invoice response to determine if accepted or rejected
    const responseCodeMatch = document.match(/<cbc:ResponseCode[^>]*>([^<]+)<\/cbc:ResponseCode>/);
    const responseDescriptionMatch = document.match(/<cbc:Description[^>]*>([^<]+)<\/cbc:Description>/);
    
    const responseCode = responseCodeMatch?.[1] || '';
    const accepted = responseCode === 'AP' || responseCode === 'OK'; // AP = Accepted, OK = OK
    
    return {
      accepted,
      responseCode,
      notes: responseDescriptionMatch?.[1] || ''
    };
  } catch (error) {
    console.error('Error parsing invoice response:', error);
    return {
      accepted: false,
      responseCode: 'ERROR',
      notes: 'Parse error'
    };
  }
}
