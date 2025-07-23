import { supabase } from './supabaseClient';

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
        client:clients(id, name, email, phone, company),
        tasks:tasks(
          id, 
          description, 
          price,
          materials:materials(id, name, quantity, price, unit)
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
        client:clients(id, name, email, phone, company, address),
        tasks:tasks(
          id, 
          description, 
          price,
          materials:materials(id, name, quantity, price, unit)
        ),
        files:files(id, file_name, file_path, file_type)
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
 * Create a new quote
 * @param {Object} quoteData - Quote data
 * @returns {Promise<{data, error}>} Created quote or error
 */
export async function createQuote(quoteData) {
  try {
    // First, create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: quoteData.client_id,
        quote_number: quoteData.quote_number,
        status: quoteData.status || 'draft',
        total_amount: quoteData.total_amount,
        valid_until: quoteData.valid_until
      })
      .select()
      .single();
    
    if (quoteError) return { error: quoteError };
    
    // Then create tasks if any
    if (quoteData.tasks && quoteData.tasks.length > 0) {
      // Prepare tasks with quote_id
      const tasksWithQuoteId = quoteData.tasks.map(task => ({
        quote_id: quote.id,
        description: task.description,
        price: task.price
      }));
      
      // Insert tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksWithQuoteId)
        .select();
      
      if (tasksError) return { error: tasksError };
      
      // Create materials for each task
      for (let i = 0; i < quoteData.tasks.length; i++) {
        const task = quoteData.tasks[i];
        if (task.materials && task.materials.length > 0) {
          // Prepare materials with task_id
          const materialsWithTaskId = task.materials.map(material => ({
            task_id: tasks[i].id,
            name: material.name,
            quantity: material.quantity,
            price: material.price,
            unit: material.unit
          }));
          
          // Insert materials
          const { error: materialsError } = await supabase
            .from('materials')
            .insert(materialsWithTaskId);
          
          if (materialsError) console.error('Error creating materials:', materialsError);
        }
      }
    }
    
    // Finally handle files if any
    if (quoteData.files && quoteData.files.length > 0) {
      const filesWithQuoteId = quoteData.files.map(file => ({
        quote_id: quote.id,
        file_name: file.name,
        file_path: file.path,
        file_type: file.type,
        file_size: file.size
      }));
      
      const { error: filesError } = await supabase
        .from('files')
        .insert(filesWithQuoteId);
      
      if (filesError) console.error('Error creating files:', filesError);
    }
    
    // Return the created quote (we'll need to fetch it again to get the relations)
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
    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        client_id: quoteData.client_id,
        status: quoteData.status,
        total_amount: quoteData.total_amount,
        valid_until: quoteData.valid_until
      })
      .eq('id', id);
    
    if (quoteError) return { error: quoteError };
    
    // Handle tasks - more complex as we need to update, delete or create
    if (quoteData.tasks) {
      // Get existing tasks for this quote
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('quote_id', id);
      
      const existingTaskIds = existingTasks?.map(t => t.id) || [];
      const newTaskIds = quoteData.tasks.filter(t => t.id).map(t => t.id);
      
      // Find tasks to delete (in existing but not in new)
      const tasksToDelete = existingTaskIds.filter(id => !newTaskIds.includes(id));
      
      // Delete tasks that were removed
      if (tasksToDelete.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('id', tasksToDelete);
      }
      
      // Update or create tasks
      for (const task of quoteData.tasks) {
        if (task.id) {
          // Update existing task
          await supabase
            .from('tasks')
            .update({
              description: task.description,
              price: task.price
            })
            .eq('id', task.id);
            
          // Handle materials for this task (similar to tasks logic)
          if (task.materials) {
            const { data: existingMaterials } = await supabase
              .from('materials')
              .select('id')
              .eq('task_id', task.id);
              
            const existingMaterialIds = existingMaterials?.map(m => m.id) || [];
            const newMaterialIds = task.materials.filter(m => m.id).map(m => m.id);
            
            // Find materials to delete
            const materialsToDelete = existingMaterialIds.filter(id => !newMaterialIds.includes(id));
            
            // Delete materials
            if (materialsToDelete.length > 0) {
              await supabase
                .from('materials')
                .delete()
                .in('id', materialsToDelete);
            }
            
            // Update or create materials
            for (const material of task.materials) {
              if (material.id) {
                // Update existing
                await supabase
                  .from('materials')
                  .update({
                    name: material.name,
                    quantity: material.quantity,
                    price: material.price,
                    unit: material.unit
                  })
                  .eq('id', material.id);
              } else {
                // Create new
                await supabase
                  .from('materials')
                  .insert({
                    task_id: task.id,
                    name: material.name,
                    quantity: material.quantity,
                    price: material.price,
                    unit: material.unit
                  });
              }
            }
          }
        } else {
          // Create new task
          const { data: newTask, error } = await supabase
            .from('tasks')
            .insert({
              quote_id: id,
              description: task.description,
              price: task.price
            })
            .select()
            .single();
            
          if (error) continue;
          
          // Create materials for new task
          if (task.materials && task.materials.length > 0) {
            const materialsData = task.materials.map(m => ({
              task_id: newTask.id,
              name: m.name,
              quantity: m.quantity,
              price: m.price,
              unit: m.unit
            }));
            
            await supabase
              .from('materials')
              .insert(materialsData);
          }
        }
      }
    }
    
    // Return updated quote
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
 * @returns {Promise<{success, error}>} Success status or error
 */
export async function deleteQuote(id) {
  try {
    // Note: with proper foreign key constraints, this will cascade delete related records
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
 * Get quote statistics
 * @returns {Promise<{data, error}>} Statistics data or error
 */
export async function getQuoteStatistics() {
  try {
    // Get total quotes count
    const { count: totalCount, error: countError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) return { error: countError };
    
    // Get quotes by status
    const { data: statusData, error: statusError } = await supabase
      .from('quotes')
      .select('status')
      .order('created_at', { ascending: false });
    
    if (statusError) return { error: statusError };
    
    // Calculate stats
    const byStatus = statusData.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get sum of total amounts
    const { data: amountData, error: amountError } = await supabase
      .rpc('sum_quote_amounts');  // Assume you have this function in your database
    
    const totalAmount = amountError ? 0 : (amountData || 0);
    
    return { 
      data: {
        totalCount,
        byStatus,
        totalAmount
      }
    };
  } catch (error) {
    console.error('Error getting quote statistics:', error);
    return { error };
  }
} 