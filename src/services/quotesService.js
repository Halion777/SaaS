import { supabase } from './supabaseClient';

/**
 * Generate a unique quote number for the current user
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Generated quote number or error
 */
export async function generateQuoteNumber(userId) {
  try {
    console.log('Generating quote number for user:', userId);
    
    if (!userId) {
      console.error('No userId provided to generateQuoteNumber');
      return { error: 'No userId provided' };
    }
    
    // First, test if we can access the quotes table at all
    console.log('Testing basic database access...');
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('id')
      .limit(1);
    
    console.log('Test query result:', { testData, testError });
    
    if (testError) {
      console.error('Cannot access quotes table:', testError);
      return { error: `Database access error: ${testError.message}` };
    }
    
    // Now try the RPC function
    console.log('Calling generate_quote_number RPC...');
    const { data, error } = await supabase
      .rpc('generate_quote_number', { user_id: userId });
    
    console.log('RPC response:', { data, error });
    
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
    console.log('Creating quote with data:', quoteData);
    
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
    
    console.log('Quote user_id:', quoteData.user_id);
    console.log('Quote client_id:', quoteData.client_id);
    console.log('Quote number:', quoteData.quote_number);
    
    // First, create the quote
    const quoteInsertData = {
      user_id: quoteData.user_id,
      profile_id: quoteData.profile_id || null,
      client_id: quoteData.client_id,
      quote_number: quoteData.quote_number,
      title: quoteData.title || 'Nouveau devis',
      description: quoteData.description || '',
      status: quoteData.status || 'draft',
      project_categories: quoteData.project_categories || [],
      custom_category: quoteData.custom_category || '',
      deadline: quoteData.deadline || null,
      total_amount: quoteData.total_amount || 0,
      tax_amount: quoteData.tax_amount || 0,
      discount_amount: quoteData.discount_amount || 0,
      final_amount: quoteData.final_amount || quoteData.total_amount || 0,
      valid_until: quoteData.valid_until || null,
      terms_conditions: quoteData.terms_conditions || ''
    };
    
    // Additional validation and debugging
    console.log('Final quote insert data:', quoteInsertData);
    console.log('Data types:', {
      user_id: typeof quoteInsertData.user_id,
      client_id: typeof quoteInsertData.client_id,
      quote_number: typeof quoteInsertData.quote_number,
      title: typeof quoteInsertData.title,
      total_amount: typeof quoteInsertData.total_amount
    });
    
    console.log('Inserting quote with data:', quoteInsertData);
    
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteInsertData)
      .select()
      .single();
    
    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      console.error('Error details:', {
        code: quoteError.code,
        message: quoteError.message,
        details: quoteError.details,
        hint: quoteError.hint
      });
      return { error: quoteError };
    }
    
    console.log('Quote created successfully:', quote);
    
    // Then create quote tasks if any
    if (quoteData.tasks && quoteData.tasks.length > 0) {
      const tasksWithQuoteId = quoteData.tasks.map((task, index) => ({
        quote_id: quote.id,
        name: task.name || task.description,
        description: task.description,
        quantity: task.quantity || 1,
        unit: task.unit || 'piece',
        unit_price: task.unit_price || task.price || 0,
        total_price: task.total_price || (task.quantity * (task.unit_price || task.price)) || 0,
        duration: task.duration,
        duration_unit: task.duration_unit || 'minutes',
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
            name: material.name,
            description: material.description,
            quantity: material.quantity || 1,
            unit: material.unit || 'piece',
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
        file_name: file.file_name || file.name || '',
        file_path: file.file_path || file.path || file.url || '',
        file_size: file.file_size || file.size || 0,
        mime_type: file.mime_type || file.type || '',
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
        deadline: quoteData.deadline,
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
          name: task.name || task.description,
          description: task.description,
          quantity: task.quantity || 1,
          unit: task.unit || 'piece',
          unit_price: task.unit_price || task.price || 0,
          total_price: task.total_price || (task.quantity * (task.unit_price || task.price)) || 0,
          duration: task.duration,
          duration_unit: task.duration_unit || 'minutes',
          pricing_type: task.pricing_type || 'flat',
          hourly_rate: task.hourly_rate,
          order_index: index
        }));
        
        const { error: tasksError } = await supabase
          .from('quote_tasks')
          .insert(tasksWithQuoteId);
        
        if (tasksError) return { error: tasksError };
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
    const { data, error } = await supabase
      .from('quote_drafts')
      .upsert({
        user_id: draftData.user_id,
        profile_id: draftData.profile_id,
        draft_data: draftData.draft_data,
        last_saved: new Date().toISOString()
      }, {
        onConflict: 'user_id,profile_id'
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
    const { data, error } = await supabase
      .from('quote_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .single();
    
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
    const { error } = await supabase
      .from('quote_drafts')
      .delete()
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting quote draft:', error);
    return { error };
  }
}
