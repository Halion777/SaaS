// @ts-ignore
declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { emailType, emailData } = await req.json();
    
    // Check if required environment variables are set
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    
    if (!resendApiKey || !fromEmail) {
      throw new Error('Email service not configured: Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
    }

    // Create Supabase client for any database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let emailResult;
    
    // Send email using Resend API directly (since npm:resend doesn't work in Deno)
    const sendEmail = async (emailPayload: any) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    };
    
    switch (emailType) {
      case 'templated_email':
        // New template system for client emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.client_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;
        
      case 'new_lead_available':
        // Keep: Business logic for artisans
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.artisan_email],
          subject: `Nouveau projet disponible - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
          html: generateNewLeadNotificationEmail(emailData.leadData, emailData.artisanData)
        });
        break;
        
      case 'lead_assigned':
        // Keep: Business logic for artisans
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.artisan_email],
          subject: `Projet assigné - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
          html: generateLeadAssignmentEmail(emailData.leadData, emailData.artisanData)
        });
        break;
        
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResult?.data || emailResult }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Email function error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Email template functions for business logic (artisan communications)

function generateNewLeadNotificationEmail(leadData: any, artisanData: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau projet disponible</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Bonjour ${artisanData?.company_name || artisanData?.name || 'Artisan'},</h2>
        
        <p>Un nouveau projet correspondant à vos compétences est disponible.</p>
        
        <p><strong>Description :</strong> ${leadData?.project_description || 'Projet'}</p>
        <p><strong>Localisation :</strong> ${leadData?.city || 'N/A'}, ${leadData?.zip_code || 'N/A'}</p>
        
        <div style="text-align: center;">
          <a href="${leadData?.site_url || 'https://yourdomain.com'}/leads-management" class="button">Voir le projet</a>
        </div>
        
        <p>Bonne chance !<br>
        L'équipe de votre plateforme</p>
      </div>
    </body>
    </html>
  `;
}

function generateLeadAssignmentEmail(leadData: any, artisanData: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Projet assigné avec succès</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Bonjour ${artisanData?.company_name || artisanData?.name || 'Artisan'},</h2>
        
        <p>Félicitations ! Le projet suivant vous a été assigné avec succès :</p>
        
        <p><strong>Description :</strong> ${leadData?.project_description || 'Projet'}</p>
        <p><strong>Client :</strong> ${leadData?.client_name || 'Client'}</p>
        
        <div style="text-align: center;">
          <a href="${leadData?.site_url || 'https://yourdomain.com'}/leads-management" class="button">Préparer le devis</a>
        </div>
        
        <p>Bonne chance !<br>
        L'équipe de votre plateforme</p>
      </div>
    </body>
    </html>
  `;
}

