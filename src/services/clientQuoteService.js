import { supabase } from './supabaseClient';

export class ClientQuoteService {
  
  /**
   * Accept a quote with client signature (for unauthenticated clients)
   * This service works with the RLS policies that allow clients to update shared quotes
   */
  static async acceptQuote(quoteId, signatureData, shareToken) {
    try {
      // First, save the signature to storage
      const signaturePath = await this.saveClientSignature(quoteId, signatureData);
      
      if (!signaturePath) {
        throw new Error('Failed to save signature');
      }

      // Insert CLIENT signature into quote_signatures table (only for client signatures)
      const { data: signatureRecord, error: signatureError } = await supabase
        .from('quote_signatures')
        .insert({
          quote_id: quoteId,
          signer_email: signatureData.clientEmail || 'client@example.com',
          signer_name: signatureData.clientName || 'Client',
          signature_type: 'client', // Always 'client' for this table
          signature_data: signatureData.signature,
          signature_file_path: signaturePath, // Use signature_file_path as per your schema
          signature_mode: signatureData.signatureMode || 'draw',
          customer_comment: signatureData.clientComment,
          signed_at: signatureData.signedAt || new Date().toISOString()
        });

      if (signatureError) {
        console.error('Error saving signature to database:', signatureError);
        throw signatureError;
      }

      // Update the quote status
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted'
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      // Log the acceptance event in workflow history
      await this.logWorkflowEvent(quoteId, 'accepted', {
        action: 'quote_accepted',
        details: 'Client accepted quote with electronic signature',
        signature_id: signatureRecord.id
      });

      return { success: true, data };
      
    } catch (error) {
      console.error('Error accepting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a quote (for unauthenticated clients)
   */
  static async rejectQuote(quoteId, rejectionReason, shareToken) {
    try {
      // Update the quote status
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'rejected'
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      // Log the rejection event in workflow history
      await this.logWorkflowEvent(quoteId, 'rejected', {
        action: 'quote_rejected',
        details: 'Client rejected quote',
        reason: rejectionReason
      });

      return { success: true, data };
      
    } catch (error) {
      console.error('Error rejecting quote:', error);
      return { success: false, error: error.message };
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

      // Log the pending event in workflow history
      await this.logWorkflowEvent(quoteId, 'pending', {
        action: 'quote_pending',
        details: 'Client requested modifications',
        comment: pendingData.clientComment
      });

      return { success: true, data: signatureRecord };
      
    } catch (error) {
      console.error('Error setting quote pending:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save client signature to storage (for unauthenticated clients)
   */
  static async saveClientSignature(quoteId, signatureData) {
    try {
      // Convert base64 signature to blob
      const base64Data = signatureData.signature.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `client-signature-${quoteId}-${timestamp}.png`;
      
      // Upload to storage - this will work with the RLS policies for client signatures
      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(`client-signatures/${filename}`, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (error) {
        console.error('Error uploading signature:', error);
        throw error;
      }

      return `client-signatures/${filename}`;
      
    } catch (error) {
      console.error('Error saving signature:', error);
      return null;
    }
  }

  /**
   * Log workflow events for tracking (for unauthenticated clients)
   */
  static async logWorkflowEvent(quoteId, action, details = {}) {
    try {
      // Try to insert with minimal required fields first
      const workflowData = {
        quote_id: quoteId,
        action: action,
        user_id: null, // Client is not authenticated
        user_email: details.clientEmail || 'client@example.com'
      };

      // Only add fields that might exist in your schema
      if (details.timestamp) workflowData.timestamp = details.timestamp;
      if (details.share_token) workflowData.share_token = details.share_token;

      const { error } = await supabase
        .from('quote_workflow_history')
        .insert(workflowData);

      if (error) {
        console.error('Error logging workflow event:', error);
        // Fallback: try to log to console for debugging
        console.log('Workflow event (fallback):', { quoteId, action, details });
      }
    } catch (error) {
      console.error('Error logging workflow event:', error);
      // Fallback: try to log to console for debugging
      console.log('Workflow event (fallback):', { quoteId, action, details });
    }
  }

  /**
   * Get quote status and signature (for unauthenticated clients)
   */
  static async getQuoteStatus(quoteId, shareToken) {
    try {
      // Get quote status
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote status:', quoteError);
        throw quoteError;
      }

      // Get client signature if exists
      const { data: signature, error: signatureError } = await supabase
        .from('quote_signatures')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('signature_type', 'client')
        .single();

      if (signatureError && signatureError.code !== 'PGRST116') {
        console.error('Error fetching signature:', signatureError);
      }

      return { 
        success: true, 
        data: {
          status: quote.status,
          signature: signature || null
        }
      };
      
    } catch (error) {
      console.error('Error getting quote status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client signature data (for unauthenticated clients)
   */
  static async getClientSignature(quoteId, shareToken) {
    try {
      const { data, error } = await supabase
        .from('quote_signatures')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('signature_type', 'client')
        .single();

      if (error) {
        console.error('Error fetching client signature:', error);
        throw error;
      }

      return { success: true, data };
      
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
        .select('quote_id, is_active')
        .eq('quote_id', quoteId)
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: 'Quote not found or access denied' };
      }

      return { success: true, data };
      
    } catch (error) {
      return { success: false, error: 'Quote not found or access denied' };
    }
  }

  /**
   * Track when a quote is viewed by a client
   */
  static async trackQuoteView(quoteId, shareToken) {
    try {
      // Log the view event in workflow history (this is the proper way)
      await this.logWorkflowEvent(quoteId, 'viewed', {
        action: 'quote_viewed',
        details: 'Client viewed shared quote',
        share_token: shareToken,
        timestamp: new Date().toISOString()
      });

      // Also log to quote_events for comprehensive tracking
      try {
        await supabase
          .from('quote_events')
          .insert({
            quote_id: quoteId,
            event_type: 'quote_viewed',
            event_data: {
              share_token: shareToken,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent || 'unknown'
            }
            // Note: created_at column doesn't exist in your schema
          });
      } catch (eventError) {
        console.warn('Failed to log to quote_events:', eventError);
        // Don't fail if this table doesn't exist or has different structure
      }

      return { success: true };
    } catch (error) {
      console.error('Error tracking quote view:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ClientQuoteService;
