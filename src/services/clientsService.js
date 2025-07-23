import { supabase } from './supabaseClient';

/**
 * Fetch all clients for the current user
 * @returns {Promise<{data, error}>} Clients data or error
 */
export async function fetchClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    
    return { data, error };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { error };
  }
}

/**
 * Fetch a single client by ID
 * @param {string} id - Client ID
 * @returns {Promise<{data, error}>} Client data or error
 */
export async function fetchClientById(id) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        quotes:quotes(id, quote_number, status, total_amount, created_at),
        invoices:invoices(id, invoice_number, status, total_amount, created_at)
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error fetching client:', error);
    return { error };
  }
}

/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @returns {Promise<{data, error}>} Created client or error
 */
export async function createClient(clientData) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error creating client:', error);
    return { error };
  }
}

/**
 * Update an existing client
 * @param {string} id - Client ID
 * @param {Object} clientData - Updated client data
 * @returns {Promise<{data, error}>} Updated client or error
 */
export async function updateClient(id, clientData) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating client:', error);
    return { error };
  }
}

/**
 * Delete a client
 * @param {string} id - Client ID
 * @returns {Promise<{success, error}>} Success status or error
 */
export async function deleteClient(id) {
  try {
    // Check if client has quotes or invoices
    const { data: relatedData, error: checkError } = await supabase
      .from('clients')
      .select(`
        quotes:quotes(count),
        invoices:invoices(count)
      `)
      .eq('id', id)
      .single();
    
    if (checkError) return { error: checkError };
    
    const hasQuotes = relatedData.quotes.length > 0;
    const hasInvoices = relatedData.invoices.length > 0;
    
    if (hasQuotes || hasInvoices) {
      return { 
        error: { 
          message: 'Cannot delete client with associated quotes or invoices' 
        },
        hasRelatedData: true
      };
    }
    
    // Delete client if no related data
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { error };
  }
}

/**
 * Search clients by name or company
 * @param {string} query - Search query
 * @returns {Promise<{data, error}>} Matching clients or error
 */
export async function searchClients(query) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    return { data, error };
  } catch (error) {
    console.error('Error searching clients:', error);
    return { error };
  }
}

/**
 * Get client statistics
 * @returns {Promise<{data, error}>} Statistics data or error
 */
export async function getClientStatistics() {
  try {
    // Get total clients count
    const { count: totalCount, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (countError) return { error: countError };
    
    // Get top clients by invoice value
    const { data: topClients, error: topError } = await supabase
      .rpc('get_top_clients', { limit_count: 5 });  // Assume you have this function in your database
    
    if (topError) return { error: topError };
    
    // Get new clients this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const { count: newClientsCount, error: newError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());
    
    if (newError) return { error: newError };
    
    return { 
      data: {
        totalCount,
        topClients: topClients || [],
        newClientsCount
      }
    };
  } catch (error) {
    console.error('Error getting client statistics:', error);
    return { error };
  }
} 