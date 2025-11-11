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
      // Prepare attachments if provided
      // Resend API expects: { content: base64String, filename: string }
      const attachments = emailPayload.attachments ? emailPayload.attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content // Base64 encoded content (without data URL prefix)
      })) : undefined;

      const payload: any = {
        from: emailPayload.from,
        to: emailPayload.to,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text
      };

      // Add reply-to if provided
      if (emailPayload.replyTo) {
        payload.reply_to = emailPayload.replyTo;
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
          text: emailData.text,
          attachments: emailData.attachments || undefined
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
        
      case 'custom_quote_sent':
        // Handle custom quote emails with user-defined subject and message
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateCustomQuoteEmail(emailData.message, emailData.variables),
          text: emailData.message
        });
        break;

      case 'quote_followup':
        // Handle follow-up emails for quotes
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateFollowUpEmail(emailData.html, emailData.variables),
          text: emailData.text
        });
        break;

      case 'quote_status_update':
        // Handle quote status update emails (accepted/rejected)
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateQuoteStatusEmail(emailData.html, emailData.variables),
          text: emailData.text
        });
        break;
        
      case 'credit_insurance_application':
        // Handle credit insurance application emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateCreditInsuranceApplicationEmail(emailData.application),
          text: emailData.text
        });
        break;
        
      case 'credit_insurance_confirmation':
        // Handle credit insurance confirmation emails to applicants
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateCreditInsuranceConfirmationEmail(emailData.application),
          text: emailData.text
        });
        break;

      case 'subscription_upgraded':
        // Handle subscription upgrade notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_downgraded':
        // Handle subscription downgrade notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_cancelled':
        // Handle subscription cancellation notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_trial_ending':
        // Handle trial ending notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_activated':
        // Handle subscription activation notification emails (for new registrations)
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'contact_form':
        // Handle contact form submissions
        const supportEmail = emailData.support_email || fromEmail;
        const contactSubject = emailData.subject || 'New Contact Form Submission';
        const contactHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0036ab;">New Contact Form Submission</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${emailData.firstName || ''} ${emailData.lastName || ''}</p>
              <p><strong>Email:</strong> ${emailData.email || ''}</p>
              <p><strong>Phone:</strong> ${emailData.phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${emailData.subject || 'N/A'}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
              <h3 style="color: #0036ab; margin-top: 0;">Message:</h3>
              <p style="white-space: pre-wrap;">${emailData.message || ''}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This email was sent from the Haliqo contact form.
            </p>
          </div>
        `;
        const contactText = `
New Contact Form Submission

Name: ${emailData.firstName || ''} ${emailData.lastName || ''}
Email: ${emailData.email || ''}
Phone: ${emailData.phone || 'Not provided'}
Subject: ${emailData.subject || 'N/A'}

Message:
${emailData.message || ''}

---
This email was sent from the Haliqo contact form.
        `;
        
        emailResult = await sendEmail({
          from: fromEmail,
          to: [supportEmail],
          replyTo: emailData.email || fromEmail,
          subject: `[Contact Form] ${contactSubject}`,
          html: contactHtml,
          text: contactText
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

function generateCustomQuoteEmail(message: string, variables: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis ${variables?.quote_number || ''}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .quote-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Bonjour ${variables?.client_name || 'Madame, Monsieur'},</h2>
        
        <div class="quote-info">
          <p><strong>Devis :</strong> ${variables?.quote_number || 'N/A'}</p>
          <p><strong>Projet :</strong> ${variables?.quote_title || 'Votre projet'}</p>
          <p><strong>Montant :</strong> ${variables?.quote_amount || '0€'}</p>
          <p><strong>Valable jusqu'au :</strong> ${variables?.valid_until || '30 jours'}</p>
        </div>
        
        <div style="white-space: pre-line;">${message}</div>
        
        ${variables?.quote_link && variables.quote_link !== '#' ? `
        <div style="text-align: center;">
          <a href="${variables.quote_link}" class="button">Voir le devis</a>
        </div>
        ` : ''}
        
        <p>Cordialement,<br>
        ${variables?.company_name || 'Notre équipe'}</p>
      </div>
    </body>
    </html>
  `;
}

function generateFollowUpEmail(html: string, variables: any) {
  // Replace variables in HTML content
  let processedHtml = html;
  if (variables) {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedHtml = processedHtml.replace(regex, variables[key] || '');
    });
  }
  return processedHtml;
}

function generateQuoteStatusEmail(html: string, variables: any) {
  // Replace variables in HTML content for status emails
  let processedHtml = html;
  if (variables) {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedHtml = processedHtml.replace(regex, variables[key] || '');
    });
  }
  return processedHtml;
}

function generateCreditInsuranceApplicationEmail(application: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle demande d'assurance crédit</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin: 15px 0; }
        .field-label { font-weight: bold; color: #1e40af; }
        .field-value { margin-top: 5px; }
        .highlight { background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvelle demande d'assurance crédit</h1>
          <p>Une nouvelle demande a été soumise via le formulaire en ligne</p>
        </div>
        
        <div class="content">
          <div class="highlight">
            <p><strong>ID de la demande:</strong> ${application.id}</p>
            <p><strong>Date de soumission:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <div class="field">
            <div class="field-label">Entreprise</div>
            <div class="field-value">${application.companyName}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Personne de contact</div>
            <div class="field-value">${application.contactPerson}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${application.email}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Téléphone</div>
            <div class="field-value">${application.telephone}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Adresse</div>
            <div class="field-value">${application.address}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Secteur d'activité</div>
            <div class="field-value">${application.sector}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Description de l'activité</div>
            <div class="field-value">${application.activityDescription}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Chiffre d'affaires annuel</div>
            <div class="field-value">${application.annualTurnover}€</div>
          </div>
          
          <div class="field">
            <div class="field-label">Principaux clients B2B</div>
            <div class="field-value">${application.topCustomers}</div>
          </div>
          
          <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <strong>Action requise:</strong> Veuillez examiner cette demande et contacter le client pour une proposition personnalisée.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCreditInsuranceConfirmationEmail(application: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de votre demande d'assurance crédit</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669; }
        .footer { margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirmation de votre demande</h1>
          <p>Nous avons bien reçu votre demande d'assurance crédit</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p>Nous avons bien reçu votre demande d'assurance crédit pour l'entreprise <strong>${application.companyName}</strong>.</p>
          
          <div class="highlight">
            <p><strong>Numéro de référence:</strong> ${application.id}</p>
            <p><strong>Date de soumission:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <p>Notre équipe va examiner votre dossier et vous contactera dans les plus brefs délais pour vous proposer une offre personnalisée.</p>
          
          <p>En attendant, voici un récapitulatif de votre demande :</p>
          
          <ul>
            <li><strong>Entreprise:</strong> ${application.companyName}</li>
            <li><strong>Personne de contact:</strong> ${application.contactPerson}</li>
            <li><strong>Secteur:</strong> ${application.sector}</li>
            <li><strong>Chiffre d'affaires annuel:</strong> ${application.annualTurnover}€</li>
          </ul>
          
          <div class="footer">
            <p><strong>Prochaines étapes:</strong></p>
            <ol>
              <li>Analyse de votre dossier par nos experts</li>
              <li>Évaluation des risques et de la solvabilité</li>
              <li>Proposition personnalisée sous 48-72h</li>
              <li>Signature du contrat et activation de la garantie</li>
            </ol>
          </div>
          
          <p>Merci de votre confiance.</p>
          
          <p>Cordialement,<br>
          <strong>L'équipe Haliqo</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

