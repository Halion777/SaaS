import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainSidebar from '../../components/ui/MainSidebar';
import PermissionGuard, { usePermissionCheck } from '../../components/PermissionGuard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TableLoader from '../../components/ui/TableLoader';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import ExpenseInvoicesSummaryBar from './components/ExpenseInvoicesSummaryBar';
import ExpenseInvoicesFilterToolbar from './components/ExpenseInvoicesFilterToolbar';
import ExpenseInvoicesDataTable from './components/ExpenseInvoicesDataTable';
import QuickExpenseInvoiceCreation from './components/QuickExpenseInvoiceCreation';
import ExpenseInvoiceDetailModal from './components/ExpenseInvoiceDetailModal';
import ExpenseInvoicesService from '../../services/expenseInvoicesService';
import { loadCompanyInfo } from '../../services/companyInfoService';
import { generateExpenseInvoicePDF } from '../../services/pdfService';
import { useAuth } from '../../context/AuthContext';
import SendToAccountantModal from '../invoices-management/components/SendToAccountantModal';
import { formatNumber } from '../../utils/numberFormat';

const ExpenseInvoicesManagement = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [expenseInvoices, setExpenseInvoices] = useState([]);
  const [filteredExpenseInvoices, setFilteredExpenseInvoices] = useState([]);
  const [selectedExpenseInvoices, setSelectedExpenseInvoices] = useState([]);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    source: '',
    invoiceType: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    paymentMethod: ''
  });

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSendToAccountantModalOpen, setIsSendToAccountantModalOpen] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);

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

  // Load data from service
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const expenseService = new ExpenseInvoicesService();
      
      // Load invoices
      const result = await expenseService.getExpenseInvoices();
      if (result.success) {
        // Auto-update overdue status based on due_date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Helper to get client invoice number from buyerReference
        const getClientInvoiceNumber = (invoice) => {
          if (invoice.source === 'peppol' && invoice.peppol_metadata?.buyerReference) {
            const buyerRef = invoice.peppol_metadata.buyerReference;
            // If buyerReference looks like a client invoice number (INV-* or FACT-*), use it
            if (buyerRef && (buyerRef.match(/^(INV|FACT)-\d+$/i) || buyerRef.startsWith('INV-') || buyerRef.startsWith('FACT-'))) {
              return buyerRef;
            }
          }
          // Also check the invoice_number itself
          if (invoice.source === 'peppol' && invoice.invoice_number && 
              (invoice.invoice_number.match(/^(INV|FACT)-\d+$/i) || invoice.invoice_number.startsWith('INV-') || invoice.invoice_number.startsWith('FACT-'))) {
            return invoice.invoice_number;
          }
          return null;
        };
        
        const updatedInvoices = await Promise.all(result.data.map(async (invoice) => {
          // If invoice is not paid and due_date has passed, mark as overdue
          if (invoice.status !== 'paid' && invoice.due_date) {
            const dueDate = new Date(invoice.due_date);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today && invoice.status !== 'overdue') {
              // Auto-update status to overdue
              await expenseService.updateExpenseInvoice(invoice.id, { status: 'overdue' });
              invoice.status = 'overdue';
            }
          }
          
          // Fetch quote number from related client invoice
          // This works for both deposit and final invoices since they share the same buyerReference
          const clientInvoiceNumber = getClientInvoiceNumber(invoice);
          if (clientInvoiceNumber && !invoice.quoteNumber) {
            try {
              const { supabase } = await import('../../services/supabaseClient');
              // Use maybeSingle() instead of single() to handle cases where invoice might not exist
              // First try to get quote_number directly from invoice
              const { data: clientInvoice, error: queryError } = await supabase
                .from('invoices')
                .select('quote_number, quote_id')
                .eq('invoice_number', clientInvoiceNumber)
                .eq('user_id', user?.id)
                .maybeSingle();
              
              if (queryError) {
                console.debug('Error querying client invoice for quote number:', queryError);
              } else if (clientInvoice) {
                // If quote_number is directly available, use it
                if (clientInvoice.quote_number) {
                  invoice.quoteNumber = clientInvoice.quote_number;
                } else if (clientInvoice.quote_id) {
                  // If quote_id is available but quote_number is not, fetch from quotes table
                  const { data: quote } = await supabase
                    .from('quotes')
                    .select('quote_number')
                    .eq('id', clientInvoice.quote_id)
                    .maybeSingle();
                  
                  if (quote?.quote_number) {
                    invoice.quoteNumber = quote.quote_number;
                  }
                }
              }
            } catch (err) {
              // Silently fail if client invoice not found
              console.debug('Could not find client invoice for quote number:', err);
            }
          }
          
          return invoice;
        }));
        
        setExpenseInvoices(updatedInvoices);
        setFilteredExpenseInvoices(updatedInvoices);
        setError(null);
      } else {
        console.error('Error loading expense invoices:', result.error);
        setError(result.error || t('expenseInvoices.errors.loadError', 'Failed to load expense invoices'));
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
      setError(error.message || t('expenseInvoices.errors.loadError', 'Failed to load expense invoices'));
      setExpenseInvoices([]);
      setFilteredExpenseInvoices([]);
    } finally {
      setIsLoading(false);
      // Dispatch event to signal page loading is complete
      window.dispatchEvent(new CustomEvent('page-loaded'));
    }
  };

  useEffect(() => {
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

    // Invoice type filter
    if (newFilters.invoiceType) {
      filtered = filtered.filter(invoice => {
        const invoiceType = invoice.invoice_type || 'final';
        return invoiceType === newFilters.invoiceType;
      });
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

  const handleExportExpenseInvoicePDF = async (invoice) => {
    if (downloadingInvoiceId) return;
    
    setDownloadingInvoiceId(invoice.id);
    try {
      // Check if we have a stored PDF from Peppol (the exact PDF that was sent)
      const pdfAttachmentPath = invoice.peppol_metadata?.pdfAttachmentPath;
      const expenseService = new ExpenseInvoicesService();
      
      // If PDF attachment exists (from Peppol), download the stored PDF (exact same as sent)
      if (pdfAttachmentPath && invoice.source === 'peppol') {
        const downloadResult = await expenseService.getFileDownloadUrl(pdfAttachmentPath);
        
        if (downloadResult.success) {
          // Download the stored PDF (exact same as sent via Peppol)
          const a = document.createElement('a');
          a.href = downloadResult.data;
          a.download = `expense-invoice-${invoice.invoice_number || 'invoice'}.pdf`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        } else {
          console.warn('Failed to download stored PDF, falling back to PDF generation:', downloadResult.error);
          // Fall through to generate PDF if download fails
        }
      }
      
      // Fallback: Generate new PDF (for manual invoices or if stored PDF is not available)
      // Check if we have sender user ID from Peppol metadata
      // Use sender's company info ONLY for logo; use receiver's (current user's) company info for COMPANY section
      const senderUserId = invoice.peppol_metadata?.sender_user_id;
      let senderCompanyInfo = null; // For logo only
      let receiverCompanyInfo = null; // For COMPANY section
      
      // Load sender's company info for logo if available
      if (senderUserId) {
        senderCompanyInfo = await loadCompanyInfo(senderUserId);
      }
      
      // Always load receiver's (current user's) company info for COMPANY section
      receiverCompanyInfo = await loadCompanyInfo(user?.id);
      
      if (!receiverCompanyInfo) {
        alert(t('expenseInvoices.errors.companyInfoNotFound', 'Company information not found'));
        return;
      }
      
      // Use sender's logo if available, otherwise use receiver's logo
      const companyInfoForLogo = senderCompanyInfo || receiverCompanyInfo;

      // Prepare expense invoice data for PDF generation
      // Use exact values from UBL XML or database - no calculations
      const amount = parseFloat(invoice.amount || 0);
      const netAmount = parseFloat(invoice.net_amount || 0);
      const vatAmount = parseFloat(invoice.vat_amount || 0);
      
      // Extract supplier and customer data from Peppol metadata (from UBL XML)
      // Supplier = AccountingSupplierParty (the sender from original client invoice) - shown in CLIENT section
      // Customer = AccountingCustomerParty (the receiver) - used for company phone fallback
      const supplierFromUBL = invoice.peppol_metadata?.supplier || {};
      const supplierAddressFromUBL = invoice.peppol_metadata?.supplierAddress || {};
      const customerFromUBL = invoice.peppol_metadata?.customer || {};
      
      // Helper to get display invoice number (prefer original client invoice number from buyerReference)
      const getDisplayInvoiceNumber = (inv) => {
        // For Peppol invoices, check if buyerReference contains the original client invoice number
        if (inv.source === 'peppol' && inv.peppol_metadata?.buyerReference) {
          const buyerRef = inv.peppol_metadata.buyerReference;
          // If buyerReference looks like a client invoice number (INV-* or FACT-*), use it
          if (buyerRef && (buyerRef.match(/^(INV|FACT)-\d+$/i) || buyerRef.startsWith('INV-') || buyerRef.startsWith('FACT-'))) {
            return buyerRef;
          }
        }
        // Also check the invoice_number itself - if it's from UBL XML (cbc:ID), it should be the original invoice number
        if (inv.source === 'peppol' && inv.invoice_number && 
            (inv.invoice_number.match(/^(INV|FACT)-\d+$/i) || inv.invoice_number.startsWith('INV-') || inv.invoice_number.startsWith('FACT-'))) {
          return inv.invoice_number;
        }
        // Otherwise, use the stored invoice_number (Peppol-generated or manual)
        return inv.invoice_number;
      };
      
      // Use customer phone from Peppol metadata if receiverCompanyInfo phone is not available
      const companyPhone = receiverCompanyInfo?.phone || customerFromUBL?.phone || customerFromUBL?.email || '';
      
      // Extract supplier info from UBL XML (AccountingSupplierParty) - shown in CLIENT section
      // This should match exactly what was in the original client invoice that was sent
      // Structure from webhook: supplier.name, supplier.vatNumber, supplier.email, supplier.contactPhone, supplier.address.*
      const supplierName = supplierFromUBL.name || invoice.peppol_metadata?.supplierName || invoice.supplier_name || '';
      const supplierEmail = supplierFromUBL.email || invoice.supplier_email || '';
      const supplierPhone = supplierFromUBL.contactPhone || supplierFromUBL.phone || invoice.supplier_phone || '';
      const supplierVatNumber = supplierFromUBL.vatNumber || invoice.peppol_metadata?.supplierVatNumber || invoice.supplier_vat_number || '';
      
      // Extract supplier address from UBL - check both supplier.address and supplierAddress
      const supplierAddress = supplierFromUBL.address || supplierAddressFromUBL || {};
      const supplierStreet = supplierAddress.street || supplierAddressFromUBL.street || invoice.supplier_address || '';
      const supplierPostalCode = supplierAddress.postalCode || supplierAddressFromUBL.postalCode || supplierAddressFromUBL.zip_code || invoice.supplier_postal_code || '';
      const supplierCity = supplierAddress.city || supplierAddressFromUBL.city || invoice.supplier_city || '';
      const supplierCountry = supplierAddress.country || supplierAddressFromUBL.country || '';
      
      const expenseInvoiceData = {
        // Use sender's company info for logo, receiver's company info for COMPANY section
        companyInfo: {
          ...receiverCompanyInfo,
          // Override logo with sender's logo if available
          logo: companyInfoForLogo?.logo || receiverCompanyInfo?.logo,
          phone: companyPhone || receiverCompanyInfo?.phone || ''
        },
        supplier: {
          name: supplierName,
          email: supplierEmail,
          phone: supplierPhone,
          address: supplierStreet,
          postal_code: supplierPostalCode,
          city: supplierCity,
          country: supplierCountry,
          vat_number: supplierVatNumber
        },
        invoice: {
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: amount,
          net_amount: netAmount,
          vat_amount: vatAmount,
          category: invoice.category,
          payment_method: invoice.payment_method,
          source: invoice.source,
          notes: invoice.notes,
          status: invoice.status,
          invoice_type: invoice.invoice_type || 'final',
          // Include deposit/balance amounts if available (for manual invoices or Peppol invoices)
          deposit_amount: invoice.deposit_amount || invoice.peppol_metadata?.deposit_amount || null,
          balance_amount: invoice.balance_amount || invoice.peppol_metadata?.balance_amount || null,
          // Include full peppol_metadata for deposit/balance information
          peppol_metadata: invoice.peppol_metadata || null,
          // Include invoice lines from Peppol metadata if available
          invoiceLines: invoice.peppol_metadata?.invoiceLines || [],
          // Include payment information from Peppol metadata if available
          payment: invoice.peppol_metadata?.payment || null
        }
      };

      // Use original client invoice number from buyerReference if available, otherwise use stored invoice_number
      const invoiceNumber = getDisplayInvoiceNumber(invoice) || 'EXP-INV-001';
      
      // Get user's preferred language
      const userLanguage = i18n.language || localStorage.getItem('language') || 'fr';
      
      // Get invoice_type for PDF generation
      const invoiceType = invoice.invoice_type || 'final';
      
      // Generate PDF blob
      const pdfBlob = await generateExpenseInvoicePDF(expenseInvoiceData, invoiceNumber, userLanguage, invoiceType);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting expense invoice PDF:', error);
      alert(t('expenseInvoices.errors.exportError', 'Error exporting invoice PDF'));
    } finally {
      setDownloadingInvoiceId(null);
    }
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
          setIsSendToAccountantModalOpen(true);
          break;
          
        case 'export':
          if (!downloadingInvoiceId) {
            setDownloadingInvoiceId('bulk'); // Use 'bulk' as identifier for bulk export
            try {
              await exportExpenseInvoices(selectedExpenseInvoices);
            } finally {
              setDownloadingInvoiceId(null);
            }
          }
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
          setSelectedInvoice(invoice);
          setIsSendToAccountantModalOpen(true);
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
          
        case 'export':
          await handleExportExpenseInvoicePDF(invoice);
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
          t('expenseInvoices.export.invoiceType', 'Invoice Type'),
          t('expenseInvoices.export.supplier', 'Supplier'),
          t('expenseInvoices.export.email', 'Email'),
          t('expenseInvoices.export.supplierVat', 'Supplier VAT'),
          t('expenseInvoices.export.supplierPhone', 'Supplier Phone'),
          t('expenseInvoices.export.supplierAddress', 'Supplier Address'),
          t('expenseInvoices.export.supplierCity', 'Supplier City'),
          t('expenseInvoices.export.supplierPostalCode', 'Supplier Postal Code'),
          t('expenseInvoices.export.supplierCountry', 'Supplier Country'),
          t('expenseInvoices.export.totalAmount', 'Total Amount'),
          t('expenseInvoices.export.netAmount', 'Net Amount'),
          t('expenseInvoices.export.vatAmount', 'VAT Amount'),
          t('expenseInvoices.export.depositAmount', 'Deposit Amount'),
          t('expenseInvoices.export.balanceAmount', 'Balance Amount'),
          t('expenseInvoices.export.status', 'Status'),
          t('expenseInvoices.export.category', 'Category'),
          t('expenseInvoices.export.source', 'Source'),
          t('expenseInvoices.export.issueDate', 'Issue Date'),
          t('expenseInvoices.export.dueDate', 'Due Date'),
          t('expenseInvoices.export.paymentMethod', 'Payment Method'),
          t('expenseInvoices.export.senderPeppolId', 'Sender Peppol ID'),
          t('expenseInvoices.export.documentType', 'Document Type'),
          t('expenseInvoices.export.buyerReference', 'Buyer Reference')
        ]
      ];

      invoicesToExport.forEach(invoice => {
        // Extract supplier info from peppol_metadata
        const supplierContact = invoice.peppol_metadata?.supplier || {};
        const supplierAddress = invoice.peppol_metadata?.supplierAddress || {};
        
        // Get deposit and balance amounts from metadata
        const depositAmount = invoice.peppol_metadata?.deposit_amount || '';
        const balanceAmount = invoice.peppol_metadata?.balance_amount || '';
        
        const row = [
          invoice.invoice_number,
          invoice.invoice_type || 'final',
          invoice.supplier_name,
          invoice.supplier_email || supplierContact.email || '',
          invoice.supplier_vat_number || '',
          supplierContact.contactPhone || supplierContact.phone || supplierContact.telephone || '',
          supplierAddress.street || '',
          supplierAddress.city || '',
          supplierAddress.postalCode || supplierAddress.zip_code || '',
          supplierAddress.country || '',
          formatNumber(invoice.amount || 0),
          formatNumber(invoice.net_amount || 0),
          formatNumber(invoice.vat_amount || 0),
          depositAmount ? formatNumber(depositAmount) : '',
          balanceAmount ? formatNumber(balanceAmount) : '',
          invoice.status,
          invoice.category || '',
          invoice.source,
          invoice.issue_date,
          invoice.due_date,
          invoice.payment_method || '',
          invoice.sender_peppol_id || '',
          invoice.peppol_metadata?.documentTypeLabel || '',
          invoice.peppol_metadata?.buyerReference || ''
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
      // Use values directly from form - no calculations
      // Values should be provided by user or from UBL XML
      const invoiceData = {
        ...newInvoice,
        amount: parseFloat(newInvoice.amount) || 0,
        netAmount: parseFloat(newInvoice.netAmount) || parseFloat(newInvoice.amount) || 0,
        vatAmount: parseFloat(newInvoice.vatAmount) || 0,
        invoiceType: newInvoice.invoiceType || 'final',
        depositAmount: newInvoice.depositAmount || null,
        balanceAmount: newInvoice.balanceAmount || null
      };
      
      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.createExpenseInvoice(invoiceData);
      
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
      // Use centralized calculation function to ensure consistency
      // Use values directly from form - no calculations
      // Values should be provided by user or from UBL XML
      // Prepare peppol_metadata with deposit/balance info if invoice_type is set
      const existingMetadata = updatedInvoice.peppol_metadata || {};
      const peppolMetadata = { ...existingMetadata };
      if (updatedInvoice.invoiceType) {
        peppolMetadata.invoice_type = updatedInvoice.invoiceType;
        if (updatedInvoice.depositAmount !== null && updatedInvoice.depositAmount !== undefined) {
          peppolMetadata.deposit_amount = parseFloat(updatedInvoice.depositAmount) || 0;
        }
        if (updatedInvoice.balanceAmount !== null && updatedInvoice.balanceAmount !== undefined) {
          peppolMetadata.balance_amount = parseFloat(updatedInvoice.balanceAmount) || 0;
        }
      }

      const expenseService = new ExpenseInvoicesService();
      const result = await expenseService.updateExpenseInvoice(invoiceId, {
        supplier_name: updatedInvoice.supplierName,
        supplier_email: updatedInvoice.supplierEmail,
        supplier_vat_number: updatedInvoice.supplierVatNumber || null,
        invoice_number: updatedInvoice.invoiceNumber,
        amount: parseFloat(updatedInvoice.amount) || 0,
        net_amount: parseFloat(updatedInvoice.netAmount) || parseFloat(updatedInvoice.amount) || 0,
        vat_amount: parseFloat(updatedInvoice.vatAmount) || 0,
        category: updatedInvoice.category || null,
        invoice_type: updatedInvoice.invoiceType || 'final',
        issue_date: updatedInvoice.issueDate,
        due_date: updatedInvoice.dueDate,
        payment_method: updatedInvoice.paymentMethod || null,
        notes: updatedInvoice.notes || null,
        peppol_metadata: Object.keys(peppolMetadata).length > 0 ? peppolMetadata : null
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

  // Check permissions for actions
  const { canEdit, canCreate, canDelete } = usePermissionCheck('supplierInvoices');

  return (
    <PermissionGuard module="supplierInvoices" requiredPermission="view_only">
    <div className="h-screen bg-background overflow-y-auto">
      <MainSidebar />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-16 pt-4' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6 overflow-visible">
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
                {canCreate && (
                  <Button
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => setIsQuickCreateOpen(true)}
                    className="text-xs sm:text-sm"
                  >
                    {t('expenseInvoices.addInvoice', 'Add Invoice')}
                  </Button>
                )}
              </div>
          </div>
          </header>

          {/* Summary Bar */}
          <ExpenseInvoicesSummaryBar summaryData={summaryData} isLoading={isLoading} />

          {/* Filters */}
          <ExpenseInvoicesFilterToolbar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filteredCount={filteredExpenseInvoices.length}
          />

          {/* Group by Supplier Toggle */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icon name="Layers" size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t('expenseInvoices.groupBySupplier.label', 'Group invoices by supplier')}
              </span>
            </div>
            <Button
              variant={groupBySupplier ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupBySupplier(!groupBySupplier)}
              iconName={groupBySupplier ? "Check" : "X"}
              iconPosition="left"
            >
              {groupBySupplier 
                ? t('expenseInvoices.groupBySupplier.enabled', 'Grouped') 
                : t('expenseInvoices.groupBySupplier.disabled', 'Ungrouped')}
            </Button>
          </div>

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

              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('send_to_accountant')}
                  iconName="Send"
                  iconPosition="left"
                  disabled={!canEdit}
                  title={!canEdit ? t('permissions.noFullAccess') : ''}
                >
                  {t('expenseInvoices.bulkActions.sendToAccountant', 'Send to Accountant')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  iconName="Download"
                  iconPosition="left"
                  loading={downloadingInvoiceId === 'bulk'}
                  disabled={downloadingInvoiceId === 'bulk'}
                >
                  {t('expenseInvoices.bulkActions.export', 'Export')}
                </Button>
                
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    iconName="Trash2"
                    iconPosition="left"
                  >
                    {t('expenseInvoices.bulkActions.delete', 'Delete')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Data Table */}
          {isLoading ? (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <TableLoader message={t('expenseInvoices.loading', 'Loading expense invoices...')} />
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6">
              <ErrorDisplay 
                error={error} 
                onRetry={loadData}
                title={t('expenseInvoices.errors.loadError', 'Error Loading Expense Invoices')}
              />
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
              downloadingInvoiceId={downloadingInvoiceId}
              canEdit={canEdit}
              canDelete={canDelete}
              groupBySupplier={groupBySupplier}
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

      {/* Send to Accountant Modal */}
      <SendToAccountantModal
        invoices={selectedExpenseInvoices.length > 0 
          ? expenseInvoices.filter(inv => selectedExpenseInvoices.includes(inv.id))
          : selectedInvoice 
            ? [selectedInvoice] 
            : []}
        isOpen={isSendToAccountantModalOpen}
        onClose={() => {
          // Clear selections and refresh when modal is closed after success
          setSelectedExpenseInvoices([]);
          setSelectedInvoice(null);
          setIsSendToAccountantModalOpen(false);
          // Refresh data
          const expenseService = new ExpenseInvoicesService();
          expenseService.getExpenseInvoices().then(refreshResult => {
            if (refreshResult.success) {
              setExpenseInvoices(refreshResult.data);
              setFilteredExpenseInvoices(refreshResult.data);
            }
          });
        }}
        onSuccess={async (email) => {
          const expenseService = new ExpenseInvoicesService();
          const invoiceIds = selectedExpenseInvoices.length > 0 
            ? selectedExpenseInvoices 
            : selectedInvoice 
              ? [selectedInvoice.id] 
              : [];
          
          if (invoiceIds.length === 0) {
            alert(t('expenseInvoices.errors.selectAtLeastOne', 'Please select at least one expense invoice'));
            return;
          }

          const sendResult = await expenseService.sendToAccountant(invoiceIds, email, user?.id);
          if (sendResult.success) {
            // Don't clear selections or refresh immediately - let modal show success state first
            // The modal will handle closing and then we'll refresh
            // Don't close modal - let it show success state
          } else {
            // Throw error so modal can display it
            throw new Error(sendResult.error || t('expenseInvoices.errors.error', 'Error sending email'));
          }
        }}
        isExpenseInvoice={true}
      />
    </div>
    </PermissionGuard>
  );
};

export default ExpenseInvoicesManagement; 