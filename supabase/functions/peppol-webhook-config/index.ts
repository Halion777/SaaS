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
    const { endpoint, username, password, method, config } = await req.json();

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

    // Determine if this is a POST request (to configure) or GET (to fetch)
    const isPost = method === 'POST' && config;

    // Call Digiteal API
    const url = isPost 
      ? `${endpoint}/api/v1/webhook/configuration`
      : `${endpoint}/api/v1/webhook`;

    const response = await fetch(url, {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: isPost ? JSON.stringify(config) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: 'Failed to configure/fetch webhook',
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
      } catch (parseError) {
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
    } else {
      // Empty response - likely successful for POST operations
      data = { success: true, message: 'Webhook configuration updated successfully' };
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

