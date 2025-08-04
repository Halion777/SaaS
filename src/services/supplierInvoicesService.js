// Service for managing supplier invoices
class SupplierInvoicesService {
  constructor() {
    // Use import.meta.env for Vite or fallback to empty string
    this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_API_URL) || '/api';
  }

  // Get all supplier invoices with optional filters
  async getSupplierInvoices(filters = {}) {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      const mockInvoices = [
        {
          id: 1,
          number: "FOURN-2024-001",
          supplierName: "Materiaux Pro",
          supplierEmail: "contact@materiaux-pro.fr",
          amount: 850.00,
          status: "paid",
          issueDate: "2024-07-01",
          dueDate: "2024-07-31",
          paymentMethod: "Virement bancaire",
          category: "Matériaux",
          invoiceFile: "facture-materiaux-001.pdf"
        },
        {
          id: 2,
          number: "FOURN-2024-002",
          supplierName: "Outillage Express",
          supplierEmail: "info@outillage-express.fr",
          amount: 1250.00,
          status: "pending",
          issueDate: "2024-07-05",
          dueDate: "2024-08-04",
          paymentMethod: "Chèque",
          category: "Outillage",
          invoiceFile: "facture-outillage-002.pdf"
        },
        {
          id: 3,
          number: "FOURN-2024-003",
          supplierName: "Électricité Plus",
          supplierEmail: "facturation@electricite-plus.fr",
          amount: 320.00,
          status: "overdue",
          issueDate: "2024-06-15",
          dueDate: "2024-07-15",
          paymentMethod: "Prélèvement",
          category: "Services",
          invoiceFile: "facture-electricite-003.pdf"
        }
      ];

      // Apply filters
      let filteredInvoices = mockInvoices;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice =>
          invoice.number.toLowerCase().includes(searchTerm) ||
          invoice.supplierName.toLowerCase().includes(searchTerm) ||
          invoice.supplierEmail.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.status) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === filters.status);
      }

      if (filters.category) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.category === filters.category);
      }

      return {
        success: true,
        data: filteredInvoices,
        total: filteredInvoices.length
      };
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des factures fournisseurs'
      };
    }
  }

  // Get a single supplier invoice by ID
  async getSupplierInvoice(id) {
    try {
      // Mock implementation
      const mockInvoice = {
        id: parseInt(id),
        number: "FOURN-2024-001",
        supplierName: "Materiaux Pro",
        supplierEmail: "contact@materiaux-pro.fr",
        amount: 850.00,
        status: "paid",
        issueDate: "2024-07-01",
        dueDate: "2024-07-31",
        paymentMethod: "Virement bancaire",
        category: "Matériaux",
        invoiceFile: "facture-materiaux-001.pdf",
        notes: "Facture pour matériaux de construction",
        attachments: ["facture-materiaux-001.pdf", "bon-livraison-001.pdf"]
      };

      return {
        success: true,
        data: mockInvoice
      };
    } catch (error) {
      console.error('Error fetching supplier invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de la facture fournisseur'
      };
    }
  }

  // Create a new supplier invoice
  async createSupplierInvoice(invoiceData) {
    try {
      // Mock implementation - in real app, this would upload to server
      const newInvoice = {
        id: Date.now(),
        ...invoiceData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: newInvoice,
        message: 'Facture fournisseur créée avec succès'
      };
    } catch (error) {
      console.error('Error creating supplier invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de la facture fournisseur'
      };
    }
  }

  // Update a supplier invoice
  async updateSupplierInvoice(id, updateData) {
    try {
      // Mock implementation
      const updatedInvoice = {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: updatedInvoice,
        message: 'Facture fournisseur mise à jour avec succès'
      };
    } catch (error) {
      console.error('Error updating supplier invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour de la facture fournisseur'
      };
    }
  }

  // Delete a supplier invoice
  async deleteSupplierInvoice(id) {
    try {
      // Mock implementation
      return {
        success: true,
        message: 'Facture fournisseur supprimée avec succès'
      };
    } catch (error) {
      console.error('Error deleting supplier invoice:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression de la facture fournisseur'
      };
    }
  }

  // Upload invoice file
  async uploadInvoiceFile(file, invoiceId = null) {
    try {
      // Mock file upload
      const formData = new FormData();
      formData.append('file', file);
      if (invoiceId) {
        formData.append('invoiceId', invoiceId);
      }

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const uploadedFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // In real app, this would be the server URL
        uploadedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: uploadedFile,
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

  // Send invoice to accountant
  async sendToAccountant(invoiceIds, accountantEmail = null) {
    try {
      // Mock implementation
      const defaultAccountantEmail = accountantEmail || 'comptable@Haliqo.fr';
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

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

  // Mark invoice as paid
  async markAsPaid(invoiceId, paymentDetails = {}) {
    try {
      // Mock implementation
      const updatedInvoice = {
        id: invoiceId,
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentDetails: {
          method: paymentDetails.method || 'Virement bancaire',
          reference: paymentDetails.reference || `PAY-${Date.now()}`,
          ...paymentDetails
        }
      };

      return {
        success: true,
        data: updatedInvoice,
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

  // Get supplier invoice statistics
  async getStatistics() {
    try {
      // Mock statistics
      const stats = {
        totalExpenses: 4370.00,
        paidExpenses: 1810.00,
        outstandingAmount: 2560.00,
        expensesGrowth: -8.2,
        overdueCount: 2,
        avgPaymentTime: 12,
        paymentRate: 88,
        upcomingDeadlines: [
          {
            invoiceNumber: "FOURN-2024-002",
            supplierName: "Outillage Express",
            amount: 1250.00,
            daysLeft: 3
          },
          {
            invoiceNumber: "FOURN-2024-005",
            supplierName: "Assurance Artisan",
            amount: 450.00,
            daysLeft: 7
          }
        ]
      };

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

  // Export supplier invoices
  async exportInvoices(filters = {}, format = 'pdf') {
    try {
      // Mock export
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        data: {
          downloadUrl: `/exports/supplier-invoices-${Date.now()}.${format}`,
          filename: `factures-fournisseurs-${new Date().toISOString().split('T')[0]}.${format}`,
          exportedAt: new Date().toISOString()
        },
        message: 'Export généré avec succès'
      };
    } catch (error) {
      console.error('Error exporting invoices:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'export des factures'
      };
    }
  }

  // Bulk operations
  async bulkOperation(operation, invoiceIds, additionalData = {}) {
    try {
      switch (operation) {
        case 'mark_paid':
          return await this.bulkMarkAsPaid(invoiceIds, additionalData);
        case 'send_to_accountant':
          return await this.sendToAccountant(invoiceIds, additionalData.accountantEmail);
        case 'delete':
          return await this.bulkDelete(invoiceIds);
        case 'export':
          return await this.exportInvoices(additionalData.filters, additionalData.format);
        default:
          throw new Error(`Opération non supportée: ${operation}`);
      }
    } catch (error) {
      console.error('Error in bulk operation:', error);
      return {
        success: false,
        error: `Erreur lors de l'opération groupée: ${error.message}`
      };
    }
  }

  // Bulk mark as paid
  async bulkMarkAsPaid(invoiceIds, paymentDetails = {}) {
    try {
      const results = await Promise.all(
        invoiceIds.map(id => this.markAsPaid(id, paymentDetails))
      );

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      return {
        success: true,
        data: {
          processed: results.length,
          successful: successCount,
          failed: failedCount
        },
        message: `${successCount} facture(s) marquée(s) comme payée(s)`
      };
    } catch (error) {
      console.error('Error in bulk mark as paid:', error);
      return {
        success: false,
        error: 'Erreur lors du marquage groupé comme payé'
      };
    }
  }

  // Bulk delete
  async bulkDelete(invoiceIds) {
    try {
      const results = await Promise.all(
        invoiceIds.map(id => this.deleteSupplierInvoice(id))
      );

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      return {
        success: true,
        data: {
          processed: results.length,
          successful: successCount,
          failed: failedCount
        },
        message: `${successCount} facture(s) supprimée(s)`
      };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression groupée'
      };
    }
  }
}

export default new SupplierInvoicesService(); 