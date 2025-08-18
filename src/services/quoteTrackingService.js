import { supabase } from './supabaseClient';

class QuoteTrackingService {
  /**
   * Get quote tracking data for relance decisions
   */
  static async getQuoteTrackingData(quoteId) {
    try {
      // Get quote status and timestamps
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('status, created_at, sent_at, accepted_at, rejected_at, valid_until')
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

      // Analyze tracking data for relance decisions
      const trackingData = this.analyzeTrackingData(quote, accessLogs, events);

      return {
        success: true,
        data: {
          quote,
          accessLogs,
          events,
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
  static analyzeTrackingData(quote, accessLogs, events) {
    const now = new Date();
    const quoteCreated = new Date(quote.created_at);
    const daysSinceCreation = Math.floor((now - quoteCreated) / (1000 * 60 * 60 * 24));

    // Check if quote is expired
    const isExpired = quote.valid_until && new Date(quote.valid_until) < now;

    // Find first view action
    const firstView = accessLogs.find(log => log.action === 'viewed');
    const hasBeenViewed = !!firstView;

    // Find client actions
    const clientAccepted = events.some(event => event.type === 'quote_accepted');
    const clientRejected = events.some(event => event.type === 'quote_rejected');

    // Determine relance status
    let relanceStatus = 'unknown';
    let relanceAllowed = false;
    let nextRelanceDate = null;
    let relanceReason = '';

    if (isExpired) {
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
      
      // Suggest next relance date (2-3 days after sending)
      if (quote.sent_at) {
        const sentDate = new Date(quote.sent_at);
        nextRelanceDate = new Date(sentDate.getTime() + (2.5 * 24 * 60 * 60 * 1000)); // 2.5 days
      }
    }

    return {
      relanceStatus,
      relanceAllowed,
      nextRelanceDate,
      relanceReason,
      daysSinceCreation,
      isExpired,
      hasBeenViewed,
      clientAccepted,
      clientRejected,
      lastAction: accessLogs[0] || null
    };
  }

  /**
   * Get all quotes that need relance attention
   */
  static async getQuotesNeedingRelance(userId) {
    try {
      // Get quotes that are sent but not accepted/rejected/expired
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          title,
          status,
          created_at,
          sent_at,
          valid_until,
          client:clients(name, email),
          company_profile:company_profiles(company_name)
        `)
        .eq('user_id', userId)
        .eq('status', 'sent')
        .order('sent_at', { ascending: true });

      if (quotesError) {
        console.error('Error getting quotes for relance:', quotesError);
        return { success: false, error: quotesError.message };
      }

      // Filter quotes that need relance attention
      const quotesNeedingRelance = [];
      const now = new Date();

      for (const quote of quotes) {
        if (!quote.sent_at) continue;

        const sentDate = new Date(quote.sent_at);
        const daysSinceSent = Math.floor((now - sentDate) / (1000 * 60 * 60 * 24));
        
        // Check if quote is expired
        const isExpired = quote.valid_until && new Date(quote.valid_until) < now;
        
        if (isExpired) continue;

        // Get tracking data for this quote
        const trackingResult = await this.getQuoteTrackingData(quote.id);
        if (trackingResult.success) {
          const trackingData = trackingResult.data.trackingData;
          
          if (trackingData.relanceAllowed) {
            quotesNeedingRelance.push({
              ...quote,
              trackingData,
              daysSinceSent
            });
          }
        }
      }

      // Sort by priority (not viewed first, then viewed but no action)
      quotesNeedingRelance.sort((a, b) => {
        if (a.trackingData.relanceStatus === 'not_viewed' && b.trackingData.relanceStatus !== 'not_viewed') return -1;
        if (b.trackingData.relanceStatus === 'not_viewed' && a.trackingData.relanceStatus !== 'not_viewed') return 1;
        return a.daysSinceSent - b.daysSinceSent;
      });

      return {
        success: true,
        data: quotesNeedingRelance
      };
    } catch (error) {
      console.error('Error getting quotes needing relance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log a relance action
   */
  static async logRelanceAction(quoteId, relanceType, relanceMethod, notes = null) {
    try {
      const { error } = await supabase
        .from('quote_access_logs')
        .insert({
          quote_id: quoteId,
          action: 'relance',
          meta: {
            relance_type: relanceType,
            relance_method: relanceMethod,
            notes: notes,
            timestamp: new Date().toISOString()
          },
          accessed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging relance action:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error logging relance action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get quote statistics for dashboard
   */
  static async getQuoteStatistics(userId, period = '30days') {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case '7days':
          startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case '30days':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case '90days':
          startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      }

      // Get quote counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (statusError) {
        console.error('Error getting status counts:', statusError);
        return { success: false, error: statusError.message };
      }

      // Calculate statistics
      const stats = {
        total: statusCounts.length,
        draft: statusCounts.filter(q => q.status === 'draft').length,
        sent: statusCounts.filter(q => q.status === 'sent').length,
        accepted: statusCounts.filter(q => q.status === 'accepted').length,
        rejected: statusCounts.filter(q => q.status === 'rejected').length,
        expired: statusCounts.filter(q => q.status === 'expired').length
      };

      // Calculate conversion rates
      const totalSent = stats.sent + stats.accepted + stats.rejected + stats.expired;
      stats.acceptanceRate = totalSent > 0 ? ((stats.accepted / totalSent) * 100).toFixed(1) : 0;
      stats.rejectionRate = totalSent > 0 ? ((stats.rejected / totalSent) * 100).toFixed(1) : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting quote statistics:', error);
      return { success: false, error: error.message };
    }
  }
}

export default QuoteTrackingService;
