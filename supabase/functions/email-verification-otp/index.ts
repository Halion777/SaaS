// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper function to normalize language code
function normalizeLanguage(lang: string | null | undefined): string {
  if (!lang) return 'en';
  const normalized = lang.split('-')[0].toLowerCase().trim();
  if (normalized === 'br' || normalized === 'be') return 'fr';
  if (normalized === 'en' || normalized === 'eng') return 'en';
  if (normalized === 'nl' || normalized === 'nld' || normalized === 'dut') return 'nl';
  if (normalized === 'fr' || normalized === 'fra') return 'fr';
  return normalized;
}

// Helper function to get and render email template from database
async function getEmailTemplate(supabaseClient: any, templateType: string, language: string = 'en') {
  try {
    const normalizedLanguage = normalizeLanguage(language);
    
    // Try to get default template for the language
    const { data: template, error } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('language', normalizedLanguage)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();
    
    if (template) {
      return { success: true, data: template };
    }
    
    // Fallback to English if requested language not found
    if (normalizedLanguage !== 'en') {
      const { data: englishTemplate } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('language', 'en')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      
      if (englishTemplate) {
        return { success: true, data: englishTemplate };
      }
    }
    
    return { success: false, error: 'Template not found' };
  } catch (error: any) {
    console.error('Error getting email template:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to render template with variables
function renderTemplate(template: any, variables: any) {
  let html = template.html_content || '';
  let text = template.text_content || '';
  let subject = template.subject || '';
  
  // Replace variables in content
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    const value = variables[key] || '';
    html = html.replace(regex, value);
    text = text.replace(regex, value);
    subject = subject.replace(regex, value);
  });
  
  return { subject, html, text };
}

// Send OTP email via Resend using database template
async function sendOTPEmail(supabaseClient: any, to: string, otp: string, language: string = 'en') {
  // @ts-ignore
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  // @ts-ignore
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // Get email template from database
  const templateResult = await getEmailTemplate(supabaseClient, 'email_verification_otp', language);
  
  if (!templateResult.success || !templateResult.data) {
    console.error('Email template not found, using fallback');
    // Fallback to simple email if template not found
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Verify Your Email Address</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
    const fallbackText = `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Verify Your Email Address - Haliqo',
        html: fallbackHtml,
        text: fallbackText
      })
    });

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resend API error: ${response.status} ${errorText}`)
    }

    return await response.json();
  }

  // Render template with OTP code
  const rendered = renderTemplate(templateResult.data, {
    otp_code: otp
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, email, otp } = await req.json()

    if (!action || !email) {
      return new Response(
        JSON.stringify({ error: 'Action and email are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const normalizedEmail = email.toLowerCase().trim()

    if (action === 'generate') {
      // Generate OTP
      const generatedOTP = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP in database (create or update)
      // First try to delete existing OTP for this email (if any)
      await supabaseClient
        .from('email_verification_otps')
        .delete()
        .eq('email', normalizedEmail)

      // Insert new OTP
      const { data: insertData, error: insertError } = await supabaseClient
        .from('email_verification_otps')
        .insert({
          email: normalizedEmail,
          otp: generatedOTP,
          expires_at: expiresAt.toISOString(),
          attempts: 0
        })
        .select()

      if (insertError) {
        console.error('Error storing OTP:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
        
        // Check if table doesn't exist
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          return new Response(
            JSON.stringify({ 
              error: 'Database table not found. Please run the email_verification_otp_schema.sql migration first.',
              details: insertError.message
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate OTP',
            details: insertError.message || 'Database error',
            code: insertError.code
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Send OTP email using database template
      try {
        // Default to English language for email template (can be enhanced to detect user language)
        await sendOTPEmail(supabaseClient, normalizedEmail, generatedOTP, 'en')
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError)
        return new Response(
          JSON.stringify({ error: 'Failed to send verification email' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent to your email' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'verify') {
      if (!otp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get OTP from database
      const { data: otpData, error: fetchError } = await supabaseClient
        .from('email_verification_otps')
        .select('*')
        .eq('email', normalizedEmail)
        .single()

      if (fetchError || !otpData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired verification code' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if OTP is expired
      const expiresAt = new Date(otpData.expires_at)
      if (new Date() > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'Verification code has expired. Please request a new one.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if too many attempts
      if (otpData.attempts >= 5) {
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Please request a new verification code.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        // Increment attempts
        await supabaseClient
          .from('email_verification_otps')
          .update({ attempts: otpData.attempts + 1 })
          .eq('email', normalizedEmail)

        return new Response(
          JSON.stringify({ error: 'Invalid verification code. Please try again.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // OTP is valid - mark email as verified
      // First, check if user exists in auth.users
      const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })

      if (authError || !authUsers?.users) {
        console.error('Error fetching auth users:', authError)
      } else {
        const authUser = authUsers.users.find(user =>
          user.email && user.email.toLowerCase().trim() === normalizedEmail
        )

        if (authUser) {
          // Update email_confirmed_at in auth.users
          await supabaseClient.auth.admin.updateUserById(authUser.id, {
            email_confirm: true
          })

          // Update public.users if exists
          const { data: userData } = await supabaseClient
            .from('users')
            .select('id')
            .eq('id', authUser.id)
            .maybeSingle()

          if (userData) {
            await supabaseClient
              .from('users')
              .update({
                email_verified: true,
                email_verified_at: new Date().toISOString()
              })
              .eq('id', authUser.id)
          }
        }
      }

      // Delete OTP after successful verification
      await supabaseClient
        .from('email_verification_otps')
        .delete()
        .eq('email', normalizedEmail)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email verified successfully' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in email-verification-otp:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

