import { supabase } from './supabaseClient';

export class QuoteAcceptanceService {
  
  /**
   * Accept a quote with client signature
   */
  static async acceptQuote(quoteId, signatureData) {
    try {
      // First, save the signature to storage
      const signaturePath = await this.saveClientSignature(quoteId, signatureData);
      
      if (!signaturePath) {
        throw new Error('Failed to save signature');
      }

      // Update the quote status and add client signature data
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          client_signature: {
            signature_path: signaturePath,
            client_comment: signatureData.clientComment,
            signature_mode: signatureData.signatureMode,
            signed_at: signatureData.signedAt,
            signature_data: signatureData.signature
          },
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      // Log the acceptance event
      await this.logQuoteEvent(quoteId, 'accepted', signatureData);

      return { success: true, data };
      
    } catch (error) {
      console.error('Error accepting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a quote
   */
  static async rejectQuote(quoteId, rejectionReason = null) {
    try {
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

      // Log the rejection event
      await this.logQuoteEvent(quoteId, 'rejected', { reason: rejectionReason });

      return { success: true, data };
      
    } catch (error) {
      console.error('Error rejecting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save client signature to storage
   */
  static async saveClientSignature(quoteId, signatureData) {
    try {
      // Convert base64 signature to blob
      const base64Data = signatureData.signature.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `client-signature-${quoteId}-${timestamp}.png`;
      
      // Upload to storage
      const { data, error } = await supabase.storage
        .from('company-assets')
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
   * Log quote events for tracking
   */
  static async logQuoteEvent(quoteId, eventType, eventData = {}) {
    try {
      const { error } = await supabase
        .from('quote_events')
        .insert({
          quote_id: quoteId,
          type: eventType,
          meta: eventData,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging quote event:', error);
      }
    } catch (error) {
      console.error('Error logging quote event:', error);
    }
  }

  /**
   * Get quote acceptance status
   */
  static async getQuoteStatus(quoteId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('status, client_signature, accepted_at, rejected_at, rejection_reason')
        .eq('id', quoteId)
        .single();

      if (error) {
        console.error('Error fetching quote status:', error);
        throw error;
      }

      return { success: true, data };
      
    } catch (error) {
      console.error('Error getting quote status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client signature data
   */
  static async getClientSignature(quoteId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('client_signature')
        .eq('id', quoteId)
        .single();

      if (error) {
        console.error('Error fetching client signature:', error);
        throw error;
      }

      return { success: true, data: data?.client_signature };
      
    } catch (error) {
      console.error('Error getting client signature:', error);
      return { success: false, error: error.message };
    }
  }
}

export default QuoteAcceptanceService;
