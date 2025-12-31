import { supabase } from './supabaseClient';
import { uploadFile, getPublicUrl, getSignedUrl } from './storageService';
import { formatCurrency, formatNumber } from '../utils/numberFormat';

/**
 * Service for managing expense invoices with Supabase backend
 */
export class ExpenseInvoicesService {
  constructor() {
    this.tableName = 'expense_invoices';
  }

  /**
   * Get all expense invoices with optional filters
   */
  async getExpenseInvoices(filters = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`supplier_name.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.dateRange) {
        const today = new Date();
        let startDate = new Date();

        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(today.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        }
        query = query.gte('issue_date', startDate.toISOString().split('T')[0]);
      }

      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching expense invoices:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des factures de dépenses'
      };
    }
  }

  /**
   * Get a single expense invoice by ID
   */
  async getExpenseInvoice(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching expense invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de la facture de dépense'
      };
    }
  }

  /**
   * Create a new expense invoice
   */
  async createExpenseInvoice(invoiceData) {
    try {
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare peppol_metadata with deposit/balance info if invoice_type is set
      const peppolMetadata = {};
      if (invoiceData.invoiceType) {
        peppolMetadata.invoice_type = invoiceData.invoiceType;
        const depositAmount = invoiceData.depositAmount !== null && invoiceData.depositAmount !== undefined 
          ? parseFloat(invoiceData.depositAmount) || 0 
          : 0;
        const balanceAmount = invoiceData.balanceAmount !== null && invoiceData.balanceAmount !== undefined 
          ? parseFloat(invoiceData.balanceAmount) || 0 
          : 0;
        
        if (invoiceData.invoiceType === 'deposit') {
          // Deposit invoice: amount = deposit, store deposit and balance in metadata
          peppolMetadata.deposit_amount = depositAmount || parseFloat(invoiceData.amount);
          if (balanceAmount > 0) {
            peppolMetadata.balance_amount = balanceAmount;
          }
        } else if (invoiceData.invoiceType === 'final') {
          // Final invoice: amount = balance, store deposit and balance in metadata
          if (depositAmount > 0) {
            peppolMetadata.deposit_amount = depositAmount;
          }
          peppolMetadata.balance_amount = balanceAmount || parseFloat(invoiceData.amount);
        }
      }

      // Insert the main invoice record
      let { data: invoice, error: invoiceError } = await supabase
        .from(this.tableName)
        .insert([{
          user_id: user.id,
          invoice_number: invoiceData.invoiceNumber || `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          supplier_name: invoiceData.supplierName,
          supplier_email: invoiceData.supplierEmail,
          supplier_vat_number: invoiceData.supplierVatNumber || null,
          amount: parseFloat(invoiceData.amount),
          net_amount: parseFloat(invoiceData.netAmount) || parseFloat(invoiceData.amount),
          vat_amount: parseFloat(invoiceData.vatAmount) || 0,
          status: 'pending',
          category: invoiceData.category || null,
          source: invoiceData.source || 'manual',
          invoice_type: invoiceData.invoiceType || 'final',
          issue_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_method: invoiceData.paymentMethod || null,
          notes: invoiceData.notes || null,
          peppol_metadata: Object.keys(peppolMetadata).length > 0 ? peppolMetadata : null
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Note: OCR processing is done in the frontend before form submission
      // Files are already uploaded to Supabase Storage during OCR
      // User verifies and edits the extracted data before clicking "Add Invoice"
      // No need to process OCR again here - the invoice is created with the verified data

      return {
        success: true,
        data: invoice,
        message: 'Facture de dépense créée avec succès'
      };
    } catch (error) {
      console.error('Error creating expense invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de la facture de dépense'
      };
    }
  }

  /**
   * Update an expense invoice
   */
  async updateExpenseInvoice(id, updateData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Facture de dépense mise à jour avec succès'
      };
    } catch (error) {
      console.error('Error updating expense invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour de la facture de dépense'
      };
    }
  }

  /**
   * Delete an expense invoice
   */
  async deleteExpenseInvoice(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Facture de dépense supprimée avec succès'
      };
    } catch (error) {
      console.error('Error deleting expense invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression de la facture de dépense'
      };
    }
  }

  /**
   * Upload invoice file to storage (metadata not stored in database)
   * Files are stored directly in Supabase Storage via OCRService
   * This method is kept for backward compatibility but does not store metadata
   */
  async uploadInvoiceFile(file, invoiceId = null) {
    try {
      // Upload file to storage (expense-invoice-attachments bucket for expense invoices)
      const { data: uploadData, error: uploadError, filePath } = await uploadFile(
        file, 
        'expense-invoice-attachments',
        invoiceId ? `invoice-${invoiceId}` : 'temp'
      );

      if (uploadError) throw uploadError;

      return {
        success: true,
        data: {
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          url: getPublicUrl('expense-invoice-attachments', filePath)
        },
        message: 'Fichier téléchargé avec succès'
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: 'Erreur lors du téléchargement du fichier'
      };
    }
  }



  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId, paymentDetails = {}) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'paid',
          payment_method: paymentDetails.method || 'Virement bancaire',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Facture marquée comme payée'
      };
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return {
        success: false,
        error: 'Erreur lors du marquage de la facture comme payée'
      };
    }
  }

  /**
   * Generate CSV content from expense invoices
   * @param {Array} invoices - Array of expense invoice objects
   * @returns {string} CSV content
   */
  generateExpenseInvoiceCSV(invoices) {
    const headers = [
      'Invoice Number',
      'Invoice Type',
      'Supplier',
      'Email',
      'Supplier VAT',
      'Supplier Phone',
      'Supplier Address',
      'Supplier City',
      'Supplier Postal Code',
      'Supplier Country',
      'Total Amount',
      'Net Amount',
      'VAT Amount',
      'Deposit Amount',
      'Balance Amount',
      'Status',
      'Category',
      'Source',
      'Issue Date',
      'Due Date',
      'Payment Method',
      'Sender Peppol ID',
      'Document Type',
      'Buyer Reference'
    ];

    const rows = invoices.map(invoice => {
      // Extract supplier info from peppol_metadata
      const supplierContact = invoice.peppol_metadata?.supplier || {};
      const supplierAddress = invoice.peppol_metadata?.supplierAddress || {};
      
      // Get deposit and balance amounts from metadata
      const depositAmount = invoice.peppol_metadata?.deposit_amount || '';
      const balanceAmount = invoice.peppol_metadata?.balance_amount || '';
      
      return [
        invoice.invoice_number || '',
        invoice.invoice_type || 'final',
        invoice.supplier_name || '',
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
        invoice.status || '',
        invoice.category || '',
        invoice.source || '',
        invoice.issue_date || '',
        invoice.due_date || '',
        invoice.payment_method || '',
        invoice.sender_peppol_id || '',
        invoice.peppol_metadata?.documentTypeLabel || '',
        invoice.peppol_metadata?.buyerReference || ''
      ];
    });

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Send invoice to accountant
   */
  async sendToAccountant(invoiceIds, accountantEmail, userId = null) {
    try {
      if (!accountantEmail || !accountantEmail.trim()) {
        throw new Error('Accountant email is required');
      }

      // Fetch full invoice data
      const { data: invoicesData, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .in('id', invoiceIds);

      if (fetchError) throw fetchError;
      if (!invoicesData || invoicesData.length === 0) {
        throw new Error('No invoices found');
      }

      // Generate CSV content
      const csvContent = this.generateExpenseInvoiceCSV(invoicesData);
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Convert to base64 for email attachment
      const csvBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(csvBlob);
      });

      // Get company profile for email template
      const { EmailService } = await import('./emailService');
      const companyProfile = await EmailService.getCurrentUserCompanyProfile(userId);
      const companyName = companyProfile?.company_name || 'Notre entreprise';

      // Prepare variables for template (edge function will load and render template)
      // Use centralized formatCurrency for European formatting
      const totalAmount = formatCurrency(invoicesData.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0));
      const invoiceDate = new Date().toLocaleDateString('fr-FR');

      // Send email via edge function with attachment
      // Edge function will load template from database and render it
      const emailData = {
        to_email: accountantEmail.trim(),
        invoice_count: invoiceIds.length.toString(),
        total_amount: totalAmount,
        date: invoiceDate,
        company_name: companyName,
        language: null, // Will be fetched from user's language_preference in edge function
        user_id: userId,
        attachments: [
          {
            filename: `factures-fournisseurs-${new Date().toISOString().split('T')[0]}.csv`,
            content: csvBase64,
            type: 'text/csv',
            disposition: 'attachment'
          }
        ],
        meta: {
          invoice_count: invoiceIds.length,
          invoice_ids: invoiceIds,
          sent_at: new Date().toISOString()
        }
      };

      const emailResult = await EmailService.sendEmailViaEdgeFunction('expense_invoice_to_accountant', emailData);

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Update invoices as sent
      const { error: updateError } = await supabase
        .from(this.tableName)
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .in('id', invoiceIds);

      if (updateError) {
        console.warn('Failed to update invoices:', updateError);
      }

      return {
        success: true,
        message: `${invoiceIds.length} facture(s) envoyée(s) à ${accountantEmail}`,
        data: {
          sentTo: accountantEmail,
          sentAt: new Date().toISOString(),
          invoiceCount: invoiceIds.length
        }
      };
    } catch (error) {
      console.error('Error sending to accountant:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi au comptable'
      };
    }
  }

  /**
   * Get expense invoice statistics
   */
  async getStatistics() {
    try {
      // Get total counts and amounts with issue_date for growth calculation
      const { data: invoices, error: invoicesError } = await supabase
        .from(this.tableName)
        .select('status, amount, due_date, source, issue_date, created_at');

      if (invoicesError) throw invoicesError;

      const stats = {
        totalExpenses: 0,
        paidExpenses: 0,
        outstandingAmount: 0,
        overdueCount: 0,
        peppolInvoices: 0,
        manualInvoices: 0,
        expensesGrowth: 0
      };

      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

      let currentMonthExpenses = 0;
      let previousMonthExpenses = 0;

      invoices.forEach(invoice => {
        const amount = parseFloat(invoice.amount || 0);
        stats.totalExpenses += amount;
        
        // Count Peppol vs Manual invoices
        if (invoice.source === 'peppol') {
          stats.peppolInvoices++;
        } else {
          stats.manualInvoices++;
        }
        
        if (invoice.status === 'paid') {
          stats.paidExpenses += amount;
        } else {
          stats.outstandingAmount += amount;
          
          // Check if overdue
          if (invoice.due_date && new Date(invoice.due_date) < today) {
            stats.overdueCount++;
          }
        }
        
        // Calculate monthly expenses for growth
        const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : (invoice.created_at ? new Date(invoice.created_at) : null);
        if (issueDate) {
          if (issueDate >= currentMonthStart && issueDate <= today) {
            currentMonthExpenses += amount;
          } else if (issueDate >= previousMonthStart && issueDate <= previousMonthEnd) {
            previousMonthExpenses += amount;
          }
        }
      });

      stats.outstandingAmount = Math.round(stats.outstandingAmount * 100) / 100;
      stats.totalExpenses = Math.round(stats.totalExpenses * 100) / 100;
      stats.paidExpenses = Math.round(stats.paidExpenses * 100) / 100;
      
      // Calculate growth percentage
      if (previousMonthExpenses > 0) {
        stats.expensesGrowth = Math.round(((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 * 10) / 10;
      } else if (currentMonthExpenses > 0) {
        stats.expensesGrowth = 100; // 100% growth if no previous month data
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      };
    }
  }



  /**
   * Check if file type is supported for OCR processing
   */
  isOCRSupported(file) {
    if (!file) return false;
    
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    return supportedTypes.includes(file.type);
  }

  /**
   * Process OCR for expense invoice files
   */
  async processOCR(fileUrl, fileName) {
    try {
      const response = await fetch('/functions/v1/process-expense-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({
          fileUrl,
          fileName
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'OCR processing failed');
      }

      return {
        success: true,
        data: result.extractedData
      };
    } catch (error) {
      console.error('Error processing OCR:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement OCR'
      };
    }
  }

  /**
   * Get signed URL for file download
   */
  async getFileDownloadUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await getSignedUrl('expense-invoice-attachments', filePath, expiresIn);
      
      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error getting download URL:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération du lien de téléchargement'
      };
    }
  }
}

export default ExpenseInvoicesService;
