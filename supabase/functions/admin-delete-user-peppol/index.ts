// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
        // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the user ID or peppol identifier from the request body
    const { userId, peppolIdentifier } = await req.json();

    let targetUserId = userId;
    let allPeppolIdentifiers: string[] = [];

    // If peppolIdentifier is provided instead of userId, find the user_id first
    if (!targetUserId && peppolIdentifier) {
      // Try to find by primary peppol_id, peppol_id_9925, or peppol_id_0208
      const { data: peppolSettings, error: findError } = await supabaseAdmin
        .from('peppol_settings')
        .select('user_id, peppol_id, peppol_id_9925, peppol_id_0208')
        .or(`peppol_id.eq.${peppolIdentifier},peppol_id_9925.eq.${peppolIdentifier},peppol_id_0208.eq.${peppolIdentifier}`)
        .maybeSingle();

      if (findError || !peppolSettings) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `No peppol_settings found for Peppol ID: ${peppolIdentifier}` 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      targetUserId = peppolSettings.user_id;
      
      // Collect all Peppol identifiers for this user (for Belgium, both 9925 and 0208)
      if (peppolSettings.peppol_id) allPeppolIdentifiers.push(peppolSettings.peppol_id);
      if (peppolSettings.peppol_id_9925) allPeppolIdentifiers.push(peppolSettings.peppol_id_9925);
      if (peppolSettings.peppol_id_0208) allPeppolIdentifiers.push(peppolSettings.peppol_id_0208);
      
      // For Belgium: If we have one ID, generate the other
      // Extract company number from the provided ID
      if (peppolIdentifier.startsWith('9925:') || peppolIdentifier.startsWith('0208:')) {
        const parts = peppolIdentifier.split(':');
        if (parts.length === 2) {
          const scheme = parts[0];
          const identifier = parts[1];
          
          if (scheme === '9925' && identifier.toLowerCase().startsWith('be')) {
            // Extract 10 digits from BEXXXXXXXXXX
            const digitsOnly = identifier.replace(/\D/g, '').substring(2); // Remove 'be' prefix
            const id0208 = `0208:${digitsOnly}`;
            if (!allPeppolIdentifiers.includes(id0208)) {
              allPeppolIdentifiers.push(id0208);
            }
          } else if (scheme === '0208') {
            // Generate 9925 ID from 0208
            const digitsOnly = identifier.replace(/\D/g, '');
            const id9925 = `9925:be${digitsOnly}`;
            if (!allPeppolIdentifiers.includes(id9925)) {
              allPeppolIdentifiers.push(id9925);
            }
          }
        }
      }
    } else if (targetUserId) {
      // If userId is provided, fetch all Peppol identifiers for this user
      const { data: peppolSettings } = await supabaseAdmin
        .from('peppol_settings')
        .select('peppol_id, peppol_id_9925, peppol_id_0208')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      if (peppolSettings) {
        if (peppolSettings.peppol_id) allPeppolIdentifiers.push(peppolSettings.peppol_id);
        if (peppolSettings.peppol_id_9925) allPeppolIdentifiers.push(peppolSettings.peppol_id_9925);
        if (peppolSettings.peppol_id_0208) allPeppolIdentifiers.push(peppolSettings.peppol_id_0208);
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'User ID or Peppol Identifier is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Disable Peppol registration for the user (bypassing RLS with service role)
    // Note: Unregistering from Digiteal is handled in the frontend (super admin panel)
    // This function only disables registration - ALL DATA IS PRESERVED
    const errors = [];

    // 1. Disable peppol_settings (mark as disabled and inactive, but keep all data)
    const { error: settingsError } = await supabaseAdmin
      .from('peppol_settings')
      .update({
        peppol_disabled: true,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId);

    if (settingsError) {
      console.error('Error disabling peppol_settings:', settingsError);
      errors.push(`peppol_settings: ${settingsError.message}`);
    } else {
      console.log(`Peppol settings disabled for user ${targetUserId}`);
    }

    // 2. Keep peppol_participants (preserve registration history)
    // No action needed - participants table is kept for historical records

    // 3. Keep peppol_invoices (preserve tracking records)
    // No action needed - tracking records are kept for historical purposes

    // 4. Keep ALL invoice data and Peppol metadata intact
    // Client invoices (outbound) - NO CHANGES - all Peppol metadata preserved
    // This ensures historical records remain intact

    // 5. Keep ALL expense_invoices (supplier invoices) - NO DELETION
    // All Peppol metadata is preserved for historical records
    // No action needed - expense invoices are kept with all their Peppol data

    // 6. Disable Peppol capability for clients (but keep Peppol IDs for reference)
    // Set peppol_enabled to false so they can't receive new Peppol invoices
    // But keep peppol_id for historical reference
    const { error: updateClientsError } = await supabaseAdmin
      .from('clients')
      .update({
        peppol_enabled: false
        // peppol_id is KEPT for historical reference
      })
      .eq('user_id', targetUserId)
      .eq('peppol_enabled', true); // Only update clients that have Peppol enabled

    if (updateClientsError) {
      console.error('Error disabling clients Peppol capability:', updateClientsError);
      errors.push(`clients update: ${updateClientsError.message}`);
    } else {
      console.log(`Peppol capability disabled for clients of user ${targetUserId}`);
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Some Peppol settings could not be disabled',
          errors: errors
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Peppol registration disabled successfully. All historical data has been preserved.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in admin-delete-user-peppol:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

