// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, username, password, method, config, action, peppolIdentifier, participantData, xmlDocument, documentType } = await req.json();

    if (!endpoint || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Basic Auth header
    const auth = btoa(`${username}:${password}`);

    let url: string;
    let fetchOptions: RequestInit = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    // Handle different actions
    if (action === 'test-connection') {
      // Get supported document types (public API for testing)
      url = `${endpoint}/api/v1/peppol/public/supported-document-types`;
      fetchOptions.method = 'GET';
    } else if (action === 'get-participant' && peppolIdentifier) {
      // Get detailed participant information (public API - no authentication required)
      url = `${endpoint}/api/v1/peppol/public/participants/${peppolIdentifier}`;
      fetchOptions.method = 'GET';
      // Remove auth headers for public endpoint
      delete fetchOptions.headers['Authorization'];
    } else if (action === 'get-participant-details' && peppolIdentifier) {
      // Get detailed participant information (authenticated API - for registered participants)
      url = `${endpoint}/api/v1/peppol/registered-participants/${peppolIdentifier}`;
      fetchOptions.method = 'GET';
    } else if (action === 'register-participant' && participantData) {
      // Register a new participant (POST)
      url = `${endpoint}/api/v1/peppol/registered-participants`;
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(participantData);
    } else if (action === 'get-participants') {
      // Get all registered participants (GET)
      url = `${endpoint}/api/v1/peppol/registered-participants`;
      fetchOptions.method = 'GET';
    } else if (action === 'unregister-participant' && peppolIdentifier) {
      // Unregister a participant (DELETE)
      url = `${endpoint}/api/v1/peppol/registered-participants/${peppolIdentifier}`;
      fetchOptions.method = 'DELETE';
    } else if (action === 'validate-document' && xmlDocument) {
      // Validate a document (POST with form-data)
      url = `${endpoint}/api/v1/peppol/public/validate-document`;
      fetchOptions.method = 'POST';
      // Note: FormData needs special handling in Deno
      const formData = new FormData();
      
      // Convert XML string to Blob for proper multipart/form-data upload
      // Ensure UTF-8 encoding for proper character handling
      // The API expects 'document' to be a File/Blob, not a string
      // Create Blob with explicit UTF-8 encoding to handle special characters correctly
      const xmlBlob = new Blob([xmlDocument], { 
        type: 'application/xml; charset=utf-8' 
      });
      formData.append('document', xmlBlob, 'invoice.xml');
      
      fetchOptions.body = formData;
      delete fetchOptions.headers['Content-Type']; // Let browser set boundary
    } else if (action === 'send-ubl-document' && xmlDocument) {
      // Send UBL document (POST with form-data)
      url = `${endpoint}/api/v1/peppol/outbound-ubl-documents`;
      
      // Log XML document preview and extract EndpointIDs for debugging
      console.log('[Edge Function] XML document preview (first 500 chars):', xmlDocument.substring(0, 500));
      
      // Extract sender and receiver Peppol IDs from XML for logging
      try {
        // Extract sender EndpointID (AccountingSupplierParty)
        const senderMatch = xmlDocument.match(/<cac:AccountingSupplierParty[^>]*>[\s\S]*?<cbc:EndpointID\s+schemeID="([^"]+)"[^>]*>([^<]+)<\/cbc:EndpointID>/i);
        if (senderMatch) {
          const senderScheme = senderMatch[1];
          const senderId = senderMatch[2].trim();
          console.log(`[Edge Function] Sender Peppol ID: ${senderScheme}:${senderId}`);
          console.log(`[Edge Function] Sender EndpointID value: "${senderId}" (length: ${senderId.length}, is 0208: ${senderScheme === '0208'})`);
          if (senderScheme === '0208') {
            // Validate 0208 format
            const is10Digits = /^\d{10}$/.test(senderId);
            const mod97Valid = is10Digits && (parseInt(senderId, 10) % 97 === 0);
            console.log(`[Edge Function] Sender 0208 validation: 10 digits=${is10Digits}, MOD97=${mod97Valid}`);
          }
        }
        
        // Extract receiver EndpointID (AccountingCustomerParty)
        const receiverMatch = xmlDocument.match(/<cac:AccountingCustomerParty[^>]*>[\s\S]*?<cbc:EndpointID\s+schemeID="([^"]+)"[^>]*>([^<]+)<\/cbc:EndpointID>/i);
        if (receiverMatch) {
          const receiverScheme = receiverMatch[1];
          const receiverId = receiverMatch[2].trim();
          console.log(`[Edge Function] Receiver Peppol ID: ${receiverScheme}:${receiverId}`);
          console.log(`[Edge Function] Receiver EndpointID value: "${receiverId}" (length: ${receiverId.length}, is 0208: ${receiverScheme === '0208'})`);
          if (receiverScheme === '0208') {
            // Validate 0208 format
            const is10Digits = /^\d{10}$/.test(receiverId);
            const mod97Valid = is10Digits && (parseInt(receiverId, 10) % 97 === 0);
            console.log(`[Edge Function] Receiver 0208 validation: 10 digits=${is10Digits}, MOD97=${mod97Valid}`);
            if (!is10Digits || !mod97Valid) {
              console.error(`[Edge Function] ⚠️ Receiver 0208 EndpointID validation failed!`, {
                value: receiverId,
                length: receiverId.length,
                hasWhitespace: /\s/.test(receiverId),
                is10Digits,
                mod97Valid,
                remainder: is10Digits ? (parseInt(receiverId, 10) % 97) : 'N/A'
              });
            }
          }
        }
      } catch (extractError) {
        console.warn('[Edge Function] Could not extract EndpointIDs from XML:', extractError);
      }
      
      console.log('[Edge Function] Sending UBL document to:', url);
      
      fetchOptions.method = 'POST';
      const formData = new FormData();
      
      // Convert XML string to Blob for proper multipart/form-data upload
      // Ensure UTF-8 encoding for proper character handling
      // The API expects 'document' to be a File/Blob, not a string
      // Create Blob with explicit UTF-8 encoding to handle special characters correctly
      const xmlBlob = new Blob([xmlDocument], { 
        type: 'application/xml; charset=utf-8' 
      });
      
      formData.append('document', xmlBlob, 'invoice.xml');
      
      fetchOptions.body = formData;
      delete fetchOptions.headers['Content-Type']; // Let browser set boundary
    } else if (action === 'add-document-type' && peppolIdentifier && documentType) {
      // Add supported document type for a remote participant (POST)
      url = `${endpoint}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types/${documentType}`;
      fetchOptions.method = 'POST';
    } else if (action === 'remove-document-type' && peppolIdentifier && documentType) {
      // Remove supported document type for a remote participant (DELETE)
      url = `${endpoint}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types/${documentType}`;
      fetchOptions.method = 'DELETE';
    } else if (action === 'get-supported-document-types' && peppolIdentifier) {
      // Get supported document types for a remote participant (GET)
      url = `${endpoint}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types`;
      fetchOptions.method = 'GET';
    } else if (method === 'POST' && config) {
      // Configure webhook (POST)
      // Only send required fields: login, password, webHooks
      // Filter out any extra fields that might cause API errors
      const webhookConfig = {
        login: config.login,
        password: config.password,
        webHooks: Array.isArray(config.webHooks) 
          ? config.webHooks.filter(wh => wh && wh.type && wh.url)
          : []
      };
      
      url = `${endpoint}/api/v1/webhook/configuration`;
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(webhookConfig);
    } else {
      // Get webhook configuration (GET)
      url = `${endpoint}/api/v1/webhook`;
      fetchOptions.method = 'GET';
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      
      // Enhanced error logging for debugging
      console.error('[Edge Function] Digiteal API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 2000), // First 2000 chars
        action: action || 'unknown'
      });
      
      // Try to parse the error details from Digiteal
      let errorMessage = 'Failed to configure/fetch webhook';
      let parsedDetails = {};
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
        parsedDetails = errorJson;
      } catch {
        errorMessage = errorText || errorMessage;
        parsedDetails = { raw: errorText };
      }
      
      // Check if it's a PEPPOL-COMMON-R043 error (0208 validation)
      const isR043Error = errorMessage.includes('PEPPOL-COMMON-R043') || 
                         errorMessage.includes('Belgian enterprise number') ||
                         errorMessage.includes('mod97-0208');
      
      if (isR043Error && action === 'send-ubl-document') {
        console.error('[Edge Function] ⚠️ PEPPOL-COMMON-R043 error detected - 0208 EndpointID validation failed');
        console.error('[Edge Function] This usually means the 0208 EndpointID is not exactly 10 digits or fails MOD97 validation');
      }
      
      // Check if it's a sender or receiver issue based on error message
      const isSenderIssue = errorMessage.toLowerCase().includes('sender') || 
                           errorMessage.toLowerCase().includes('supplier') ||
                           errorMessage.toLowerCase().includes('accounting supplier');
      const isReceiverIssue = errorMessage.toLowerCase().includes('receiver') || 
                             errorMessage.toLowerCase().includes('recipient') ||
                             errorMessage.toLowerCase().includes('customer') ||
                             errorMessage.toLowerCase().includes('accounting customer');
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorText,
          status: response.status,
          isSenderIssue,
          isReceiverIssue,
          parsedDetails
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get response text first
    const responseText = await response.text();
    
    // Parse JSON if content exists
    let data;
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
        
        // For send-ubl-document action, try to extract messageId from response
        if (action === 'send-ubl-document') {
          // Try various possible fields where messageId might be
          const messageId = data.messageId || data.id || data.documentId || data.message_id || null;
          if (messageId) {
            data.messageId = messageId;
          }
        }
      } catch (parseError) {
        // If response is not JSON, might be plain text success message
        // For send-ubl-document, check if it's a success message
        if (action === 'send-ubl-document' && (responseText.includes('OK') || responseText.includes('success'))) {
          data = { 
            success: true, 
            message: 'UBL document sent successfully',
            // Note: messageId will be received via webhook later
          };
        } else {
          return new Response(
            JSON.stringify({
              error: 'Invalid JSON response from API',
              rawResponse: responseText,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } else {
      // Empty response - likely successful for POST operations
      if (action === 'send-ubl-document') {
        data = { 
          success: true, 
          message: 'UBL document sent successfully',
          // Note: messageId will be received via webhook later
        };
      } else {
        data = { success: true, message: 'Webhook configuration updated successfully' };
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in peppol-webhook-config:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        details: error?.toString() || 'Error details not available',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

