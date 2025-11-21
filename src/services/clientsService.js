import { supabase } from './supabaseClient';

/**
 * Fetch all clients for the current user
 * @returns {Promise<{data, error}>} Clients data or error
 */
export async function fetchClients() {
  try {
    // Get current user ID to ensure RLS works correctly
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }

    // Fetch clients, quotes, and invoices in parallel
    // IMPORTANT: Explicitly filter clients by user_id to ensure only user's clients are returned
    const [clientsResult, quotesResult, invoicesResult] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)  // Explicitly filter by user_id
        .order('name', { ascending: true }),
      supabase
        .from('quotes')
        .select('id, client_id')
        .eq('user_id', user.id),
      supabase
        .from('invoices')
        .select('client_id, final_amount')
        .eq('user_id', user.id)
    ]);
    
    if (clientsResult.error) {
      console.error('Supabase error fetching clients:', clientsResult.error);
      return { error: clientsResult.error };
    }
    
    // Aggregate quotes and invoices by client_id
    const quotesByClient = {};
    if (quotesResult.data) {
      quotesResult.data.forEach(quote => {
        if (quote.client_id) {
          quotesByClient[quote.client_id] = (quotesByClient[quote.client_id] || 0) + 1;
        }
      });
    }
    
    const revenueByClient = {};
    if (invoicesResult.data) {
      invoicesResult.data.forEach(invoice => {
        if (invoice.client_id) {
          const amount = parseFloat(invoice.final_amount) || 0;
          revenueByClient[invoice.client_id] = (revenueByClient[invoice.client_id] || 0) + amount;
        }
      });
    }
    
    // Map database fields to frontend fields and add calculated stats
    const mappedData = clientsResult.data ? clientsResult.data.map(client => {
      // Determine Peppol configuration status
      const peppolConfigured = client.peppol_enabled && client.peppol_id ? true : false;
      
      return {
        ...client,
        isActive: client.is_active,
        type: client.client_type === 'company' ? 'professionnel' : 'particulier',
        contactPerson: client.contact_person,
        companySize: client.company_size,
        regNumber: client.vat_number,
        peppolId: client.peppol_id,
        enablePeppol: client.peppol_enabled,
        preferences: client.communication_preferences || [],
        languagePreference: client.language_preference || 'fr',
        city: client.city,
        postalCode: client.postal_code,
        projectsCount: quotesByClient[client.id] || 0,
        totalRevenue: revenueByClient[client.id] || 0,
        peppolConfigured: peppolConfigured
      };
    }) : [];
    
    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { error: { message: 'Failed to fetch clients', details: error.message } };
  }
}

/**
 * Fetch a single client by ID
 * @param {string} id - Client ID
 * @returns {Promise<{data, error}>} Client data or error
 */
