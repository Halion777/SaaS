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
          subject: `Votre devis est prêt - ${emailData.project_description?.substring(0, 50) || 'Projet'}...`,
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

    // Log successful email send to database if needed
    try {
      await supabase
        .from('email_logs')
        .insert({
          email_type: emailType,
          recipient: emailData.client_email || emailData.artisan_email,
          subject: emailResult?.data?.subject || 'Email sent',
          status: 'sent',
          provider_message_id: emailResult?.data?.id,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log email to database:', logError);
      // Don't fail the request if logging fails
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
    
    // Log error to database if possible
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('email_logs')
        .insert({
          email_type: 'error',
          recipient: 'unknown',
          subject: 'Email sending failed',
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log error to database:', logError);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Email template functions
function generateQuoteNotificationEmail(clientData: any, quoteData: any, artisanData: any) {
  // Handle both lead-based and direct client data
  const isLeadData = clientData?.leadData;
  const clientInfo = isLeadData ? clientData.leadData : clientData;
  
  // Fix the URL to use the correct share link format
  const quoteUrl = `${clientData?.site_url || 'https://yourdomain.com'}/quote-share/${quoteData?.share_token}`;
  
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
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .project-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .highlight { color: #2563eb; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏗️ Votre devis est prêt !</h1>
        </div>
        
        <div class="content">
          <h2>Bonjour ${clientInfo?.client_name || 'Client'},</h2>
          
          <p>Nous avons le plaisir de vous informer que votre devis pour le projet suivant est maintenant prêt :</p>
          
          <div class="project-details">
            <h3>📋 Détails du projet</h3>
            <p><strong>Description :</strong> ${clientInfo?.project_description || 'Projet'}</p>
            <p><strong>Localisation :</strong> ${clientInfo?.city || 'N/A'}, ${clientInfo?.zip_code || 'N/A'}</p>
            <p><strong>Catégories :</strong> ${clientInfo?.project_categories?.join(', ') || 'N/A'}</p>
            <p><strong>Date de réalisation souhaitée :</strong> ${clientInfo?.completion_date ? new Date(clientInfo.completion_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
          </div>
          
          <p>L'artisan <span class="highlight">${artisanData?.company_name || artisanData?.name || 'Artisan'}</span> a préparé un devis détaillé pour votre projet.</p>
          
          <div style="text-align: center;">
            <a href="${quoteUrl}" class="button">📋 Voir votre devis</a>
          </div>
          
          <p><strong>Important :</strong> Ce devis est valable 30 jours à compter de sa date d'émission.</p>
          
          <p>Si vous avez des questions ou souhaitez discuter des détails du projet, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>
          L'équipe de votre plateforme artisanale</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
          <p>© ${new Date().getFullYear()} - Plateforme Artisanale</p>
        </div>
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
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .project-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .highlight { color: #059669; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Nouveau projet disponible !</h1>
        </div>
        
        <div class="content">
          <h2>Bonjour ${artisanData?.company_name || artisanData?.name || 'Artisan'},</h2>
          
          <p>Un nouveau projet correspondant à vos compétences est disponible dans votre zone d'intervention :</p>
          
          <div class="project-details">
            <h3>📋 Détails du projet</h3>
            <p><strong>Description :</strong> ${leadData?.project_description || 'Projet'}</p>
            <p><strong>Localisation :</strong> ${leadData?.city || 'N/A'}, ${leadData?.zip_code || 'N/A'}</p>
            <p><strong>Catégories :</strong> ${leadData?.project_categories?.join(', ') || 'N/A'}</p>
            <p><strong>Budget estimé :</strong> ${leadData?.price_range || 'Non spécifié'}</p>
            <p><strong>Date de réalisation souhaitée :</strong> ${leadData?.completion_date ? new Date(leadData.completion_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
          </div>
          
          <p>Ce projet correspond parfaitement à vos spécialités et se trouve dans votre rayon d'intervention de <span class="highlight">${artisanData?.intervention_radius || 'N/A'} km</span>.</p>
          
          <div style="text-align: center;">
            <a href="${leadData?.site_url || 'https://yourdomain.com'}/leads-management" class="button">👀 Voir le projet</a>
          </div>
          
          <p><strong>Rappel :</strong> Vous pouvez envoyer un devis pour ce projet depuis votre tableau de bord des leads.</p>
          
          <p>Bonne chance !<br>
          L'équipe de votre plateforme artisanale</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
          <p>© ${new Date().getFullYear()} - Plateforme Artisanale</p>
        </div>
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
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .project-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .highlight { color: #7c3aed; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Projet assigné !</h1>
        </div>
        
        <div class="content">
          <h2>Bonjour ${artisanData?.company_name || artisanData?.name || 'Artisan'},</h2>
          
          <p>Félicitations ! Le projet suivant vous a été assigné avec succès :</p>
          
          <div class="project-details">
            <h3>📋 Détails du projet</h3>
            <p><strong>Description :</strong> ${leadData?.project_description || 'Projet'}</p>
            <p><strong>Client :</strong> ${leadData?.client_name || 'Client'}</p>
            <p><strong>Localisation :</strong> ${leadData?.city || 'N/A'}, ${leadData?.zip_code || 'N/A'}</p>
            <p><strong>Catégories :</strong> ${leadData?.project_categories?.join(', ') || 'N/A'}</p>
          </div>
          
          <p>Vous pouvez maintenant préparer votre devis et le soumettre au client. N'oubliez pas que vous avez un délai pour répondre à ce projet.</p>
          
          <div style="text-align: center;">
            <a href="${leadData?.site_url || 'https://yourdomain.com'}/leads-management" class="button">📝 Préparer le devis</a>
          </div>
          
          <p><strong>Prochaine étape :</strong> Connectez-vous à votre tableau de bord pour accéder aux détails complets du projet et préparer votre proposition.</p>
          
          <p>Bonne chance !<br>
          L'équipe de votre plateforme artisanale</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
          <p>© ${new Date().getFullYear()} - Plateforme Artisanale</p>
        </div>
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
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue sur notre plateforme !</h1>
        </div>
        
        <div class="content">
          <h2>Bonjour ${clientData?.name || 'Client'},</h2>
          
          <p>Nous sommes ravis de vous accueillir sur notre plateforme artisanale !</p>
          
          <p>Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l'examiner et vous proposer des devis dans les plus brefs délais.</p>
          
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Nos artisans analysent votre projet</li>
            <li>Vous recevrez des devis par email</li>
            <li>Vous pourrez comparer et choisir</li>
            <li>L'artisan sélectionné commencera les travaux</li>
          </ul>
          
          <p>Nous vous tiendrons informé de chaque étape par email.</p>
          
          <p>Merci de votre confiance !<br>
          L'équipe de votre plateforme artisanale</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} - Plateforme Artisanale</p>
        </div>
      </div>
    </body>
    </html>
  `;
}