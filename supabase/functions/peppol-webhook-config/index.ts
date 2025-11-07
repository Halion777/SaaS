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
      // Get detailed participant information (public API)
      url = `${endpoint}/api/v1/peppol/public/participants/${peppolIdentifier}`;
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
      
      // Try to parse the error details from Digiteal
      let errorMessage = 'Failed to configure/fetch webhook';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorText,
          status: response.status,
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

