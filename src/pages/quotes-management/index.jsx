import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import QuotesTable from './components/QuotesTable';
import FilterBar from './components/FilterBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import AIAnalyticsPanel from './components/AIAnalyticsPanel';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { fetchQuotes, getQuoteStatistics } from '../../services/quotesService';
import { 
  listScheduledFollowUps, 
  createFollowUpForQuote, 
  stopFollowUpsForQuote,
  logQuoteEvent 
} from '../../services/followUpService';
import FollowUpManagementPanel from './components/FollowUpManagementPanel';

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
    signed: 0,
    pending: 0,
    averageScore: 0
  });
  
  // Follow-up related state
  const [followUps, setFollowUps] = useState({});
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [showFollowUpPanel, setShowFollowUpPanel] = useState(false);
  const [selectedQuoteForFollowUp, setSelectedQuoteForFollowUp] = useState(null);
  
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    search: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Apply filters to quotes
  useEffect(() => {
    let filtered = [...quotes];
    
    if (filters.status) {
      filtered = filtered.filter(q => q.status === filters.status);
    }
    
    if (filters.client) {
      filtered = filtered.filter(q => q.client?.id?.toString() === filters.client);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.number.toLowerCase().includes(searchLower) ||
        q.clientName.toLowerCase().includes(searchLower) ||
        q.description.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredQuotes(filtered);
  }, [quotes, filters]);

  // Fetch quotes data from backend
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user || !currentProfile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quotes
        const { data: quotesData, error: quotesError } = await fetchQuotes();
        
        // Handle case when no quotes exist (this is not an error)
        if (!quotesData || quotesData.length === 0) {
          setQuotes([]);
          setFilteredQuotes([]);
          setStats({ total: 0, signed: 0, pending: 0, averageScore: 0 });
          return;
        }
        
        // Only set error for actual errors, not for empty data
        if (quotesError) {
          console.error('Error fetching quotes:', quotesError);
          setError('Erreur lors du chargement des devis');
          return;
        }
        
        // Transform backend data to match frontend structure
        const transformedQuotes = quotesData.map(quote => ({
          id: quote.id,
          number: quote.quote_number,
          clientName: quote.client?.name || 'Client inconnu',
          amount: parseFloat(quote.total_with_tax || quote.total_amount || 0),
          amountFormatted: formatCurrency(parseFloat(quote.total_with_tax || quote.total_amount || 0)),
          status: quote.status,
          statusLabel: getStatusLabel(quote.status),
          createdAt: quote.created_at,
          createdAtFormatted: formatDate(quote.created_at),
          aiScore: Math.floor(Math.random() * 40) + 60, // Placeholder AI score
          description: quote.project_description || 'Aucune description',
          client: quote.client,
          companyProfile: quote.company_profile,
          tasks: quote.quote_tasks || [],
          materials: quote.quote_materials || [],
          files: quote.quote_files || [],
          deadline: quote.deadline,
          deadlineFormatted: formatDate(quote.deadline),
          validUntil: quote.expires_at,
          validUntilFormatted: formatDate(quote.expires_at),
          isExpired: isQuoteExpired(quote.expires_at),
          terms: quote.terms_conditions
        }));
        
        // Sort quotes by priority
        const sortedQuotes = transformedQuotes.sort((a, b) => getQuotePriority(a) - getQuotePriority(b));
        
        setQuotes(sortedQuotes);
        
        // Calculate stats
        const total = sortedQuotes.length;
        const signed = sortedQuotes.filter(q => q.status === 'accepted').length;
        const pending = sortedQuotes.filter(q => ['sent', 'draft'].includes(q.status)).length;
        const averageScore = total > 0 ? Math.round(sortedQuotes.reduce((acc, q) => acc + q.aiScore, 0) / total) : 0;
        
        setStats({ total, signed, pending, averageScore });
        
      } catch (err) {
        console.error('Error loading quotes:', err);
        // Only show error for actual network/server errors, not for empty data
        if (err.message && !err.message.includes('No data')) {
          setError('Erreur lors du chargement des devis');
        } else {
          // If it's just no data, set empty state
          setQuotes([]);
          setFilteredQuotes([]);
          setStats({ total: 0, signed: 0, pending: 0, averageScore: 0 });
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
      if (!user || !currentProfile || quotes.length === 0) return;
      
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

  // Update quotes with follow-up status
  const updateQuotesWithFollowUpStatus = (followUpsData) => {
    setQuotes(prevQuotes => 
      prevQuotes.map(quote => {
        const quoteFollowUps = followUpsData[quote.id] || [];
        const followUpStatus = getFollowUpStatus(quote.id);
        
        return {
          ...quote,
          followUpStatus,
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus),
          followUpCount: quoteFollowUps.length
        };
      })
    );
    
    setFilteredQuotes(prevFilteredQuotes => 
      prevFilteredQuotes.map(quote => {
        const quoteFollowUps = followUpsData[quote.id] || [];
        const followUpStatus = getFollowUpStatus(quote.id);
        
        return {
          ...quote,
          followUpStatus,
          followUpStatusLabel: getFollowUpStatusLabel(followUpStatus),
          followUpStatusColor: getFollowUpStatusColor(followUpStatus),
          followUpCount: quoteFollowUps.length
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

  const handleClearFilters = () => {
    setFilters({
      status: '',
      client: '',
      search: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
  };

  const handleBulkOptimize = () => {
    if (selectedQuotes.length > 0) {
      handleBulkAction('ai-optimize');
    }
  };

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
      case 'convert':
        if (quote.status === 'accepted') {
          navigate(`/invoices-management?convert=${quote.id}`);
        } else {
          console.log('Quote must be accepted before converting to invoice');
        }
        break;
      case 'optimize':
        setSelectedQuote(quote);
        setShowAIPanel(true);
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
      const followUpId = await createFollowUpForQuote(quote.id, 1);
      
      // Log the event
      await logQuoteEvent({
        quote_id: quote.id,
        user_id: user.id,
        type: 'followup_manual',
        meta: { stage: 1, manual: true }
      });

      // Refresh follow-ups
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
      }

      console.log('Follow-up created successfully:', followUpId);
    } catch (error) {
      console.error('Error creating follow-up:', error);
    }
  };

  const handleStopFollowUps = async (quoteId) => {
    try {
      await stopFollowUpsForQuote(quoteId);
      
      // Refresh follow-ups
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
      }

      console.log('Follow-ups stopped successfully');
    } catch (error) {
      console.error('Error stopping follow-ups:', error);
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
      sent: 'Envoyée'
    };
    return labels[status] || 'Aucune';
  };

  const getFollowUpStatusColor = (status) => {
    const colors = {
      none: 'bg-gray-100 text-gray-700',
      pending: 'bg-orange-100 text-orange-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700'
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

  const handleOptimizeQuote = async (quote) => {
    // Handle quote optimization with AI
    console.log('Optimizing quote:', quote.id);
    // This would integrate with your AI service
  };

  const handleFollowUpRecommendation = async (quote) => {
    // Handle follow-up recommendations
    console.log('Getting follow-up recommendations for quote:', quote.id);
    // This would integrate with your AI service
  };

  const handleBulkAction = async (action) => {
    if (selectedQuotes.length === 0) return;
    
    try {
      switch (action) {
        case 'delete':
          // Implement bulk delete logic
          console.log(`Bulk delete for quotes:`, selectedQuotes);
          break;
        case 'export':
          // Implement bulk export logic
          console.log(`Bulk export for quotes:`, selectedQuotes);
          break;
        case 'ai-optimize':
          // Implement bulk AI optimization
          console.log(`Bulk AI optimization for quotes:`, selectedQuotes);
          break;
        default:
          console.log(`Bulk action ${action} for quotes:`, selectedQuotes);
      }
      
      // Clear selection after action
      setSelectedQuotes([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleQuoteSelect = (quote) => {
    setSelectedQuote(quote);
    // Remove automatic AI panel opening - user must click AI button explicitly
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
              
              <Button
                variant="outline"
                onClick={() => setShowFollowUpPanel(!showFollowUpPanel)}
                iconName={showFollowUpPanel ? "PanelRightClose" : "MessageCircle"}
                iconPosition="left"
                className="hidden md:flex text-xs sm:text-sm"
              >
                Relances
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAIPanel(!showAIPanel)}
                iconName={showAIPanel ? "PanelRightClose" : "PanelRightOpen"}
                iconPosition="left"
                className="hidden md:flex text-xs sm:text-sm"
              >
                Analyse IA
              </Button>
              
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

          {/* Stats Cards */}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Signés</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-success">
                    {loading ? '...' : stats.signed}
                  </p>
                </div>
                <div className="bg-success/10 rounded-full p-2 sm:p-2.5">
                  <Icon name="CheckCircle" size={16} className="sm:w-5 sm:h-5 text-success" />
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">En attente</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">
                    {loading ? '...' : stats.pending}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Score IA moyen</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                    {loading ? '...' : `${stats.averageScore}%`}
                  </p>
                </div>
                <div className="bg-accent/10 rounded-full p-2 sm:p-2.5">
                  <Icon name="Sparkles" size={16} className="sm:w-5 sm:h-5 text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
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
                  <Button onClick={handleClearFilters} variant="outline" className="gap-2">
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
              />
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
            
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowAIPanel(!showAIPanel)}
              iconName="Sparkles"
              iconPosition="left"
              className="flex-1 text-xs sm:text-sm"
            >
              {showAIPanel ? 'Masquer' : 'Afficher'} l'analyse IA
            </Button>
          </div>

          {/* Mobile AI Panel */}
          {showAIPanel && (
            <div className="md:hidden bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Analyse IA</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIPanel(false)}
                >
                  <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
                </Button>
              </div>
              <AIAnalyticsPanel
                selectedQuote={selectedQuote}
                onOptimizeQuote={handleOptimizeQuote}
                onFollowUpRecommendation={handleFollowUpRecommendation}
              />
            </div>
          )}


        </div>
      </main>

      {/* Desktop AI Panel */}
      {showAIPanel && (
        <div className="hidden md:block fixed right-0 top-0 w-80 h-full bg-background border-l border-border overflow-y-auto z-50 shadow-lg">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
                <Icon name="Sparkles" size={16} className="sm:w-[18px] sm:h-[18px] text-primary mr-2" />
                Analyse IA
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIPanel(false)}
              >
                <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <AIAnalyticsPanel
              selectedQuote={selectedQuote}
              onOptimizeQuote={handleOptimizeQuote}
              onFollowUpRecommendation={handleFollowUpRecommendation}
            />
          </div>
        </div>
      )}

      {/* Desktop Follow-up Panel */}
      {showFollowUpPanel && (
        <div className="hidden md:block fixed right-0 top-0 w-80 h-full bg-background border-l border-border overflow-y-auto z-50 shadow-lg">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
                <Icon name="MessageCircle" size={16} className="sm:w-[18px] sm:h-[18px] text-primary mr-2" />
                Gestion des Relances
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFollowUpPanel(false)}
              >
                <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <FollowUpManagementPanel
              selectedQuote={selectedQuoteForFollowUp}
              followUps={followUps}
              onSendFollowUp={handleSendFollowUpNow}
              onStopFollowUps={handleStopFollowUps}
              loading={followUpLoading}
            />
          </div>
        </div>
      )}

      {/* Mobile Panels */}
      {showAIPanel && (
        <div className="md:hidden fixed inset-0 bg-background z-50 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
                <Icon name="Sparkles" size={16} className="sm:w-[18px] sm:h-[18px] text-primary mr-2" />
                Analyse IA
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIPanel(false)}
              >
                <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <AIAnalyticsPanel
              selectedQuote={selectedQuote}
              onOptimizeQuote={handleOptimizeQuote}
              onFollowUpRecommendation={handleFollowUpRecommendation}
            />
          </div>
        </div>
      )}

      {showFollowUpPanel && (
        <div className="md:hidden fixed inset-0 bg-background z-50 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
                <Icon name="MessageCircle" size={16} className="sm:w-[18px] sm:h-[18px] text-primary mr-2" />
                Gestion des Relances
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFollowUpPanel(false)}
              >
                <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <FollowUpManagementPanel
              selectedQuote={selectedQuoteForFollowUp}
              followUps={followUps}
              onSendFollowUp={handleSendFollowUpNow}
              onStopFollowUps={handleStopFollowUps}
              loading={followUpLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesManagement;