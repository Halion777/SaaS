import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import QuotesTable from './components/QuotesTable';
import FilterBar from './components/FilterBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
// Analyse IA removed
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { fetchQuotes, getQuoteStatistics, updateQuoteStatus, deleteQuote, fetchQuoteById, loadQuoteDraft, deleteQuoteDraftById, listQuoteDrafts } from '../../services/quotesService';
import { 
  listScheduledFollowUps, 
  createFollowUpForQuote, 
  stopFollowUpsForQuote,
  logQuoteEvent 
} from '../../services/followUpService';


const QuotesManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProfile } = useMultiUser();
  
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    averageAmount: 0
  });
  
  // Follow-up related state
  const [followUps, setFollowUps] = useState({});
  const [followUpLoading, setFollowUpLoading] = useState(false);
  
  // Ref to prevent infinite API calls
  const followUpsLoadedRef = useRef(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  // const [selectedQuote, setSelectedQuote] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });
  const [tableLoading, setTableLoading] = useState(false);
  // const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters to quotes
  useEffect(() => {
    let filtered = [...quotes];
    
    if (filters.status) {
      filtered = filtered.filter(q => q.status === filters.status);
    }
    
    if (filters.client) {
      filtered = filtered.filter(q => q.client?.id?.toString() === filters.client);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.number.toLowerCase().includes(searchLower) ||
        q.clientName.toLowerCase().includes(searchLower) ||
        q.description.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredQuotes(filtered);
  }, [quotes, filters, searchTerm]);

  // Fetch quotes data from backend
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user || !currentProfile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quotes
        const { data: quotesData, error: quotesError } = await fetchQuotes(user.id);
        
        // If none in quotes yet, try showing a draft placeholder
        if (!quotesData || quotesData.length === 0) {
          try {
            const { data: draft, error: draftError } = await loadQuoteDraft(user.id, currentProfile?.id || null);
            if (draftError) {
              console.log('QuotesManagement: loadQuoteDraft error', draftError);
            }
            if (draft?.draft_data) {
              console.log('QuotesManagement: loaded backend draft for display', draft);
              const d = draft.draft_data;
              const placeholder = {
                id: `draft-${draft.id}`,
                number: '(brouillon non envoyé)',
                clientName: d.selectedClient?.client?.name || d.selectedClient?.label || 'Client inconnu',
                amount: 0,
                amountFormatted: formatCurrency(0),
                status: 'draft',
                statusLabel: getStatusLabel('draft'),
                isDraftPlaceholder: true,
                createdAt: draft.last_saved,
                createdAtFormatted: formatDate(draft.last_saved),
                description: d.projectInfo?.description || 'Brouillon en cours',
                client: d.selectedClient?.client || null,
                tasks: d.tasks || [],
                materials: [],
                files: d.files || [],
                deadline: d.projectInfo?.deadline || null,
                deadlineFormatted: d.projectInfo?.deadline ? formatDate(d.projectInfo.deadline) : '',
                validUntil: d.projectInfo?.deadline || null,
                validUntilFormatted: d.projectInfo?.deadline ? formatDate(d.projectInfo.deadline) : '',
              };
              setQuotes([placeholder]);
              setFilteredQuotes([placeholder]);
              setStats({ total: 1, drafts: 1, sent: 0, viewed: 0, accepted: 0, rejected: 0, expired: 0, averageAmount: 0 });
              return;
            }
          } catch (e) { console.log('QuotesManagement: loadQuoteDraft exception', e); }
          setQuotes([]);
          setFilteredQuotes([]);
          setStats({ total: 0, signed: 0, pending: 0, averageScore: 0 });
          return;
        }

        // Additionally merge ALL backend drafts so they appear as placeholders
        const additionalDrafts = [];
        try {
          const { data: drafts } = await listQuoteDrafts(user.id, currentProfile?.id || null);
          (drafts || []).forEach(draft => {
            const d = draft.draft_data || {};
            additionalDrafts.push({
              id: `draft-${draft.id}`,
              number: '(brouillon non envoyé)',
              clientName: d.selectedClient?.client?.name || d.selectedClient?.label || 'Client inconnu',
              amount: 0,
              amountFormatted: formatCurrency(0),
              status: 'draft',
              statusLabel: getStatusLabel('draft'),
              isDraftPlaceholder: true,
              createdAt: draft.last_saved,
              createdAtFormatted: formatDate(draft.last_saved),
              description: d.projectInfo?.description || 'Brouillon en cours',
              client: d.selectedClient?.client || null,
              tasks: d.tasks || [],
              materials: [],
              files: d.files || [],
              deadline: d.projectInfo?.deadline || null,
              deadlineFormatted: d.projectInfo?.deadline ? formatDate(d.projectInfo.deadline) : '',
              validUntil: d.projectInfo?.deadline || null,
              validUntilFormatted: d.projectInfo?.deadline ? formatDate(d.projectInfo.deadline) : '',
            });
          });
        } catch (_) {}
        // Local drafts list removed for a simpler flow
        
        // Only set error for actual errors, not for empty data
        if (quotesError) {
          console.error('Error fetching quotes:', quotesError);
          setError('Erreur lors du chargement des devis');
          return;
        }
        
        // Transform backend data to match frontend structure
          const transformedQuotes = (quotesData || []).map(quote => ({
          id: quote.id,
          number: quote.quote_number,
          clientName: quote.client?.name || 'Client inconnu',
          amount: parseFloat(quote.total_with_tax || quote.total_amount || 0),
          amountFormatted: formatCurrency(parseFloat(quote.total_with_tax || quote.total_amount || 0)),
          status: quote.status,
          statusLabel: getStatusLabel(quote.status),
          createdAt: quote.created_at,
          createdAtFormatted: formatDate(quote.created_at),
          // aiScore removed
          description: quote.project_description || 'Aucune description',
          client: quote.client,
          companyProfile: quote.company_profile,
          tasks: quote.quote_tasks || [],
          materials: quote.quote_materials || [],
          files: quote.quote_files || [],
          // start_date (DB) or legacy deadline as start; validUntil from valid_until
          deadline: quote.start_date || quote.deadline,
          deadlineFormatted: formatDate(quote.start_date || quote.deadline),
          validUntil: quote.valid_until || quote.expires_at,
          validUntilFormatted: formatDate(quote.valid_until || quote.expires_at),
          isExpired: isQuoteExpired(quote.valid_until || quote.expires_at),
          terms: quote.terms_conditions
        }));
        
        // Sort quotes by priority
        const merged = [...transformedQuotes, ...additionalDrafts];
        const sortedQuotes = merged.sort((a, b) => getQuotePriority(a) - getQuotePriority(b));
        
        // Merge existing follow-ups (if already loaded) to avoid transient 'Aucune'
        if (followUps && Object.keys(followUps).length > 0) {
          const merged = sortedQuotes.map(quote => {
            const quoteFollowUps = followUps[quote.id] || [];
            // Reuse selection logic from updateQuotesWithFollowUpStatus
            const candidates = quoteFollowUps
              .filter(f => f.status === 'pending' || f.status === 'scheduled')
              .map(f => ({ ...f, dueAt: f.next_attempt_at || f.scheduled_at }))
              .filter(f => !!f.dueAt)
              .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
            let picked = candidates[0];
            if (!picked) picked = quoteFollowUps.find(f => f.status === 'failed')
              || quoteFollowUps.find(f => f.status === 'stopped')
              || quoteFollowUps.find(f => f.status === 'sent')
              || quoteFollowUps[0];
            const followUpStatus = picked?.status || 'none';
            return {
              ...quote,
              followUpStatus,
              followUpStatusLabel: getFollowUpStatusLabel(followUpStatus),
              followUpStatusColor: getFollowUpStatusColor(followUpStatus),
              followUpCount: quoteFollowUps.length,
              followUpMeta: picked ? {
                stage: picked.stage,
                dueAt: picked.next_attempt_at || picked.scheduled_at || null,
                attempts: picked.attempts,
                maxAttempts: picked.max_attempts,
                lastError: picked.last_error || null,
                channel: picked.channel || 'email'
              } : null
            };
          });
          setQuotes(merged);
        } else {
        setQuotes(sortedQuotes);
        }
        
        // Calculate stats (actual data)
        const total = sortedQuotes.length;
        const drafts = sortedQuotes.filter(q => q.status === 'draft').length;
        const sent = sortedQuotes.filter(q => q.status === 'sent').length;
        const viewed = sortedQuotes.filter(q => q.status === 'viewed').length;
        const accepted = sortedQuotes.filter(q => q.status === 'accepted').length;
        const rejected = sortedQuotes.filter(q => q.status === 'rejected').length;
        const expired = sortedQuotes.filter(q => q.status === 'expired').length;
        const amounts = sortedQuotes.map(q => parseFloat(q.amount) || 0);
        const averageAmount = total > 0 ? (amounts.reduce((acc, v) => acc + v, 0) / total) : 0;
        
        setStats({ 
          total, 
          drafts, 
          sent, 
          viewed,
          accepted,
          rejected,
          expired,
          averageAmount 
        });
        
      } catch (err) {
        console.error('Error loading quotes:', err);
        // Only show error for actual network/server errors, not for empty data
        if (err.message && !err.message.includes('No data')) {
          setError('Erreur lors du chargement des devis');
        } else {
          // If it's just no data, set empty state
          setQuotes([]);
          setFilteredQuotes([]);
          setStats({ total: 0, drafts: 0, sent: 0, viewed: 0, accepted: 0, rejected: 0, expired: 0, averageAmount: 0 });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadQuotes();
  }, [user, currentProfile]);

  // Load follow-ups for quotes
  useEffect(() => {
    const loadFollowUps = async () => {
      if (!user || !currentProfile || quotes.length === 0 || followUpsLoadedRef.current) return;
      
      try {
        setFollowUpLoading(true);
        
        // Get all follow-ups for the current user's quotes
        const { data: followUpsData, error: followUpsError } = await listScheduledFollowUps({ 
          status: 'all', 
          limit: 1000 
        });
        
        if (followUpsError) {
          console.error('Error fetching follow-ups:', followUpsError);
          return;
        }
        
        // Group follow-ups by quote_id
        const followUpsByQuote = {};
        if (followUpsData) {
          followUpsData.forEach(fu => {
            if (!followUpsByQuote[fu.quote_id]) {
              followUpsByQuote[fu.quote_id] = [];
            }
            followUpsByQuote[fu.quote_id].push(fu);
          });
        }
        
        setFollowUps(followUpsByQuote);
        followUpsLoadedRef.current = true;
        
        // Update quotes with follow-up status
        updateQuotesWithFollowUpStatus(followUpsByQuote);
      } catch (err) {
        console.error('Error loading follow-ups:', err);
      } finally {
        setFollowUpLoading(false);
      }
    };
    
    loadFollowUps();
  }, [user, currentProfile, quotes]);

  // Keep relances column in sync whenever follow-ups change
  useEffect(() => {
    if (quotes.length === 0) return;
    updateQuotesWithFollowUpStatus(followUps);
  }, [followUps]);

  // Update quotes with follow-up status
  const updateQuotesWithFollowUpStatus = (followUpsData) => {
    const selectFollowUp = (arr) => {
      if (!arr || arr.length === 0) return null;
      // pending/scheduled: choose earliest due
      const candidates = arr
        .filter(f => f.status === 'pending' || f.status === 'scheduled')
        .map(f => ({
          ...f,
          dueAt: f.next_attempt_at || f.scheduled_at
        }))
        .filter(f => !!f.dueAt)
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
      if (candidates.length > 0) return candidates[0];
      // failed preferred over stopped, then sent, else any
      const failed = arr.find(f => f.status === 'failed');
      if (failed) return failed;
      const stopped = arr.find(f => f.status === 'stopped');
      if (stopped) return stopped;
      const sent = arr.find(f => f.status === 'sent');
      if (sent) return sent;
      return arr[0];
    };

    setQuotes(prevQuotes => 
      prevQuotes.map(quote => {
        const quoteFollowUps = followUpsData[quote.id] || [];
        const picked = selectFollowUp(quoteFollowUps);
        const followUpStatus = picked?.status || 'none';
        const meta = picked ? {
          stage: picked.stage,
          dueAt: picked.next_attempt_at || picked.scheduled_at || null,
          attempts: picked.attempts,
          maxAttempts: picked.max_attempts,
          lastError: picked.last_error || null,
          channel: picked.channel || 'email'
        } : null;
        
        return {
          ...quote,
          followUpStatus,
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus),
          followUpCount: quoteFollowUps.length,
          followUpMeta: meta
        };
      })
    );
    
    setFilteredQuotes(prevFilteredQuotes => 
      prevFilteredQuotes.map(quote => {
        const quoteFollowUps = followUpsData[quote.id] || [];
        const picked = selectFollowUp(quoteFollowUps);
        const followUpStatus = picked?.status || 'none';
        const meta = picked ? {
          stage: picked.stage,
          dueAt: picked.next_attempt_at || picked.scheduled_at || null,
          attempts: picked.attempts,
          maxAttempts: picked.max_attempts,
          lastError: picked.last_error || null,
          channel: picked.channel || 'email'
        } : null;
        
        return {
          ...quote,
          followUpStatus,
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus),
          followUpCount: quoteFollowUps.length,
          followUpMeta: meta
        };
      })
    );
  };

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
        // On desktop, check sidebar state
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const handleSelectQuote = (quoteId) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuotes(
      selectedQuotes.length === filteredQuotes.length ? [] : filteredQuotes.map(q => q.id)
    );
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      client: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
    setSearchTerm('');
  };

  // Removed bulk optimize (AI)

  const handleClearSelection = () => {
    setSelectedQuotes([]);
  };

  const handleQuoteAction = async (action, quote) => {
    switch (action) {
      case 'edit':
        navigate(`/quote-creation?edit=${quote.id}`);
        break;
      case 'duplicate':
        navigate(`/quote-creation?duplicate=${quote.id}`);
        break;
      case 'markAsSent':
        await handleMarkAsSent(quote);
        break;
      case 'convert':
        if (quote.status === 'accepted') {
          navigate(`/invoices-management?convert=${quote.id}`);
        } else {
          console.log('Quote must be accepted before converting to invoice');
        }
        break;
      // Removed optimize (AI)
      case 'delete':
        try {
          setTableLoading(true);
          if (String(quote.id).startsWith('draft-') || quote.isDraftPlaceholder) {
            // Delete backend draft by row id if present
            try {
              const draftRowId = String(quote.id).replace('draft-', '');
              await deleteQuoteDraftById(draftRowId);
            } catch (_) {}
            // Remove from local drafts list
            // Local drafts list deprecated – nothing to remove beyond current draft
            setQuotes(prev => prev.filter(q => q.id !== quote.id));
            setFilteredQuotes(prev => prev.filter(q => q.id !== quote.id));
            setSelectedQuotes(prev => prev.filter(id => id !== quote.id));
          } else {
            const { error } = await deleteQuote(quote.id);
            if (error) {
              console.error('Error deleting quote:', error);
              return;
            }
            setQuotes(prev => prev.filter(q => q.id !== quote.id));
            setFilteredQuotes(prev => prev.filter(q => q.id !== quote.id));
            setSelectedQuotes(prev => prev.filter(id => id !== quote.id));
          }
        } catch (err) {
          console.error('Error deleting quote:', err);
        } finally {
          setTableLoading(false);
        }
        break;
      case 'followup':
        setSelectedQuoteForFollowUp(quote);
        setShowFollowUpPanel(true);
        break;
      case 'sendFollowUpNow':
        await handleSendFollowUpNow(quote);
        break;
      case 'status':
        // Handle status updates if needed
        console.log(`Status update for quote ${quote.id}`);
        break;
      default:
        console.log(`Action ${action} for quote ${quote.id}`);
    }
  };

  // Follow-up action handlers
  const handleSendFollowUpNow = async (quote) => {
    if (!quote || quote.status !== 'sent') {
      console.log('Quote must be in sent status to send follow-up');
      return;
    }

    try {
      // Create immediate follow-up
      await createFollowUpForQuote(quote.id, 1);
      
      // Log the event
      await logQuoteEvent({
        quote_id: quote.id,
        user_id: user.id,
        type: 'followup_manual',
        meta: { stage: 1, manual: true }
      });

      // Refresh follow-ups (sync actual data)
      await refreshFollowUps();

      console.log('Follow-up created successfully:', followUpId);
    } catch (error) {
      console.error('Error creating follow-up:', error);
    }
  };

  const handleStopFollowUps = async (quoteId) => {
    try {
      await stopFollowUpsForQuote(quoteId);
      
      // Refresh follow-ups
      await refreshFollowUps();
      
      console.log('Follow-ups stopped successfully');
    } catch (error) {
      console.error('Error stopping follow-ups:', error);
    }
  };

  const refreshFollowUps = async () => {
    try {
      const { data: followUpsData } = await listScheduledFollowUps({ status: 'all', limit: 1000 });
      if (followUpsData) {
        const followUpsByQuote = {};
        followUpsData.forEach(fu => {
          if (!followUpsByQuote[fu.quote_id]) {
            followUpsByQuote[fu.quote_id] = [];
          }
          followUpsByQuote[fu.quote_id].push(fu);
        });
        setFollowUps(followUpsByQuote);
        updateQuotesWithFollowUpStatus(followUpsByQuote);
      }
    } catch (error) {
      console.error('Error refreshing follow-ups:', error);
    }
  };

  const handleMarkAsSent = async (quote) => {
    if (!quote || quote.status !== 'draft') {
      console.log('Quote must be in draft status to mark as sent');
      return;
    }

    try {
      // Update quote status to 'sent' - this will trigger the database trigger
      const { data: updatedQuote, error } = await updateQuoteStatus(quote.id, 'sent');
      
      if (error) {
        console.error('Error updating quote status:', error);
        return;
      }

      // Update the local state
      setQuotes(prevQuotes => 
        prevQuotes.map(q => 
          q.id === quote.id ? { ...q, status: 'sent' } : q
        )
      );
      
      setFilteredQuotes(prevFilteredQuotes => 
        prevFilteredQuotes.map(q => 
          q.id === quote.id ? { ...q, status: 'sent' } : q
        )
      );

      // Refresh follow-ups to show the newly created ones
      await refreshFollowUps();

      console.log('Quote marked as sent successfully:', updatedQuote);
    } catch (error) {
      console.error('Error marking quote as sent:', error);
    }
  };

  const getFollowUpStatus = (quoteId) => {
    const quoteFollowUps = followUps[quoteId] || [];
    if (quoteFollowUps.length === 0) return 'none';
    
    const hasPending = quoteFollowUps.some(fu => fu.status === 'pending');
    const hasScheduled = quoteFollowUps.some(fu => fu.status === 'scheduled');
    const hasSent = quoteFollowUps.some(fu => fu.status === 'sent');
    
    if (hasPending) return 'pending';
    if (hasScheduled) return 'scheduled';
    if (hasSent) return 'sent';
    return 'none';
  };

  const getFollowUpStatusLabel = (status) => {
    const labels = {
      none: 'Aucune',
      pending: 'En attente',
      scheduled: 'Programmée',
      sent: 'Envoyée',
      stopped: 'Arrêtée',
      failed: 'Échouée'
    };
    return labels[status] || 'Aucune';
  };

  const getFollowUpStatusColor = (status) => {
    const colors = {
      none: 'bg-gray-100 text-gray-700',
      pending: 'bg-orange-100 text-orange-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      stopped: 'bg-gray-200 text-gray-700',
      failed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré'
    };
    return statusMap[status] || status;
  };

  const isQuoteExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getQuotePriority = (quote) => {
    // Priority order: expired > sent > draft > accepted > rejected
    const priorityMap = {
      expired: 1,
      sent: 2,
      draft: 3,
      accepted: 4,
      rejected: 5
    };
    return priorityMap[quote.status] || 6;
  };

  // Action handlers
  const handleRefresh = async () => {
    // Refresh quotes data
    window.location.reload();
  };

  // Removed AI handlers

  const handleBulkAction = async (action) => {
    if (selectedQuotes.length === 0) return;
    
    try {
      switch (action) {
        case 'delete':
          setTableLoading(true);
          await Promise.all(selectedQuotes.map(async (id) => {
            if (String(id).startsWith('draft-')) {
              try { await deleteQuoteDraftById(String(id).replace('draft-', '')); } catch (_) {}
            } else {
              await deleteQuote(id);
            }
          }));
          setQuotes(prev => prev.filter(q => !selectedQuotes.includes(q.id)));
          setFilteredQuotes(prev => prev.filter(q => !selectedQuotes.includes(q.id)));
          break;
        case 'export': {
          // Export selected quotes as CSV (flattened rows)
          const fullQuotes = await Promise.all(
            selectedQuotes.map(async (id) => {
              const { data } = await fetchQuoteById(id);
              return data;
            })
          );

          const rows = [];
          fullQuotes.forEach((q) => {
            const base = {
              quote_id: q.id,
              quote_number: q.quote_number,
              status: q.status,
              created_at: q.created_at,
              client_name: q.client?.name || '',
              client_email: q.client?.email || '',
              total_amount: q.total_amount ?? '',
              tax_amount: q.tax_amount ?? '',
              final_amount: q.final_amount ?? '',
              deadline: q.deadline ?? '',
              category: Array.isArray(q.project_categories) ? q.project_categories.join('|') : '',
            };

            if (q.quote_tasks?.length) {
              q.quote_tasks.forEach((t) => {
                const taskRow = {
                  ...base,
                  task_id: t.id,
                  task_name: t.name || '',
                  task_description: (t.description || '').replace(/\n/g, ' '),
                  task_quantity: t.quantity ?? '',
                  task_unit: t.unit || '',
                  task_unit_price: t.unit_price ?? '',
                  task_total_price: t.total_price ?? '',
                  task_duration: t.duration ?? '',
                  task_duration_unit: t.duration_unit || '',
                };

                const materials = (q.quote_materials || []).filter((m) => m.quote_task_id === t.id);
                if (materials.length) {
                  materials.forEach((m) => {
                    rows.push({
                      ...taskRow,
                      material_id: m.id,
                      material_name: m.name || '',
                      material_quantity: m.quantity ?? '',
                      material_unit: m.unit || '',
                      material_unit_price: m.unit_price ?? '',
                      material_total_price: m.total_price ?? '',
                    });
                  });
                } else {
                  rows.push(taskRow);
                }
              });
            } else {
              rows.push(base);
            }
          });

          const headers = [
            'quote_id','quote_number','status','created_at','client_name','client_email','total_amount','tax_amount','final_amount','deadline','category',
            'task_id','task_name','task_description','task_quantity','task_unit','task_unit_price','task_total_price','task_duration','task_duration_unit',
            'material_id','material_name','material_quantity','material_unit','material_unit_price','material_total_price'
          ];

          const escapeCSV = (val) => {
            if (val == null) return '';
            const s = String(val);
            if (/[",\n]/.test(s)) {
              return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
          };

          const csv = [headers.join(',')]
            .concat(rows.map((r) => headers.map((h) => escapeCSV(r[h])).join(',')))
            .join('\n');

          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const dateStr = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
          a.href = url;
          a.download = `quotes-export-${dateStr}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          break;
        }
        default:
          console.log(`Bulk action ${action} for quotes:`, selectedQuotes);
      }
      
      // Clear selection after action
      setSelectedQuotes([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      if (action === 'delete') {
        setTableLoading(false);
      }
    }
  };

  const handleQuoteSelect = (quote) => {
    // No-op (AI removed)
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-16 pt-4' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center">
                  <Icon name="FileText" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des devis</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Gérez et optimisez vos devis avec l'intelligence artificielle
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
              
              {/* Relances and Analyse IA buttons removed */}
              
              <Button
                variant="default"
                onClick={() => navigate('/quote-creation')}
                iconName="Plus"
                iconPosition="left"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Nouveau devis</span>
              </Button>
            </div>
          </div>


        </header>

          {/* Stats Cards (actual data) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total devis</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.total}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-full p-2 sm:p-2.5">
                  <Icon name="FileText" size={16} className="sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Brouillons</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.drafts}
                  </p>
                </div>
                <div className="bg-muted rounded-full p-2 sm:p-2.5">
                  <Icon name="ClipboardList" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Envoyés</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.sent}
                  </p>
                </div>
                <div className="bg-amber-100 rounded-full p-2 sm:p-2.5">
                  <Icon name="Clock" size={16} className="sm:w-5 sm:h-5 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Montant moyen</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                    {loading ? '...' : formatCurrency(stats.averageAmount || 0)}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-full p-2 sm:p-2.5">
                  <Icon name="Euro" size={16} className="sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearFilters}
          quotes={quotes}
          />

          {/* Bulk Actions */}
          {selectedQuotes.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedQuotes.length}
              onBulkAction={handleBulkAction}
              onClearSelection={handleClearSelection}
            />
          )}

          {/* Quotes Table */}
          <div className="relative">
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des devis...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <Icon name="AlertCircle" size={24} className="text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Réessayer
                </Button>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun devis trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {quotes.length === 0 
                    ? "Bienvenue ! Vous n'avez pas encore créé de devis. Commencez par en créer un nouveau pour gérer vos projets professionnels."
                    : "Aucun devis ne correspond aux filtres appliqués. Essayez de modifier vos critères de recherche."
                  }
                </p>
                {quotes.length === 0 && (
                  <Button onClick={() => navigate('/quote-creation')} variant="default" className="gap-2">
                    <Icon name="Plus" size={16} />
                    Créer votre premier devis
                  </Button>
                )}
                {quotes.length > 0 && (
                  <Button onClick={clearFilters} variant="outline" className="gap-2">
                    <Icon name="RotateCcw" size={16} />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : (
              <QuotesTable
                quotes={filteredQuotes}
                selectedQuotes={selectedQuotes}
                onSelectQuote={handleSelectQuote}
                onSelectAll={handleSelectAll}
                onQuoteAction={handleQuoteAction}
                onQuoteSelect={handleQuoteSelect}
                viewMode={viewMode}
                setViewMode={setViewMode}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}
            </div>
            {tableLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
          
          {/* Mobile Actions */}
          <div className="md:hidden flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              iconName={loading ? "Loader2" : "RefreshCw"}
              iconPosition="left"
              className="flex-1 text-xs sm:text-sm"
              disabled={loading}
            >
              {loading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>

          {/* Mobile AI Panel removed */}


        </div>
      </main>

      {/* Desktop AI Panel removed */}

      {/* Follow-up side panel removed per request */}
    </div>
  );
};

export default QuotesManagement;