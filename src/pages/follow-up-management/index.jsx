import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import TableLoader from '../../components/ui/TableLoader';
import FilterToolbar from './components/FilterToolbar';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { 
  listScheduledFollowUps, 
  stopFollowUpsForQuote,
  logQuoteEvent,
  triggerFollowUpScheduling,
  triggerFollowUpDispatching
} from '../../services/followUpService';
import { fetchQuotes } from '../../services/quotesService';
import EmailService from '../../services/emailService';
import { supabase } from '../../services/supabaseClient';
import QuoteTrackingService from '../../services/quoteTrackingService';

import { useNavigate } from 'react-router-dom';

const FollowUpManagement = () => {
  const { user } = useAuth();
  const { currentProfile } = useMultiUser();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  const [activeFilter, setActiveFilter] = useState('quotes');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    days: 'all'
  });
  const filterScrollRef = useScrollPosition('followup-filter-scroll');
  
  // Real data states
  const [followUps, setFollowUps] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingFollowUp, setProcessingFollowUp] = useState(null);

  const navigate = useNavigate();

  // Handle sidebar offset for responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, check localStorage for sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (!isMobile && !isTablet) {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    // Set initial view mode based on screen size
    const setInitialViewMode = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    setInitialViewMode();

    // Add event listeners
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);

    // Initial setup
    handleResize();

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch real data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!user || !currentProfile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quotes
        const { data: quotesData, error: quotesError } = await fetchQuotes(user.id);
        if (quotesError) {
          console.error('Error fetching quotes:', quotesError);
          setError('Erreur lors du chargement des devis');
          return;
        }
        
        // Fetch follow-ups
        const { data: followUpsData, error: followUpsError } = await listScheduledFollowUps({ 
          status: 'all', 
          limit: 1000 
        });
        
        if (followUpsError) {
          console.error('Error fetching follow-ups:', followUpsError);
          setError('Erreur lors du chargement des relances');
          return;
        }


        
        // Transform quotes data
        const transformedQuotes = (quotesData || []).map(quote => ({
          id: quote.id,
          title: quote.title || 'Sans titre',
          validUntil: quote.valid_until,
          number: quote.quote_number,
          clientName: quote.client?.name || 'Client inconnu',
          amount: parseFloat(quote.final_amount || quote.total_amount || 0),
          status: quote.status,
          createdAt: quote.created_at,
          client: quote.client,
          share_token: quote.share_token, // Add share token for email links
          quote_number: quote.quote_number // Add quote number for email templates
        }));
        
        setQuotes(transformedQuotes);
        
       
        // Transform follow-ups data to match the expected format
        const transformedFollowUps = (followUpsData || []).map(followUp => {
          const quote = transformedQuotes.find(q => q.id === followUp.quote_id);
          if (!quote) return null;
          
                  // 🔒 CRITICAL: Only show follow-ups for quotes that need relance
        // Hide quotes that are accepted, rejected, or expired
        if (quote.status === 'accepted' || quote.status === 'rejected' || quote.status === 'expired') {
          return null; // Don't show these in follow-up list
        }
        
        // Expiration is now handled by edge functions - backend status is authoritative
        // No need to check valid_until date on frontend
        
        const nextFollowUp = followUp.scheduled_at || followUp.created_at;
          
          // Determine follow-up type based on quote status and client behavior
          let followUpType = 'general';
          let followUpReason = '';
          
                     if (quote.status === 'sent') {
             followUpType = 'email_not_opened';
             followUpReason = '';
           } else if (quote.status === 'viewed') {
             followUpType = 'viewed_no_action';
             followUpReason = '';
           }
          
                     // Get automation status from follow-up record
           const isAutomated = followUp.automated || false;
           
                       return {
               id: followUp.id,
               name: quote.clientName,
               number: quote.number, // Add devis number
               title: quote.title || 'Sans titre',
               project: `${quote.number} - ${quote.description}`,
               nextFollowUp: nextFollowUp,
               validUntil: quote.validUntil || null,
               potentialRevenue: quote.amount,
                                                 priority: (() => {
              // Check if we've sent a follow-up recently (within 1 day)
              const lastFollowUpDate = followUp.updated_at || followUp.created_at;
              const oneDayAgo = new Date();
              oneDayAgo.setDate(oneDayAgo.getDate() - 1);
              
              // If follow-up was sent within the last day, set priority to low
              if (lastFollowUpDate && new Date(lastFollowUpDate) >= oneDayAgo) {
                return 'low';
              }
              
              // Otherwise, calculate priority based on quote status
              if (quote.status === 'sent') {
                // Not viewed quotes get high priority
                return 'high';
              } else if (quote.status === 'viewed') {
                // Viewed quotes get medium priority
                return 'medium';
              }
              
              // Fallback (should rarely happen)
              return 'medium';
             })(),
            status: followUp.status,
            type: 'quote',
            hasResponse: false, // Always false since we filtered out accepted/rejected
            isPaid: false, // Always false since we filtered out accepted
            quoteId: followUp.quote_id,
            stage: followUp.stage,
            scheduledAt: followUp.scheduled_at,
            attempts: followUp.attempts || 0,
            // Follow-up type based on quote status
            followUpType: followUpType,
            followUpReason: followUpReason,
            isAutomated: isAutomated,
            templateSubject: followUp.template_subject,
            // Quote status for reference (not displayed, just for logic)
            quoteStatus: quote.status
          };
        }).filter(Boolean); // Remove null entries
        
        setFollowUps(transformedFollowUps);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, currentProfile]);

  // Auto-switch view mode on resize
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode('card');
    }
  }, []);

  // Auto-refresh follow-up data every 30 seconds to keep status current
  useEffect(() => {
    if (!user || !currentProfile) return;
    
    const interval = setInterval(async () => {
      try {
        // Only refresh if not currently loading
        if (!loading) {
          await refreshData();
        }
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [user, currentProfile, loading]);

  // Refresh data - use the same logic as loadData to avoid duplication
  const refreshData = async () => {
    if (!user || !currentProfile) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch quotes
      const { data: quotesData, error: quotesError } = await fetchQuotes(user.id);
      if (quotesError) {
        console.error('Error fetching quotes:', quotesError);
        setError('Erreur lors du chargement des devis');
        return;
      }
      
      // Fetch follow-ups
      const { data: followUpsData, error: followUpsError } = await listScheduledFollowUps({ 
        status: 'all', 
        limit: 1000 
      });
      
      if (followUpsError) {
        console.error('Error fetching follow-ups:', followUpsError);
        setError('Erreur lors du chargement des relances');
        return;
      }

      // Transform quotes data
      const transformedQuotes = (quotesData || []).map(quote => ({
        id: quote.id,
        title: quote.title || 'Sans titre',
        validUntil: quote.valid_until,
        number: quote.quote_number,
        clientName: quote.client?.name || 'Client inconnu',
        amount: parseFloat(quote.final_amount || quote.total_amount || 0),
        status: quote.status,
        createdAt: quote.created_at,
        client: quote.client,
        share_token: quote.share_token, // Add share token for email links
        quote_number: quote.quote_number // Add quote number for email templates
      }));
      
      setQuotes(transformedQuotes);
      
      // Transform follow-ups data to match the expected format
      const transformedFollowUps = (followUpsData || []).map(followUp => {
        const quote = transformedQuotes.find(q => q.id === followUp.quote_id);
        if (!quote) return null;
        
        // 🔒 CRITICAL: Only show follow-ups for quotes that need relance
        // Hide quotes that are accepted, rejected, or expired
        if (quote.status === 'accepted' || quote.status === 'rejected' || quote.status === 'expired') {
          return null; // Don't show these in follow-up list
        }
        
        // Expiration is now handled by edge functions - backend status is authoritative
        // No need to check valid_until date on frontend
        
        const nextFollowUp = followUp.scheduled_at || followUp.created_at;
        
        // Determine follow-up type based on quote status and client behavior
        let followUpType = 'general';
        let followUpReason = '';
        
        if (quote.status === 'sent') {
          followUpType = 'email_not_opened';
          followUpReason = '';
        } else if (quote.status === 'viewed') {
          followUpType = 'viewed_no_action';
          followUpReason = '';
        }
        
        // Get automation status from follow-up record
        const isAutomated = followUp.automated || false;
        
        return {
          id: followUp.id,
          name: quote.clientName,
          number: quote.number, // Add devis number
          title: quote.title || 'Sans titre',
          project: `${quote.number} - ${quote.description}`,
          nextFollowUp: nextFollowUp,
          validUntil: quote.validUntil || null,
          potentialRevenue: quote.amount,
                                  priority: (() => {
              // Check if we've sent a follow-up recently (within 1 day)
              const lastFollowUpDate = followUp.updated_at || followUp.created_at;
              const oneDayAgo = new Date();
              oneDayAgo.setDate(oneDayAgo.getDate() - 1);
              
              // If follow-up was sent within the last day, set priority to low
              if (lastFollowUpDate && new Date(lastFollowUpDate) >= oneDayAgo) {
                return 'low';
              }
              
              // Otherwise, calculate priority based on quote status
              if (quote.status === 'sent') {
                // Not viewed quotes get high priority
                return 'high';
              } else if (quote.status === 'viewed') {
                // Viewed quotes get medium priority
                return 'medium';
              }
              
              // Fallback (should rarely happen)
              return 'medium';
          })(),
          status: followUp.status,
          type: 'quote',
          hasResponse: false, // Always false since we filtered out accepted/rejected
          isPaid: false, // Always false since we filtered out accepted
          quoteId: followUp.quote_id,
          stage: followUp.stage,
          scheduledAt: followUp.scheduled_at,
          attempts: followUp.attempts || 0,
          // Follow-up type based on quote status
          followUpType: followUpType,
          followUpReason: followUpReason,
          isAutomated: isAutomated,
          templateSubject: followUp.template_subject,
          // Quote status for reference (not displayed, just for logic)
          quoteStatus: quote.status
        };
      }).filter(Boolean); // Remove null entries
      
      setFollowUps(transformedFollowUps);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erreur lors de l\'actualisation des données');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Handle manual trigger of follow-up scheduler
  const handleTriggerScheduler = async () => {
    try {
      setLoading(true);
      const result = await triggerFollowUpScheduling();
      if (result.success) {
        console.log('Scheduler triggered successfully');
        // Refresh data to show new follow-ups
        await refreshData();
      } else {
        setError('Failed to trigger scheduler');
      }
    } catch (error) {
      console.error('Error triggering scheduler:', error);
      setError('Failed to trigger scheduler');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual trigger of follow-up dispatcher
  const handleTriggerDispatcher = async () => {
    try {
      setLoading(true);
      const result = await triggerFollowUpDispatching();
      if (result.success) {
        console.log('Dispatcher triggered successfully');
        // Refresh data to show updated statuses
        await refreshData();
      } else {
        setError('Failed to trigger dispatcher');
      }
    } catch (error) {
      console.error('Error triggering dispatcher:', error);
      setError('Failed to trigger dispatcher');
    } finally {
      setLoading(false);
    }
  };



  // Filter to only show items that need follow-up (no response or not paid)
  const needsFollowUp = (followUp) => {
    if (followUp.type === 'quote') {
      return !followUp.hasResponse; // Quotes need follow-up if no response
    } else if (followUp.type === 'invoice') {
      return !followUp.isPaid; // Invoices need follow-up if not paid
    }
    return false;
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getDaysRange = (days) => {
    switch (days) {
      case '0-2': return [0, 2];
      case '3-5': return [3, 5];
      case '6-10': return [6, 10];
      case '10+': return [10, Infinity];
      default: return [0, Infinity];
    }
  };

  const filteredFollowUps = followUps.filter(followUp => {
    if (!needsFollowUp(followUp)) return false; // Only show items that need follow-up
    
    // Only show quote follow-ups
    if (followUp.type !== 'quote') return false;
    
    // Filter by type
    if (filters.type !== 'all' && followUp.type !== filters.type) return false;
    
    // Filter by priority
    if (filters.priority !== 'all' && followUp.priority !== filters.priority) return false;
    
    // Filter by status
    if (filters.status !== 'all' && followUp.status !== filters.status) return false;
    
    // Filter by days
    if (filters.days !== 'all') {
      const [minDays, maxDays] = getDaysRange(filters.days);
      if (followUp.daysAgo < minDays || followUp.daysAgo > maxDays) return false;
    }
    
    return true;
  });

  const quoteFollowUps = followUps.filter(f => f.type === 'quote' && !f.hasResponse);
  const invoiceFollowUps = followUps.filter(f => f.type === 'invoice' && !f.isPaid);
  const pendingCount = filteredFollowUps.filter(f => f.status === 'pending').length;
  const highPriorityCount = filteredFollowUps.filter(f => f.priority === 'high').length;
  const totalRevenue = filteredFollowUps.reduce((sum, f) => sum + f.potentialRevenue, 0);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-700 bg-red-100',
      medium: 'text-amber-700 bg-amber-100',
      low: 'text-blue-700 bg-blue-100'
    };
    return colors[priority] || colors.low;
  };

  

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible'
    };
    return labels[priority] || 'Faible';
  };

 
  

  const getFollowUpTypeLabel = (followUpType) => {
    const labels = {
      'email_not_opened': 'Email non ouvert',
      'viewed_no_action': 'Vue sans action',
      'general': 'Général',
      'manual': 'Manuel'
    };
    return labels[followUpType] || 'Général';
  };

  const getFollowUpTypeColor = (followUpType) => {
    const colors = {
      'email_not_opened': 'text-red-700 bg-red-100',
      'viewed_no_action': 'text-amber-700 bg-amber-100',
      'general': 'text-blue-700 bg-blue-100',
      'manual': 'text-purple-700 bg-purple-100'
    };
    return colors[followUpType] || 'text-blue-700 bg-blue-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-blue-700 bg-blue-100',
      'scheduled': 'text-purple-700 bg-purple-100',
      'sent': 'text-green-700 bg-green-100',
      'failed': 'text-red-700 bg-red-100',
      'stopped': 'text-gray-700 bg-gray-100'
    };
    return colors[status] || 'text-gray-700 bg-gray-100';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'scheduled': 'Programmée',
      'sent': 'Terminée',
      'failed': 'Échouée',
      'stopped': 'Arrêtée'
    };
    return labels[status] || 'Inconnu';
  };



  const getTypeIcon = (type) => {
    return type === 'invoice' ? 'Receipt' : 'FileText';
  };

    /**
   * Handle manual follow-up button click
   * Sends immediate email reminder WITHOUT changing stages or creating new follow-up records
   * Stages only advance based on client behavior tracking, not manual actions
   */
  const handleFollowUp = async (id) => {
    try {
      // Set processing state
      setProcessingFollowUp(id);
      
      // Find the follow-up details
      const followUp = followUps.find(fu => fu.id === id);
      
      if (!followUp) {
        console.error('Follow-up not found:', id);
        return;
      }

      

      // Get quote and client details for email
      const quote = quotes.find(q => q.id === followUp.quoteId);
      if (!quote) {
        throw new Error('Quote not found for follow-up');
      }

      // Get company profile for email
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

             // Send immediate follow-up email
       const emailResult = await EmailService.sendFollowUpEmail(
         quote,
         { name: followUp.name, email: quote.client?.email },
         companyProfile,
         'general_followup',
         user.id
       );

      if (!emailResult.success) {
        throw new Error(`Failed to send follow-up email: ${emailResult.error}`);
      }

      // ✅ Email sent successfully - now log the action
     
      // Log the manual follow-up event (NO stage advancement, NO new records)
      await logQuoteEvent({
        quote_id: followUp.quoteId,
        user_id: user.id,
        type: 'followup_manual',
        meta: { 
          stage: followUp.stage || 1, // Keep current stage - NO advancement
          manual: true,
          original_followup_id: id,
          client_name: followUp.name,
          project: followUp.project,
          email_sent: true,
          email_result: emailResult,
          note: 'Manual reminder sent without changing automated workflow'
        }
      });

      // Log relance action for tracking (NO stage change)
      try {
        await QuoteTrackingService.logRelanceAction(
          followUp.quoteId, 
          'manual_followup', 
          'manual_action', 
          `Relance manuelle envoyée - Email envoyé (Stage ${followUp.stage || 1} maintenu)`
        );
      } catch (relanceError) {
        console.warn('Error logging relance action:', relanceError);
      }
      
      // Refresh the follow-ups list (no new records created)
      await refreshData();
      
    
      
      // Success feedback handled silently (no alert)
      
      
      
    } catch (error) {
      console.error('Error sending manual follow-up:', error);
      alert('Erreur lors de l\'envoi de la relance. Veuillez réessayer.');
    } finally {
      // Clear processing state
      setProcessingFollowUp(null);
    }
  };

  // Removed Quick AI

  const renderTableView = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Devis</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Date relance</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Valid until</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Montant</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Priorité</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Type Relance</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFollowUps.map((followUp) => (
              <tr key={followUp.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="User" 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{followUp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="FileText" 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{followUp.number || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate block">
                    {followUp.title || 'Sans titre'}
                  </span>
                </td>
                 
                                  <td className="px-4 py-3">
                   <span className="text-xs sm:text-sm text-muted-foreground">
                     {followUp.scheduledAt ? new Date(followUp.scheduledAt).toLocaleDateString('fr-FR') : 'Non programmée'}
                   </span>
                 </td>
                 <td className="px-4 py-3">
                   <span className="text-xs sm:text-sm text-muted-foreground">
                     {followUp.validUntil ? new Date(followUp.validUntil).toLocaleDateString('fr-FR') : 'Non définie'}
                   </span>
                 </td>
                 <td className="px-4 py-3">
                   <span className="text-xs sm:text-sm font-medium text-green-600">
                     +{followUp.potentialRevenue.toLocaleString()}€
                   </span>
                 </td>
                 <td className="px-4 py-3">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                     {getPriorityLabel(followUp.priority)}
                   </span>
                 </td>
                 <td className="px-4 py-3">
                   <div className="flex flex-col gap-1">
                                     <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getFollowUpTypeColor(followUp.followUpType)}`}>
                  {getFollowUpTypeLabel(followUp.followUpType)}
                </span>
                                 
                   </div>
                 </td>
                 <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleFollowUp(followUp.id)}
                      iconName={processingFollowUp === followUp.id ? "Loader" : "Mail"}
                      iconPosition="left"
                      className="h-7 sm:h-8 text-xs"
                      title="Relancer"
                      disabled={processingFollowUp === followUp.id}
                    >
                      {processingFollowUp === followUp.id ? 'Envoi...' : 'Relancer'}
                    </Button>
                    {/* Quick AI removed */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {filteredFollowUps.map((followUp) => (
        <div key={followUp.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header with client info and tags */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name="User" 
                  size={16} 
                  className="sm:w-5 sm:h-5 text-blue-500"
                />
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{followUp.name}</h3>
              </div>
                                            <div className="flex flex-wrap gap-1">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                   {getPriorityLabel(followUp.priority)}
                 </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getFollowUpTypeColor(followUp.followUpType)}`}>
                  {getFollowUpTypeLabel(followUp.followUpType)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(followUp.status)}`}>
                  {getStatusLabel(followUp.status)}
                </span>
                                 
              </div>
            </div>

                         {/* Project details */}
             <div className="space-y-2">
               <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                 <Icon name="FileText" size={12} className="sm:w-3.5 sm:h-3.5" />
                 <span>{followUp.title}</span>
               </div>
               <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                 <Icon name="Hash" size={12} className="sm:w-3.5 sm:h-3.5" />
                 <span>Devis: {followUp.number || 'N/A'}</span>
               </div>
               <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                 <Icon name="Calendar" size={12} className="sm:w-3.5 sm:h-3.5" />
                 <span>Date relance: {followUp.scheduledAt ? new Date(followUp.scheduledAt).toLocaleDateString('fr-FR') : 'Non programmée'}</span>
               </div>
               <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                 <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                 <span>Valid until: {followUp.validUntil ? new Date(followUp.validUntil).toLocaleDateString('fr-FR') : 'Non définie'}</span>
               </div>
              {followUp.templateSubject && (
                <div className="flex items-start space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <Icon name="MessageSquare" size={12} className="sm:w-3.5 sm:h-3.5 mt-0.5" />
                  <span className="break-words">{followUp.templateSubject}</span>
                </div>
              )}
            </div>

            {/* Revenue and actions */}
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                +{followUp.potentialRevenue.toLocaleString()}€
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleFollowUp(followUp.id)}
                  iconName={processingFollowUp === followUp.id ? "Loader" : "Mail"}
                  iconPosition="left"
                  className="h-8 sm:h-9"
                  disabled={processingFollowUp === followUp.id}
                >
                  {processingFollowUp === followUp.id ? 'Envoi...' : 'Relancer'}
                </Button>
                {/* Quick AI removed */}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <main 
        className={`transition-all duration-300 ease-out ${isMobile ? 'pb-16 pt-4' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="MessageCircle" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des relances</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Suivez et gérez vos relances de devis et factures
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  iconName={loading ? "Loader2" : "RefreshCw"}
                  iconPosition="left"
                  className="hidden md:flex text-xs sm:text-sm"
                  disabled={loading}
                >
                  {loading ? 'Actualisation...' : 'Actualiser'}
                </Button>
              </div>
            </div>
          </header>



          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Relances en attente</h3>
                <Icon name="Clock" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{pendingCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">À traiter</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Priorité haute</h3>
                <Icon name="MessageCircle" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Urgent</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">CA potentiel</h3>
                <Icon name="FileText" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">{totalRevenue.toLocaleString()}€</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Devis
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <FilterToolbar 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
            filteredCount={filteredFollowUps.length}
          />

          

          {/* Follow-up Items */}
          <div className="relative">
            {loading ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="w-full">
                  <TableLoader message="Chargement des relances..." />
                </div>
              </div>
            ) : (
              <>
                {/* View Toggle */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">Vue:</span>
                    <div className="flex bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'table'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon name="Table" size={14} className="mr-1" />
                        Tableau
                      </button>
                      <button
                        onClick={() => setViewMode('card')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'card'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon name="Grid" size={14} className="mr-1" />
                        Cartes
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {filteredFollowUps.length} relance(s)
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                  {error ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground">
                {error}. Veuillez réessayer ou rafraîchir la page.
              </p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="mt-4"
              >
                Rafraîchir
              </Button>
                              </div>
                  ) : filteredFollowUps.length === 0 ? (
                    <div className="p-8 text-center">
                      <Icon name="MessageCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Aucune relance trouvée</h3>
                      <p className="text-muted-foreground mb-4">
                        {followUps.length === 0 
                          ? "Aucune relance n'est actuellement programmée. Les relances apparaîtront automatiquement pour vos devis envoyés."
                          : "Aucune relance ne correspond aux filtres appliqués. Essayez de modifier vos critères de recherche."
                        }
                      </p>
                      {followUps.length === 0 && (
                        <Button onClick={() => navigate('/quotes-management')} variant="default" className="gap-2">
                          <Icon name="ArrowRight" size={16} />
                          Aller aux devis
                        </Button>
                      )}
                      {followUps.length > 0 && (
                        <Button onClick={() => setFilters({ type: 'all', priority: 'all', status: 'all', days: 'all' })} variant="outline" className="gap-2">
                          <Icon name="RotateCcw" size={16} />
                          Effacer les filtres
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Content */}
                      {viewMode === 'table' ? (
                        renderTableView()
                      ) : (
                        renderCardView()
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );

};
export default FollowUpManagement;