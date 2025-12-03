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

    // If peppolIdentifier is provided instead of userId, find the user_id first
    if (!targetUserId && peppolIdentifier) {
      const { data: peppolSettings, error: findError } = await supabaseAdmin
        .from('peppol_settings')
        .select('user_id')
        .eq('peppol_id', peppolIdentifier)
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

    // Delete all Peppol-related data for the user (bypassing RLS with service role)
    const errors = [];

    // 1. Delete from peppol_settings
    const { error: settingsError } = await supabaseAdmin
      .from('peppol_settings')
      .delete()
      .eq('user_id', targetUserId);

    if (settingsError) {
      console.error('Error deleting peppol_settings:', settingsError);
      errors.push(`peppol_settings: ${settingsError.message}`);
    }

    // 2. Delete from peppol_participants
    const { error: participantsError } = await supabaseAdmin
      .from('peppol_participants')
      .delete()
      .eq('user_id', targetUserId);

    if (participantsError) {
      console.error('Error deleting peppol_participants:', participantsError);
      errors.push(`peppol_participants: ${participantsError.message}`);
    }

    // 3. Delete from peppol_invoices
    const { error: invoicesError } = await supabaseAdmin
      .from('peppol_invoices')
      .delete()
      .eq('user_id', targetUserId);

    if (invoicesError) {
      console.error('Error deleting peppol_invoices:', invoicesError);
      errors.push(`peppol_invoices: ${invoicesError.message}`);
    }

    // 4. Clean up Peppol fields from invoices table (set to null/false)
    const { error: updateInvoicesError } = await supabaseAdmin
      .from('invoices')
      .update({
        peppol_enabled: false,
        peppol_status: null,
        peppol_message_id: null,
        peppol_sent_at: null,
        peppol_delivered_at: null,
        peppol_error_message: null,
        receiver_peppol_id: null,
        ubl_xml: null,
        peppol_metadata: null
      })
      .eq('user_id', targetUserId);

    if (updateInvoicesError) {
      console.error('Error cleaning up invoices Peppol data:', updateInvoicesError);
      errors.push(`invoices cleanup: ${updateInvoicesError.message}`);
    }

    // 5. Clean up Peppol fields from expense_invoices table
    const { error: updateExpenseInvoicesError } = await supabaseAdmin
      .from('expense_invoices')
      .update({
        peppol_enabled: false,
        peppol_message_id: null,
        peppol_received_at: null,
        sender_peppol_id: null,
        ubl_xml: null,
        peppol_metadata: null
      })
      .eq('user_id', targetUserId);

    if (updateExpenseInvoicesError) {
      console.error('Error cleaning up expense_invoices Peppol data:', updateExpenseInvoicesError);
      errors.push(`expense_invoices cleanup: ${updateExpenseInvoicesError.message}`);
    }

    // 6. Clean up Peppol fields from clients table
    const { error: updateClientsError } = await supabaseAdmin
      .from('clients')
      .update({
        peppol_id: null,
        peppol_enabled: false
      })
      .eq('user_id', targetUserId);

    if (updateClientsError) {
      console.error('Error cleaning up clients Peppol data:', updateClientsError);
      errors.push(`clients cleanup: ${updateClientsError.message}`);
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Some Peppol data could not be deleted',
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
        message: 'All Peppol data deleted successfully' 
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

