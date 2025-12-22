// @ts-ignore
declare const Deno: any;
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'No captcha token provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the reCAPTCHA secret key from environment
    // @ts-ignore
    const recaptchaSecretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    
    if (!recaptchaSecretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'reCAPTCHA not configured on server' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the token with Google reCAPTCHA API (works for both v2 and Enterprise)
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    const formData = new URLSearchParams();
    formData.append('secret', recaptchaSecretKey);
    formData.append('response', token);

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const verifyData = await verifyResponse.json();

    console.log('reCAPTCHA verification response:', verifyData);

    if (!verifyResponse.ok) {
      console.error('reCAPTCHA verification request failed:', verifyResponse.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification request failed',
          details: verifyData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if verification was successful
    if (!verifyData.success) {
      console.error('reCAPTCHA verification failed:', verifyData['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Captcha verification failed',
          errorCodes: verifyData['error-codes'] || [],
          message: 'Please complete the CAPTCHA verification'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success!
    return new Response(
      JSON.stringify({ 
        success: true, 
        valid: true,
        challengeTimestamp: verifyData.challenge_ts,
        hostname: verifyData.hostname
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

