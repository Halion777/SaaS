import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TableLoader from '../../components/ui/TableLoader';
import ExpenseInvoicesSummaryBar from './components/ExpenseInvoicesSummaryBar';
import ExpenseInvoicesFilterToolbar from './components/ExpenseInvoicesFilterToolbar';
import ExpenseInvoicesDataTable from './components/ExpenseInvoicesDataTable';
import QuickExpenseInvoiceCreation from './components/QuickExpenseInvoiceCreation';
import ExpenseInvoiceDetailModal from './components/ExpenseInvoiceDetailModal';
import Select from '../../components/ui/Select';
import ExpenseInvoicesService from '../../services/expenseInvoicesService';

const ExpenseInvoicesManagement = () => {
  const { t } = useTranslation();
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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
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
          // Auto-update overdue status based on due_date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const updatedInvoices = await Promise.all(result.data.map(async (invoice) => {
            // If invoice is not paid and due_date has passed, mark as overdue
            if (invoice.status !== 'paid' && invoice.due_date) {
              const dueDate = new Date(invoice.due_date);
              dueDate.setHours(0, 0, 0, 0);
              
              if (dueDate < today && invoice.status !== 'overdue') {
                // Auto-update status to overdue
                await expenseService.updateExpenseInvoice(invoice.id, { status: 'overdue' });
                return { ...invoice, status: 'overdue' };
              }
            }
            return invoice;
          }));
          
          setExpenseInvoices(updatedInvoices);
          setFilteredExpenseInvoices(updatedInvoices);
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
      alert(t('expenseInvoices.errors.selectAtLeastOne', 'Please select at least one expense invoice'));
      return;
    }

    try {
      const expenseService = new ExpenseInvoicesService();
      
      switch (action) {
        case 'send_to_accountant':
          const sendResult = await expenseService.sendToAccountant(selectedExpenseInvoices);
          if (sendResult.success) {
            setSelectedExpenseInvoices([]);
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          }
          break;
          
        case 'export':
          await exportExpenseInvoices(selectedExpenseInvoices);
          break;
          
        case 'delete':
          if (confirm(t('expenseInvoices.messages.confirmDelete', { count: selectedExpenseInvoices.length }, `Are you sure you want to delete ${selectedExpenseInvoices.length} invoice(s)?`))) {
            // Delete each selected invoice
            for (const invoiceId of selectedExpenseInvoices) {
              await expenseService.deleteExpenseInvoice(invoiceId);
            }
            alert(t('expenseInvoices.messages.deletedSuccess', { count: selectedExpenseInvoices.length }, `${selectedExpenseInvoices.length} invoice(s) deleted`));
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
      alert(t('expenseInvoices.errors.bulkActionError', 'Error during bulk action'));
    }
  };

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.updateExpenseInvoice(invoiceId, { status: newStatus });
      
      if (result.success) {
        // Update local state
        setExpenseInvoices(prev => 
          prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv)
        );
        setFilteredExpenseInvoices(prev => 
          prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv)
        );
      } else {
        alert(t('expenseInvoices.errors.updateStatusError', 'Error updating status: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('expenseInvoices.errors.updateStatusError', 'Error updating status'));
    }
  };

  const handleExpenseInvoiceAction = async (action, invoice) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      
      switch (action) {
        case 'view':
          setSelectedInvoice(invoice);
          setIsDetailModalOpen(true);
          break;
          
        case 'edit':
          setInvoiceToEdit(invoice);
          setIsQuickCreateOpen(true);
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
            alert(t('expenseInvoices.errors.error', 'Error: {{error}}', { error: sendResult.error }));
          }
          break;
          
        case 'download':
          if (invoice.attachments && invoice.attachments.length > 0) {
            const downloadResult = await expenseService.getFileDownloadUrl(invoice.attachments[0].file_path);
            if (downloadResult.success) {
              window.open(downloadResult.data, '_blank');
            } else {
              alert(t('expenseInvoices.errors.downloadError', 'Error downloading: {{error}}', { error: downloadResult.error }));
            }
          } else {
            alert(t('expenseInvoices.errors.noAttachment', 'No file attached to this invoice'));
          }
          break;
          
        case 'markPaid':
          const markResult = await expenseService.markAsPaid(invoice.id);
          if (markResult.success) {
            alert(t('expenseInvoices.messages.markedAsPaid', 'Invoice marked as paid'));
            // Refresh data
            const refreshResult = await expenseService.getExpenseInvoices();
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          } else {
            alert(t('expenseInvoices.errors.error', 'Error: {{error}}', { error: markResult.error }));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling expense invoice action:', error);
      alert(t('expenseInvoices.errors.actionError', 'Error during invoice action'));
    }
  };

  const exportExpenseInvoices = async (invoiceIds) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      const invoicesToExport = expenseInvoices.filter(inv => invoiceIds.includes(inv.id));
      
      if (invoicesToExport.length === 0) {
        return;
      }

      const csvData = [
        [
          t('expenseInvoices.export.invoiceNumber', 'Invoice Number'),
          t('expenseInvoices.export.supplier', 'Supplier'),
          t('expenseInvoices.export.email', 'Email'),
          t('expenseInvoices.export.vat', 'VAT'),
          t('expenseInvoices.export.totalAmount', 'Total Amount'),
          t('expenseInvoices.export.netAmount', 'Net Amount'),
          t('expenseInvoices.export.vatAmount', 'VAT Amount'),
          t('expenseInvoices.export.status', 'Status'),
          t('expenseInvoices.export.category', 'Category'),
          t('expenseInvoices.export.source', 'Source'),
          t('expenseInvoices.export.issueDate', 'Issue Date'),
          t('expenseInvoices.export.dueDate', 'Due Date'),
          t('expenseInvoices.export.paymentMethod', 'Payment Method'),
          t('expenseInvoices.export.peppolId', 'Peppol ID'),
          t('expenseInvoices.export.documentType', 'Document Type')
        ]
      ];

      invoicesToExport.forEach(invoice => {
        const row = [
          invoice.invoice_number,
          invoice.supplier_name,
          invoice.supplier_email || '',
          invoice.supplier_vat_number || '',
          invoice.amount,
          invoice.net_amount || '',
          invoice.vat_amount || '',
          invoice.status,
          invoice.category || '',
          invoice.source,
          invoice.issue_date,
          invoice.due_date,
          invoice.payment_method || '',
          invoice.sender_peppol_id || '',
          invoice.peppol_metadata?.documentTypeLabel || ''
        ];
        csvData.push(row);
      });

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting invoices:', error);
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
        alert(t('expenseInvoices.errors.createError', 'Error creating invoice: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('Error creating expense invoice:', error);
      alert(t('expenseInvoices.errors.createError', 'Error creating invoice'));
    }
  };

  const handleUpdateExpenseInvoice = async (invoiceId, updatedInvoice) => {
    try {
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.updateExpenseInvoice(invoiceId, {
        supplier_name: updatedInvoice.supplierName,
        supplier_email: updatedInvoice.supplierEmail,
        supplier_vat_number: updatedInvoice.supplierVatNumber || null,
        invoice_number: updatedInvoice.invoiceNumber,
        amount: updatedInvoice.amount,
        net_amount: updatedInvoice.netAmount || updatedInvoice.amount,
        vat_amount: updatedInvoice.vatAmount || 0,
        category: updatedInvoice.category || null,
        issue_date: updatedInvoice.issueDate,
        due_date: updatedInvoice.dueDate,
        payment_method: updatedInvoice.paymentMethod || null,
        notes: updatedInvoice.notes || null
      });
      
      if (result.success) {
        // Refresh the data from the service
        const refreshResult = await expenseService.getExpenseInvoices();
        if (refreshResult.success) {
          setExpenseInvoices(refreshResult.data);
          setFilteredExpenseInvoices(refreshResult.data);
        }
        setInvoiceToEdit(null);
      } else {
        console.error('Error updating expense invoice:', result.error);
        alert(t('expenseInvoices.errors.updateError', 'Error updating invoice: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('Error updating expense invoice:', error);
      alert(t('expenseInvoices.errors.updateError', 'Error updating invoice'));
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
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <div className="flex items-center">
                  <Icon name="Receipt" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('expenseInvoices.title', 'Expense Invoices')}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t('expenseInvoices.subtitle', 'Manage your expense invoices, track your costs and send them to your accountant')}
              </p>
            </div>
              <div className="flex items-center space-x-2 sm:space-x-3">

              <Button
                iconName="Plus"
                iconPosition="left"
                onClick={() => setIsQuickCreateOpen(true)}
                  className="text-xs sm:text-sm"
              >
                {t('expenseInvoices.addInvoice', 'Add Invoice')}
              </Button>
            </div>
          </div>
          </header>

          {/* Summary Bar */}
          <ExpenseInvoicesSummaryBar summaryData={summaryData} isLoading={isLoading} />

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
                      {t('expenseInvoices.bulkActions.selectedInvoices', { count: selectedExpenseInvoices.length }, `${selectedExpenseInvoices.length} invoice(s) selected`)}
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
                    {t('expenseInvoices.bulkActions.deselect', 'Deselect')}
                  </Button>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none sm:w-64">
                    <Select
                      options={[
                        { value: '', label: t('expenseInvoices.bulkActions.chooseAction', 'Choose an action...') },
                        { value: 'send_to_accountant', label: t('expenseInvoices.bulkActions.sendToAccountant', 'Send to Accountant') },
                        { value: 'export', label: t('expenseInvoices.bulkActions.export', 'Export') },
                        { value: 'delete', label: t('expenseInvoices.bulkActions.delete', 'Delete') }
                      ]}
                      value=""
                      onChange={(value) => value && handleBulkAction(value)}
                      placeholder={t('expenseInvoices.bulkActions.chooseAction', 'Choose an action...')}
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
                  {t('expenseInvoices.bulkActions.sendToAccountant', 'Send to Accountant')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  iconName="Download"
                  iconPosition="left"
                >
                  {t('expenseInvoices.bulkActions.export', 'Export')}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  {t('expenseInvoices.bulkActions.delete', 'Delete')}
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {isLoading ? (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <TableLoader message={t('expenseInvoices.loading', 'Loading expense invoices...')} />
            </div>
          ) : (
            <ExpenseInvoicesDataTable
              expenseInvoices={filteredExpenseInvoices}
              onExpenseInvoiceAction={handleExpenseInvoiceAction}
              selectedExpenseInvoices={selectedExpenseInvoices}
              onSelectionChange={setSelectedExpenseInvoices}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onStatusUpdate={handleStatusUpdate}
            />
          )}

        </div>
      </main>



      {/* Quick Expense Invoice Creation Modal */}
      <QuickExpenseInvoiceCreation
        isOpen={isQuickCreateOpen}
        onClose={() => {
          setIsQuickCreateOpen(false);
          setInvoiceToEdit(null);
        }}
        onCreateExpenseInvoice={handleCreateExpenseInvoice}
        onUpdateExpenseInvoice={handleUpdateExpenseInvoice}
        invoiceToEdit={invoiceToEdit}
      />

      {/* Expense Invoice Detail Modal */}
      <ExpenseInvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </div>
  );
};

export default ExpenseInvoicesManagement; 