export async function fetchClientById(id) {
  try {
    // Get current user ID to ensure we only fetch user's own clients
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        quotes:quotes(id, quote_number, status, total_amount, created_at),
        invoices:invoices(id, invoice_number, status, final_amount, created_at)
      `)
      .eq('id', id)
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .single();
    
    if (error) {
      console.error('Supabase error fetching client:', error);
      return { error };
    }
    
    // Map database fields to frontend fields
    const mappedData = data ? {
      ...data,
      isActive: data.is_active,
      type: data.client_type === 'company' ? 'professionnel' : 'particulier',
      contactPerson: data.contact_person,
      companySize: data.company_size,
      regNumber: data.vat_number,
      peppolId: data.peppol_id,
      enablePeppol: data.peppol_enabled,
      preferences: data.communication_preferences || [],
      city: data.city,
      postalCode: data.postal_code
    } : null;
    
    return { data: mappedData, error: null };
  } catch (error) {
    console.error('Error fetching client:', error);
    return { error: { message: 'Failed to fetch client', details: error.message } };
  }
}

/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @returns {Promise<{data, error}>} Created client or error
 */
export async function createClient(clientData) {
  try {
    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }

    
    // Map frontend fields to database fields
    const mappedData = {
      user_id: user.id, // Add the current user's ID
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      country: clientData.country,
      postal_code: clientData.postalCode,
      client_type: clientData.type === 'professionnel' ? 'company' : 'individual',
      contact_person: clientData.contactPerson,
      company_size: clientData.companySize,
      vat_number: clientData.regNumber,
      peppol_id: clientData.peppolId,
      peppol_enabled: clientData.enablePeppol,
      communication_preferences: clientData.preferences || [],
      language_preference: clientData.languagePreference || 'fr',
      is_active: true
    };

  
    const { data, error } = await supabase
      .from('clients')
      .insert(mappedData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating client:', error);
      console.error('Error details:', error.details, 'Error hint:', error.hint);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating client:', error);
    return { error: { message: 'Failed to create client', details: error.message } };
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
    // Map frontend fields to database fields
    const mappedData = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      country: clientData.country,
      postal_code: clientData.postalCode,
      client_type: clientData.type === 'professionnel' ? 'company' : 'individual',
      contact_person: clientData.contactPerson,
      company_size: clientData.companySize,
      vat_number: clientData.regNumber,
      peppol_id: clientData.peppolId,
      peppol_enabled: clientData.enablePeppol,
      communication_preferences: clientData.preferences || [],
      language_preference: clientData.languagePreference || 'fr',
      is_active: clientData.isActive !== undefined ? clientData.isActive : true
    };

    const { data, error } = await supabase
      .from('clients')
      .update(mappedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating client:', error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating client:', error);
    return { error: { message: 'Failed to update client', details: error.message } };
  }
}

/**
 * Delete a client
 * @param {string} id - Client ID
 * @returns {Promise<{success, error}>} Success status or error
 */
export async function deleteClient(id) {
  try {
    // Check if client has quotes or invoices by querying for actual records
    const [quotesResult, invoicesResult] = await Promise.all([
      supabase
        .from('quotes')
        .select('id')
        .eq('client_id', id)
        .limit(1),
      supabase
        .from('invoices')
        .select('id')
        .eq('client_id', id)
        .limit(1)
    ]);
    
    // Check for errors
    if (quotesResult.error) {
      console.error('Error checking quotes:', quotesResult.error);
      return { error: quotesResult.error };
    }
    
    if (invoicesResult.error) {
      console.error('Error checking invoices:', invoicesResult.error);
      return { error: invoicesResult.error };
    }
    
    const hasQuotes = quotesResult.data && quotesResult.data.length > 0;
    const hasInvoices = invoicesResult.data && invoicesResult.data.length > 0;
    
    if (hasQuotes || hasInvoices) {
      // Get counts for better error message
      let quotesCount = 0;
      let invoicesCount = 0;
      
      if (hasQuotes) {
        const { count } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', id);
        quotesCount = count || 0;
      }
      
      if (hasInvoices) {
        const { count } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', id);
        invoicesCount = count || 0;
      }
      
      let message = 'Cannot delete client with associated ';
      const parts = [];
      if (hasQuotes) parts.push(`${quotesCount} quote(s)`);
      if (hasInvoices) parts.push(`${invoicesCount} invoice(s)`);
      message += parts.join(' and ');
      
      return { 
        error: { 
          message: message
        },
        hasRelatedData: true,
        quotesCount,
        invoicesCount
      };
    }
    
    // Delete client if no related data
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting client:', error);
      return { error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { error: { message: 'Failed to delete client', details: error.message } };
  }
}

/**
 * Search clients by name, email, or company
 * @param {string} query - Search query
 * @returns {Promise<{data, error}>} Matching clients or error
 */
export async function searchClients(query) {
  try {
    // Get current user ID to ensure we only search user's own clients
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,contact_person.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Supabase error searching clients:', error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error searching clients:', error);
    return { error: { message: 'Failed to search clients', details: error.message } };
  }
}

/**
 * Get client statistics
 * @returns {Promise<{data, error}>} Statistics data or error
 */
export async function getClientStatistics() {
  try {
    // Get current user ID to ensure we only get user's own client statistics
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }
    
    // Get total clients count
    const { count: totalCount, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);  // Explicitly filter by user_id
    
    if (countError) return { error: countError };
    
    // Get active clients count
    const { count: activeCount, error: activeError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .eq('is_active', true);
    
    if (activeError) return { error: activeError };
    
    // Get new clients this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const { count: newClientsCount, error: newError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .gte('created_at', firstDayOfMonth.toISOString());
    
    if (newError) return { error: newError };
    
    // Get clients by type
    const { data: typeStats, error: typeError } = await supabase
      .from('clients')
      .select('client_type')
      .eq('user_id', user.id);  // Explicitly filter by user_id
    
    if (typeError) return { error: typeError };
    
    // Group by type manually since Supabase doesn't support group by easily
    const groupedStats = (typeStats || []).reduce((acc, client) => {
      const type = client.client_type || 'individual';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const typeStatsArray = Object.entries(groupedStats).map(([type, count]) => ({
      client_type: type,
      count
    }));
    
    return { 
      data: {
        totalCount,
        activeCount,
        newClientsCount,
        typeStats: typeStatsArray
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting client statistics:', error);
    return { error: { message: 'Failed to get client statistics', details: error.message } };
  }
}

/**
 * Toggle client active status
 * @param {string} id - Client ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<{data, error}>} Updated client or error
 */
export async function toggleClientStatus(id, isActive) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error toggling client status:', error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling client status:', error);
    return { error: { message: 'Failed to toggle client status', details: error.message } };
  }
}

/**
 * Get clients by location (city/country)
 * @param {string} location - City or country to filter by
 * @returns {Promise<{data, error}>} Filtered clients or error
 */
export async function getClientsByLocation(location) {
  try {
    // Get current user ID to ensure we only get user's own clients
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { error: { message: 'User not authenticated', details: userError?.message } };
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .or(`city.ilike.%${location}%,country.ilike.%${location}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Supabase error getting clients by location:', error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting clients by location:', error);
    return { error: { message: 'Failed to get clients by location', details: error.message } };
  }
} 