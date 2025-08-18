import { supabase } from './supabaseClient';
import EmailService from './emailService';

// Helper to ensure DB varchar limits are respected
function truncateString(value, max) {
  if (value == null) return value;
  const str = String(value);
  return str.length > max ? str.slice(0, max) : str;
}

/**
 * Generate a unique quote number for the current user
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Generated quote number or error
 */
export async function generateQuoteNumber(userId) {
  try {
    if (!userId) {
      console.error('No userId provided to generateQuoteNumber');
      return { error: 'No userId provided' };
    }
    
    // First, test if we can access the quotes table at all
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Cannot access quotes table:', testError);
      return { error: `Database access error: ${testError.message}` };
    }
    
    // Now try the RPC function
    const { data, error } = await supabase
      .rpc('generate_quote_number', { user_id: userId });
    
    if (error) {
      console.error('Supabase RPC error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error generating quote number:', error);
    return { error };
  }
}

/**
 * Fetch all quotes for the current user
 * @returns {Promise<{data, error}>} Quotes data or error
 */
export async function fetchQuotes() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(id, name, email, phone, address, city, postal_code),
        company_profile:company_profiles(id, company_name, logo_path, address, city, postal_code, phone, email, website, vat_number),
        quote_tasks(
          id, 
          name,
          description, 
          quantity,
          unit,
          unit_price,
          total_price,
          duration,
          duration_unit,
          pricing_type,
          hourly_rate,
          order_index
        ),
        quote_materials(
          id,
          quote_task_id,
          name,
          description,
          quantity,
          unit,
          unit_price,
          total_price,
          order_index
        ),
        quote_files(
          id,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_category,
          uploaded_by,
          created_at
        )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return { error };
  }
}

/**
 * Fetch a single quote by ID
 * @param {string} id - Quote ID
 * @returns {Promise<{data, error}>} Quote data or error
 */
export async function fetchQuoteById(id) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(id, name, email, phone, address, city, postal_code),
        company_profile:company_profiles(
          id, 
          company_name, 
          logo_path, 
          logo_filename,
          logo_size,
          logo_mime_type,
          signature_path,
          signature_filename,
          signature_size,
          signature_mime_type,
          address, 
          city, 
          state,
          postal_code, 
          phone, 
          email, 
          website, 
          vat_number,
          country
        ),
        quote_tasks(
          id, 
          name,
          description, 
          quantity,
          unit,
          unit_price,
          total_price,
          duration,
          duration_unit,
          pricing_type,
          hourly_rate,
          order_index
        ),
        quote_materials(
          id,
          quote_task_id,
          name,
          description,
          quantity,
          unit,
          unit_price,
          total_price,
          order_index
        ),
        quote_files(
          id,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_category,
          uploaded_by,
          created_at
        ),
        quote_signatures(
          id,
          signer_name,
          signer_email,
          signature_type,
          signature_mode,
          signature_file_path,
          signature_filename,
          signature_size,
          signature_mime_type,
          signature_data,
          signed_at,
          created_at
        ),
        quote_financial_configs(
          id,
          vat_config,
          advance_config,
          marketing_banner,
          payment_terms,
          discount_config,
          created_at
        )
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error fetching quote:', error);
    return { error };
  }
}

/**
 * Create a new quote with tasks, materials, and files
 * @param {Object} quoteData - Quote data
 * @returns {Promise<{data, error}>} Created quote or error
 */
