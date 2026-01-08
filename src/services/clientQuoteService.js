import { supabase } from './supabaseClient';
import { uploadQuoteSignature } from './quoteFilesService';

class ClientQuoteService {
  /**
   * Accept a quote (for unauthenticated clients)
   */
  static async acceptQuote(quoteId, shareToken, signatureData, quoteData = null) {
    try {
      // SECURITY: Check if this is a view-only token - block accept action
      const { data: quoteCheck, error: viewOnlyCheckError } = await supabase
        .from('quotes')
        .select('id, share_token, view_only_token')
        .eq('id', quoteId)
        .single();
      
      if (viewOnlyCheckError) {
        return { 
          success: false, 
          error: 'Quote not found or invalid token.' 
        };
      }
      
      // Verify token is valid for this quote
      if (quoteCheck.share_token !== shareToken && quoteCheck.view_only_token !== shareToken) {
        return { 
          success: false, 
          error: 'Invalid token for this quote.' 
        };
      }
      
      // Block if it's a view-only token
      if (quoteCheck.view_only_token === shareToken) {
        return { 
          success: false, 
          error: 'This quote is in view-only mode. Accept/reject actions are not allowed.' 
        };
      }

      // Get client data from quote if not provided
      let clientEmail, clientName;
      
      if (quoteData?.client) {
        clientEmail = quoteData.client.email;
        clientName = quoteData.client.name;
      } else {
        // Fallback: fetch quote data
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            id,
            client:clients(id, name, email)
          `)
          .eq('id', quoteId)
          .single();
        
        if (quoteError) throw quoteError;
        clientEmail = quote.client?.email;
        clientName = quote.client?.name;
      }

      // Get quote data to fetch user_id (needed for uploadQuoteSignature)
      let userId = null;
      if (quoteData?.user_id) {
        userId = quoteData.user_id;
      } else {
        // Fetch user_id from quote if not provided
        const { data: quoteInfo, error: quoteError } = await supabase
          .from('quotes')
          .select('user_id')
          .eq('id', quoteId)
          .single();
        
        if (!quoteError && quoteInfo) {
          userId = quoteInfo.user_id;
        }
      }

      // Check if signature already exists
      const { data: existingSignature, error: signatureCheckError } = await supabase
        .from('quote_signatures')
        .select('id, signature_file_path')
        .eq('quote_id', quoteId)
        .eq('signature_type', 'client')
        .maybeSingle();

      if (signatureCheckError) {
        console.error('Error checking existing signature:', signatureCheckError);
        throw signatureCheckError;
      }

      let signaturePath, signatureRecordId;

      if (existingSignature) {
        // Signature already exists, use the existing one
        signaturePath = existingSignature.signature_file_path;
        signatureRecordId = existingSignature.id;
       
      } else {
        // No existing signature, create new one using same process as quote creation step 4
        try {
          // Convert base64 signature to File object (same as quote creation)
          let signatureFile;
          if (signatureData.signature.startsWith('data:')) {
            // Data URI format: data:image/png;base64,...
            const response = await fetch(signatureData.signature);
            const blob = await response.blob();
            signatureFile = new File([blob], 'client-signature.png', { type: 'image/png' });
          } else if (signatureData.signature.startsWith('http')) {
            // Already a URL, download it
            const response = await fetch(signatureData.signature);
            const blob = await response.blob();
            signatureFile = new File([blob], 'client-signature.png', { type: 'image/png' });
          } else {
            // Base64 string without data: prefix
            const response = await fetch(`data:image/png;base64,${signatureData.signature}`);
            const blob = await response.blob();
            signatureFile = new File([blob], 'client-signature.png', { type: 'image/png' });
          }
          
          // Use the same uploadQuoteSignature function as quote creation step 4
          // Path format: ${quoteId}/client (same as quote creation)
          // Bucket: signatures (same as quote creation)
          const result = await uploadQuoteSignature(
            signatureFile,
            quoteId,
            userId, // Use quote's user_id (same as quote creation)
            'client',
            signatureData.clientComment || null
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to upload signature');
          }
          
          // Use the same path format as quote creation: quoteId/client/filename
          signaturePath = result.data.signature_file_path;
          signatureRecordId = result.data.id;
          
        } catch (signatureError) {
          console.error('Error saving signature:', signatureError);
          throw new Error(`Failed to save signature: ${signatureError.message}`);
        }
      }

      // Update the quote status and set accepted_at timestamp
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      // Send acceptance email via Edge Function
      // Get language from localStorage (user selected from dropdown on quote share page)
      // This is important for non-logged in users who don't have a database record
      let selectedLanguage = 'fr'; // Default
      if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
        selectedLanguage = storedLang.split('-')[0] || 'fr';
      }
      
      try {
        await this.sendQuoteStatusEmail(quoteId, 'accepted', {
          client_email: clientEmail,
          client_name: clientName,
          language: selectedLanguage // Pass language from dropdown selection
        });
      } catch (emailError) {
        console.warn('Failed to send acceptance email:', emailError);
        // Don't fail the acceptance if email fails
      }

      // Stop follow-ups for accepted quote via Edge Function
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'cleanup_finalized_quote',
            quote_id: quoteId
          })
        });

        const result = await response.json();
        
      } catch (followUpError) {
        console.warn('Error stopping follow-ups for accepted quote:', followUpError);
        // Don't fail the acceptance if follow-up cleanup fails
      }
      
      // Log to access logs for tracking
      await this.logAccessLog(quoteId, shareToken, 'accepted');

      return { success: true, data };
      
    } catch (error) {
      console.error('Error accepting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a quote (for unauthenticated clients)
   */
  static async rejectQuote(quoteId, shareToken, rejectionReason) {
    try {
      // SECURITY: Check if this is a view-only token - block reject action
      const { data: quoteCheck, error: viewOnlyCheckError } = await supabase
        .from('quotes')
        .select('id, share_token, view_only_token')
        .eq('id', quoteId)
        .single();
      
      if (viewOnlyCheckError) {
        return { 
          success: false, 
          error: 'Quote not found or invalid token.' 
        };
      }
      
      // Verify token is valid for this quote
      if (quoteCheck.share_token !== shareToken && quoteCheck.view_only_token !== shareToken) {
        return { 
          success: false, 
          error: 'Invalid token for this quote.' 
        };
      }
      
      // Block if it's a view-only token
      if (quoteCheck.view_only_token === shareToken) {
        return { 
          success: false, 
          error: 'This quote is in view-only mode. Accept/reject actions are not allowed.' 
        };
      }

      // Get client data for email
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          client:clients(id, name, email)
        `)
        .eq('id', quoteId)
        .single();
      
      if (quoteError) throw quoteError;
      const clientEmail = quote.client?.email;
      const clientName = quote.client?.name;

      // Update the quote status and set rejected_at timestamp and rejection_reason
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      // Send rejection email via Edge Function
      // Get language from localStorage (user selected from dropdown on quote share page)
      // This is important for non-logged in users who don't have a database record
      let selectedLanguage = 'fr'; // Default
      if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
        selectedLanguage = storedLang.split('-')[0] || 'fr';
      }
      
      try {
        await this.sendQuoteStatusEmail(quoteId, 'rejected', {
          client_email: clientEmail,
          client_name: clientName,
          rejection_reason: rejectionReason,
          language: selectedLanguage // Pass language from dropdown selection
        });
      } catch (emailError) {
        console.warn('Failed to send rejection email:', emailError);
        // Don't fail the rejection if email fails
      }

      // Stop follow-ups for rejected quote via Edge Function
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'cleanup_finalized_quote',
            quote_id: quoteId
          })
        });

        const result = await response.json();
        if (result.ok) {
          console.log('Follow-ups stopped for rejected quote:', result);
        } else {
          console.warn('Failed to stop follow-ups for rejected quote:', result.error);
        }
      } catch (followUpError) {
        console.warn('Error stopping follow-ups for rejected quote:', followUpError);
        // Don't fail the rejection if follow-up cleanup fails
      }
  
      // Log to access logs for tracking
      await this.logAccessLog(quoteId, shareToken, 'rejected');

      return { success: true, data };
      
    } catch (error) {
      console.error('Error rejecting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send quote status email (accepted/rejected) via Edge Function
   */
  static async sendQuoteStatusEmail(quoteId, status, clientData) {
    try {
      // Get quote details with client language preference, tasks, materials, and financial config
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          title,
          total_amount,
          tax_amount,
          final_amount,
          share_token,
          user_id,
          client_id,
          company_profiles!quotes_company_profile_id_fkey(company_name),
          client:clients(id, language_preference),
          quote_tasks(id, total_price, quantity, unit_price, quote_id),
          quote_materials(id, unit_price, total_price, quote_task_id),
          quote_financial_configs(vat_config, advance_config)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Format amount with comma as decimal separator (fr-FR format)
      const formatAmount = (amount) => {
        const numAmount = parseFloat(amount || 0);
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numAmount) + '€';
      };
      
      // Use stored values from quotes table directly for consistency
      // Calculate financial breakdown using EmailService helper (uses stored values)
      const { EmailService } = await import('./emailService');
      const financialBreakdown = EmailService.calculateFinancialBreakdown(quote);
      
      // For accepted/rejected emails, use total_with_vat (full quote amount) as the accepted amount
      // balanceAmount is the amount after deposit, but "Accepted Amount" should show the full quote total
      const quoteAmount = financialBreakdown.totalWithVAT > 0 
        ? financialBreakdown.totalWithVAT 
        : (parseFloat(quote.final_amount || 0) || financialBreakdown.balanceAmount);

      // Prepare variables for template rendering
        const variables = {
          client_name: clientData.client_name || 'Madame, Monsieur',
          quote_number: quote.quote_number,
          quote_amount: formatAmount(quoteAmount),
          quote_link: quote.share_token ? `${import.meta.env.SITE_URL || window.location.origin}/quote-share/${quote.share_token}` : '#',
          company_name: quote.company_profiles?.company_name || 'Notre équipe',
          // Financial breakdown variables
          total_before_vat: formatAmount(financialBreakdown.totalBeforeVAT),
          vat_enabled: financialBreakdown.vatEnabled ? 'true' : 'false',
          vat_rate: financialBreakdown.vatRate.toString(),
          vat_percentage: `${financialBreakdown.vatRate}%`,
          vat_amount: formatAmount(financialBreakdown.vatAmount),
          total_with_vat: formatAmount(financialBreakdown.totalWithVAT),
          deposit_enabled: financialBreakdown.depositEnabled ? 'true' : 'false',
          deposit_amount: formatAmount(financialBreakdown.depositWithVAT),
          balance_amount: formatAmount(financialBreakdown.balanceAmount)
        };

      // Prepare fallback templates (only used if edge function can't find database template)
      let fallbackSubject, fallbackHtml, fallbackText;
      if (status === 'accepted') {
        fallbackSubject = `Devis ${quote.quote_number} accepté - Merci !`;
        fallbackText = `Bonjour ${variables.client_name},\n\nMerci d'avoir accepté notre devis !\nMontant accepté : ${variables.quote_amount}\n\nNotre équipe vous contacte bientôt pour la suite !\n\nCordialement,\n${variables.company_name}`;
        fallbackHtml = `<p>Bonjour ${variables.client_name},</p><p>Merci d'avoir accepté notre devis !</p><p><strong>Montant accepté : ${variables.quote_amount}</strong></p><p>Notre équipe vous contacte bientôt pour la suite !</p><p>Cordialement,<br><strong>${variables.company_name}</strong></p>`;
      } else {
        fallbackSubject = `Devis ${quote.quote_number} - Merci pour votre retour`;
        fallbackText = `Bonjour ${variables.client_name},\n\nMerci pour votre retour sur notre devis.\nNous restons à votre disposition pour de futurs projets.\n\nCordialement,\n${variables.company_name}`;
        fallbackHtml = `<p>Bonjour ${variables.client_name},</p><p>Merci pour votre retour sur notre devis.</p><p>Nous restons à votre disposition pour de futurs projets.</p><p>Cordialement,<br><strong>${variables.company_name}</strong></p>`;
      }

      // Send email via Edge Function
      // Edge function will fetch template from database with correct language preference
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          emailType: 'quote_status_update',
          emailData: {
            to: clientData.client_email,
            client_id: quote.client_id || quote.client?.id || null, // Pass client_id so edge function can fetch language from database
            user_id: quote.user_id,
            language: (quote.client?.language_preference || 'fr').split('-')[0] || 'fr', // Fallback language, but edge function will prioritize database
            subject: fallbackSubject, // Fallback subject (only used if template not found)
            html: fallbackHtml, // Fallback HTML (only used if template not found)
            text: fallbackText, // Fallback text (only used if template not found)
            variables: {
              status: status, // Pass status so edge function knows which template to fetch
              quote_status: status, // Alternative key
              ...variables // Spread all variables for template rendering
            }
          }
        })
      });

      // Check if HTTP response is OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to send email'}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;

    } catch (error) {
      console.error(`Error sending quote ${status} email:`, error);
      throw error;
    }
  }

  /**
   * Set quote to pending status with client comment (for unauthenticated clients)
   */
  static async setQuotePending(quoteId, pendingData, shareToken) {
    try {
      // Insert pending signature record with comment
      const { data: signatureRecord, error: signatureError } = await supabase
        .from('quote_signatures')
        .insert({
          quote_id: quoteId,
          signer_email: pendingData.clientEmail,
          signer_name: pendingData.clientName,
          signature_type: 'client',
          signature_data: null, // No signature for pending
          signature_file_path: null, // No file for pending
          signature_mode: 'pending',
          customer_comment: pendingData.clientComment,
          signed_at: pendingData.signedAt
        });

      if (signatureError) {
        console.error('Error saving pending signature record:', signatureError);
        throw signatureError;
      }

      // Update the quote status to pending
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'pending'
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      
      // Log to access logs for tracking
      await this.logAccessLog(quoteId, shareToken, 'pending');

      return { success: true, data: signatureRecord };
      
    } catch (error) {
      console.error('Error setting quote pending:', error);
      return { success: false, error: error.message };
    }
  }



  /**
   * Log workflow events for tracking (for unauthenticated clients)
   */
  static async logWorkflowEvent(quoteId, action, details = {}) {
    try {
      const workflowData = {
        quote_id: quoteId,
        action: action,
        user_id: null, // Client is not authenticated
        status_from: 'sent',
        status_to: action === 'accepted' ? 'accepted' : action === 'rejected' ? 'rejected' : 'pending',
        metadata: {
          ...details,
          timestamp: new Date().toISOString(),
          client_action: true
        }
      };

      // Note: quote_workflow_history table removed - using quote_events instead
      // Log to quote_events table for tracking
      const { error } = await supabase
        .from('quote_events')
        .insert({
          quote_id: quoteId,
          user_id: null,
          type: 'client_action',
          meta: {
            ...workflowData,
            timestamp: new Date().toISOString(),
            client_action: true
          }
        });

      if (error) {
        console.error('Error logging workflow event:', error);
        // Fallback: try to log to console for debugging
       
      }
    } catch (error) {
      console.error('Error logging workflow event:', error);
    
    }
  }

  /**
   * Log to quote_events table (for unauthenticated clients)
   */
  static async logQuoteEvent(quoteId, eventType, meta = {}, shareToken) {
    try {
      // Extract share_token from meta if present
      const { share_token, ...otherMeta } = meta;
      
      const eventData = {
        quote_id: quoteId,
        user_id: null, // Client is not authenticated
        type: eventType,
        share_token: share_token || shareToken, // Use dedicated column
        meta: {
          ...otherMeta,
          timestamp: new Date().toISOString(),
          client_action: true
        }
      };

      const { error } = await supabase
        .from('quote_events')
        .insert(eventData);

      if (error) {
        console.error('Error logging quote event:', error);
       
      }
    } catch (error) {
      console.error('Error logging quote event:', error);
     
    }
  }

  /**
   * Log to access logs for tracking
   */
  static async logAccessLog(quoteId, shareToken, action) {
    try {
      const accessData = {
        quote_id: quoteId,
        share_token: shareToken,
        action: action
      };

      const { error } = await supabase
        .from('quote_access_logs')
        .insert(accessData);

      if (error) {
        console.error('Error logging access log:', error);
        // Fallback: try to log to console for debugging
       
      }
    } catch (error) {
      console.error('Error logging access log:', error);
      // Fallback: try to log to console for debugging
     
    }
  }

  /**
   * Ensure quote_shares record exists for tracking
   * This handles both new quotes and existing quotes that might be missing the record
   */
  static async ensureQuoteSharesRecord(quoteId, shareToken) {
    try {
      // Check if record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('quote_shares')
        .select('id')
        .eq('quote_id', quoteId)
        .eq('share_token', shareToken)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Record doesn't exist, create it
       
        const { error: createError } = await supabase
          .from('quote_shares')
          .insert({
            quote_id: quoteId,
            share_token: shareToken,
            access_count: 0,
            is_active: true
          });
        
        if (createError) {
          console.warn('Failed to create quote_shares record:', createError);
          return false;
        }
        return true;
      } else if (checkError) {
        console.warn('Error checking quote_shares record:', checkError);
        return false;
      }
      
      return true; // Record already exists
    } catch (error) {
      console.error('Error ensuring quote_shares record:', error);
      return false;
    }
  }

  /**
   * Sync missing quote_shares records for existing quotes
   * This is useful for quotes created before the tracking system was implemented
   */
  static async syncMissingQuoteSharesRecords() {
    try {
      // Find quotes that have share_token but no corresponding quote_shares record
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, share_token, status')
        .not('share_token', 'is', null)
        .eq('status', 'sent');

      if (quotesError) {
        console.error('Error fetching quotes for sync:', quotesError);
        return { success: false, error: quotesError.message };
      }

      let syncedCount = 0;
      for (const quote of quotes) {
        const recordExists = await this.ensureQuoteSharesRecord(quote.id, quote.share_token);
        if (recordExists) {
          syncedCount++;
        }
      }

     
      return { success: true, syncedCount };
    } catch (error) {
      console.error('Error syncing missing quote_shares records:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Smart tracking: Only log meaningful quote interactions, not every page load
   */
  static async trackQuoteView(quoteId, shareToken, isViewOnly = false) {
    try {
      // Check if we've already logged a 'viewed' action for this quote
      const { data: existingLogs, error: checkError } = await supabase
        .from('quote_access_logs')
        .select('id, action, accessed_at')
        .eq('quote_id', quoteId)
        .eq('share_token', shareToken)
        .eq('action', 'viewed')
        .order('accessed_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.warn('Failed to check existing view logs:', checkError);
      }

      // Only log 'viewed' action if it's the first time or if significant time has passed
      let shouldLogView = true;
      if (existingLogs && existingLogs.length > 0) {
        const lastView = new Date(existingLogs[0].accessed_at);
        const now = new Date();
        const hoursSinceLastView = (now - lastView) / (1000 * 60 * 60);
        
        // Only log again if more than 24 hours have passed (prevents spam from refreshes)
        shouldLogView = hoursSinceLastView > 24;
      }

      if (shouldLogView) {
        // Log the quote access for tracking (first time or after 24h)
        const { error } = await supabase
          .from('quote_access_logs')
          .insert({
            quote_id: quoteId,
            share_token: shareToken,
            action: 'viewed'
          });

        if (error) {
          console.error('Error tracking quote view:', error);
          return { success: false, error: error.message };
        }
      }

      // IMPORTANT: Only update quote status to 'viewed' if this is NOT a view-only token
      // View-only tokens are used for copy emails sent to the sender - they should not change the quote status
      if (!isViewOnly) {
        // Update quote status to 'viewed' via Edge Function
        try {
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

          const result = await response.json();
         
        } catch (statusError) {
          console.warn('Error updating quote status to viewed:', statusError);
          // Don't fail the main tracking operation if status update fails
        }
      } else {
        // View-only access - don't update status, just log for analytics
        console.log('View-only access detected - skipping status update');
      }

      // Ensure quote_shares record exists and update access count
      const recordExists = await this.ensureQuoteSharesRecord(quoteId, shareToken);
      
      if (recordExists) {
        // Update with incremented count
        const { data: currentShare, error: fetchError } = await supabase
          .from('quote_shares')
          .select('access_count')
          .eq('quote_id', quoteId)
          .eq('share_token', shareToken)
          .single();

        if (!fetchError) {
          const { error: updateError } = await supabase
            .from('quote_shares')
            .update({
              access_count: (currentShare.access_count || 0) + 1,
              last_accessed: new Date().toISOString()
            })
            .eq('quote_id', quoteId)
            .eq('share_token', shareToken);

          if (updateError) {
            console.warn('Failed to update quote_shares access count:', updateError);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error tracking quote view:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get quote status for tracking purposes
   */
  static async getQuoteStatus(quoteId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('status, created_at, valid_until')
        .eq('id', quoteId)
        .single();

      if (error) {
        console.error('Error getting quote status:', error);
        return { success: false, error: error.message };
      }

      // Check if quote is expired (only for quotes that haven't been acted upon)
      let status = data.status;
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        // Only mark as expired if quote is still in a state where expiration matters
        if (['sent', 'viewed'].includes(data.status)) {
          status = 'expired';
        }
        // Don't override 'accepted', 'rejected', 'pending' statuses with 'expired'
      }

      return { 
        success: true, 
        data: {
          status,
          created_at: data.created_at,
          valid_until: data.valid_until
        }
      };
    } catch (error) {
      console.error('Error getting quote status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client signature if exists
   */
  static async getClientSignature(quoteId, shareToken) {
    try {
      const { data, error } = await supabase
        .from('quote_signatures')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('signature_type', 'client')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting client signature:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error getting client signature:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify quote access (for unauthenticated clients)
   */
  static async verifyQuoteAccess(quoteId, shareToken) {
    try {
      const { data, error } = await supabase
        .from('quote_shares')
        .select('quote_id, is_active, expires_at')
        .eq('quote_id', quoteId)
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: 'Quote not found or access denied' };
      }

      // Check if share token has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { success: false, error: 'Share link has expired' };
      }

      return { success: true, data };
      
    } catch (error) {
      return { success: false, error: 'Quote not found or access denied' };
    }
  }

  /**
   * Update quote status to 'viewed' if it has been viewed but status is still 'sent'
   * This is useful for syncing existing data
   */
  static async syncQuoteStatus(quoteId) {
    try {
      // Check if quote has been viewed
      const { data: accessLogs, error: logsError } = await supabase
        .from('quote_access_logs')
        .select('id')
        .eq('quote_id', quoteId)
        .eq('action', 'viewed')
        .limit(1);

      if (logsError) {
        console.error('Error checking access logs:', logsError);
        return { success: false, error: logsError.message };
      }

      // If quote has been viewed, update status to 'viewed'
      if (accessLogs && accessLogs.length > 0) {
        const { error: statusUpdateError } = await supabase
          .from('quotes')
          .update({ status: 'viewed' })
          .eq('id', quoteId)
          .eq('status', 'sent'); // Only update if currently 'sent'

        if (statusUpdateError) {
          console.warn('Failed to sync quote status:', statusUpdateError);
          return { success: false, error: statusUpdateError.message };
        } else {
         
          return { success: true, data: { status: 'viewed' } };
        }
      }

      return { success: true, data: { status: 'unchanged' } };
    } catch (error) {
      console.error('Error syncing quote status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get quote tracking data for relance decisions
   */
  static async getQuoteTrackingData(quoteId) {
    try {
      // Get quote status and timestamps
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('status, created_at, valid_until')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error getting quote data:', quoteError);
        return { success: false, error: quoteError.message };
      }

      // Get access logs
      const { data: accessLogs, error: logsError } = await supabase
        .from('quote_access_logs')
        .select('action, accessed_at, share_token')
        .eq('quote_id', quoteId)
        .order('accessed_at', { ascending: false });

      if (logsError) {
        console.error('Error getting access logs:', logsError);
        return { success: false, error: logsError.message };
      }

      // Get quote events
      const { data: events, error: eventsError } = await supabase
        .from('quote_events')
        .select('type, meta, timestamp')
        .eq('quote_id', quoteId)
        .order('timestamp', { ascending: false });

      if (eventsError) {
        console.error('Error getting quote events:', eventsError);
        return { success: false, error: eventsError.message };
      }

      // Note: quote_workflow_history table removed - using quote_events instead
      // Get workflow events from quote_events table
      const { data: workflowEvents, error: workflowError } = await supabase
        .from('quote_events')
        .select('type, meta, created_at')
        .eq('quote_id', quoteId)
        .in('type', ['client_action', 'quote_accepted', 'quote_rejected', 'quote_pending'])
        .order('created_at', { ascending: false });

      if (workflowError) {
        console.warn('Failed to get workflow events:', workflowError);
        // Don't fail if this table doesn't exist
      }

      // Analyze tracking data for relance decisions
      const trackingData = this.analyzeTrackingData(quote, accessLogs, events, workflowEvents);

      return {
        success: true,
        data: {
          quote,
          accessLogs,
          events,
          workflowEvents: workflowEvents || [],
          trackingData
        }
      };
    } catch (error) {
      console.error('Error getting quote tracking data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze tracking data to determine relance strategy
   */
  static analyzeTrackingData(quote, accessLogs, events, workflowEvents = []) {
    const now = new Date();
    const quoteCreated = new Date(quote.created_at);
    const daysSinceCreation = Math.floor((now - quoteCreated) / (1000 * 60 * 60 * 24));

    // Expiration is now handled by edge functions - no need to calculate here

    // Find first view action
    const firstView = accessLogs.find(log => log.action === 'viewed');
    const hasBeenViewed = !!firstView;

    // Find client actions from workflow events
    const clientAccepted = workflowEvents.some(event => 
      event.type === 'quote_accepted' || (event.meta && event.meta.status_to === 'accepted')
    );
    const clientRejected = workflowEvents.some(event => 
      event.type === 'quote_rejected' || (event.meta && event.meta.status_to === 'rejected')
    );
    const clientPending = workflowEvents.some(event => 
      event.type === 'quote_pending' || (event.meta && event.meta.status_to === 'pending')
    );

    // Determine relance status
    let relanceStatus = 'unknown';
    let relanceAllowed = false;
    let nextRelanceDate = null;
    let relanceReason = '';

    // Expiration is now handled by edge functions - check status directly
    if (quote.status === 'expired') {
      relanceStatus = 'expired';
      relanceAllowed = false;
      relanceReason = 'Quote has expired';
    } else if (clientAccepted) {
      relanceStatus = 'accepted';
      relanceAllowed = false;
      relanceReason = 'Client has accepted the quote';
    } else if (clientRejected) {
      relanceStatus = 'rejected';
      relanceAllowed = false;
      relanceReason = 'Client has rejected the quote';
    } else if (clientPending) {
      relanceStatus = 'pending';
      relanceAllowed = true;
      relanceReason = 'Client requested modifications';
      
      // Suggest next relance date (2-3 days after pending)
      const lastPending = workflowEvents.find(e => e.type === 'quote_pending' || (e.meta && e.meta.status_to === 'pending'));
      if (lastPending) {
        const pendingDate = new Date(lastPending.created_at);
        nextRelanceDate = new Date(pendingDate.getTime() + (2.5 * 24 * 60 * 60 * 1000)); // 2.5 days
      }
    } else if (hasBeenViewed) {
      relanceStatus = 'viewed_no_action';
      relanceAllowed = true;
      relanceReason = 'Client viewed but took no action';
      
      // Suggest next relance date (3-5 days after last view)
      if (firstView) {
        const lastViewDate = new Date(firstView.accessed_at);
        nextRelanceDate = new Date(lastViewDate.getTime() + (4 * 24 * 60 * 60 * 1000)); // 4 days
      }
    } else {
      relanceStatus = 'not_viewed';
      relanceAllowed = true;
      relanceReason = 'Client has not opened the email link';
      
      // Suggest next relance date (2-3 days after creation)
      nextRelanceDate = new Date(quoteCreated.getTime() + (2.5 * 24 * 60 * 60 * 1000)); // 2.5 days
    }

    return {
      relanceStatus,
      relanceAllowed,
      nextRelanceDate,
      relanceReason,
      daysSinceCreation,
      hasBeenViewed,
      clientAccepted,
      clientRejected,
      clientPending,
      lastAction: accessLogs[0] || null
    };
  }
}

export default ClientQuoteService;

