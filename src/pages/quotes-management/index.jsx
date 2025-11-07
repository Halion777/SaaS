import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TableLoader, { TableSkeletonLoader } from '../../components/ui/TableLoader';
import QuotesTable from './components/QuotesTable';
import FilterBar from './components/FilterBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import { useTranslation } from 'react-i18next';
// Analyse IA removed
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { 
  fetchQuotes, 
  getQuoteStatistics, 
  updateQuoteStatus, 
  deleteQuote, 
  fetchQuoteById, 
  loadQuoteDraft, 
  deleteQuoteDraftById, 
  listQuoteDrafts,
  processQuoteExpirations,
  convertQuoteToInvoice
} from '../../services/quotesService';
import { supabase } from '../../services/supabaseClient';
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
  const { t } = useTranslation();
  
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

  // Helper function to calculate draft amount with robust fallbacks
  const calculateDraftAmount = (draftData) => {
    if (!draftData) return 0;
    
    // First, check if we have pre-calculated amounts from the auto-save
    if (draftData.finalAmount !== undefined) {
      // Get the final amount with VAT included
      let amount = parseFloat(draftData.finalAmount);
      
      // Subtract deposit if it exists
      if (draftData.depositAmount !== undefined && draftData.depositAmount > 0) {
        amount -= parseFloat(draftData.depositAmount);
      }
      
      return amount;
    }
    
    if (draftData.projectInfo?.finalAmount !== undefined) {
      // Get the final amount with VAT included
      let amount = parseFloat(draftData.projectInfo.finalAmount);
      
      // Subtract deposit if it exists
      if (draftData.projectInfo?.depositAmount !== undefined && draftData.projectInfo.depositAmount > 0) {
        amount -= parseFloat(draftData.projectInfo.depositAmount);
      }
      
      return amount;
    }
    
    // If we have totalAmount and taxAmount, calculate final amount
    if (draftData.totalAmount !== undefined && draftData.taxAmount !== undefined) {
      // Calculate total with VAT
      let amount = parseFloat(draftData.totalAmount) + parseFloat(draftData.taxAmount);
      
      // Subtract deposit if it exists
      if (draftData.depositAmount !== undefined && draftData.depositAmount > 0) {
        amount -= parseFloat(draftData.depositAmount);
      }
      
      return amount;
    }
    
    if (draftData.projectInfo?.totalAmount !== undefined && draftData.projectInfo?.taxAmount !== undefined) {
      // Calculate total with VAT
      let amount = parseFloat(draftData.projectInfo.totalAmount) + parseFloat(draftData.projectInfo.taxAmount);
      
      // Subtract deposit if it exists
      if (draftData.projectInfo?.depositAmount !== undefined && draftData.projectInfo.depositAmount > 0) {
        amount -= parseFloat(draftData.projectInfo.depositAmount);
      }
      
      return amount;
    }
    
    // Fall back to calculating from tasks and materials
    let total = 0;
    
    // Handle tasks - they have a direct 'price' field for flat rate pricing
    const tasks = draftData.tasks || draftData.quote_tasks || draftData.quoteTasks || [];
    total += tasks.reduce((sum, task) => {
      // For flat rate tasks, use the price directly
      const taskPrice = parseFloat(task.price || 0);
      return sum + taskPrice;
    }, 0);
    
    // Handle materials - they have price and quantity fields
    const materials = draftData.materials || draftData.quote_materials || draftData.quoteMaterials || [];
    total += materials.reduce((sum, material) => {
      const quantity = parseFloat(material.quantity || material.qty || 1);
      const price = parseFloat(material.price || material.unit_price || material.unitPrice || 0);
      return sum + (quantity * price);
    }, 0);
    
    // If no tasks/materials or total is 0, try direct amount fields
    if (total === 0) {
      total = parseFloat(draftData.total_amount || draftData.totalAmount || draftData.total || draftData.amount || 0);
    }
    
    // Apply VAT if enabled in financialConfig
    if (draftData.financialConfig?.vatConfig?.display && total > 0) {
      const vatRate = parseFloat(draftData.financialConfig.vatConfig.rate || 20);
      total = total * (1 + vatRate / 100);
    }
    
    // Subtract deposit amount if enabled in financialConfig
    if (draftData.financialConfig?.advanceConfig?.enabled && draftData.financialConfig?.advanceConfig?.amount > 0) {
      const depositAmount = parseFloat(draftData.financialConfig.advanceConfig.amount);
      total = total - depositAmount;
    }
    
    return total;
  };

  // Fetch quotes data from backend
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user || !currentProfile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Process quote expirations using the service function
        try {
          const { success, data, error } = await processQuoteExpirations(user.id);
          
          if (!success || error) {
            console.warn('Expiration check failed during data loading:', error);
          } else if (data && data.expired > 0) {
            console.log(`Processed ${data.processed} quotes, marked ${data.expired} as expired`);
          }
        } catch (expError) {
          console.warn('Error checking expirations during data loading:', expError);
          // Continue with fetch even if expiration check fails
        }
        
        // Fetch quotes (after expiration check)
        const { data: quotesData, error: quotesError } = await fetchQuotes(user.id);
        
        // If none in quotes yet, try showing a draft placeholder
        if (!quotesData || quotesData.length === 0) {
          try {
            const { data: draft, error: draftError } = await loadQuoteDraft(user.id, currentProfile?.id || null);
            if (draftError) {
              console.log('QuotesManagement: loadQuoteDraft error', draftError);
            }
            if (draft?.draft_data) {
              const d = draft.draft_data;
              const placeholder = {
                id: `draft-${draft.id}`,
                number: '(brouillon non envoyé)',
                clientName: d.selectedClient?.client?.name || d.selectedClient?.label || d.selectedClient?.name || 'Client inconnu',
                amount: calculateDraftAmount(d),
                amountFormatted: formatCurrency(calculateDraftAmount(d)),
                status: 'Auto-Sauvegardé',
                statusLabel: 'Brouillon Auto-Sauvegardé',
                isDraftPlaceholder: true,
                createdAt: draft.last_saved,
                createdAtFormatted: formatDate(draft.last_saved),
                description: d.projectInfo?.description || 'Brouillon en cours',
                              client: d.selectedClient?.client || d.selectedClient || null,
                tasks: d.tasks || [],
              materials: d.materials || [],
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
              number: draft.quote_number || '(brouillon non envoyé)',
              clientName: d.selectedClient?.client?.name || d.selectedClient?.label || d.selectedClient?.name || 'Client inconnu',
              amount: calculateDraftAmount(d),
              amountFormatted: formatCurrency(calculateDraftAmount(d)),
              status: 'Auto-Sauvegardé',
              statusLabel: 'Brouillon Auto-Sauvegardé',
              isDraftPlaceholder: true,
              createdAt: draft.last_saved,
              createdAtFormatted: formatDate(draft.last_saved),
              description: d.projectInfo?.description || 'Brouillon en cours',
              client: d.selectedClient?.client || d.selectedClient || null,
              tasks: d.tasks || [],
              materials: d.materials || [],
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
          const transformedQuotes = (quotesData || []).map(quote => {
            // Calculate the final amount including VAT if enabled
            let finalAmount = parseFloat(quote.final_amount || quote.total_amount || 0);
            
            // If VAT is enabled, make sure we include it in the displayed amount
            if (quote.tax_amount && quote.tax_amount > 0) {
              finalAmount = parseFloat(quote.final_amount || (parseFloat(quote.total_amount || 0) + parseFloat(quote.tax_amount || 0)));
            }
            
            // Subtract deposit amount if it exists in financial configs
            let depositAmount = 0;
            
            // Check if there are financial configs with advance_config
            if (quote.quote_financial_configs && quote.quote_financial_configs.length > 0) {
              const financialConfig = quote.quote_financial_configs[0];
              if (financialConfig.advance_config && financialConfig.advance_config.enabled) {
                depositAmount = parseFloat(financialConfig.advance_config.amount || 0);
              }
            }
            
            // Fallback to advance_payment_amount if it exists
            if (depositAmount === 0) {
              depositAmount = parseFloat(quote.advance_payment_amount || 0);
            }
            
            if (depositAmount > 0) {
              finalAmount = finalAmount - depositAmount;
            }
            
            return {
              id: quote.id,
              number: quote.quote_number,
              clientName: quote.client?.name || 'Client inconnu',
              amount: finalAmount,
              amountFormatted: formatCurrency(finalAmount),
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
            };
          });
        
        // Sort quotes by priority
        const merged = [...transformedQuotes, ...additionalDrafts];
        const sortedQuotes = merged.sort((a, b) => getQuotePriority(a) - getQuotePriority(b));
        
        // Merge existing follow-ups (if already loaded) to avoid transient 'Aucune'
        if (followUps && Object.keys(followUps).length > 0) {
          const merged = sortedQuotes.map(quote => {
            const quoteFollowUps = followUps[quote.id] || [];
            
            // Use the same selection logic as updateQuotesWithFollowUpStatus
            const selectFollowUp = (arr) => {
              if (!arr || arr.length === 0) return null;
              
              // Priority order for display:
              // 1. pending (highest priority - immediate action needed)
              // 2. scheduled (next priority - future action)
              // 3. failed (needs attention)
              // 4. stopped (completed/stopped)
              // 5. sent (completed successfully)
              
              const pending = arr.find(f => f.status === 'pending');
              if (pending) return pending;
              
              const scheduled = arr.find(f => f.status === 'scheduled');
              if (scheduled) return scheduled;
              
              const failed = arr.find(f => f.status === 'failed');
              if (failed) return failed;
              
              const stopped = arr.find(f => f.status === 'stopped');
              if (stopped) return stopped;
              
              const sent = arr.find(f => f.status === 'sent');
              if (sent) return sent;
              
              return arr[0];
            };
            
            const picked = selectFollowUp(quoteFollowUps);
            const followUpStatus = picked?.status || 'none';
            
            return {
              ...quote,
              followUpStatus,
              followUpStatusLabel: getFollowUpStatusLabel(followUpStatus, quote.status),
              followUpStatusColor: getFollowUpStatusColor(followUpStatus, quote.status),
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
      
      // Priority order for display:
      // 1. pending (highest priority - immediate action needed)
      // 2. scheduled (next priority - future action)
      // 3. failed (needs attention)
      // 4. stopped (completed/stopped)
      // 5. sent (completed successfully)
      
      // First, look for pending follow-ups (immediate action needed)
      const pending = arr.find(f => f.status === 'pending');
      if (pending) return pending;
      
      // Then look for scheduled follow-ups (future action)
      const scheduled = arr.find(f => f.status === 'scheduled');
      if (scheduled) return scheduled;
      
      // Then look for failed follow-ups (needs attention)
      const failed = arr.find(f => f.status === 'failed');
      if (failed) return failed;
      
      // Then look for stopped follow-ups
      const stopped = arr.find(f => f.status === 'stopped');
      if (stopped) return stopped;
      
      // Finally, look for sent follow-ups
      const sent = arr.find(f => f.status === 'sent');
      if (sent) return sent;
      
      // Fallback to first available
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
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus, quote.status),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus, quote.status),
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
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus, quote.status),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus, quote.status),
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

  const handleConvertToInvoice = async (quote) => {
    try {
      setTableLoading(true);
      
      const result = await convertQuoteToInvoice(quote, user.id);
      
      if (result.success) {
        // Navigate to invoices management page immediately after successful conversion
        navigate('/invoices-management');
        
        // Refresh quotes list in background (optional, as user is navigating away)
        // await handleRefresh();
      } else {
        alert(`Erreur lors de la conversion: ${result.error}`);
      }
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      alert('Erreur lors de la conversion du devis en facture');
    } finally {
      setTableLoading(false);
    }
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
        await handleConvertToInvoice(quote);
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
      case 'sync_status':
        await syncQuoteStatusWithBackend(quote.id);
        break;
      case 'test_expiration':
        await testQuoteExpiration(quote.id);
        break;
      case 'cleanup_finalized':
        await cleanupFinalizedQuote(quote.id);
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
      // First, check if the quote has a valid share token
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('share_token, is_public')
        .eq('id', quote.id)
        .single();
      
      // If no share token or not public, generate and save one
      if (!quoteData?.share_token || !quoteData?.is_public) {
        // Import the share service to generate a proper share token
        const { generatePublicShareLink } = await import('../../services/shareService');
        const shareResult = await generatePublicShareLink(quote.id, user.id);
        
        if (!shareResult?.success) {
          console.error('Failed to generate share token for manual follow-up');
        }
      } else {
        // Ensure is_public is set to TRUE even if share_token exists
        await supabase
          .from('quotes')
          .update({ is_public: true })
          .eq('id', quote.id);
      }
      
      // Create immediate follow-up
      const followUpId = await createFollowUpForQuote(quote.id, 1, user.id);
      
      // Get the quote with the updated share token
      const { data: updatedQuote } = await supabase
        .from('quotes')
        .select('share_token')
        .eq('id', quote.id)
        .single();
      
      // Log the event with the share token from the quotes table
      await logQuoteEvent({
        quote_id: quote.id,
        user_id: user.id,
        type: 'followup_manual',
        meta: { 
          stage: 1, 
          manual: true,
          project: `${quote.quote_number} - ${quote.title}`,
          client_name: quote.client?.name || 'Client',
          email_sent: true
        },
        share_token: updatedQuote?.share_token
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

      // Check if email was already sent for this quote to prevent duplicates
      const { data: existingEvents } = await supabase
        .from('quote_events')
        .select('id, type, meta')
        .eq('quote_id', quote.id)
        .eq('type', 'email_sent')
        .limit(1);

      // Only send email if no email event exists (prevents duplicate emails)
      if (!existingEvents || existingEvents.length === 0) {
        try {
          // Get client information
          const client = quote.client || {
            name: quote.client_name || 'Client',
            email: quote.client_email
          };

          // Check if we have valid client email
          if (!client.email) {
            console.warn('Cannot send email: No client email found for quote', quote.id);
            return;
          }

          // Get company profile information
          let companyProfile = null;
          if (quote.company_profile) {
            companyProfile = {
              company_name: quote.company_profile.company_name,
              // Add other company fields as needed
            };
          }

          // Send email using the new method
          const { EmailService } = await import('../../services/emailService');
          const emailResult = await EmailService.sendDraftQuoteMarkedAsSentEmail(
            updatedQuote || quote,
            client,
            companyProfile,
            user?.id
          );

          if (emailResult.success) {
            console.log('Email sent successfully when marking quote as sent');
            
            // Log the email event to prevent future duplicates
            try {
              // Use the logQuoteEvent function to ensure share token is set correctly
              await logQuoteEvent({
                quote_id: quote.id,
                user_id: user?.id || null,
                type: 'email_sent',
                meta: {
                  email_type: 'draft_marked_as_sent',
                  recipient: client.email,
                  timestamp: new Date().toISOString(),
                  source: 'quotes_management'
                }
              });
            } catch (eventError) {
              console.warn('Failed to log email event:', eventError);
            }
          } else {
            console.warn('Failed to send email when marking quote as sent:', emailResult.error);
          }
        } catch (emailError) {
          console.warn('Error sending email when marking quote as sent:', emailError);
          // Don't fail the quote status update if email fails
        }
      } else {
        console.log('Email already sent for this quote, skipping duplicate email');
      }

      // Refresh follow-ups to show the newly created ones
      await refreshFollowUps();

   
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

  const getFollowUpStatusLabel = (status, quoteStatus) => {
    // Disable follow-ups for accepted/rejected quotes - no need for relances
    if (quoteStatus === 'accepted' || quoteStatus === 'rejected') {
      return t('quotesManagement.followUpStatus.stopped');
    }
    
    // Handle expired quotes
    if (quoteStatus === 'expired') {
      return t('quotesManagement.followUpStatus.expired');
    }
    
    return t(`quotesManagement.followUpStatus.${status}`) || t('quotesManagement.followUpStatus.none');
  };

  const getFollowUpStatusColor = (status, quoteStatus) => {
    // Disable follow-ups for accepted/rejected quotes - show as disabled
    if (quoteStatus === 'accepted' || quoteStatus === 'rejected') {
      return 'bg-gray-100 text-gray-500';
    }
    
    // Handle expired quotes
    if (quoteStatus === 'expired') {
      return 'bg-red-50 text-red-600';
    }
    
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
    if (status === 'Auto-Sauvegardé') {
      return 'Brouillon Auto-Sauvegardé';
    }
    return t(`quotesManagement.filter.status.${status}`) || status;
  };

  // Check if a quote is expired based on its valid_until date
  const isQuoteExpired = (expiresAt) => {
    if (!expiresAt) return false;
    
    // Parse the valid_until date - handle both date-only and full ISO formats
    let validUntilDate;
    if (typeof expiresAt === 'string') {
      if (expiresAt.includes('T')) {
        // Full ISO date
        validUntilDate = new Date(expiresAt);
      } else {
        // Date-only format (YYYY-MM-DD)
        const [year, month, day] = expiresAt.split('-').map(Number);
        validUntilDate = new Date(year, month - 1, day); // Month is 0-based in JS
      }
    } else if (expiresAt instanceof Date) {
      validUntilDate = expiresAt;
    } else {
      return false;
    }
    
    // Compare with current date (ignoring time for date-only values)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return validUntilDate < today;
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
    // No-op (removed quote detail panel)
  };

  // Sync quote status with backend to ensure accuracy
  const syncQuoteStatusWithBackend = async (quoteId) => {
    try {
      // Call edge function to sync status
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'sync_quote_status',
          quote_id: quoteId
        })
      });
      
      if (response.ok) {
        // Refresh the specific quote data
        const { data: updatedQuote, error } = await fetchQuoteById(quoteId);
        if (!error && updatedQuote) {
          // Update the quote in local state
          setQuotes(prevQuotes => 
            prevQuotes.map(q => 
              q.id === quoteId 
                ? {
                    ...q,
                    status: updatedQuote.status,
                    statusLabel: getStatusLabel(updatedQuote.status),
                    isExpired: isQuoteExpired(updatedQuote.valid_until || updatedQuote.expires_at)
                  }
                : q
            )
          );
        }
      }
    } catch (error) {
      console.warn('Error syncing quote status:', error);
    }
  };

  // Test expiration for a specific quote
  const testQuoteExpiration = async (quoteId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'test_expiration',
          quote_id: quoteId
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('Expiration test result:', result);
        // Refresh data to show updated status
        await loadQuotes(); // Use loadQuotes to refetch all data
        // Show success message
        alert(`Expiration test completed!\nPrevious: ${result.previous_status}\nCurrent: ${result.current_status}`);
      } else {
        console.error('Expiration test failed:', result.error);
        alert(`Expiration test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing expiration:', error);
      alert('Error testing expiration: ' + error.message);
    }
  };

  // Cleanup follow-ups for finalized quotes (accepted/rejected)
  const cleanupFinalizedQuote = async (quoteId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/followups-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'cleanup_finalized_quote',
          quote_id: quoteId
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('Follow-ups cleanup result:', result);
        // Refresh data to show updated status
        await loadQuotes(); // Use loadQuotes to refetch all data
        // Show success message
        alert(`Follow-ups cleaned up successfully!\nQuote status: ${result.status}\nCleanup completed: ${result.cleanup_completed}`);
      } else {
        console.error('Follow-ups cleanup failed:', result.error);
        alert(`Follow-ups cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cleaning up follow-ups:', error);
      alert('Error cleaning up follow-ups: ' + error.message);
    }
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
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('quotesManagement.title')}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {t('quotesManagement.subtitle')}
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
                {loading ? t('quotesManagement.refreshing') : t('quotesManagement.refresh')}
              </Button>
              
              {/* Relances and Analyse IA buttons removed */}
              
              <Button
                variant="default"
                onClick={() => navigate('/quote-creation')}
                iconName="Plus"
                iconPosition="left"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t('quotesManagement.newQuote')}</span>
              </Button>
            </div>
          </div>


        </header>

          {/* Stats Cards (actual data) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('quotesManagement.stats.totalQuotes')}</p>
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
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('quotesManagement.stats.drafts')}</p>
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
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('quotesManagement.stats.sent')}</p>
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
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('quotesManagement.stats.averageAmount')}</p>
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
              <div className="w-full">
                <TableLoader message={t('quotesManagement.table.loading')} />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <Icon name="AlertCircle" size={24} className="text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">{error || t('quotesManagement.table.error')}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  {t('quotesManagement.table.retry')}
                </Button>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('quotesManagement.table.noQuotesFound')}</h3>
                <p className="text-muted-foreground mb-4">
                  {quotes.length === 0 
                    ? t('quotesManagement.table.noQuotesMessage')
                    : t('quotesManagement.table.noMatchingQuotes')
                  }
                </p>
                {quotes.length === 0 && (
                  <Button onClick={() => navigate('/quote-creation')} variant="default" className="gap-2">
                    <Icon name="Plus" size={16} />
                    {t('quotesManagement.table.createFirstQuote')}
                  </Button>
                )}
                {quotes.length > 0 && (
                  <Button onClick={clearFilters} variant="outline" className="gap-2">
                    <Icon name="RotateCcw" size={16} />
                    {t('quotesManagement.table.clearFilters')}
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
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
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
              {loading ? t('quotesManagement.refreshing') : t('quotesManagement.refresh')}
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