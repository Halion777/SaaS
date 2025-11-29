import { supabase } from './supabaseClient';
import EmailService from './emailService';

export class LeadManagementService {
  
  // ========================================
  // LEAD REQUESTS (from Find Artisan form)
  // ========================================
  
  /**
   * Create a new lead request from the Find Artisan form
   */
  static async createLeadRequest(leadData) {
    try {
      // Handle empty date strings - convert to null
      const completionDate = leadData.completionDate && leadData.completionDate.trim() !== '' 
        ? leadData.completionDate 
        : null;
      
      const { data, error } = await supabase
        .from('lead_requests')
        .insert({
          project_categories: leadData.categories,
          custom_category: leadData.customCategory || null,
          project_description: leadData.description,
          price_range: leadData.priceRange || null,
          completion_date: completionDate,
          
          // Location details
          street_number: leadData.streetNumber || null,
          full_address: leadData.fullAddress || null,
          city: leadData.city || null,
          zip_code: leadData.zipCode || null,
          country: leadData.country || 'BE',
          region: leadData.region || null,
          
          // Client information
          client_name: leadData.fullName,
          client_email: leadData.email,
          client_phone: leadData.phone || null,
          client_address: leadData.clientAddress || null,
          communication_preferences: {
            ...leadData.communicationPreferences,
            language_preference: leadData.languagePreference || 'fr'
          },
          
          // Project files
          project_images: leadData.projectImages || [],
          
          // Status
          status: 'active',
          is_public: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Automatically assign lead to matching artisans
      try {
        await supabase.rpc('auto_assign_lead_to_artisans', {
          lead_uuid: data.id
        });
        
        // After assignment, send notification emails to assigned artisans
        await this.sendLeadNotificationEmails(data);
        
      } catch (assignmentError) {
        console.error('Failed to auto-assign lead:', assignmentError);
        // Don't fail the lead creation if assignment fails
      }
      
      // Send welcome email to client using new template system
      try {
        const clientLanguage = leadData.languagePreference || leadData.communicationPreferences?.language_preference || 'fr';
        await EmailService.sendWelcomeEmail({
          name: leadData.fullName,
          email: leadData.email,
          language_preference: clientLanguage
        }, null, null); // No userId needed for non-authenticated clients
        console.log('Welcome email sent successfully to:', leadData.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the lead creation if email fails
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error creating lead request:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Get lead request by ID
   */
  static async getLeadRequest(leadId) {
    try {
      const { data, error } = await supabase
        .from('lead_requests')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error fetching lead request:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Send lead notification emails to all assigned artisans
   * This is called after a lead is created and assigned
   */
  static async sendLeadNotificationEmails(leadData) {
    try {
      // Get all artisans assigned to this lead
      const { data: assignments, error: assignmentError } = await supabase
        .from('lead_assignments')
        .select(`
          artisan_user_id,
          users:artisan_user_id (
            id,
            email,
            first_name,
            last_name,
            full_name,
            language_preference
          )
        `)
        .eq('lead_id', leadData.id);

      if (assignmentError) {
        console.error('Error fetching lead assignments for email:', assignmentError);
        return { success: false, error: assignmentError };
      }

      if (!assignments || assignments.length === 0) {
        console.log('No artisans assigned to lead, skipping email notifications');
        return { success: true, message: 'No artisans to notify' };
      }

      // Get artisan profiles for company names
      const artisanUserIds = assignments.map(a => a.artisan_user_id);
      const { data: profiles } = await supabase
        .from('artisan_lead_preferences')
        .select('user_id, email_notifications')
        .in('user_id', artisanUserIds);

      // Create a map for quick lookup
      const profileMap = {};
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = p;
        });
      }

      // Get artisan company names from user_profiles
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, company_name')
        .in('user_id', artisanUserIds);

      const companyNameMap = {};
      if (userProfiles) {
        userProfiles.forEach(p => {
          companyNameMap[p.user_id] = p.company_name;
        });
      }

      // Send email to each assigned artisan who has email notifications enabled
      const emailPromises = [];
      
      for (const assignment of assignments) {
        const user = assignment.users;
        if (!user || !user.email) continue;

        // Check if artisan has email notifications enabled
        const prefs = profileMap[assignment.artisan_user_id];
        if (prefs && prefs.email_notifications === false) {
          console.log(`Skipping email for user ${user.email} - notifications disabled`);
          continue;
        }

        const artisanName = user.full_name || 
                           (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                           user.first_name || 
                           'Artisan';
        
        const companyName = companyNameMap[assignment.artisan_user_id] || artisanName;
        const language = user.language_preference || 'fr';

        // Prepare lead data for email
        const emailLeadData = {
          id: leadData.id,
          project_description: leadData.project_description,
          city: leadData.city,
          zip_code: leadData.zip_code,
          client_name: leadData.client_name,
          site_url: typeof window !== 'undefined' ? window.location.origin : 'https://app.haliqo.com'
        };

        const artisanData = {
          email: user.email,
          name: artisanName,
          company_name: companyName,
          user_id: assignment.artisan_user_id
        };

        console.log(`Sending lead notification email to ${user.email} for lead ${leadData.id}`);
        
        // Use the existing email service function
        emailPromises.push(
          EmailService.sendNewLeadNotificationEmail(emailLeadData, artisanData, language)
            .then(result => {
              if (result.success) {
                console.log(`✅ Lead notification email sent successfully to ${user.email}`);
              } else {
                console.error(`❌ Failed to send lead email to ${user.email}:`, result.error);
              }
              return result;
            })
            .catch(err => {
              console.error(`❌ Error sending lead email to ${user.email}:`, err);
              return { success: false, error: err };
            })
        );
      }

      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      console.log(`Lead notification emails: ${successCount} sent, ${failCount} failed`);

      return { 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: results.length 
      };

    } catch (error) {
      console.error('Error sending lead notification emails:', error);
      return { success: false, error };
    }
  }
  
  // ========================================
  // ARTISAN LEAD PREFERENCES
  // ========================================
  
  /**
   * Get or create artisan lead preferences for current user
   */
  static async getArtisanPreferences(userId) {
    try {
      let { data, error } = await supabase
        .from('artisan_lead_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No preferences found, create default ones
        // Try to get user's profile_id first
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        const { data: newPrefs, error: createError } = await supabase
          .from('artisan_lead_preferences')
          .insert({
            user_id: userId,
            profile_id: profileData?.id || null,
            receive_leads: false,
            intervention_radius: 20,
            work_categories: {},
            email_notifications: true
          })
          .select()
          .single();
        
        if (createError) throw createError;
        data = newPrefs;
      } else if (error) {
        throw error;
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error getting artisan preferences:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Update artisan lead preferences
   */
  static async updateArtisanPreferences(userId, preferences) {
    try {
      // Get current preferences to preserve profile_id
      const { data: currentPrefs } = await supabase
        .from('artisan_lead_preferences')
        .select('profile_id')
        .eq('user_id', userId)
        .single();
      
      const { data, error } = await supabase
        .from('artisan_lead_preferences')
        .upsert({
          user_id: userId,
          profile_id: currentPrefs?.profile_id || null,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error updating artisan preferences:', error);
      return { success: false, data: null, error };
    }
  }
  
  // ========================================
  // LEAD ASSIGNMENTS & MATCHING
  // ========================================
  
  /**
   * Get leads for current artisan based on preferences
   */
  static async getLeadsForArtisan(userId, limit = 50) {
    try {
      // Use the database function we created
      const { data, error } = await supabase
        .rpc('get_leads_for_artisan', {
          artisan_user_uuid: userId,
          limit_count: limit
        });
      
      if (error) throw error;
      
      // Add public URLs for project images (now they're already URLs)
      const leadsWithImageUrls = (data || []).map(lead => ({
        ...lead,
        project_images: lead.project_images?.map(imageUrl => ({
          path: imageUrl, // Keep path for backward compatibility
          url: imageUrl   // URL is now the same as the stored value
        })) || []
      }));
      
      return { success: true, data: leadsWithImageUrls, error: null };
    } catch (error) {
      console.error('Error fetching leads for artisan:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get lead details for quote creation
   */
  static async getLeadDetailsForQuote(leadId) {
    try {
      const { data, error } = await supabase
        .rpc('get_lead_details_for_quote_creation', {
          lead_uuid: leadId
        });
      
      if (error) throw error;
      
      return { success: true, data: data[0] || null, error: null };
    } catch (error) {
      console.error('Error fetching lead details for quote:', error);
      return { success: false, data: null, error };
    }
  }
  
  // ========================================
  // LEAD QUOTES
  // ========================================
  
  /**
   * Create quote from lead data
   */
  static async createQuoteFromLead(leadId, userId, profileId, quoteData) {
    try {
      const { data, error } = await supabase
        .rpc('create_quote_from_lead', {
          lead_uuid: leadId,
          artisan_user_uuid: userId,
          artisan_profile_uuid: profileId,
          quote_data: quoteData
        });
      
      if (error) throw error;
      
      // Send quote notification email to client
      if (data && data.quote_id) {
        try {
          // Get lead details for email
          const leadDetails = await this.getLeadDetailsForQuote(leadId);
          if (leadDetails.success && leadDetails.data) {
            const leadData = leadDetails.data;
            
            // Get artisan profile data
            const { data: profileData } = await supabase
              .from('company_profiles')
              .select('company_name, name')
              .eq('id', profileId)
              .single();

            // Send email notification using new template system
            await EmailService.sendQuoteSentEmail(
              { id: data.quote_id, share_token: data.share_token, quote_number: `Q-${Date.now()}`, title: leadData.project_description, total_with_tax: 0 },
              { name: leadData.client_name, email: leadData.client_email },
              profileData,
              userId
            );
          }
        } catch (emailError) {
          console.error('Failed to send quote notification email:', emailError);
          // Don't fail the quote creation if email fails
        }
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error creating quote from lead:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Get lead quotes for artisan
   */
  static async getLeadQuotes(userId) {
    try {
      const { data, error } = await supabase
        .from('lead_quotes')
        .select(`
          *,
          lead_requests (
            id,
            project_description,
            client_name,
            city,
            zip_code
          )
        `)
        .eq('artisan_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching lead quotes:', error);
      return { success: false, data: [], error };
    }
  }
  
  // ========================================
  // FILE MANAGEMENT
  // ========================================
  
  /**
   * Upload project files to Supabase Storage
   */
  static async uploadProjectFiles(files, leadId = null) {
    try {
      const uploadedFiles = [];
      const bucketName = 'lead-files';
      
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = leadId 
          ? `${leadId}/${fileName}`
          : `temp-upload/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);
        
        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          continue;
        }
        
        // Generate public URL for the uploaded file
        const publicUrl = this.getFilePublicUrl(filePath);
        
        uploadedFiles.push({
          path: filePath,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        });
      }
      
      return { success: true, data: uploadedFiles, error: null };
    } catch (error) {
      console.error('Error uploading project files:', error);
      return { success: false, data: [], error };
    }
  }
  
  /**
   * Get public URL for a file
   */
  static getFilePublicUrl(filePath) {
    const { data } = supabase.storage
      .from('lead-files')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
  
  /**
   * Delete project files
   */
  static async deleteProjectFiles(filePaths) {
    try {
      const { data, error } = await supabase.storage
        .from('lead-files')
        .remove(filePaths);
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error deleting project files:', error);
      return { success: false, data: null, error };
    }
  }
  
  // ========================================
  // LEAD STATISTICS
  // ========================================
  
  /**
   * Get lead statistics for artisan
   */
  static async getLeadStatistics(userId) {
    try {
      // Get total leads assigned
      const { data: assignedLeads, error: assignedError } = await supabase
        .from('lead_assignments')
        .select('id')
        .eq('artisan_user_id', userId);
      
      if (assignedError) throw assignedError;
      
      // Get total quotes sent
      const { data: quotes, error: quotesError } = await supabase
        .from('lead_quotes')
        .select('id')
        .eq('artisan_user_id', userId);
      
      if (quotesError) throw quotesError;
      
      // Get active leads
      const { data: activeLeads, error: activeError } = await supabase
        .from('lead_assignments')
        .select('id')
        .eq('artisan_user_id', userId)
        .eq('status', 'assigned');
      
      if (activeError) throw activeError;
      
      const stats = {
        totalAssigned: assignedLeads?.length || 0,
        totalQuotes: quotes?.length || 0,
        activeLeads: activeLeads?.length || 0,
        responseRate: assignedLeads?.length > 0 
          ? Math.round((quotes?.length / assignedLeads?.length) * 100)
          : 0
      };
      
      return { success: true, data: stats, error: null };
    } catch (error) {
      console.error('Error fetching lead statistics:', error);
      return { success: false, data: null, error };
    }
  }
  
  // ========================================
  // SPAM REPORTING
  // ========================================
  
  /**
   * Report a lead as spam
   */
  static async reportLeadAsSpam(leadId, userId, reason, reportType = 'spam', additionalDetails = null) {
    try {
      const { data, error } = await supabase
        .rpc('report_lead_as_spam', {
          lead_uuid: leadId,
          reporter_user_uuid: userId,
          spam_reason_text: reason,
          report_type_text: reportType,
          additional_details_text: additionalDetails
        });
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error reporting lead as spam:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Get spam reports for superadmin
   */
  static async getSpamReports(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .rpc('get_spam_reports', {
          limit_count: limit,
          offset_count: offset
        });
      
      if (error) throw error;
      
      return { success: true, data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching spam reports:', error);
      return { success: false, data: [], error };
    }
  }
  
  /**
   * Review spam report (superadmin action)
   */
  static async reviewSpamReport(leadId, reviewerId, reviewStatus, reviewNotes = null) {
    try {
      const { data, error } = await supabase
        .rpc('review_spam_report', {
          lead_uuid: leadId,
          reviewer_user_uuid: reviewerId,
          review_status_text: reviewStatus,
          review_notes_text: reviewNotes
        });
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error reviewing spam report:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Delete lead (superadmin action)
   */
  static async deleteLead(leadId) {
    try {
      const { error } = await supabase
        .from('lead_requests')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      
      return { success: true, data: null, error: null };
    } catch (error) {
      console.error('Error deleting lead:', error);
      return { success: false, data: null, error };
    }
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================
  
  /**
   * Get lead notifications for artisan
   */
  static async getLeadNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('lead_notifications')
        .select(`
          *,
          lead_requests (
            id,
            project_description,
            client_name
          )
        `)
        .eq('artisan_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return { success: true, data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching lead notifications:', error);
      return { success: false, data: [], error };
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('lead_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, data: null, error };
    }
  }
}

export default LeadManagementService;
