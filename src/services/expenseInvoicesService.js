import { supabase } from './supabaseClient';
import { uploadFile, getPublicUrl, getSignedUrl } from './storageService';

/**
 * Service for managing expense invoices with Supabase backend
 */
export class ExpenseInvoicesService {
  constructor() {
    this.tableName = 'expense_invoices';
    this.attachmentsTable = 'expense_invoice_attachments';
  }

  /**
   * Get all expense invoices with optional filters
   */
  async getExpenseInvoices(filters = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          attachments:${this.attachmentsTable}(*)
        `)
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
        .select(`
          *,
          attachments:${this.attachmentsTable}(*)
        `)
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
      // Insert the main invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from(this.tableName)
        .insert([{
          invoice_number: invoiceData.invoiceNumber || `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          supplier_name: invoiceData.supplierName,
          supplier_email: invoiceData.supplierEmail,
          supplier_vat_number: invoiceData.supplierVatNumber,
          amount: parseFloat(invoiceData.amount),
          net_amount: parseFloat(invoiceData.netAmount) || parseFloat(invoiceData.amount),
          vat_amount: parseFloat(invoiceData.vatAmount) || 0,
          status: 'pending',
          category: invoiceData.category,
          source: invoiceData.source || 'manual',
          issue_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_method: invoiceData.paymentMethod,
          notes: invoiceData.notes
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Handle file upload if present
      if (invoiceData.invoiceFile) {
        const fileResult = await this.uploadInvoiceFile(invoiceData.invoiceFile, invoice.id);
        
        // Process OCR if file upload was successful
        if (fileResult.success && this.isOCRSupported(invoiceData.invoiceFile)) {
          try {
            const ocrResult = await this.processOCR(fileResult.data.url, invoiceData.invoiceFile.name);
            if (ocrResult.success) {
              // Update invoice with OCR data if fields are empty
              const updateData = {};
              if (!invoice.supplier_name && ocrResult.data.supplier_name) {
                updateData.supplier_name = ocrResult.data.supplier_name;
              }
              if (!invoice.supplier_email && ocrResult.data.supplier_email) {
                updateData.supplier_email = ocrResult.data.supplier_email;
              }
              if (!invoice.supplier_vat_number && ocrResult.data.supplier_vat_number) {
                updateData.supplier_vat_number = ocrResult.data.supplier_vat_number;
              }
              if (!invoice.invoice_number && ocrResult.data.invoice_number) {
                updateData.invoice_number = ocrResult.data.invoice_number;
              }
              if (!invoice.issue_date && ocrResult.data.issue_date) {
                updateData.issue_date = ocrResult.data.issue_date;
              }
              if (!invoice.due_date && ocrResult.data.due_date) {
                updateData.due_date = ocrResult.data.due_date;
              }
              if (!invoice.category && ocrResult.data.category) {
                updateData.category = ocrResult.data.category;
              }
              if (!invoice.amount && ocrResult.data.amount) {
                updateData.amount = parseFloat(ocrResult.data.amount);
              }
              if (!invoice.net_amount && ocrResult.data.net_amount) {
                updateData.net_amount = parseFloat(ocrResult.data.net_amount);
              }
              if (!invoice.vat_amount && ocrResult.data.tax_amount) {
                updateData.vat_amount = parseFloat(ocrResult.data.tax_amount);
              }
              
              // Update invoice with OCR data if we have any
              if (Object.keys(updateData).length > 0) {
                await this.updateExpenseInvoice(invoice.id, updateData);
                // Refresh invoice data
                const updatedInvoice = await this.getExpenseInvoice(invoice.id);
                if (updatedInvoice.success) {
                  invoice = updatedInvoice.data;
                }
              }
            }
          } catch (ocrError) {
            console.warn('OCR processing failed:', ocrError);
            // Continue without OCR data
          }
        }
      }

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
   * Upload invoice file and store metadata
   */
  async uploadInvoiceFile(file, invoiceId = null) {
    try {
      // Upload file to storage
      const { data: uploadData, error: uploadError, filePath } = await uploadFile(
        file, 
        'expense-invoice-attachments',
        invoiceId ? `invoice-${invoiceId}` : 'temp'
      );

      if (uploadError) throw uploadError;

      // Store file metadata in database
      const { data: attachmentData, error: attachmentError } = await supabase
        .from(this.attachmentsTable)
        .insert([{
          expense_invoice_id: invoiceId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type.split('/')[1],
          mime_type: file.type,
          is_primary: true
        }])
        .select()
        .single();

      if (attachmentError) throw attachmentError;

      return {
        success: true,
        data: {
          ...attachmentData,
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
   * Send invoice to accountant
   */
  async sendToAccountant(invoiceIds, accountantEmail = null) {
    try {
      // This would integrate with your email service
      const defaultAccountantEmail = accountantEmail || 'comptable@Haliqo.fr';
      
      // For now, just mark as sent
      const { error } = await supabase
        .from(this.tableName)
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .in('id', invoiceIds);

      if (error) throw error;

      return {
        success: true,
        message: `${invoiceIds.length} facture(s) envoyée(s) à votre comptable`,
        data: {
          sentTo: defaultAccountantEmail,
          sentAt: new Date().toISOString(),
          invoiceCount: invoiceIds.length
        }
      };
    } catch (error) {
      console.error('Error sending to accountant:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'envoi au comptable'
      };
    }
  }

  /**
   * Get expense invoice statistics
   */
  async getStatistics() {
    try {
      // Get total counts and amounts
      const { data: invoices, error: invoicesError } = await supabase
        .from(this.tableName)
        .select('status, amount, due_date');

      if (invoicesError) throw invoicesError;

      const stats = {
        totalExpenses: 0,
        paidExpenses: 0,
        outstandingAmount: 0,
        overdueCount: 0,
        peppolInvoices: 0,
        manualInvoices: 0
      };

      const today = new Date();

      invoices.forEach(invoice => {
        stats.totalExpenses += parseFloat(invoice.amount || 0);
        
        if (invoice.status === 'paid') {
          stats.paidExpenses += parseFloat(invoice.amount || 0);
        } else {
          stats.outstandingAmount += parseFloat(invoice.amount || 0);
          
          // Check if overdue
          if (invoice.due_date && new Date(invoice.due_date) < today) {
            stats.overdueCount++;
          }
        }
      });

      stats.outstandingAmount = Math.round(stats.outstandingAmount * 100) / 100;
      stats.totalExpenses = Math.round(stats.totalExpenses * 100) / 100;
      stats.paidExpenses = Math.round(stats.paidExpenses * 100) / 100;

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
