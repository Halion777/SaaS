import React, { useState, useEffect } from 'react';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ExpenseInvoicesSummaryBar from './components/ExpenseInvoicesSummaryBar';
import ExpenseInvoicesFilterToolbar from './components/ExpenseInvoicesFilterToolbar';
import ExpenseInvoicesDataTable from './components/ExpenseInvoicesDataTable';
import QuickExpenseInvoiceCreation from './components/QuickExpenseInvoiceCreation';
import Select from '../../components/ui/Select';
import ExpenseInvoicesService from '../../services/expenseInvoicesService';

const ExpenseInvoicesManagement = () => {
  const [expenseInvoices, setExpenseInvoices] = useState([]);
  const [filteredExpenseInvoices, setFilteredExpenseInvoices] = useState([]);
  const [selectedExpenseInvoices, setSelectedExpenseInvoices] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    source: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    paymentMethod: ''
  });

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

  // Expense categories as defined in requirements
  const expenseCategories = [
    { value: 'fuel', label: 'Fuel (company vehicles, machinery, transport-related fuel)' },
    { value: 'it_software', label: 'IT / Software Services (licenses, subscriptions, cloud services, maintenance)' },
    { value: 'energy', label: 'Energy (electricity, gas, water, heating)' },
    { value: 'materials_supplies', label: 'Materials / Supplies (construction materials, tools, consumables, office supplies)' },
    { value: 'telecommunications', label: 'Telecommunications (internet, mobile, landline services)' },
    { value: 'rent_property', label: 'Rent & Property Costs (office/workshop rent, warehouse costs, maintenance fees)' },
    { value: 'professional_services', label: 'Professional Services (accounting, legal, consulting, training)' },
    { value: 'insurance', label: 'Insurance (business liability, health insurance for employees, vehicle insurance)' },
    { value: 'travel_accommodation', label: 'Travel & Accommodation (flights, hotels, meals, transportation)' },
    { value: 'banking_financial', label: 'Banking & Financial Costs (loan repayments, bank fees, interest)' },
    { value: 'marketing_advertising', label: 'Marketing & Advertising (digital ads, print material, website hosting, branding)' },
    { value: 'other_professional', label: 'Other Professional Costs (any additional business-related expenses not listed above)' }
  ];

  // Summary data for expense invoices
  const [summaryData, setSummaryData] = useState({
    totalExpenses: 0,
    paidExpenses: 0,
    outstandingAmount: 0,
    expensesGrowth: 0,
    overdueCount: 0,
    peppolInvoices: 0,
    manualInvoices: 0
  });

  useEffect(() => {
    // Load data from service
    const loadData = async () => {
      setIsLoading(true);
      try {
        const expenseService = new ExpenseInvoicesService();
        
        // Load invoices
        const result = await expenseService.getExpenseInvoices();
        if (result.success) {
          setExpenseInvoices(result.data);
          setFilteredExpenseInvoices(result.data);
        } else {
          console.error('Error loading expense invoices:', result.error);
          setExpenseInvoices([]);
          setFilteredExpenseInvoices([]);
        }
        
        // Load statistics
        const statsResult = await expenseService.getStatistics();
        if (statsResult.success) {
          setSummaryData(statsResult.data);
        }
      } catch (error) {
        console.error('Error loading expense invoices:', error);
        setExpenseInvoices([]);
        setFilteredExpenseInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = [...expenseInvoices];

    // Search filter
    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm)) ||
        (invoice.supplier_name && invoice.supplier_name.toLowerCase().includes(searchTerm)) ||
        (invoice.category && invoice.category.toLowerCase().includes(searchTerm)) ||
        (invoice.status && invoice.status.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (newFilters.status) {
      filtered = filtered.filter(invoice => invoice.status === newFilters.status);
    }



    // Category filter
    if (newFilters.category) {
      filtered = filtered.filter(invoice => invoice.category === newFilters.category);
    }

    // Source filter
    if (newFilters.source) {
      filtered = filtered.filter(invoice => invoice.source === newFilters.source);
    }

    // Date range filter
    if (newFilters.dateRange && (newFilters.dateRange.start || newFilters.dateRange.end)) {
      const today = new Date();
      const filterDate = new Date();

      switch (newFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issue_date) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issue_date) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issue_date) >= filterDate
          );
          break;
        case 'quarter':
          filterDate.setMonth(today.getMonth() - 3);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issue_date) >= filterDate
          );
          break;
        case 'year':
          filterDate.setFullYear(today.getFullYear() - 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.issue_date) >= filterDate
          );
          break;
      }
    }

    // Payment method filter
    if (newFilters.paymentMethod) {
      filtered = filtered.filter(invoice => 
        invoice.payment_method === newFilters.paymentMethod
      );
    }

    // Amount range filter
    if (newFilters.amountRange && (newFilters.amountRange.min || newFilters.amountRange.max)) {
      if (newFilters.amountRange.min) {
        filtered = filtered.filter(invoice => 
          parseFloat(invoice.amount) >= parseFloat(newFilters.amountRange.min)
        );
      }
      if (newFilters.amountRange.max) {
        filtered = filtered.filter(invoice => 
          parseFloat(invoice.amount) <= parseFloat(newFilters.amountRange.max)
        );
      }
    }

    setFilteredExpenseInvoices(filtered);
  };

  const handleBulkAction = async (action) => {
    if (selectedExpenseInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture de dépense');
      return;
    }

    try {
      const expenseService = new ExpenseInvoicesService();
      
      switch (action) {
        case 'send_to_accountant':
          const sendResult = await expenseService.sendToAccountant(selectedExpenseInvoices);
          if (sendResult.success) {
            alert(sendResult.message);
            setSelectedExpenseInvoices([]);
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          } else {
            alert('Erreur: ' + sendResult.error);
          }
          break;
          
        case 'mark_paid':
          // Mark each selected invoice as paid
          for (const invoiceId of selectedExpenseInvoices) {
            await expenseService.markAsPaid(invoiceId);
          }
          alert(`${selectedExpenseInvoices.length} facture(s) marquée(s) comme payée(s)`);
          setSelectedExpenseInvoices([]);
          // Refresh data
          const refreshResult = await expenseService.getExpenseInvoices();
          if (refreshResult.success) {
            setExpenseInvoices(refreshResult.data);
            setFilteredExpenseInvoices(refreshResult.data);
          }
          break;
          
        case 'export':
          alert(`Export de ${selectedExpenseInvoices.length} facture(s) en cours...`);
          break;
          
        case 'delete':
          if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedExpenseInvoices.length} facture(s) ?`)) {
            // Delete each selected invoice
            for (const invoiceId of selectedExpenseInvoices) {
              await expenseService.deleteExpenseInvoice(invoiceId);
            }
            alert(`${selectedExpenseInvoices.length} facture(s) supprimée(s)`);
            setSelectedExpenseInvoices([]);
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling bulk action:', error);
      alert('Erreur lors de l\'action en lot');
    }
  };

  const handleExpenseInvoiceAction = async (action, invoice) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      
      switch (action) {
        case 'view':
          alert(`Affichage de la facture de dépense ${invoice.invoice_number || invoice.number}`);
          break;
          
        case 'edit':
          alert(`Édition de la facture de dépense ${invoice.invoice_number || invoice.number}`);
          break;
          
        case 'send_to_accountant':
          const sendResult = await expenseService.sendToAccountant([invoice.id]);
          if (sendResult.success) {
            alert(sendResult.message);
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          } else {
            alert('Erreur: ' + sendResult.error);
          }
          break;
          
        case 'download':
          if (invoice.attachments && invoice.attachments.length > 0) {
            const downloadResult = await expenseService.getFileDownloadUrl(invoice.attachments[0].file_path);
            if (downloadResult.success) {
              window.open(downloadResult.data, '_blank');
            } else {
              alert('Erreur lors du téléchargement: ' + downloadResult.error);
            }
          } else {
            alert('Aucun fichier joint à cette facture');
          }
          break;
          
        case 'markPaid':
          const markResult = await expenseService.markAsPaid(invoice.id);
          if (markResult.success) {
            alert('Facture marquée comme payée');
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          } else {
            alert('Erreur: ' + markResult.error);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling expense invoice action:', error);
      alert('Erreur lors de l\'action sur la facture');
    }
  };

  const handleCreateExpenseInvoice = async (newInvoice) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.createExpenseInvoice(newInvoice);
      
      if (result.success) {
        // Refresh the data from the service
        const refreshResult = await expenseService.getExpenseInvoices();
        if (refreshResult.success) {
          setExpenseInvoices(refreshResult.data);
          setFilteredExpenseInvoices(refreshResult.data);
        }
      } else {
        console.error('Error creating expense invoice:', result.error);
        alert('Erreur lors de la création de la facture: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating expense invoice:', error);
      alert('Erreur lors de la création de la facture');
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
              <p className="text-xs sm:text-sm text-muted-foreground">Chargement des factures de dépenses...</p>
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
                  <Icon name="Receipt" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Factures de dépenses</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Gérez vos factures de dépenses, suivez vos coûts et envoyez-les à votre comptable
              </p>
            </div>
              <div className="flex items-center space-x-2 sm:space-x-3">

              <Button
                iconName="Plus"
                iconPosition="left"
                onClick={() => setIsQuickCreateOpen(true)}
                  className="text-xs sm:text-sm"
              >
                Ajouter facture
              </Button>
            </div>
          </div>
          </header>

          {/* Summary Bar */}
          <ExpenseInvoicesSummaryBar summaryData={summaryData} />

          {/* Filters */}
          <ExpenseInvoicesFilterToolbar
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Bulk Actions */}
          {selectedExpenseInvoices.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckSquare" size={20} color="var(--color-primary)" />
                    <span className="font-medium text-primary">
                      {selectedExpenseInvoices.length} facture{selectedExpenseInvoices.length > 1 ? 's' : ''} sélectionnée{selectedExpenseInvoices.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExpenseInvoices([])}
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
                        { value: 'send_to_accountant', label: 'Envoyer au comptable' },
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
                  onClick={() => handleBulkAction('send_to_accountant')}
                  iconName="Send"
                  iconPosition="left"
                >
                  Envoyer comptable
                </Button>
                
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
          <ExpenseInvoicesDataTable
            expenseInvoices={filteredExpenseInvoices}
            onExpenseInvoiceAction={handleExpenseInvoiceAction}
            selectedExpenseInvoices={selectedExpenseInvoices}
            onSelectionChange={setSelectedExpenseInvoices}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Pagination */}
          {filteredExpenseInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Affichage de {filteredExpenseInvoices.length} facture(s) sur {expenseInvoices.length}
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



      {/* Quick Expense Invoice Creation Modal */}
      <QuickExpenseInvoiceCreation
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onCreateExpenseInvoice={handleCreateExpenseInvoice}
      />
    </div>
  );
};

export default ExpenseInvoicesManagement; 