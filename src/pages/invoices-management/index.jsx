import React, { useState, useEffect } from 'react';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import InvoicesSummaryBar from './components/InvoicesSummaryBar';
import InvoicesFilterToolbar from './components/InvoicesFilterToolbar';
import InvoicesDataTable from './components/InvoicesDataTable';

import Select from '../../components/ui/Select';
import InvoiceService from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';

const InvoicesManagement = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });

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

  // Fetch invoices when component mounts
  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  // Load data function for compatibility
  const loadData = () => {
    if (user) {
      fetchInvoices();
    }
  };

  // Fetch invoices from database
  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await InvoiceService.fetchInvoices(user.id);
      
      if (result.success) {
        // Transform the data to match the expected format
        const transformedInvoices = result.data.map(invoice => ({
          id: invoice.id,
          number: invoice.invoice_number,
          quoteNumber: invoice.quote_number,
          clientName: invoice.client?.name || 'Client inconnu',
          clientEmail: invoice.client?.email || '',
          amount: parseFloat(invoice.final_amount || 0),
          status: invoice.status,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          paymentMethod: invoice.payment_method || 'À définir'
        }));
        
        setInvoices(transformedInvoices);
        setFilteredInvoices(transformedInvoices);
      } else {
        console.error('Failed to fetch invoices:', result.error);
        // Fallback to empty array
        setInvoices([]);
        setFilteredInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary data from invoices
  const summaryData = {
    totalRevenue: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    paidRevenue: invoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0),
    outstandingAmount: invoices.filter(invoice => invoice.status === 'unpaid' || invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0),
    revenueGrowth: 0, // Could be calculated from historical data
    overdueCount: invoices.filter(invoice => invoice.status === 'overdue').length
  };



  useEffect(() => {
    // Simulate loading
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = [...invoices];

    // Search filter
    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.number.toLowerCase().includes(searchTerm) ||
        invoice.clientName.toLowerCase().includes(searchTerm) ||
        invoice.clientEmail.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (newFilters.status) {
      filtered = filtered.filter(invoice => invoice.status === newFilters.status);
    }

    // Client filter
    if (newFilters.client) {
      filtered = filtered.filter(invoice => invoice.client?.id?.toString() === newFilters.client);
    }

    // Date range filter (custom date range)
    if (newFilters.dateRange && (newFilters.dateRange.start || newFilters.dateRange.end)) {
      if (newFilters.dateRange.start) {
        const startDate = new Date(newFilters.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(invoice => 
          new Date(invoice.issueDate) >= startDate
        );
      }
      if (newFilters.dateRange.end) {
        const endDate = new Date(newFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(invoice => 
          new Date(invoice.issueDate) <= endDate
        );
      }
    }

    // Amount range filter (custom amount range)
    if (newFilters.amountRange && (newFilters.amountRange.min || newFilters.amountRange.max)) {
      if (newFilters.amountRange.min) {
        const minAmount = parseFloat(newFilters.amountRange.min);
        filtered = filtered.filter(invoice => invoice.amount >= minAmount);
      }
      if (newFilters.amountRange.max) {
        const maxAmount = parseFloat(newFilters.amountRange.max);
        filtered = filtered.filter(invoice => invoice.amount <= maxAmount);
      }
    }

    setFilteredInvoices(filtered);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      client: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    };
    setFilters(clearedFilters);
    setFilteredInvoices(invoices);
  };

  const handleInvoiceAction = async (action, invoice) => {
    switch (action) {
      case 'mark_paid':
        await handleMarkAsPaid(invoice);
        break;
      case 'edit':
        // Handle edit action
        console.log('Edit invoice:', invoice);
        break;
      case 'delete':
        // Handle delete action
        console.log('Delete invoice:', invoice);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    try {
      const result = await InvoiceService.updateInvoiceStatus(invoice.id, 'paid', 'Marqué comme payé manuellement');
      
      if (result.success) {
        // Update local state
        setInvoices(prev => prev.map(inv => 
          inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
        ));
        setFilteredInvoices(prev => prev.map(inv => 
          inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
        ));
        
        alert('Facture marquée comme payée avec succès !');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    try {
      // Update all selected invoices to paid status
      for (const invoiceId of selectedInvoices) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice && invoice.status !== 'paid') {
          await InvoiceService.updateInvoiceStatus(invoiceId, 'paid', 'Marqué comme payé en lot');
        }
      }
      
      // Update local state
      const updatedInvoices = invoices.map(invoice =>
        selectedInvoices.includes(invoice.id) && invoice.status !== 'paid'
          ? { ...invoice, status: 'paid' }
          : invoice
      );
      
      setInvoices(updatedInvoices);
      setFilteredInvoices(updatedInvoices);
      setSelectedInvoices([]);
      
      alert(`${selectedInvoices.length} facture(s) marquée(s) comme payée(s) avec succès !`);
    } catch (error) {
      console.error('Error marking invoices as paid:', error);
      alert('Erreur lors de la mise à jour des factures');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }

    switch (action) {
      case 'mark_paid':
        await handleBulkMarkAsPaid();
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
                  onClick={fetchInvoices}
                  iconName="RefreshCw"
                  iconPosition="left"
                  className="text-xs sm:text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualisation...' : 'Actualiser'}
                </Button>
              </div>
          </div>
          </header>

          {/* Summary Bar */}
          <InvoicesSummaryBar summaryData={summaryData} />

          {/* Filters */}
          <InvoicesFilterToolbar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            invoices={invoices}
          />

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckSquare" size={20} color="var(--color-primary)" />
                    <span className="font-medium text-primary">
                      {selectedInvoices.length} facture{selectedInvoices.length > 1 ? 's' : ''} sélectionnée{selectedInvoices.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvoices([])}
                    iconName="X"
                    iconPosition="left"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Désélectionner
                  </Button>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none sm:w-64">
                    <Select
                      options={[
                        { value: '', label: 'Choisir une action...' },
                        { value: 'mark_paid', label: 'Marquer comme payée' },
                        { value: 'export', label: 'Exporter' },
                        { value: 'delete', label: 'Supprimer' }
                      ]}
                      value=""
                      onChange={(value) => value && handleBulkAction(value)}
                      placeholder="Choisir une action..."
                    />
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('mark_paid')}
                  iconName="CheckCircle"
                  iconPosition="left"
                >
                  Marquer payée
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  iconName="Download"
                  iconPosition="left"
                >
                  Exporter
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <InvoicesDataTable
            invoices={filteredInvoices}
            onInvoiceAction={handleInvoiceAction}
            selectedInvoices={selectedInvoices}
            onSelectionChange={setSelectedInvoices}
            filters={filters}
            onFiltersChange={handleFiltersChange}
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
    </div>
  );
};

export default InvoicesManagement;