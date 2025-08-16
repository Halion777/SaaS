import { Resend } from 'resend';
import { supabase } from './supabaseClient';

// Initialize Resend with API key from environment
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);
const FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL;
const BASE_URL = import.meta.env.SITE_URL || window.location.origin;

export class EmailService {
  
  // ========================================
  // EMAIL TEMPLATES
  // ========================================
  
  /**
   * Generate quote notification email template
   */
  static generateQuoteNotificationEmail(leadData, quoteData, artisanData) {
    const quoteUrl = `${window.location.origin}/quote/${quoteData.id}?token=${quoteData.share_token}`;
    
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
            <h2>Bonjour ${leadData.client_name},</h2>
            
            <p>Nous avons le plaisir de vous informer que votre devis pour le projet suivant est maintenant prêt :</p>
            
            <div class="project-details">
              <h3>📋 Détails du projet</h3>
              <p><strong>Description :</strong> ${leadData.project_description}</p>
              <p><strong>Localisation :</strong> ${leadData.city}, ${leadData.zip_code}</p>
              <p><strong>Catégories :</strong> ${leadData.project_categories.join(', ')}</p>
              <p><strong>Date de réalisation souhaitée :</strong> ${leadData.completion_date ? new Date(leadData.completion_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
            </div>
            
            <p>L'artisan <span class="highlight">${artisanData.company_name || artisanData.name}</span> a préparé un devis détaillé pour votre projet.</p>
            
            <div style="text-align: center;">
              <a href="${quoteUrl}" class="button">📄 Voir votre devis</a>
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
  
  /**
   * Generate new lead notification email for artisans
   */
  static generateNewLeadNotificationEmail(leadData, artisanData) {
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
            <h2>Bonjour ${artisanData.company_name || artisanData.name},</h2>
            
            <p>Un nouveau projet correspondant à vos compétences est disponible dans votre zone d'intervention :</p>
            
            <div class="project-details">
              <h3>📋 Détails du projet</h3>
              <p><strong>Description :</strong> ${leadData.project_description}</p>
              <p><strong>Localisation :</strong> ${leadData.city}, ${leadData.zip_code}</p>
              <p><strong>Catégories :</strong> ${leadData.project_categories.join(', ')}</p>
              <p><strong>Budget estimé :</strong> ${leadData.price_range || 'Non spécifié'}</p>
              <p><strong>Date de réalisation souhaitée :</strong> ${leadData.completion_date ? new Date(leadData.completion_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
            </div>
            
            <p>Ce projet correspond parfaitement à vos spécialités et se trouve dans votre rayon d'intervention de <span class="highlight">${artisanData.intervention_radius} km</span>.</p>
            
            <div style="text-align: center;">
              <a href="${window.location.origin}/leads-management" class="button">👀 Voir le projet</a>
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
  
  /**
   * Generate lead assignment confirmation email
   */
  static generateLeadAssignmentEmail(leadData, artisanData) {
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
            <h2>Bonjour ${artisanData.company_name || artisanData.name},</h2>
            
            <p>Félicitations ! Le projet suivant vous a été assigné avec succès :</p>
            
            <div class="project-details">
              <h3>📋 Détails du projet</h3>
              <p><strong>Description :</strong> ${leadData.project_description}</p>
              <p><strong>Client :</strong> ${leadData.client_name}</p>
              <p><strong>Localisation :</strong> ${leadData.city}, ${leadData.zip_code}</p>
              <p><strong>Catégories :</strong> ${leadData.project_categories.join(', ')}</p>
            </div>
            
            <p>Vous pouvez maintenant préparer votre devis et le soumettre au client. N'oubliez pas que vous avez un délai pour répondre à ce projet.</p>
            
            <div style="text-align: center;">
              <a href="${window.location.origin}/leads-management" class="button">📝 Préparer le devis</a>
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
  
  // ========================================
  // EMAIL DELIVERY FUNCTIONS
  // ========================================
  
  /**
   * Send quote notification email to client
   */
  static async sendQuoteNotificationEmail(leadData, quoteData, artisanData) {
    try {
      const html = this.generateQuoteNotificationEmail(leadData, quoteData, artisanData);
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [leadData.client_email],
        subject: `Votre devis est prêt - ${leadData.project_description.substring(0, 50)}...`,
        html: html
      });
      
      if (error) {
        console.error('Resend email error:', error);
        // Log failed email
        await this.logEmailInDatabase('quote_notification', leadData.client_email, 'Quote Notification', 'failed', error.message);
        return { success: false, error };
      }
      
      // Log successful email
      await this.logEmailInDatabase('quote_notification', leadData.client_email, 'Quote Notification', 'sent');
      console.log('Quote notification email sent successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send new lead notification email to artisan
   */
  static async sendNewLeadNotificationEmail(leadData, artisanData) {
    try {
      const html = this.generateNewLeadNotificationEmail(leadData, artisanData);
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [artisanData.email],
        subject: `Nouveau projet disponible - ${leadData.project_description.substring(0, 50)}...`,
        html: html
      });
      
      if (error) {
        console.error('Resend email error:', error);
        // Log failed email
        await this.logEmailInDatabase('new_lead_available', artisanData.email, 'New Lead Available', 'failed', error.message);
        return { success: false, error };
      }
      
      // Log successful email
      await this.logEmailInDatabase('new_lead_available', artisanData.email, 'New Lead Available', 'sent');
      console.log('New lead notification email sent successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send lead assignment confirmation email to artisan
   */
  static async sendLeadAssignmentEmail(leadData, artisanData) {
    try {
      const html = this.generateLeadAssignmentEmail(leadData, artisanData);
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [artisanData.email],
        subject: `Projet assigné - ${leadData.project_description.substring(0, 50)}...`,
        html: html
      });
      
      if (error) {
        console.error('Resend email error:', error);
        // Log failed email
        await this.logEmailInDatabase('lead_assigned', artisanData.email, 'Lead Assigned', 'failed', error.message);
        return { success: false, error };
      }
      
      // Log successful email
      await this.logEmailInDatabase('lead_assigned', artisanData.email, 'Lead Assigned', 'sent');
      console.log('Lead assignment email sent successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send welcome email to new clients
   */
  static async sendWelcomeEmail(clientData) {
    try {
      const html = `
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
              <h2>Bonjour ${clientData.name},</h2>
              
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
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [clientData.email],
        subject: 'Bienvenue - Votre projet a été reçu',
        html: html
      });
      
      if (error) {
        console.error('Resend email error:', error);
        // Log failed email
        await this.logEmailInDatabase('welcome_client', clientData.email, 'Welcome Email', 'failed', error.message);
        return { success: false, error };
      }
      
      // Log successful email
      await this.logEmailInDatabase('welcome_client', clientData.email, 'Welcome Email', 'sent');
      console.log('Welcome email sent successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  // ========================================
  // DATABASE LOGGING
  // ========================================

  /**
   * Log email in database for tracking
   */
  static async logEmailInDatabase(templateName, recipientEmail, subject, status, errorMessage = null) {
    try {
      const { error } = await supabase
        .from('email_logs')
        .insert({
          template_name: templateName,
          recipient_email: recipientEmail,
          subject: subject,
          status: status,
          error_message: errorMessage,
          metadata: {
            sent_at: new Date().toISOString(),
            service: 'resend'
          }
        });

      if (error) {
        console.error('Error logging email to database:', error);
      }
    } catch (error) {
      console.error('Error logging email to database:', error);
    }
  }

  /**
   * Get email logs for monitoring
   */
  static async getEmailLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching email logs:', error);
      return { success: false, data: [], error: null };
    }
  }

  /**
   * Get email statistics
   */
  static async getEmailStatistics() {
    try {
      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('status, sent_at');

      if (error) throw error;

      const stats = {
        total: logs?.length || 0,
        sent: logs?.filter(log => log.status === 'sent').length || 0,
        failed: logs?.filter(log => log.status === 'failed').length || 0,
        pending: logs?.filter(log => log.status === 'pending').length || 0
      };

      return { success: true, data: stats, error: null };
    } catch (error) {
      console.error('Error fetching email statistics:', error);
      return { success: false, data: null, error: null };
    }
  }
}

export default EmailService;