export async function createQuote(quoteData) {
  try {
    // Validate required fields
    if (!quoteData.user_id) {
      return { error: { message: 'user_id is required' } };
    }
    if (!quoteData.client_id) {
      return { error: { message: 'client_id is required' } };
    }
    if (!quoteData.quote_number) {
      return { error: { message: 'quote_number is required' } };
    }
    
    // First, create the quote
    const quoteInsertData = {
      user_id: quoteData.user_id,
      profile_id: quoteData.profile_id || null,
      client_id: quoteData.client_id,
      // DB limits: quote_number VARCHAR(50), title TEXT (ok), custom_category VARCHAR(255)
      quote_number: truncateString(quoteData.quote_number, 50),
      title: quoteData.title || 'Nouveau devis',
      description: quoteData.description || '',
      status: quoteData.status || 'draft',
      project_categories: quoteData.project_categories || [],
      custom_category: truncateString(quoteData.custom_category || '', 255),
      start_date: quoteData.start_date || null,
      total_amount: quoteData.total_amount || 0,
      tax_amount: quoteData.tax_amount || 0,
      discount_amount: quoteData.discount_amount || 0,
      final_amount: quoteData.final_amount || quoteData.total_amount || 0,
      valid_until: quoteData.valid_until || null,
      terms_conditions: quoteData.terms_conditions || ''
    };
    
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteInsertData)
      .select()
      .single();
    
    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return { error: quoteError };
    }
    
    // Then create quote tasks if any
    if (quoteData.tasks && quoteData.tasks.length > 0) {
      const tasksWithQuoteId = quoteData.tasks.map((task, index) => ({
        quote_id: quote.id,
        // DB limit: VARCHAR(255)
        name: truncateString(task.name || task.description || '', 255),
        description: task.description,
        quantity: task.quantity || 1,
        // DB limit: VARCHAR(50)
        unit: truncateString(task.unit || 'piece', 50),
        unit_price: task.unit_price || task.price || 0,
        total_price: task.total_price || (task.quantity * (task.unit_price || task.price)) || 0,
        duration: task.duration,
        // DB limit: VARCHAR(20)
        duration_unit: truncateString(task.duration_unit || 'minutes', 20),
        pricing_type: task.pricing_type || 'flat',
        hourly_rate: task.hourly_rate,
        order_index: index
      }));
      
      const { data: tasks, error: tasksError } = await supabase
        .from('quote_tasks')
        .insert(tasksWithQuoteId)
        .select();
      
      if (tasksError) return { error: tasksError };
      
      // Create materials for each task
      for (let i = 0; i < quoteData.tasks.length; i++) {
        const task = quoteData.tasks[i];
        if (task.materials && task.materials.length > 0) {
          const materialsWithTaskId = task.materials.map((material, matIndex) => ({
            quote_id: quote.id,
            quote_task_id: tasks[i].id,
            // DB limit: VARCHAR(255)
            name: truncateString(material.name || '', 255),
            description: material.description,
            quantity: material.quantity || 1,
            // DB limit: VARCHAR(50)
            unit: truncateString(material.unit || 'piece', 50),
            unit_price: material.unit_price || material.price || 0,
            total_price: material.total_price || (material.quantity * (material.unit_price || material.price)) || 0,
            order_index: matIndex
          }));
          
          const { error: materialsError } = await supabase
            .from('quote_materials')
            .insert(materialsWithTaskId);
          
          if (materialsError) console.error('Error creating materials:', materialsError);
        }
      }
    }
    
    // Handle quote files if any
    if (quoteData.files && quoteData.files.length > 0) {
      const filesWithQuoteId = quoteData.files.map((file, index) => ({
        quote_id: quote.id,
        // DB limit: VARCHAR(255)
        file_name: truncateString(file.file_name || file.name || '', 255),
        file_path: file.file_path || file.path || file.url || '',
        file_size: file.file_size || file.size || 0,
        // DB limit: VARCHAR(100)
        mime_type: truncateString(file.mime_type || file.type || '', 100),
        file_category: file.file_category || 'attachment', // Use provided category or default
        uploaded_by: quoteData.profile_id || null
      }));
      
      const { error: filesError } = await supabase
        .from('quote_files')
        .insert(filesWithQuoteId);
      
      if (filesError) console.error('Error creating files:', filesError);
    }
    
    // Note: Financial config is stored directly in the quotes table
    // No separate table needed for this data
    
    // Send quote notification email if this is from a lead
    if (quoteData.lead_id) {
      try {
        // Get lead details
        const { data: leadData } = await supabase
          .from('lead_requests')
          .select('*')
          .eq('id', quoteData.lead_id)
          .single();
        
        if (leadData) {
          // Get artisan profile data
          const { data: profileData } = await supabase
            .from('company_profiles')
            .select('company_name, name')
            .eq('id', quoteData.profile_id)
            .single();

          // Send email notification
          await EmailService.sendQuoteNotificationEmail(
            leadData,
            quote,
            profileData || { name: 'Artisan' }
          );
          
          // Update lead status to indicate quote was sent
          try {
            await supabase.rpc('update_lead_status_on_quote_sent', {
              lead_uuid: quoteData.lead_id,
              artisan_user_uuid: quoteData.user_id
            });
          } catch (statusError) {
            console.error('Failed to update lead status:', statusError);
            // Don't fail the quote creation if status update fails
          }
        }
      } catch (emailError) {
        console.error('Failed to send quote notification email:', emailError);
        // Don't fail the quote creation if email fails
      }
    }
    
    // NEW: Send email notification for manually created quotes with status 'sent'
    if (quoteData.status === 'sent' && quoteData.client_id) {
      try {
        // Get client details
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', quoteData.client_id)
          .single();
        
        if (client?.email) {
          // Get company profile for artisan info
          const { data: companyProfile } = await supabase
            .from('company_profiles')
            .select('company_name, name')
            .eq('id', quoteData.company_profile_id)
            .single();
          
          // Send quote notification email
          const emailResult = await EmailService.sendQuoteNotificationEmail({
            client_email: client.email,
            client_name: client.name,
            project_description: quoteData.description || quoteData.title,
            site_url: window.location.origin
          }, quote, companyProfile || { company_name: 'Your Company', name: 'Artisan' });
          
          if (emailResult.success) {
            console.log('Quote notification email sent successfully');
            
            // Log email sent event to quote_events table (proper way)
            try {
              await supabase
                .from('quote_events')
                .insert({
                  quote_id: quote.id,
                  user_id: null, // System event
                  type: 'email_sent',
                  meta: {
                    email_type: 'quote_notification',
                    recipient: client.email,
                    timestamp: new Date().toISOString()
                  }
                });
            } catch (eventError) {
              console.warn('Failed to log email event:', eventError);
              // Don't fail if this table doesn't exist
            }
          } else {
            console.error('Failed to send quote notification email:', emailResult.error);
          }
        }
      } catch (emailError) {
        console.error('Failed to send quote notification email:', emailError);
        // Don't fail quote creation if email fails
      }
    }
    
    // Return the created quote with all relations
    return await fetchQuoteById(quote.id);
    
  } catch (error) {
    console.error('Error creating quote:', error);
    return { error };
  }
}

/**
 * Update an existing quote
 * @param {string} id - Quote ID
 * @param {Object} quoteData - Updated quote data
 * @returns {Promise<{data, error}>} Updated quote or error
 */
export async function updateQuote(id, quoteData) {
  try {
    // Update the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .update({
        title: quoteData.title,
        description: quoteData.description,
        status: quoteData.status,
        project_categories: quoteData.project_categories,
        custom_category: quoteData.custom_category,
        start_date: quoteData.start_date,
        total_amount: quoteData.total_amount,
        tax_amount: quoteData.tax_amount,
        discount_amount: quoteData.discount_amount,
        final_amount: quoteData.final_amount,
        valid_until: quoteData.valid_until,
        terms_conditions: quoteData.terms_conditions
      })
      .eq('id', id)
      .select()
      .single();
    
    if (quoteError) return { error: quoteError };
    
    // Update tasks if provided
    if (quoteData.tasks !== undefined) {
      // Delete existing tasks
      await supabase.from('quote_tasks').delete().eq('quote_id', id);
      
      // Create new tasks
      if (quoteData.tasks.length > 0) {
        const tasksWithQuoteId = quoteData.tasks.map((task, index) => ({
          quote_id: id,
          name: truncateString(task.name || task.description || '', 255),
          description: task.description,
          quantity: task.quantity || 1,
          unit: truncateString(task.unit || 'piece', 50),
          unit_price: task.unit_price || task.price || 0,
          total_price: task.total_price || (task.quantity * (task.unit_price || task.price)) || 0,
          duration: task.duration,
          duration_unit: truncateString(task.duration_unit || 'minutes', 20),
          pricing_type: task.pricing_type || 'flat',
          hourly_rate: task.hourly_rate,
          order_index: index
        }));
        
        // Insert tasks and return IDs
        const { data: newTasks, error: tasksError } = await supabase
          .from('quote_tasks')
          .insert(tasksWithQuoteId)
          .select();
        if (tasksError) return { error: tasksError };

        // Insert materials nested under each task (if provided)
        for (let i = 0; i < quoteData.tasks.length; i++) {
          const task = quoteData.tasks[i];
          if (task.materials && task.materials.length > 0) {
            const materialsWithTaskId = task.materials.map((material, matIndex) => ({
              quote_id: id,
              quote_task_id: newTasks[i].id,
              name: truncateString(material.name || '', 255),
              description: material.description,
              quantity: material.quantity || 1,
              unit: truncateString(material.unit || 'piece', 50),
              unit_price: material.unit_price || material.price || 0,
              total_price: material.total_price || (material.quantity * (material.unit_price || material.price)) || 0,
              order_index: matIndex
            }));

            const { error: materialsError } = await supabase
              .from('quote_materials')
              .insert(materialsWithTaskId);
            if (materialsError) return { error: materialsError };
          }
        }
      }
    }
    
    // Update materials if provided
    if (quoteData.materials !== undefined) {
      // Delete existing materials
      await supabase.from('quote_materials').delete().eq('quote_id', id);
      
      // Create new materials
      if (quoteData.materials.length > 0) {
        const materialsWithQuoteId = quoteData.materials.map((material, index) => ({
          quote_id: id,
          name: material.name,
          description: material.description,
          quantity: material.quantity || 1,
          unit: material.unit || 'piece',
          unit_price: material.unit_price || material.price || 0,
          total_price: material.total_price || (material.quantity * (material.unit_price || material.price)) || 0,
          order_index: index
        }));
        
        const { error: materialsError } = await supabase
          .from('quote_materials')
          .insert(materialsWithQuoteId);
        
        if (materialsError) return { error: materialsError };
      }
    }
    
    // Update files if provided
    if (quoteData.files !== undefined) {
      // Delete existing files
      await supabase.from('quote_files').delete().eq('quote_id', id);
      
      // Create new files
      if (quoteData.files.length > 0) {
        const filesWithQuoteId = quoteData.files.map((file, index) => ({
          quote_id: id,
          file_name: file.name || file.file_name,
          file_path: file.path || file.file_path,
          file_size: file.size || file.file_size,
          mime_type: file.type || file.mime_type,
          file_category: file.category || file.file_category || 'attachment',
          uploaded_by: quoteData.user_id
        }));
        
        const { error: filesError } = await supabase
          .from('quote_files')
          .insert(filesWithQuoteId);
        
        if (filesError) return { error: filesError };
      }
    }
    
    // Return the updated quote
    return await fetchQuoteById(id);
    
  } catch (error) {
    console.error('Error updating quote:', error);
    return { error };
  }
}

