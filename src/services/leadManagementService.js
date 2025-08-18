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
      const { data, error } = await supabase
        .from('lead_requests')
        .insert({
          project_categories: leadData.categories,
          custom_category: leadData.customCategory || null,
          project_description: leadData.description,
          price_range: leadData.priceRange,
          completion_date: leadData.completionDate,
          
          // Location details
          street_number: leadData.streetNumber,
          full_address: leadData.fullAddress,
          city: 'N/A', // Default value since city field was removed from form
          zip_code: leadData.zipCode,
          country: leadData.country || 'BE',
          region: leadData.region,
          
          // Client information
          client_name: leadData.fullName,
          client_email: leadData.email,
          client_phone: leadData.phone,
          client_address: leadData.clientAddress,
          communication_preferences: leadData.communicationPreferences,
          
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
      } catch (assignmentError) {
        console.error('Failed to auto-assign lead:', assignmentError);
        // Don't fail the lead creation if assignment fails
      }
      
      // Send welcome email to client
      try {
        await EmailService.sendWelcomeEmail({
          name: leadData.fullName,
          email: leadData.email
        });
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
      
      return { success: true, data: data || [], error: null };
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

            // Send email notification
            await EmailService.sendQuoteNotificationEmail(
              leadData,
              { id: data.quote_id, share_token: data.share_token },
              profileData || { name: 'Artisan' }
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
      const uploadedPaths = [];
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
        
        uploadedPaths.push(filePath);
      }
      
      return { success: true, data: uploadedPaths, error: null };
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
