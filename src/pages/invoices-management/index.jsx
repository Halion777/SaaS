import React, { useState, useEffect } from 'react';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import InvoicesSummaryBar from './components/InvoicesSummaryBar';
import InvoicesFilterToolbar from './components/InvoicesFilterToolbar';
import InvoicesDataTable from './components/InvoicesDataTable';
import PaymentAnalyticsSidebar from './components/PaymentAnalyticsSidebar';
import QuickInvoiceCreation from './components/QuickInvoiceCreation';

const InvoicesManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isAnalyticsSidebarVisible, setIsAnalyticsSidebarVisible] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  // Mock data for invoices
  const mockInvoices = [
    {
      id: 1,
      number: "FACT-2024-001",
      quoteNumber: "DEVIS-2024-001",
      clientName: "Jean Martin",
      clientEmail: "jean.martin@email.com",
      amount: 1250.00,
      status: "paid",
      issueDate: "2024-07-01",
      dueDate: "2024-07-31",
      paymentMethod: "Virement bancaire"
    },
    {
      id: 2,
      number: "FACT-2024-002",
      quoteNumber: "DEVIS-2024-003",
      clientName: "Sophie Dubois",
      clientEmail: "sophie.dubois@email.com",
      amount: 2800.00,
      status: "pending",
      issueDate: "2024-07-05",
      dueDate: "2024-08-04",
      paymentMethod: "Chèque"
    },
    {
      id: 3,
      number: "FACT-2024-003",
      quoteNumber: null,
      clientName: "Pierre Moreau",
      clientEmail: "pierre.moreau@email.com",
      amount: 950.00,
      status: "overdue",
      issueDate: "2024-06-15",
      dueDate: "2024-07-15",
      paymentMethod: "Espèces"
    },
    {
      id: 4,
      number: "FACT-2024-004",
      quoteNumber: "DEVIS-2024-007",
      clientName: "Marie Leroy",
      clientEmail: "marie.leroy@email.com",
      amount: 3200.00,
      status: "paid",
      issueDate: "2024-07-10",
      dueDate: "2024-08-09",
      paymentMethod: "Virement bancaire"
    },
    {
      id: 5,
      number: "FACT-2024-005",
      quoteNumber: "DEVIS-2024-012",
      clientName: "Paul Bernard",
      clientEmail: "paul.bernard@email.com",
      amount: 1800.00,
      status: "pending",
      issueDate: "2024-07-12",
      dueDate: "2024-08-11",
      paymentMethod: "Carte bancaire"
    },
    {
      id: 6,
      number: "FACT-2024-006",
      quoteNumber: null,
      clientName: "Lucie Petit",
      clientEmail: "lucie.petit@email.com",
      amount: 750.00,
      status: "overdue",
      issueDate: "2024-06-20",
      dueDate: "2024-07-20",
      paymentMethod: "Chèque"
    },
    {
      id: 7,
      number: "FACT-2024-007",
      quoteNumber: "DEVIS-2024-015",
      clientName: "Thomas Roux",
      clientEmail: "thomas.roux@email.com",
      amount: 4500.00,
      status: "paid",
      issueDate: "2024-07-15",
      dueDate: "2024-08-14",
      paymentMethod: "Virement bancaire"
    },
    {
      id: 8,
      number: "FACT-2024-008",
      quoteNumber: "DEVIS-2024-018",
      clientName: "Emma Blanc",
      clientEmail: "emma.blanc@email.com",
      amount: 1650.00,
      status: "pending",
      issueDate: "2024-07-18",
      dueDate: "2024-08-17",
      paymentMethod: "Virement bancaire"
    }
  ];

  // Mock summary data
  const summaryData = {
    totalRevenue: 16900.00,
    paidRevenue: 9450.00,
    outstandingAmount: 7450.00,
    revenueGrowth: 12.5,
    overdueCount: 2
  };

  // Mock analytics data
  const analyticsData = {
    avgPaymentTime: 14,
    recoveryRate: 92,
    overdueCount: 2,
    upcomingDeadlines: [
      {
        invoiceNumber: "FACT-2024-002",
        clientName: "Sophie Dubois",
        amount: 2800.00,
        daysLeft: 3
      },
      {
        invoiceNumber: "FACT-2024-005",
        clientName: "Paul Bernard",
        amount: 1800.00,
        daysLeft: 7
      },
      {
        invoiceNumber: "FACT-2024-008",
        clientName: "Emma Blanc",
        amount: 1650.00,
        daysLeft: 12
      }
    ]
  };

  useEffect(() => {
    // Simulate loading
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInvoices(mockInvoices);
      setFilteredInvoices(mockInvoices);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleFiltersChange = (filters) => {
    let filtered = [...invoices];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.number.toLowerCase().includes(searchTerm) ||
        invoice.clientName.toLowerCase().includes(searchTerm) ||
        invoice.clientEmail.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange) {
      const today = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issueDate) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issueDate) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issueDate) >= filterDate
          );
          break;
        case 'quarter':
          filterDate.setMonth(today.getMonth() - 3);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issueDate) >= filterDate
          );
          break;
        case 'year':
          filterDate.setFullYear(today.getFullYear() - 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issueDate) >= filterDate
          );
          break;
      }
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(invoice => 
        invoice.paymentMethod === filters.paymentMethod
      );
    }

    // Amount range filter
    if (filters.amountRange) {
      const [min, max] = filters.amountRange.split('-').map(v => 
        v === '5000+' ? Infinity : parseInt(v)
      );
      filtered = filtered.filter(invoice => 
        invoice.amount >= min && (max === Infinity || invoice.amount <= max)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleBulkAction = (action) => {
    if (selectedInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }

    switch (action) {
      case 'send_reminder':
        alert(`Rappel envoyé pour ${selectedInvoices.length} facture(s)`);
        break;
      case 'mark_paid':
        const updatedInvoices = invoices.map(invoice =>
          selectedInvoices.includes(invoice.id)
            ? { ...invoice, status: 'paid' }
            : invoice
        );
        setInvoices(updatedInvoices);
        setFilteredInvoices(updatedInvoices);
        setSelectedInvoices([]);
        break;
      case 'export':
        alert(`Export de ${selectedInvoices.length} facture(s) en cours...`);
        break;
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedInvoices.length} facture(s) ?`)) {
          const updatedInvoices = invoices.filter(invoice =>
            !selectedInvoices.includes(invoice.id)
          );
          setInvoices(updatedInvoices);
          setFilteredInvoices(updatedInvoices);
          setSelectedInvoices([]);
        }
        break;
    }
  };

  const handleInvoiceAction = (action, invoice) => {
    switch (action) {
      case 'view':
        alert(`Affichage de la facture ${invoice.number}`);
        break;
      case 'edit':
        alert(`Édition de la facture ${invoice.number}`);
        break;
      case 'duplicate':
        const duplicatedInvoice = {
          ...invoice,
          id: Date.now(),
          number: `FACT-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          status: 'pending',
          issueDate: new Date().toISOString().split('T')[0]
        };
        const updatedInvoices = [...invoices, duplicatedInvoice];
        setInvoices(updatedInvoices);
        setFilteredInvoices(updatedInvoices);
        break;
      case 'sendReminder':
        alert(`Rappel envoyé pour la facture ${invoice.number}`);
        break;
      case 'markPaid':
        const paidInvoices = invoices.map(inv =>
          inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
        );
        setInvoices(paidInvoices);
        setFilteredInvoices(paidInvoices);
        break;
    }
  };

  const handleCreateInvoice = (newInvoice) => {
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    setFilteredInvoices(updatedInvoices);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainSidebar />
        <div 
          className="pt-16 sm:pt-4 md:pt-0 p-3 sm:p-4 md:p-6"
          style={{ marginLeft: `${sidebarOffset}px` }}
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon name="Loader2" size={32} className="sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
              <p className="text-xs sm:text-sm text-muted-foreground">Chargement des factures...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="FileText" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des factures</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez vos factures, suivez les paiements et analysez vos performances
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  variant="outline"
                  iconName="BarChart3"
                  iconPosition="left"
                  onClick={() => setIsAnalyticsSidebarVisible(!isAnalyticsSidebarVisible)}
                  className="text-xs sm:text-sm"
                >
                  Analyses
                </Button>
                <Button
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => setIsQuickCreateOpen(true)}
                  className="text-xs sm:text-sm"
                >
                  Nouvelle facture
                </Button>
              </div>
            </div>
          </header>

          {/* Summary Bar */}
          <InvoicesSummaryBar summaryData={summaryData} />

          {/* Filter Toolbar */}
          <InvoicesFilterToolbar
            onFiltersChange={handleFiltersChange}
            onBulkAction={handleBulkAction}
          />

          {/* Data Table */}
          <InvoicesDataTable
            invoices={filteredInvoices}
            onInvoiceAction={handleInvoiceAction}
            selectedInvoices={selectedInvoices}
            onSelectionChange={setSelectedInvoices}
          />

          {/* Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Affichage de {filteredInvoices.length} facture(s) sur {invoices.length}
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" iconName="ChevronLeft" className="text-xs sm:text-sm">
                  Précédent
                </Button>
                <Button variant="outline" size="sm" iconName="ChevronRight" className="text-xs sm:text-sm">
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Payment Analytics Sidebar */}
      {isAnalyticsSidebarVisible && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsAnalyticsSidebarVisible(false)}
        />
      )}
      <PaymentAnalyticsSidebar
        analyticsData={analyticsData}
        isVisible={isAnalyticsSidebarVisible}
        onToggle={() => setIsAnalyticsSidebarVisible(!isAnalyticsSidebarVisible)}
      />

      {/* Quick Invoice Creation Modal */}
      <QuickInvoiceCreation
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onCreateInvoice={handleCreateInvoice}
      />
    </div>
  );
};

export default InvoicesManagement;