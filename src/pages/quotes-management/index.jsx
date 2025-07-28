import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import QuotesTable from './components/QuotesTable';
import FilterBar from './components/FilterBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import AIAnalyticsPanel from './components/AIAnalyticsPanel';
import QuickActionsSection from './components/QuickActionsSection';

const QuotesManagement = () => {
  const navigate = useNavigate();
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Mock quotes data
  const mockQuotes = [
    {
      id: 'Q2025-001',
      number: 'DEV-2025-001',
      clientName: 'Marie Dubois',
      amount: 2450.00,
      status: 'signed',
      createdAt: '2025-01-15',
      aiScore: 92,
      description: 'Rénovation salle de bain complète'
    },
    {
      id: 'Q2025-002',
      number: 'DEV-2025-002',
      clientName: 'Pierre Martin',
      amount: 1850.00,
      status: 'viewed',
      createdAt: '2025-01-16',
      aiScore: 78,
      description: 'Installation électrique cuisine'
    },
    {
      id: 'Q2025-003',
      number: 'DEV-2025-003',
      clientName: 'Sophie Bernard',
      amount: 3200.00,
      status: 'sent',
      createdAt: '2025-01-17',
      aiScore: 65,
      description: 'Plomberie maison neuve'
    },
    {
      id: 'Q2025-004',
      number: 'DEV-2025-004',
      clientName: 'Jean Moreau',
      amount: 890.00,
      status: 'draft',
      createdAt: '2025-01-18',
      aiScore: 45,
      description: 'Réparation fuite robinet'
    },
    {
      id: 'Q2025-005',
      number: 'DEV-2025-005',
      clientName: 'Claire Petit',
      amount: 4100.00,
      status: 'refused',
      createdAt: '2025-01-14',
      aiScore: 58,
      description: 'Chauffage central appartement'
    },
    {
      id: 'Q2025-006',
      number: 'DEV-2025-006',
      clientName: 'Michel Durand',
      amount: 1650.00,
      status: 'signed',
      createdAt: '2025-01-13',
      aiScore: 88,
      description: 'Carrelage terrasse'
    },
    {
      id: 'Q2025-007',
      number: 'DEV-2025-007',
      clientName: 'Isabelle Leroy',
      amount: 2750.00,
      status: 'viewed',
      createdAt: '2025-01-12',
      aiScore: 72,
      description: 'Peinture intérieure maison'
    },
    {
      id: 'Q2025-008',
      number: 'DEV-2025-008',
      clientName: 'Thomas Roux',
      amount: 5200.00,
      status: 'sent',
      createdAt: '2025-01-11',
      aiScore: 81,
      description: 'Toiture complète garage'
    }
  ];

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
      selectedQuotes.length === mockQuotes.length ? [] : mockQuotes.map(q => q.id)
    );
  };

  const handleQuoteAction = (action, quote) => {
    switch (action) {
      case 'edit':
        navigate(`/quote-creation?edit=${quote.id}`);
        break;
      case 'duplicate':
        navigate(`/quote-creation?duplicate=${quote.id}`);
        break;
      case 'convert':
        navigate(`/invoices-management?convert=${quote.id}`);
        break;
      case 'optimize':
        setSelectedQuote(quote);
        setShowAIPanel(true);
        break;
      default:
        console.log(`Action ${action} for quote ${quote.id}`);
    }
  };

  const handleQuoteSelect = (quote) => {
    setSelectedQuote(quote);
    setShowAIPanel(true);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action ${action} for quotes:`, selectedQuotes);
    // Implement bulk actions logic here
    setSelectedQuotes([]);
  };

  const handleClearSelection = () => {
    setSelectedQuotes([]);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      client: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
  };

  const handleOptimizeQuote = (quote) => {
    console.log('Optimizing quote:', quote);
    // Implement AI optimization logic
  };

  const handleFollowUpRecommendation = (recommendation) => {
    console.log('Applying recommendation:', recommendation);
    // Implement recommendation logic
  };

  const handleBulkOptimize = () => {
    if (selectedQuotes.length > 0) {
      handleBulkAction('ai-optimize');
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
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des devis</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Gérez et optimisez vos devis avec l'intelligence artificielle
                  </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
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
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{mockQuotes.length}</p>
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
                    {mockQuotes.filter(q => q.status === 'signed').length}
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
                    {mockQuotes.filter(q => ['sent', 'viewed'].includes(q.status)).length}
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
                    {Math.round(mockQuotes.reduce((acc, q) => acc + q.aiScore, 0) / mockQuotes.length)}%
                  </p>
                </div>
                <div className="bg-accent/10 rounded-full p-2 sm:p-2.5">
                  <Icon name="Sparkles" size={16} className="sm:w-5 sm:h-5 text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section - Positioned above the filters */}
          <QuickActionsSection
            onBulkOptimize={handleBulkOptimize}
            selectedCount={selectedQuotes.length}
          />

          {/* Filters */}
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
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
            <QuotesTable
              quotes={mockQuotes}
              selectedQuotes={selectedQuotes}
              onSelectQuote={handleSelectQuote}
              onSelectAll={handleSelectAll}
              onQuoteAction={handleQuoteAction}
              onQuoteSelect={handleQuoteSelect}
            />
          </div>
          
          {/* Mobile AI Panel Toggle */}
          <div className="md:hidden">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowAIPanel(!showAIPanel)}
              iconName="Sparkles"
              iconPosition="left"
              className="text-xs sm:text-sm"
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
    </div>
  );
  };
  
export default QuotesManagement;