import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import ClientModal from './components/ClientModal';
import ClientCard from './components/ClientCard';
import FilterToolbar from './components/FilterToolbar';
import ClientAnalytics from './components/ClientAnalytics';
import { 
  fetchClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  searchClients,
  getClientStatistics,
  toggleClientStatus,
  getClientsByLocation
} from '../../services/clientsService';

const ClientManagement = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    location: 'all'
  });
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Default to card view on mobile/tablet, table view on desktop
    return window.innerWidth < 1024 ? 'card' : 'table';
  });

  // Fetch clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients when search term or filters change
  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filters]);

  // Handle view mode resize
  useEffect(() => {
    const handleViewModeResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'table') {
        setViewMode('card');
      } else if (window.innerWidth >= 1024 && viewMode === 'card') {
        setViewMode('table');
      }
    };

    window.addEventListener('resize', handleViewModeResize);
    return () => window.removeEventListener('resize', handleViewModeResize);
  }, [viewMode]);

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
    
    // Auto-switch to card view on mobile/tablet
    const handleViewModeResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'table') {
        setViewMode('card');
      } else if (window.innerWidth >= 1024 && viewMode === 'card') {
        setViewMode('table');
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await fetchClients();
      
      if (error) {
        console.error('Error loading clients:', error);
        setError(error.message || 'Failed to load clients');
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading clients:', err);
      setError('An unexpected error occurred');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };



  const filterClients = () => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactPerson && client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(client => client.type === filters.type);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(client => 
        filters.status === 'active' ? client.isActive : !client.isActive
      );
    }

    // Apply location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(client => 
        client.country === filters.location
      );
    }

    setFilteredClients(filtered);
  };

  const generateAnalytics = async () => {
    if (clients.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await getClientStatistics();
      
      if (error) {
        console.error('Error getting client statistics:', error);
        // Fallback analytics
        setAnalytics({
          totalRevenue: clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0),
          topClients: clients.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 3).map(c => c.name),
          recommendations: ['Focus on high-value clients', 'Improve payment collection'],
          riskFactors: ['Payment delays possible']
        });
      } else {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Analytics generation error:', error);
      // Fallback analytics
      setAnalytics({
        totalRevenue: clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0),
        topClients: clients.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 3).map(c => c.name),
        recommendations: ['Focus on high-value clients', 'Improve payment collection'],
        riskFactors: ['Payment delays possible']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleClientSave = async (clientData) => {
    try {
      if (selectedClient) {
        // Update existing client
        const { data, error } = await updateClient(selectedClient.id, clientData);
        
        if (error) {
          console.error('Error updating client:', error);
          alert('Failed to update client: ' + (error.message || 'Unknown error'));
          return;
        }
        
        setClients(prev => prev.map(client => 
          client.id === selectedClient.id ? { ...client, ...clientData } : client
        ));
      } else {
        // Create new client
        const { data, error } = await createClient(clientData);
        
        if (error) {
          console.error('Error creating client:', error);
          alert('Failed to create client: ' + (error.message || 'Unknown error'));
          return;
        }
        
        const newClient = {
          id: data.id,
          ...clientData,
          totalRevenue: 0,
          projectsCount: 0,
          isActive: true
        };
        
        setClients(prev => [...prev, newClient]);
      }
      
      setIsModalOpen(false);
      setSelectedClient(null);
    } catch (err) {
      console.error('Unexpected error saving client:', err);
      alert('An unexpected error occurred while saving the client');
    }
  };

  const handleClientDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }
    
    try {
      const { success, error } = await deleteClient(clientId);
      
      if (error) {
        console.error('Error deleting client:', error);
        if (error.hasRelatedData) {
          alert('Cannot delete client with associated quotes or invoices');
        } else {
          alert('Failed to delete client: ' + (error.message || 'Unknown error'));
        }
        return;
      }
      
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (err) {
      console.error('Unexpected error deleting client:', err);
      alert('An unexpected error occurred while deleting the client');
    }
  };

  const handleStatusToggle = async (clientId) => {
    try {
      // Toggle the isActive boolean
      const currentClient = clients.find(c => c.id === clientId);
      if (!currentClient) return;
      
      const newIsActive = !currentClient.isActive;
      
      const { data, error } = await toggleClientStatus(clientId, newIsActive);
      
      if (error) {
        console.error('Error toggling client status:', error);
        alert('Failed to update client status: ' + (error.message || 'Unknown error'));
        return;
      }
      
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, isActive: newIsActive } : client
      ));
    } catch (err) {
      console.error('Unexpected error toggling client status:', err);
      alert('An unexpected error occurred while updating client status');
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadClients();
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvHeaders = [
      'Nom',
      'Type',
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Code Postal',
      'Pays',
      'Contact Personne',
      'Taille Entreprise',
      'Numéro Enregistrement',
      'ID Peppol',
      'Peppol Activé',
      'Statut',
      'Préférences Communication'
    ];

    const csvData = filteredClients.map(client => [
      client.name || '',
      client.type === 'professionnel' ? 'Professionnel' : 'Particulier',
      client.email || '',
      client.phone || '',
      client.address || '',
      client.city || '',
      client.postalCode || '',
      getCountryLabel(client.country) || '',
      client.contactPerson || '',
      getCompanySizeLabel(client.companySize) || '',
      client.regNumber || '',
      client.peppolId || '',
      client.enablePeppol ? 'Oui' : 'Non',
      client.isActive ? 'Actif' : 'Inactif',
      (client.preferences || []).join(', ')
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions for CSV export
  const getCountryLabel = (countryCode) => {
    if (!countryCode) return '';
    const countries = {
      'FR': 'France',
      'BE': 'Belgique',
      'CH': 'Suisse',
      'CA': 'Canada',
      'US': 'États-Unis',
      'GB': 'Royaume-Uni',
      'DE': 'Allemagne',
      'IT': 'Italie',
      'ES': 'Espagne',
      'NL': 'Pays-Bas'
    };
    return countries[countryCode] || countryCode;
  };

  const getCompanySizeLabel = (size) => {
    if (!size) return '';
    const sizes = {
      '1-10': '1-10 employés',
      '11-50': '11-50 employés',
      '51-200': '51-200 employés',
      '201-500': '201-500 employés',
      '500+': '500+ employés'
    };
    return sizes[size] || size;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <MainSidebar />
      
      {/* Main Content */}
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
                  <Icon name="Users" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des Clients</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez vos clients et suivez leurs informations
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  iconName="RefreshCw"
                >
                  Actualiser
                </Button>
                <Button
                  onClick={() => {
                    setSelectedClient(null);
                    setIsModalOpen(true);
                  }}
                  iconName="Plus"
                >
                  Nouveau Client
                </Button>
              </div>
            </div>
          </header>
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={20} className="text-destructive" />
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
                <p className="text-xl font-bold text-foreground">{clients.length}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Users" size={24} className="text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Particulier</p>
                <p className="text-xl font-bold text-foreground">
                  {clients.filter(c => c.type === 'particulier').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="User" size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Professionnel</p>
                <p className="text-xl font-bold text-foreground">
                  {clients.filter(c => c.type === 'professionnel').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="Building" size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
                        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">CA Total</p>
                <p className="text-xl font-bold text-foreground">
                  {clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0).toLocaleString()}€
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Euro" size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Icon name="Crown" size={20} className="text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-foreground">Top Clients</h3>
            </div>
            <div className="space-y-3">
              {clients.length > 0 ? (
                clients.slice(0, 3).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-yellow-500 mr-2">#{index + 1}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{client.name}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Aucun client trouvé</p>
              )}
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Icon name="TrendingUp" size={20} className="text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-foreground">Aperçu Financier</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">CA Total</p>
                <p className="text-xl font-bold text-foreground">
                  {clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0).toLocaleString()}€
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${Math.min(
                      clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0) > 0 
                        ? (clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0) / 100000) * 100 
                        : 0, 
                      100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Objectif</span>
                <span className="font-medium text-foreground">100,000€</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Icon name="Zap" size={20} className="text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-foreground">Actions Rapides</h3>
            </div>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={handleExportCSV}
              >
                <Icon name="Download" size={14} className="mr-2" />
                Exporter la liste clients
              </Button>
            </div>
          </div>
        </div>



        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-6">
          <FilterToolbar
            filters={filters}
            onFiltersChange={handleFilterChange}
            filteredCount={filteredClients.length}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Vue:</span>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="Table" size={14} className="mr-1" />
                Tableau
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'card'
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
            {filteredClients.length} client(s)
          </div>
        </div>

        {/* Clients Display */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun client trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier client'
              }
            </p>
            {!searchTerm && Object.values(filters).every(f => f === 'all') && (
              <Button
                onClick={() => {
                  setSelectedClient(null);
                  setIsModalOpen(true);
                }}
                iconName="Plus"
              >
                Ajouter un client
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Peppol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Projets
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          CA Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon name="User" size={20} className="text-primary" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-foreground">{client.name}</div>
                                {client.contactPerson && (
                                  <div className="text-sm text-muted-foreground">Contact: {client.contactPerson}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.type === 'professionnel' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {client.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground">{client.email}</div>
                            <div className="text-sm text-muted-foreground">{client.phone}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground">
                              {client.peppolId || 'Non configuré'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground">
                              {client.projectsCount || 0}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-foreground">
                              {client.totalRevenue ? `${client.totalRevenue.toLocaleString()}€` : '0€'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.isActive)}`}>
                              {client.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClientSelect(client)}
                                className="h-8 w-8 p-0"
                                title="Voir/Modifier"
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClientDelete(client.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Supprimer"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={() => handleClientSelect(client)}
                    onDelete={() => handleClientDelete(client.id)}
                    onStatusToggle={(newStatus) => handleStatusToggle(client.id, newStatus)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Client Modal */}
      {isModalOpen && (
        <ClientModal
          client={selectedClient}
          onSave={handleClientSave}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientManagement;