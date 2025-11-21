import { supabase } from './supabaseClient';
import EmailService from './emailService';
import QuoteTrackingService from './quoteTrackingService';

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
 * Get quote tracking data for enhanced status display
 */
export async function getQuoteTrackingData(quoteId) {
  try {
    return await QuoteTrackingService.getQuoteTrackingData(quoteId);
  } catch (error) {
    console.error('Error getting quote tracking data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save or update financial config for a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} financialConfig - Financial configuration object
 * @returns {Promise<{data, error}>} Saved config or error
 */
export async function saveFinancialConfig(quoteId, financialConfig) {
  try {
    if (!quoteId) {
      return { error: { message: 'quoteId is required' } };
    }

    // Check if financial config already exists
    const { data: existingConfig } = await supabase
      .from('quote_financial_configs')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();

    const configData = {
      quote_id: quoteId,
      vat_config: financialConfig.vatConfig || null,
      advance_config: financialConfig.advanceConfig || null,
      marketing_banner: financialConfig.marketingBannerConfig || null,
      payment_terms: financialConfig.paymentTerms || null,
      discount_config: financialConfig.discountConfig || null,
      show_material_prices: financialConfig.showMaterialPrices ?? false
    };

    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('quote_financial_configs')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();
      return { data, error };
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('quote_financial_configs')
        .insert(configData)
        .select()
        .single();
      return { data, error };
    }
  } catch (error) {
    console.error('Error saving financial config:', error);
    return { error };
  }
}

/**
 * Fetch all quotes for the current user
 * @returns {Promise<{data, error}>} Quotes data or error
 */
export async function fetchQuotes(userId) {
  try {
    if (!userId) {
      console.error('No userId provided to fetchQuotes');
      return { error: 'No userId provided' };
    }
    
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
        ),
        quote_financial_configs(
          id,
          vat_config,
          advance_config,
          marketing_banner,
          payment_terms,
          discount_config,
          show_material_prices,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return { data, error };

    // Enhance quotes with tracking data
    const enhancedQuotes = await Promise.all(
      data.map(async (quote) => {
        try {
          // Get tracking data for each quote
          const trackingResult = await getQuoteTrackingData(quote.id);
          if (trackingResult.success) {
            return {
              ...quote,
              trackingData: trackingResult.data.trackingData
            };
          }
          return quote;
        } catch (trackingError) {
          console.warn(`Error getting tracking data for quote ${quote.id}:`, trackingError);
          return quote;
        }
      })
    );
    
    return { data: enhancedQuotes, error };
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
          show_material_prices,
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
    
    
    // Generate unique share token for the quote
    const shareToken = `qt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // First, create the quote
    
    const quoteInsertData = {
      user_id: quoteData.user_id,
      profile_id: quoteData.profile_id || null,
      client_id: quoteData.client_id,
      // DB limits: quote_number VARCHAR(50), title TEXT (ok), custom_category VARCHAR(255)
      quote_number: truncateString(quoteData.quote_number, 50),
      title: quoteData.title || 'Nouveau devis',
      description: quoteData.description || '',
      status: quoteData.status,
      project_categories: quoteData.project_categories || [],
      custom_category: truncateString(quoteData.custom_category || '', 255),
      start_date: quoteData.start_date || new Date().toISOString().split('T')[0],
      total_amount: quoteData.total_amount || 0,
      tax_amount: quoteData.tax_amount || 0,
      discount_amount: quoteData.discount_amount || 0,
      final_amount: quoteData.final_amount || quoteData.total_amount || 0,
      valid_until: quoteData.valid_until || null,
      terms_conditions: quoteData.terms_conditions || '',
      sent_at: quoteData.status === 'sent' ? new Date().toISOString() : null,
      share_token: shareToken,
      is_public: quoteData.status === 'sent'
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
    
    // Create financial config if provided
    if (quoteData.financialConfig || quoteData.advance_payment_amount > 0) {
      try {
        const financialConfigData = {
          quote_id: quote.id,
          vat_config: quoteData.financialConfig?.vatConfig || quoteData.vat_config || null,
          advance_config: quoteData.advance_payment_amount > 0 ? {
            enabled: true,
            amount: quoteData.advance_payment_amount
          } : (quoteData.financialConfig?.advanceConfig || null),
          marketing_banner: quoteData.financialConfig?.marketingBannerConfig || quoteData.marketing_banner || null,
          payment_terms: quoteData.financialConfig?.paymentTerms || quoteData.payment_terms || null,
          discount_config: quoteData.financialConfig?.discountConfig || quoteData.discount_config || null,
          show_material_prices: quoteData.financialConfig?.showMaterialPrices ?? quoteData.financialConfig?.materialPriceDisplay ?? false
        };
        
        await supabase
          .from('quote_financial_configs')
          .insert(financialConfigData);
      } catch (financialConfigError) {
        console.error('Error saving financial config:', financialConfigError);
        // Continue with quote creation even if financial config save fails
      }
    }

    // Create quote_shares record for tracking
    if (quoteData.status === 'sent') {
      const { error: sharesError } = await supabase
        .from('quote_shares')
        .insert({
          quote_id: quote.id,
          share_token: shareToken,
          access_count: 0,
          is_active: true
        });
      
      if (sharesError) {
        console.error('Error creating quote_shares record:', sharesError);
        // Don't fail quote creation if shares tracking fails
      }
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
    
    // Flag to prevent double email sending
    let emailSent = false;
    
    // Send quote notification email if this is from a lead
    if (quoteData.lead_id && !emailSent) {
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

          // Send email notification using new template system
          const emailResult = await EmailService.sendQuoteSentEmail(
            quote,
            { name: leadData.client_name, email: leadData.client_email },
            profileData,
            quoteData.user_id
          );
          
          // Mark email as sent to prevent double sending
          if (emailResult?.success) {
            emailSent = true;
          }
          
                     // Follow-ups are now created by edge functions, not database triggers
          // The followups-scheduler edge function will handle this automatically
          
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
    
    // REMOVED: Duplicate email sending for manually created quotes
    // Email is now handled by the quote creation page directly
    // This prevents duplicate emails and duplicate event logging
    
    // Trigger edge function to create follow-ups
    await triggerFollowUpCreation(quote.id, quote.status);
    
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
    
    // Update financial config if provided
    if (quoteData.financialConfig || quoteData.advance_payment_amount > 0) {
      try {
        const financialConfigData = {
          vat_config: quoteData.financialConfig?.vatConfig || quoteData.vat_config || null,
          advance_config: quoteData.advance_payment_amount > 0 ? {
            enabled: true,
            amount: quoteData.advance_payment_amount
          } : (quoteData.financialConfig?.advanceConfig || null),
          marketing_banner: quoteData.financialConfig?.marketingBannerConfig || quoteData.marketing_banner || null,
          payment_terms: quoteData.financialConfig?.paymentTerms || quoteData.payment_terms || null,
          discount_config: quoteData.financialConfig?.discountConfig || quoteData.discount_config || null,
          show_material_prices: quoteData.financialConfig?.showMaterialPrices ?? quoteData.financialConfig?.materialPriceDisplay ?? null
        };

        // First, check if a financial config already exists for this quote
        const { data: existingConfig } = await supabase
          .from('quote_financial_configs')
          .select('id')
          .eq('quote_id', id)
          .maybeSingle();
        
        if (existingConfig) {
          // Update existing financial config (only update non-null fields)
          const updateData = {};
          Object.keys(financialConfigData).forEach(key => {
            if (financialConfigData[key] !== null && financialConfigData[key] !== undefined) {
              updateData[key] = financialConfigData[key];
            }
          });
          
          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('quote_financial_configs')
              .update(updateData)
              .eq('id', existingConfig.id);
          }
        } else {
          // Create new financial config
          await supabase
            .from('quote_financial_configs')
            .insert({
              quote_id: id,
              ...financialConfigData
            });
        }
      } catch (financialConfigError) {
        console.error('Error saving financial config:', financialConfigError);
        // Continue with quote update even if financial config save fails
      }
    }
    
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
    
    // Check if the quote was already in 'sent' status before triggering follow-ups
    try {
      // Get the current quote status from the database and client info
      const { data: currentQuote } = await supabase
        .from('quotes')
        .select(`
          status,
          client:clients(id, name, email, phone, address, city, postal_code),
          company_profile:company_profiles(id, company_name, logo_path, address, city, postal_code, phone, email, website, vat_number)
        `)
        .eq('id', id)
        .single();
      
      // Only trigger follow-ups if the status is changing from non-sent to sent
      if (quoteData.status === 'sent' && (!currentQuote || currentQuote.status !== 'sent')) {
        console.log('Creating follow-ups for quote that was not previously sent');
        await triggerFollowUpCreation(id, quoteData.status);
      } else if (quoteData.status === 'sent' && currentQuote && currentQuote.status === 'sent') {
        console.log('Skipping follow-up creation for quote that was already sent');
        
        // For quotes that are already in 'sent' status, send an update email
        if (currentQuote && currentQuote.client && currentQuote.client.email) {
          try {
            // Get the updated quote with all necessary data
            const { data: updatedQuote } = await supabase
              .from('quotes')
              .select(`
                *,
                client:clients(id, name, email, phone, address, city, postal_code),
                company_profile:company_profiles(id, company_name, logo_path, address, city, postal_code, phone, email, website, vat_number)
              `)
              .eq('id', id)
              .single();
              
            if (updatedQuote) {
              // Send email notification about the updated quote
              // Use the custom email data if provided, otherwise use default
              const emailResult = await EmailService.sendQuoteSentEmail(
                updatedQuote,
                updatedQuote.client,
                updatedQuote.company_profile,
                quoteData.user_id,
                quoteData.emailData // Use the email data passed from the quote creation page
              );
              
              if (emailResult?.success) {
               
                // Update sent_at timestamp when email is sent
                await supabase
                  .from('quotes')
                  .update({ sent_at: new Date().toISOString() })
                  .eq('id', id);
                  
                // Log email sent event to quote_events table
                await supabase
                  .from('quote_events')
                  .insert({
                    quote_id: id,
                    event_type: 'email_sent',
                    event_data: {
                      email_type: 'quote_update',
                      recipient: updatedQuote.client.email
                    }
                  });
              } else {
                console.error('Failed to send update email for quote:', emailResult?.error);
              }
            }
          } catch (emailError) {
            console.error('Error sending update email for quote:', emailError);
            // Don't fail the quote update if email fails
          }
        }
      }
    } catch (statusError) {
      console.error('Error checking quote status:', statusError);
      // If there's an error, don't create follow-ups to be safe
    }
    
    // Follow-ups are now created by edge functions, not database triggers
    // The followups-scheduler edge function will handle this automatically
    
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
    // First, update the status
    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return { data, error };
    }
    
    // If status was successfully updated to 'sent', also update sent_at, is_public flag, and trigger follow-up creation
    if (status === 'sent' && data) {
      try {
        // Update sent_at timestamp and is_public flag
        await supabase
          .from('quotes')
          .update({ 
            sent_at: new Date().toISOString(),
            is_public: true  // Set is_public to true so the quote can be accessed via share token
          })
          .eq('id', id);
        
        // Trigger follow-up creation for quotes marked as sent
        await triggerFollowUpCreation(id, status);
        
      } catch (sentAtError) {
        console.warn('Failed to update sent_at timestamp:', sentAtError);
        // Don't fail the main operation if sent_at update fails
      }
    }
    
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
    // Note: quote_workflow_history table removed - no longer needed
    await supabase.from('quote_shares').delete().eq('quote_id', id);
    await supabase.from('quote_access_logs').delete().eq('quote_id', id);
    
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
    // If a draft row id is provided, update that row
    if (draftData.id) {
      const { data, error } = await supabase
        .from('quote_drafts')
        .update({
          draft_data: draftData.draft_data,
          quote_number: draftData.quote_number, // Use dedicated column
          last_saved: new Date().toISOString()
        })
        .eq('id', draftData.id)
        .select()
        .maybeSingle(); // Use maybeSingle() in case draft doesn't exist
      
      // If update succeeded and returned data, return it
      if (data && !error) {
        return { data, error };
      }
      // If draft doesn't exist (data is null and no error) or there's a different error,
      // fall through to insert/upsert logic below
      if (error && error.code !== 'PGRST116') {
        // If it's a different error, return it
        return { data, error };
      }
      // Otherwise, continue to insert/upsert logic (draft doesn't exist)
    }
    
    // Check if we have a quote number for UPSERT logic
    if (draftData.quote_number) {
      // Try to find existing draft with same quote number and user
      let query = supabase
        .from('quote_drafts')
        .select('id')
        .eq('user_id', draftData.user_id)
        .eq('quote_number', draftData.quote_number); // Direct column query - much faster!
      
      // Handle profile_id null matching correctly
      if (draftData.profile_id) {
        query = query.eq('profile_id', draftData.profile_id);
      } else {
        query = query.is('profile_id', null);
      }
      
      const { data: existingDraft, error: findError } = await query.maybeSingle();
      
      if (existingDraft && !findError) {
        // Update existing draft
        const { data, error } = await supabase
          .from('quote_drafts')
          .update({
            draft_data: draftData.draft_data,
            quote_number: draftData.quote_number, // Use dedicated column
            last_saved: new Date().toISOString()
          })
          .eq('id', existingDraft.id)
          .select()
          .maybeSingle(); // Use maybeSingle() in case update fails
        return { data, error };
      }
    }
    
    // Insert new draft
    const { data, error } = await supabase
      .from('quote_drafts')
      .insert({
        user_id: draftData.user_id,
        profile_id: draftData.profile_id || null,
        quote_number: draftData.quote_number || null, // Use dedicated column
        draft_data: draftData.draft_data,
        last_saved: new Date().toISOString()
      })
      .select()
      .single(); // Insert should always return exactly one row
    
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
    const { data, error } = await query;
    
    // Return the first result if multiple exist, or null if none
    return { data: data?.[0] || null, error };
  } catch (error) {
    console.error('Error loading quote draft:', error);
    return { error };
  }
 }

/**
 * Load quote draft by quote number for the current user and profile
 * @param {string} userId - User ID
 * @param {string} profileId - Profile ID
 * @param {string} quoteNumber - Quote number to search for
 * @returns {Promise<{data, error}>} Draft data or error
 */
export async function loadQuoteDraftByQuoteNumber(userId, profileId, quoteNumber) {
  try {
    if (!quoteNumber) {
      return { error: 'No quote number provided' };
    }
    
    let query = supabase
      .from('quote_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('quote_number', quoteNumber); // Direct column query - much faster!
    
    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }
    
    const { data, error } = await query.single();
    return { data, error };
  } catch (error) {
    console.error('Error loading quote draft by quote number:', error);
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
 * Delete quote draft by quote number for the current user and profile
 * @param {string} userId - User ID
 * @param {string} profileId - Profile ID
 * @param {string} quoteNumber - Quote number to delete
 * @returns {Promise<{success, error}>} Success or error
 */
export async function deleteQuoteDraftByQuoteNumber(userId, profileId, quoteNumber) {
  try {
    if (!quoteNumber) {
      return { error: 'No quote number provided' };
    }
    
    let query = supabase
      .from('quote_drafts')
      .delete()
      .eq('user_id', userId)
      .eq('quote_number', quoteNumber); // Direct column query - much faster!
    
    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else {
      query = query.is('profile_id', null);
    }
    
    const { error } = await query;
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting quote draft by quote number:', error);
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

/**
 * Trigger edge function to create follow-ups for a quote
 * If follow-ups already exist, they will be replaced with new ones
 */
async function triggerFollowUpCreation(quoteId, quoteStatus) {
  try {
    if (quoteStatus === 'sent') {
      // Check if there are already follow-ups for this quote
      const { data: existingFollowUps } = await supabase
        .from('quote_follow_ups')
        .select('id, status')
        .eq('quote_id', quoteId)
        .in('status', ['pending', 'scheduled'])
        .order('created_at', { ascending: false });
      
      if (existingFollowUps && existingFollowUps.length > 0) {
       
        // First, mark all existing follow-ups as stopped
        for (const followUp of existingFollowUps) {
          await supabase
            .from('quote_follow_ups')
            .update({
              status: 'stopped',
              updated_at: new Date().toISOString(),
              meta: {
                stopped_reason: 'replaced_with_new_followup',
                stopped_at: new Date().toISOString(),
                reason: 'quote_status_change_to_sent'
              }
            })
            .eq('id', followUp.id);
        }
      }
      
      // Call followups-scheduler to create initial follow-up
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'create_followup_for_quote',
          quote_id: quoteId,
          status: quoteStatus,
          replace_existing: true
        })
      });
      
 
    }
  } catch (error) {
    console.warn('Error triggering follow-up creation:', error);
    // Don't fail quote creation if follow-up trigger fails
  }
}

/**
 * Handle follow-ups when a quote status becomes "viewed"
 * This is called when a client views a quote from an email link
 * If follow-ups already exist, they will be replaced with new ones
 */
export async function handleQuoteViewedFollowUps(quoteId) {
  try {
    // Check if there are already follow-ups for this quote
    const { data: existingFollowUps } = await supabase
      .from('quote_follow_ups')
      .select('id, status')
      .eq('quote_id', quoteId)
      .in('status', ['pending', 'scheduled'])
      .order('created_at', { ascending: false });
    
    if (existingFollowUps && existingFollowUps.length > 0) {
    
      // First, mark all existing follow-ups as stopped
      for (const followUp of existingFollowUps) {
        await supabase
          .from('quote_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'replaced_with_new_followup',
              stopped_at: new Date().toISOString(),
              reason: 'quote_viewed_status_change'
            }
          })
          .eq('id', followUp.id);
      }
      
      // Call the edge function to create a new follow-up for the viewed quote
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'mark_quote_viewed',
          quote_id: quoteId,
          replace_existing: true
        })
      });
      
      return { success: true, message: 'Replaced existing follow-ups with new ones' };
    }
    
    // If no existing follow-ups, let the normal flow create a new one
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'mark_quote_viewed',
        quote_id: quoteId
      })
    });
    
    return { success: true, message: 'Created new follow-up for viewed quote' };
  } catch (error) {
    console.warn('Error handling follow-ups for viewed quote:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process quote expirations
 * Checks if quotes with valid_until dates have expired and updates their status
 * @param {string} userId - Optional user ID to process expirations for a specific user only
 * @returns {Promise<{success, data, error}>} Result of the operation
 */
export async function processQuoteExpirations(userId = null) {
  try {
    // Build the query to get quotes that might be expired
    let query = supabase
      .from('quotes')
      .select('id, quote_number, status, valid_until')
      .in('status', ['sent', 'viewed', 'draft']);
    
    // If userId is provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Get quotes to check for expiration
    const { data: allQuotes, error: allError } = await query;

    if (allError) {
      console.error('Error fetching quotes for expiration check:', allError);
      return { success: false, error: allError };
    }
    
    // Filter quotes manually to ensure correct date comparison
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiredQuotes = allQuotes?.filter(quote => {
      if (!quote.valid_until) return false;
      
      // Parse the valid_until date - handle both date-only and full ISO formats
      let validUntilDate;
      if (quote.valid_until.includes('T')) {
        // Full ISO date
        validUntilDate = new Date(quote.valid_until);
      } else {
        // Date-only format (YYYY-MM-DD)
        const [year, month, day] = quote.valid_until.split('-').map(Number);
        validUntilDate = new Date(year, month - 1, day); // Month is 0-based in JS
      }
      
      // Compare with current date (ignoring time for date-only values)
      return validUntilDate < today && ['sent', 'viewed', 'draft'].includes(quote.status);
    }) || [];

    // Process each expired quote
    const results = [];
    for (const quote of expiredQuotes) {
      try {
        // Update quote status to 'expired' in the database
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ 
            status: 'expired', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', quote.id);

        if (updateError) {
          console.error(`Error updating quote ${quote.quote_number} status to expired:`, updateError);
          results.push({ 
            quote_id: quote.id, 
            quote_number: quote.quote_number, 
            success: false, 
            error: updateError 
          });
          continue;
        }

        // Stop any pending follow-ups for this expired quote
        const { error: followUpError } = await supabase
          .from('quote_follow_ups')
          .update({ 
            status: 'stopped', 
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'quote_expired',
              stopped_at: new Date().toISOString(),
              valid_until: quote.valid_until
            }
          })
          .eq('quote_id', quote.id)
          .in('status', ['pending', 'scheduled']);

        // Log the expiration event - include user_id to satisfy RLS policy
        const { error: eventError } = await supabase
          .from('quote_events')
          .insert({
            quote_id: quote.id,
            user_id: userId, // Add user_id to satisfy RLS policy
            type: 'quote_expired',
            meta: {
              expired_at: new Date().toISOString(),
              valid_until: quote.valid_until,
              previous_status: quote.status,
              reason: 'valid_until_date_passed'
            }
          });

        results.push({ 
          quote_id: quote.id, 
          quote_number: quote.quote_number, 
          success: true,
          previous_status: quote.status,
          new_status: 'expired',
          follow_ups_stopped: !followUpError,
          event_logged: !eventError
        });
      } catch (quoteError) {
        console.error(`Error processing expiration for quote ${quote.quote_number}:`, quoteError);
        results.push({ 
          quote_id: quote.id, 
          quote_number: quote.quote_number, 
          success: false, 
          error: quoteError.message 
        });
      }
    }

    return { 
      success: true, 
      data: { 
        processed: expiredQuotes.length,
        expired: results.filter(r => r.success).length,
        results 
      } 
    };
  } catch (error) {
    console.error('Error processing quote expirations:', error);
    return { success: false, error };
  }
}

/**
 * Check if a specific quote is expired and update its status if needed
 * @param {string} quoteId - The ID of the quote to check
 * @param {string} userId - User ID for RLS policies
 * @returns {Promise<{success, data, error}>} Result of the operation
 */
export async function checkAndUpdateQuoteExpiration(quoteId, userId) {
  try {
    // Get the quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, status, quote_number, valid_until')
      .eq('id', quoteId)
      .single();
    
    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError);
      return { success: false, error: quoteError || 'Quote not found' };
    }
    
    // If quote doesn't have a valid_until date or is already in a final state, return early
    if (!quote.valid_until || !['sent', 'viewed', 'draft'].includes(quote.status)) {
      return { 
        success: true, 
        data: { 
          quote_id: quote.id,
          quote_number: quote.quote_number,
          status: quote.status,
          valid_until: quote.valid_until,
          is_expired: false,
          reason: !quote.valid_until ? 'no_expiration_date' : 'already_in_final_state'
        } 
      };
    }
    
    // Check if the quote is expired
    let validUntilDate;
    if (quote.valid_until.includes('T')) {
      // Full ISO date
      validUntilDate = new Date(quote.valid_until);
    } else {
      // Date-only format (YYYY-MM-DD)
      const [year, month, day] = quote.valid_until.split('-').map(Number);
      validUntilDate = new Date(year, month - 1, day); // Month is 0-based in JS
    }
    
    // Compare with current date (ignoring time for date-only values)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isExpired = validUntilDate < today;
    
    if (!isExpired) {
      return { 
        success: true, 
        data: { 
          quote_id: quote.id,
          quote_number: quote.quote_number,
          status: quote.status,
          valid_until: quote.valid_until,
          is_expired: false,
          reason: 'not_yet_expired'
        } 
      };
    }
    
    // Quote is expired, update its status
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'expired', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error(`Error updating quote ${quote.quote_number} status to expired:`, updateError);
      return { success: false, error: updateError };
    }

    // Stop any pending follow-ups for this expired quote
    const { error: followUpError } = await supabase
      .from('quote_follow_ups')
      .update({ 
        status: 'stopped', 
        updated_at: new Date().toISOString(),
        meta: {
          stopped_reason: 'quote_expired',
          stopped_at: new Date().toISOString(),
          valid_until: quote.valid_until
        }
      })
      .eq('quote_id', quote.id)
      .in('status', ['pending', 'scheduled']);

    // Log the expiration event - include user_id to satisfy RLS policy
    const { error: eventError } = await supabase
      .from('quote_events')
      .insert({
        quote_id: quote.id,
        user_id: userId, // Add user_id to satisfy RLS policy
        type: 'quote_expired',
        meta: {
          expired_at: new Date().toISOString(),
          valid_until: quote.valid_until,
          previous_status: quote.status,
          reason: 'valid_until_date_passed'
        }
      });

    return { 
      success: true, 
      data: { 
        quote_id: quote.id,
        quote_number: quote.quote_number,
        previous_status: quote.status,
        new_status: 'expired',
        is_expired: true,
        follow_ups_stopped: !followUpError,
        event_logged: !eventError
      } 
    };
  } catch (error) {
    console.error('Error checking quote expiration:', error);
    return { success: false, error };
  }
}

/**
 * Convert a quote to an invoice
 * @param {Object} quote - The quote object to convert (can be transformed or raw)
 * @param {string} userId - The current user ID
 * @returns {Promise<{success: boolean, data: Object, error: string}>}
 */
export async function convertQuoteToInvoice(quote, userId) {
  try {
    // Validate quote status - only convert quotes that are not draft or expired
    if (quote.status === 'draft' || quote.status === 'expired') {
      throw new Error('Cannot convert draft or expired quotes to invoices');
    }

    // Fetch full quote data from database to ensure we have all fields
    // The quote object passed might be transformed and missing some fields
    const { data: fullQuote, error: fetchError } = await fetchQuoteById(quote.id);
    
    if (fetchError || !fullQuote) {
      throw new Error(`Failed to fetch quote data: ${fetchError?.message || 'Quote not found'}`);
    }

    // Use full quote data for conversion
    const quoteData = fullQuote;

    // Extract client_id - handle both transformed (quote.client.id) and raw (quote.client_id) formats
    const clientId = quoteData.client_id || quoteData.client?.id || quote.client_id || quote.client?.id;
    
    if (!clientId) {
      throw new Error('Quote must have a client to convert to invoice');
    }

    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number', { user_id: userId });

    if (numberError) {
      throw new Error(`Failed to generate invoice number: ${numberError.message}`);
    }

    // Calculate due date (30 days from today by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Extract description - check both project_description and description fields
    const description = quoteData.project_description || quoteData.description || quote.description || '';

    // Extract amounts - use final_amount, total_amount, tax_amount, net_amount from quote
    const totalAmount = parseFloat(quoteData.total_amount || 0);
    const taxAmount = parseFloat(quoteData.tax_amount || 0);
    const discountAmount = parseFloat(quoteData.discount_amount || 0);
    const finalAmount = parseFloat(quoteData.final_amount || quoteData.total_amount || 0);
    // Calculate net amount if not present
    const netAmount = quoteData.net_amount 
      ? parseFloat(quoteData.net_amount) 
      : (totalAmount - discountAmount);

    // Prepare invoice data with all necessary fields
    const invoiceData = {
      user_id: userId,
      client_id: clientId,
      quote_id: quoteData.id,
      invoice_number: invoiceNumber,
      quote_number: quoteData.quote_number,
      title: quoteData.title || `Facture pour ${description || 'Projet'}`,
      description: description,
      status: 'unpaid', // Always start as unpaid
      amount: netAmount, // Net amount (HT)
      net_amount: netAmount, // Net amount (HT)
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payment_method: 'À définir',
      payment_terms: 'Paiement à 30 jours',
      notes: `Facture générée automatiquement depuis le devis ${quoteData.quote_number}`,
      converted_from_quote_at: new Date().toISOString()
    };

    // Insert the invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting invoice:', insertError);
      throw new Error(`Failed to create invoice: ${insertError.message}`);
    }

    // Update quote status to indicate it has been converted
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'converted_to_invoice',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteData.id);

    if (updateError) {
      console.warn('Warning: Failed to update quote status:', updateError);
      // Don't fail the whole operation if quote update fails
    }

    // Trigger follow-up creation for the new invoice
    try {
      const { default: InvoiceFollowUpService } = await import('./invoiceFollowUpService');
      await InvoiceFollowUpService.triggerFollowUpCreation(invoice.id);
    } catch (followUpError) {
      console.warn('Warning: Failed to trigger follow-up creation for invoice:', followUpError);
      // Don't fail the whole operation if follow-up trigger fails
    }

    return {
      success: true,
      data: invoice,
      message: 'Quote successfully converted to invoice'
    };

  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

