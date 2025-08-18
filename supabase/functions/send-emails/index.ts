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
      case 'quote_notification':
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.client_email],
          subject: emailData.subject || `Votre devis est prêt - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
          html: generateQuoteNotificationEmail(emailData, emailData.quoteData, emailData.artisanData)
        });
        break;
        
      case 'new_lead_available':
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.artisan_email],
          subject: `Nouveau projet disponible - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
          html: generateNewLeadNotificationEmail(emailData.leadData, emailData.artisanData)
        });
        break;
        
      case 'lead_assigned':
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.artisan_email],
          subject: `Projet assigné - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
          html: generateLeadAssignmentEmail(emailData.leadData, emailData.artisanData)
        });
        break;
        
      case 'welcome_client':
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.client_email],
          subject: 'Bienvenue - Votre projet a été reçu',
          html: generateWelcomeEmail(emailData.clientData)
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

// Simplified email template functions
function generateQuoteNotificationEmail(clientData: any, quoteData: any, artisanData: any) {
  // Handle both lead-based and direct client data
  const isLeadData = clientData?.leadData;
  const clientInfo = isLeadData ? clientData.leadData : clientData;
  
  // Get the custom message from emailData if available
  const customMessage = clientData?.message || 'Veuillez trouver ci-joint notre devis pour votre projet.';
  
  // Fix the URL to use the correct share link format
  const quoteUrl = `${clientData?.site_url || 'https://www.haliqo.com'}/quote-share/${quoteData?.share_token}`;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre devis est prêt</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Bonjour ${clientInfo?.client_name || 'Client'},</h2>
        
        <p>${customMessage}</p>
        
        <div style="text-align: center;">
          <a href="${quoteUrl}" class="button">Voir votre devis</a>
        </div>
        
        <p>Cordialement,<br>
        ${artisanData?.company_name || artisanData?.name || 'Votre équipe'}</p>
      </div>
    </body>
    </html>
  `;
}

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

function generateWelcomeEmail(clientData: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur notre plateforme</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Bonjour ${clientData?.name || 'Client'},</h2>
        
        <p>Nous sommes ravis de vous accueillir sur notre plateforme !</p>
        
        <p>Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l'examiner et vous proposer des devis dans les plus brefs délais.</p>
        
        <p>Merci de votre confiance !<br>
        L'équipe de votre plateforme</p>
      </div>
    </body>
    </html>
  `;
}