/**
 * Update quote status
 * @param {string} id - Quote ID
 * @param {string} status - New status
 * @returns {Promise<{data, error}>} Updated quote or error
 */
export async function updateQuoteStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating quote status:', error);
    return { error };
  }
}

/**
 * Delete a quote
 * @param {string} id - Quote ID
 * @returns {Promise<{data, error}>} Success or error
 */
export async function deleteQuote(id) {
  try {
    // Delete related records first (CASCADE should handle this, but being explicit)
    await supabase.from('quote_tasks').delete().eq('quote_id', id);
    await supabase.from('quote_materials').delete().eq('quote_id', id);
    await supabase.from('quote_files').delete().eq('quote_id', id);
    await supabase.from('quote_financial_configs').delete().eq('quote_id', id);
    await supabase.from('quote_signatures').delete().eq('quote_id', id);
    await supabase.from('quote_workflow_history').delete().eq('quote_id', id);
    await supabase.from('quote_shares').delete().eq('quote_id', id);
    await supabase.from('quote_access_logs').delete().eq('quote_id', id);
    await supabase.from('quote_tags').delete().eq('quote_id', id);
    
    // Delete the quote
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting quote:', error);
    return { error };
  }
}

/**
 * Get quote statistics for the current user
 * @returns {Promise<{data, error}>} Statistics data or error
 */
