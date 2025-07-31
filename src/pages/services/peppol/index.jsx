import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MainSidebar from '../../../components/ui/MainSidebar';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import peppolService from '../../../services/peppolService';

const PeppolNetworkPage = () => {
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [peppolSettings, setPeppolSettings] = useState({
    peppolId: '',
    businessName: '',
    sandboxMode: true,
    isConfigured: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: '',
    amountRange: '',
    recipient: '',
    sender: ''
  });
  const [filteredSentInvoices, setFilteredSentInvoices] = useState([]);
  const [filteredReceivedInvoices, setFilteredReceivedInvoices] = useState([]);
  const [sentViewMode, setSentViewMode] = useState('table');
  const [receivedViewMode, setReceivedViewMode] = useState('table');

  React.useEffect(() => {
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

  // Load Peppol settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const result = await peppolService.getPeppolSettings();
      if (result.success) {
        setPeppolSettings(result.data);
      }
    };
    loadSettings();
  }, []);

  // Auto-switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSentViewMode('card');
        setReceivedViewMode('card');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock data for sent invoices
  const sentInvoices = [
    {
      id: 'INV-001',
      recipient: 'Entreprise ABC',
      recipientEmail: 'contact@abc.com',
      amount: 2500.00,
      date: '2024-01-15',
      status: 'delivered',
      peppolId: '0208:123456789',
      currency: 'EUR',
      dueDate: '2024-02-15'
    },
    {
      id: 'INV-002',
      recipient: 'Société XYZ',
      recipientEmail: 'info@xyz.fr',
      amount: 1800.50,
      date: '2024-01-14',
      status: 'delivered',
      peppolId: '0208:987654321',
      currency: 'EUR',
      dueDate: '2024-02-14'
    },
    {
      id: 'INV-003',
      recipient: 'Cabinet Legal',
      recipientEmail: 'contact@cabinet-legal.fr',
      amount: 3200.00,
      date: '2024-01-13',
      status: 'pending',
      peppolId: '0208:456789123',
      currency: 'EUR',
      dueDate: '2024-02-13'
    },
    {
      id: 'INV-004',
      recipient: 'Construction Plus',
      recipientEmail: 'devis@construction-plus.fr',
      amount: 4500.00,
      date: '2024-01-12',
      status: 'failed',
      peppolId: '0208:789123456',
      currency: 'EUR',
      dueDate: '2024-02-12'
    },
    {
      id: 'INV-005',
      recipient: 'Rénovation Express',
      recipientEmail: 'contact@renovation-express.fr',
      amount: 2800.00,
      date: '2024-01-11',
      status: 'delivered',
      peppolId: '0208:321654987',
      currency: 'EUR',
      dueDate: '2024-02-11'
    }
  ];

  // Mock data for received invoices
  const receivedInvoices = [
    {
      id: 'INV-R-001',
      sender: 'Fournisseur Tech',
      senderEmail: 'factures@fournisseur-tech.fr',
      amount: 1500.00,
      date: '2024-01-15',
      status: 'received',
      peppolId: '0208:111222333',
      currency: 'EUR',
      dueDate: '2024-02-15'
    },
    {
      id: 'INV-R-002',
      sender: 'Services Pro',
      senderEmail: 'comptabilite@services-pro.fr',
      amount: 2200.00,
      date: '2024-01-14',
      status: 'processed',
      peppolId: '0208:444555666',
      currency: 'EUR',
      dueDate: '2024-02-14'
    },
    {
      id: 'INV-R-003',
      sender: 'Matériaux Plus',
      senderEmail: 'facturation@materiaux-plus.fr',
      amount: 3800.00,
      date: '2024-01-13',
      status: 'received',
      peppolId: '0208:777888999',
      currency: 'EUR',
      dueDate: '2024-02-13'
    },
    {
      id: 'INV-R-004',
      sender: 'Outillage Pro',
      senderEmail: 'compta@outillage-pro.fr',
      amount: 950.00,
      date: '2024-01-12',
      status: 'pending',
      peppolId: '0208:123789456',
      currency: 'EUR',
      dueDate: '2024-02-12'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'received':
      case 'processed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'received':
        return 'Reçu';
      case 'processed':
        return 'Traité';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const result = await peppolService.savePeppolSettings(peppolSettings);
      if (result.success) {
        setPeppolSettings(result.data);
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await peppolService.testConnection(peppolSettings);
      if (result.success) {
        alert('Test de connexion réussi! Temps de réponse: ' + result.data.responseTime + 'ms');
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Erreur lors du test de connexion');
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPeppolSettings(prev => ({ ...prev, [field]: value }));
  };

  // Apply filters to invoices
  useEffect(() => {
    const applyFilters = (invoices, isSent = true) => {
      return invoices.filter(invoice => {
        // Search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchFields = [
            invoice.id,
            isSent ? invoice.recipient : invoice.sender,
            isSent ? invoice.recipientEmail : invoice.senderEmail,
            invoice.peppolId
          ].join(' ').toLowerCase();
          
          if (!searchFields.includes(searchTerm)) {
            return false;
          }
        }

        // Status filter
        if (filters.status && invoice.status !== filters.status) {
          return false;
        }

        // Date range filter
        if (filters.dateRange) {
          const invoiceDate = new Date(invoice.date);
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
            default:
              break;
          }
          
          if (invoiceDate < startDate) {
            return false;
          }
        }

        // Amount range filter
        if (filters.amountRange) {
          const amount = invoice.amount;
          switch (filters.amountRange) {
            case 'low':
              if (amount >= 1000) return false;
              break;
            case 'medium':
              if (amount < 1000 || amount >= 5000) return false;
              break;
            case 'high':
              if (amount < 5000) return false;
              break;
            default:
              break;
          }
        }

        // Recipient/Sender filter
        if (isSent && filters.recipient) {
          if (!invoice.recipient.toLowerCase().includes(filters.recipient.toLowerCase())) {
            return false;
          }
        } else if (!isSent && filters.sender) {
          if (!invoice.sender.toLowerCase().includes(filters.sender.toLowerCase())) {
            return false;
          }
        }

        return true;
      });
    };

    setFilteredSentInvoices(applyFilters(sentInvoices, true));
    setFilteredReceivedInvoices(applyFilters(receivedInvoices, false));
  }, [filters, sentInvoices, receivedInvoices]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateRange: '',
      amountRange: '',
      recipient: '',
      sender: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.status || filters.dateRange || filters.amountRange || filters.recipient || filters.sender;
  };

  const renderSentTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">N° Facture</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">Destinataire</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">Peppol ID</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">Montant</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">Date</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">Statut</th>
          </tr>
        </thead>
        <tbody>
          {filteredSentInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
              <td className="p-4 font-medium">{invoice.id}</td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{invoice.recipient}</div>
                  <div className="text-xs text-muted-foreground">{invoice.recipientEmail}</div>
                </div>
              </td>
              <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
              <td className="p-4 font-medium">
                {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(invoice.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSentCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredSentInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Send" size={12} className="sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{invoice.id}</h3>
                  <p className="text-xs text-muted-foreground truncate">{invoice.recipient}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center flex-shrink-0 ${getStatusColor(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-xs text-foreground truncate">{invoice.recipientEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Montant</p>
                <p className="text-xs font-medium text-foreground">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <Icon name="Network" size={10} className="sm:w-3 sm:h-3 text-success flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono truncate">{invoice.peppolId}</span>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(invoice.date).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReceivedTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">N° Facture</th>
            <th className="text-left p-4 font-medium">Expéditeur</th>
            <th className="text-left p-4 font-medium">Peppol ID</th>
            <th className="text-left p-4 font-medium">Montant</th>
            <th className="text-left p-4 font-medium">Date</th>
            <th className="text-left p-4 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceivedInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
              <td className="p-4 font-medium">{invoice.id}</td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{invoice.sender}</div>
                  <div className="text-xs text-muted-foreground">{invoice.senderEmail}</div>
                </div>
              </td>
              <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
              <td className="p-4 font-medium">
                {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(invoice.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderReceivedCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredReceivedInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Download" size={12} className="sm:w-4 sm:h-4 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{invoice.id}</h3>
                  <p className="text-xs text-muted-foreground truncate">{invoice.sender}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center flex-shrink-0 ${getStatusColor(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-xs text-foreground truncate">{invoice.senderEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Montant</p>
                <p className="text-xs font-medium text-foreground">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <Icon name="Network" size={10} className="sm:w-3 sm:h-3 text-success flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono truncate">{invoice.peppolId}</span>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(invoice.date).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <div className="flex items-center">
                  <Icon name="Network" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Réseau Peppol</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Factures envoyées et reçues via le réseau Peppol
              </p>
            </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                
          </div>
            </div>
          </header>

          {/* Connection Status */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Status Peppol</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${peppolSettings.isConfigured ? 'bg-success' : 'bg-error'}`}></div>
                  <p className={`text-xs sm:text-sm font-medium ${peppolSettings.isConfigured ? 'text-success' : 'text-error'}`}>
                    {peppolSettings.isConfigured ? 'Connecté' : 'Non connecté'}
                  </p>
                </div>
                {peppolSettings.sandboxMode && (
                  <p className="text-xs text-warning mt-1">Mode sandbox activé</p>
                )}
              </div>
              <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                <Icon name="Network" size={18} className="sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            {peppolSettings.peppolId && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {peppolSettings.peppolId}
                </p>
                {peppolSettings.businessName && (
                  <p className="text-xs text-muted-foreground">
                    Entreprise: {peppolSettings.businessName}
                  </p>
                )}
                {peppolSettings.lastTested && (
                  <p className="text-xs text-muted-foreground">
                    Testé le: {new Date(peppolSettings.lastTested).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Factures envoyées</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{sentInvoices.length}</p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Send" size={18} className="sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Factures reçues</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{receivedInvoices.length}</p>
                </div>
                <div className="bg-success/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Download" size={18} className="sm:w-6 sm:h-6 text-success" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total envoyé</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {sentInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-warning/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Euro" size={18} className="sm:w-6 sm:h-6 text-warning" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total reçu</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {receivedInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-info/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Euro" size={18} className="sm:w-6 sm:h-6 text-info" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-border">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'setup'
                    ? 'border-b-2 border-primary text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('setup')}
              >
                Configuration
              </button>
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'sent'
                    ? 'border-b-2 border-primary text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('sent')}
              >
                Factures envoyées ({sentInvoices.length})
              </button>
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'received'
                    ? 'border-b-2 border-primary text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('received')}
              >
                Factures reçues ({receivedInvoices.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'setup' && (
              <div className="max-w-2xl">
                {/* Peppol Integration Setup */}
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Link" size={20} className="sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">Peppol Integration</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Configure your Peppol connection to send and receive electronic invoices.
                      </p>
                    </div>
                  </div>

                  {/* Information Box */}
                  <div className="bg-muted/30 border border-border rounded-lg p-3 sm:p-4">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <Icon name="Info" size={16} className="sm:w-5 sm:h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm text-foreground">
                          Peppol (Pan-European Public Procurement On-Line) enables secure electronic document exchange. 
                          You need a valid Peppol ID to send and receive invoices through the network.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                        Peppol ID (Participant Identifier)
                      </label>
                      <Input
                        value={peppolSettings.peppolId}
                        onChange={(e) => handleInputChange('peppolId', e.target.value)}
                        placeholder="e.g., 0088:1234567890123"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: scheme:identifier (e.g., 0088:1234567890123 for GLN).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                        Business Name
                      </label>
                      <Input
                        value={peppolSettings.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Your registered business name"
                      />
                    </div>

                    {/* Sandbox Mode Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/20 rounded-lg gap-3 sm:gap-0">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-foreground">
                          Sandbox Mode (for testing)
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enable sandbox mode to test Peppol integration without sending real invoices
                        </p>
                      </div>
                      <button
                        onClick={() => handleInputChange('sandboxMode', !peppolSettings.sandboxMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          peppolSettings.sandboxMode ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            peppolSettings.sandboxMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={isTesting || !peppolSettings.peppolId}
                      variant="outline"
                      iconName={isTesting ? "Loader2" : "Wifi"}
                      iconPosition="left"
                      className="w-full sm:w-auto"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      iconName={isSaving ? "Loader2" : "Save"}
                      iconPosition="left"
                      className="w-full sm:min-w-[200px]"
                    >
                      {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>

                  {/* Help Information */}
                  <div className="bg-muted/30 border border-border rounded-lg p-3 sm:p-4">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <Icon name="Info" size={16} className="sm:w-5 sm:h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm text-foreground font-medium mb-1">
                          Don't have a Peppol ID?
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          You need to register with a Peppol Access Point provider. Contact your local authority 
                          or a certified Peppol provider to get started.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sent' && (
              <div>
                {/* Filter Toolbar */}
                <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Rechercher</label>
                      <Input
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="N° facture, destinataire, Peppol ID..."
                        iconName="Search"
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Statut</label>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        placeholder="Tous les statuts"
                        options={[
                          { value: '', label: 'Tous les statuts' },
                          { value: 'delivered', label: 'Livré' },
                          { value: 'pending', label: 'En attente' },
                          { value: 'failed', label: 'Échoué' }
                        ]}
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Période</label>
                      <Select
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        placeholder="Toutes les dates"
                        options={[
                          { value: '', label: 'Toutes les dates' },
                          { value: 'today', label: 'Aujourd\'hui' },
                          { value: 'week', label: '7 derniers jours' },
                          { value: 'month', label: '30 derniers jours' },
                          { value: 'quarter', label: '3 derniers mois' }
                        ]}
                      />
                    </div>

                    {/* Amount Range */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Montant</label>
                      <Select
                        value={filters.amountRange}
                        onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                        placeholder="Tous les montants"
                        options={[
                          { value: '', label: 'Tous les montants' },
                          { value: 'low', label: 'Moins de 1000€' },
                          { value: 'medium', label: '1000€ - 5000€' },
                          { value: 'high', label: 'Plus de 5000€' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-border gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {filteredSentInvoices.length} facture(s) trouvée(s)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasActiveFilters() && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={clearFilters}
                          iconName="X"
                          iconPosition="left"
                          className="h-8 sm:h-9"
                        >
                          Effacer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* View Toggle */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">Vue:</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setSentViewMode('table')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            sentViewMode === 'table'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Table" size={14} className="mr-1" />
                          Tableau
                        </button>
                        <button
                          onClick={() => setSentViewMode('card')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            sentViewMode === 'card'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Grid" size={14} className="mr-1" />
                          Cartes
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {filteredSentInvoices.length} facture(s) envoyée(s)
                    </div>
                  </div>

                  {/* Content */}
                  {filteredSentInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Send" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {sentInvoices.length === 0 ? 'Aucune facture envoyée' : 'Aucune facture trouvée'}
                      </h3>
                      <p className="text-muted-foreground">
                        {sentInvoices.length === 0 
                          ? 'Vous n\'avez pas encore envoyé de factures via Peppol.'
                          : 'Aucune facture ne correspond aux critères de recherche.'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {sentViewMode === 'table' && renderSentTableView()}
                      {sentViewMode === 'card' && renderSentCardView()}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'received' && (
              <div>
                {/* Filter Toolbar */}
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Rechercher</label>
                      <Input
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="N° facture, expéditeur, Peppol ID..."
                        iconName="Search"
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Statut</label>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        placeholder="Tous les statuts"
                        options={[
                          { value: '', label: 'Tous les statuts' },
                          { value: 'received', label: 'Reçu' },
                          { value: 'processed', label: 'Traité' },
                          { value: 'pending', label: 'En attente' }
                        ]}
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Période</label>
                      <Select
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        placeholder="Toutes les dates"
                        options={[
                          { value: '', label: 'Toutes les dates' },
                          { value: 'today', label: 'Aujourd\'hui' },
                          { value: 'week', label: '7 derniers jours' },
                          { value: 'month', label: '30 derniers jours' },
                          { value: 'quarter', label: '3 derniers mois' }
                        ]}
                      />
                    </div>

                    {/* Amount Range */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Montant</label>
                      <Select
                        value={filters.amountRange}
                        onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                        placeholder="Tous les montants"
                        options={[
                          { value: '', label: 'Tous les montants' },
                          { value: 'low', label: 'Moins de 1000€' },
                          { value: 'medium', label: '1000€ - 5000€' },
                          { value: 'high', label: 'Plus de 5000€' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {filteredReceivedInvoices.length} facture(s) trouvée(s)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasActiveFilters() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          iconName="X"
                          iconPosition="left"
                        >
                          Effacer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* View Toggle */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">Vue:</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setReceivedViewMode('table')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            receivedViewMode === 'table'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Table" size={14} className="mr-1" />
                          Tableau
                        </button>
                        <button
                          onClick={() => setReceivedViewMode('card')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            receivedViewMode === 'card'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Grid" size={14} className="mr-1" />
                          Cartes
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {filteredReceivedInvoices.length} facture(s) reçue(s)
                    </div>
                  </div>

                  {/* Content */}
                  {filteredReceivedInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Download" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {receivedInvoices.length === 0 ? 'Aucune facture reçue' : 'Aucune facture trouvée'}
                      </h3>
                      <p className="text-muted-foreground">
                        {receivedInvoices.length === 0 
                          ? 'Vous n\'avez pas encore reçu de factures via Peppol.'
                          : 'Aucune facture ne correspond aux critères de recherche.'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {receivedViewMode === 'table' && renderReceivedTableView()}
                      {receivedViewMode === 'card' && renderReceivedCardView()}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PeppolNetworkPage; 