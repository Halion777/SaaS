import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.SITE_URL || window.location.origin;

export class EmailService {
  
  // ========================================
  // EMAIL TEMPLATES
  // ========================================
  
  /**
   * Generate quote notification email template
   */
  static generateQuoteNotificationEmail(leadData, quoteData, artisanData) {
    // Fix the URL to use the correct share link format
    const quoteUrl = `${leadData.site_url || window.location.origin}/quote-share/${quoteData.share_token}`;
    
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
            L'équipe de votre plateforme Haliqo</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
            <p>© ${new Date().getFullYear()} - Plateforme Haliqo</p>
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
            L'équipe de votre plateforme Haliqo</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
            <p>© ${new Date().getFullYear()} - Plateforme Haliqo</p>
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
            L'équipe de votre plateforme Haliqo</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
            <p>© ${new Date().getFullYear()} - Plateforme Haliqo</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  // ========================================
  // EMAIL DELIVERY FUNCTIONS (Edge Function)
  // ========================================
  
  /**
   * Send email using Supabase Edge Function
   */
  static async sendEmailViaEdgeFunction(emailType, emailData) {
    try {
      const { data, error } = await supabase.functions.invoke('send-emails', {
        body: {
          emailType,
          emailData
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send quote notification email to client
   */
  static async sendQuoteNotificationEmail(leadData, quoteData, artisanData) {
    try {
      const emailData = {
        client_email: leadData.client_email,
        project_description: leadData.project_description,
        leadData,
        quoteData,
        artisanData
      };
      
      const result = await this.sendEmailViaEdgeFunction('quote_notification', emailData);
      
      if (result.success) {
        console.log('Quote notification email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send quote notification email:', result.error);
        return result;
      }
      
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
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData
      };
      
      const result = await this.sendEmailViaEdgeFunction('new_lead_available', emailData);
      
      if (result.success) {
        console.log('New lead notification email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send new lead notification email:', result.error);
        return result;
      }
      
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
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData
      };
      
      const result = await this.sendEmailViaEdgeFunction('lead_assigned', emailData);
      
      if (result.success) {
        console.log('Lead assignment email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send lead assignment email:', result.error);
        return result;
      }
      
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
      const emailData = {
        client_email: clientData.email,
        clientData
      };
      
      const result = await this.sendEmailViaEdgeFunction('welcome_client', emailData);
      
      if (result.success) {
        console.log('Welcome email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send welcome email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send quote notification email for manually created quotes
   */
  static async sendQuoteNotificationEmail(clientData, quoteData, artisanData) {
    try {
      const emailData = {
        client_email: clientData.client_email,
        project_description: clientData.project_description,
        clientData,
        quoteData,
        artisanData
      };
      
      const result = await this.sendEmailViaEdgeFunction('quote_notification', emailData);
      
      if (result.success) {
        console.log('Quote notification email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send quote notification email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  // ========================================
  // DATABASE LOGGING
  // ========================================

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