export async function getQuoteStatistics() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('status, total_amount, created_at')
      .order('created_at', { ascending: false });
    
    if (error) return { error };
    
    // Calculate statistics
    const stats = {
      total: data.length,
      draft: data.filter(q => q.status === 'draft').length,
      sent: data.filter(q => q.status === 'sent').length,
      accepted: data.filter(q => q.status === 'accepted').length,
      rejected: data.filter(q => q.status === 'rejected').length,
      expired: data.filter(q => q.status === 'expired').length,
      totalAmount: data.reduce((sum, q) => sum + (q.total_amount || 0), 0),
      averageAmount: data.length > 0 ? data.reduce((sum, q) => sum + (q.total_amount || 0), 0) / data.length : 0
    };
    
    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting quote statistics:', error);
    return { error };
  }
}

/**
 * Save quote draft
 * @param {Object} draftData - Draft data
 * @returns {Promise<{data, error}>} Saved draft or error
 */
export async function saveQuoteDraft(draftData) {
  try {
    // If a draft row id is provided, update that row; otherwise insert a new draft
    if (draftData.id) {
      const { data, error } = await supabase
        .from('quote_drafts')
        .update({
          draft_data: draftData.draft_data,
          last_saved: new Date().toISOString()
        })
        .eq('id', draftData.id)
        .select()
        .single();
      return { data, error };
    }
    const { data, error } = await supabase
      .from('quote_drafts')
      .insert({
        user_id: draftData.user_id,
        profile_id: draftData.profile_id,
        draft_data: draftData.draft_data,
        last_saved: new Date().toISOString()
      })
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error saving quote draft:', error);
    return { error };
  }
}

/**
 * Load quote draft for the current user and profile
 * @param {string} userId - User ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<{data, error}>} Draft data or error
 */
export async function loadQuoteDraft(userId, profileId) {
  try {
    let query = supabase
      .from('quote_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('last_saved', { ascending: false })
      .limit(1);
    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }
    const { data, error } = await query.single();
    
    return { data, error };
  } catch (error) {
    console.error('Error loading quote draft:', error);
    return { error };
  }
}

/**
 * Delete quote draft
 * @param {string} userId - User ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<{data, error}>} Success or error
 */
export async function deleteQuoteDraft(userId, profileId) {
  try {
    let query = supabase
      .from('quote_drafts')
      .delete()
      .eq('user_id', userId);
    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }
    const { error } = await query;
    
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting quote draft:', error);
    return { error };
  }
}

/**
 * Delete quote draft by its row id
 * @param {string} draftId - quote_drafts.id
 */
export async function deleteQuoteDraftById(draftId) {
  try {
    const { error } = await supabase
      .from('quote_drafts')
      .delete()
      .eq('id', draftId);
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting quote draft by id:', error);
    return { error };
  }
}
/**
 * Load recent drafts for the current user (any profile)
 * @param {string} userId
 * @param {number} limit
 */
export async function loadRecentQuoteDrafts(userId, limit = 3) {
  try {
    const { data, error } = await supabase
      .from('quote_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('last_saved', { ascending: false })
      .limit(limit);
    return { data, error };
  } catch (error) {
    console.error('Error loading recent quote drafts:', error);
    return { error };
  }
}

/**
 * List all drafts for a user (optionally scoped to a profile)
 * @param {string} userId
 * @param {string|null} profileId
 */
export async function listQuoteDrafts(userId, profileId = null) {
  try {
    let query = supabase
      .from('quote_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('last_saved', { ascending: false });
    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }
    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    console.error('Error listing quote drafts:', error);
    return { error };
  }
}
