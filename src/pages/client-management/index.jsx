import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import MainSidebar from '../../components/ui/MainSidebar';

import ClientModal from './components/ClientModal';
import ClientAnalytics, { 
  RevenueOverview, 
  TopClients, 
  AIRecommendations, 
  RiskFactors, 
  QuickActions 
} from './components/ClientAnalytics';
import FilterToolbar from './components/FilterToolbar';
import { analyzeClientData } from '../../services/openaiService';

const ClientManagement = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Jean Dupont',
      type: 'individual',
      email: 'jean.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      address: '123 Rue de la Paix, Paris',
      totalRevenue: 15000,
      projectsCount: 5,
      status: 'active',
      lastContact: '2025-07-15',
      preferences: ['Email', 'SMS'],
      paymentReliability: 95,
      enablePeppol: false,
      peppolId: ''
    },
    {
      id: 2,
      name: 'SARL Construction Plus',
      type: 'professional',
      email: 'contact@constructionplus.fr',
      phone: '+33 1 23 45 67 89',
      address: '456 Avenue des Entreprises, Lyon',
      totalRevenue: 85000,
      projectsCount: 12,
      status: 'active',
      lastContact: '2025-07-18',
      contactPerson: 'Marie Martin',
      companySize: 'PME',
      paymentReliability: 98,
      enablePeppol: true,
      peppolId: '0208:123456789'
    },
    {
      id: 3,
      name: 'Cabinet Legal Martin',
      type: 'professional',
      email: 'contact@cabinetmartin.fr',
      phone: '+33 2 34 56 78 90',
      address: '789 Boulevard des Avocats, Marseille',
      totalRevenue: 45000,
      projectsCount: 8,
      status: 'active',
      lastContact: '2025-07-16',
      contactPerson: 'Sophie Bernard',
      companySize: 'TPE',
      paymentReliability: 92,
      enablePeppol: false,
      peppolId: ''
    }
  ]);
  
  const [filteredClients, setFilteredClients] = useState(clients);
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

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filters]);

  useEffect(() => {
    generateAnalytics();
  }, [clients]);

  // Auto-switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const filterClients = () => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(client => client.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    setFilteredClients(filtered);
  };

  const generateAnalytics = async () => {
    if (clients.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const insights = await analyzeClientData(clients);
      setAnalytics(insights);
    } catch (error) {
      console.error('Analytics generation error:', error);
      // Fallback analytics
      setAnalytics({
        totalRevenue: clients.reduce((sum, client) => sum + client.totalRevenue, 0),
        topClients: clients.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3).map(c => c.name),
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

  const handleClientSave = (clientData) => {
    if (selectedClient) {
      // Update existing client
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id 
          ? { ...client, ...clientData }
          : client
      ));
    } else {
      // Add new client
      const newClient = {
        id: Date.now(),
        ...clientData,
        totalRevenue: 0,
        projectsCount: 0,
        status: 'active',
        lastContact: new Date().toISOString().split('T')[0],
        paymentReliability: 100
      };
      setClients(prev => [...prev, newClient]);
    }
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleClientDelete = (clientId) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'prospect': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'individual' ? 'User' : 'Building2';
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Client</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Type</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Contact</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Peppol</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Projets</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">CA Total</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Statut</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <motion.tr
              key={client.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-border hover:bg-muted/20 transition-colors"
            >
              <td className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name={getTypeIcon(client.type)} size={16} className="sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-medium text-foreground">{client.name}</p>
                    {client.contactPerson && (
                      <p className="text-xs sm:text-sm text-muted-foreground">Contact: {client.contactPerson}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="p-3 sm:p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-center ${
                  client.type === 'individual' ?'text-blue-600 bg-blue-100' :'text-green-600 bg-green-100'
                }`}>
                  {client.type === 'individual' ? 'Particulier' : 'Professionnel'}
                </span>
              </td>
              <td className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm">
                  <p className="text-foreground">{client.email}</p>
                  <p className="text-muted-foreground">{client.phone}</p>
                </div>
              </td>
              <td className="p-3 sm:p-4">
                {client.enablePeppol && client.peppolId ? (
                  <div className="flex items-center space-x-2">
                    <Icon name="Network" size={14} className="sm:w-4 sm:h-4 text-success" />
                    <span className="text-xs text-muted-foreground font-mono">{client.peppolId}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Non configuré</span>
                )}
              </td>
              <td className="p-3 sm:p-4">
                <span className="font-medium text-foreground">{client.projectsCount}</span>
              </td>
              <td className="p-3 sm:p-4">
                <span className="font-medium text-foreground">
                  {client.totalRevenue.toLocaleString()}€
                </span>
              </td>
              <td className="p-3 sm:p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(client.status)}`}>
                  {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'}
                </span>
              </td>
              <td className="p-3 sm:p-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleClientSelect(client)}
                    iconName="Eye"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleClientDelete(client.id)}
                    iconName="Trash2"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredClients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg p-2 sm:p-3 md:p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name={getTypeIcon(client.type)} size={12} className="sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{client.name}</h3>
                  {client.contactPerson && (
                    <p className="text-xs text-muted-foreground truncate">Contact: {client.contactPerson}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center ${
                  client.type === 'individual' ?'text-blue-600 bg-blue-100' :'text-green-600 bg-green-100'
                }`}>
                  {client.type === 'individual' ? 'Particulier' : 'Professionnel'}
                </span>
                <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center ${getStatusColor(client.status)}`}>
                  {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Contact</p>
                <p className="text-xs text-foreground truncate">{client.email}</p>
                <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Projets</p>
                <p className="text-xs font-medium text-foreground">{client.projectsCount}</p>
                <p className="text-xs text-muted-foreground truncate">CA: {client.totalRevenue.toLocaleString()}€</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                {client.enablePeppol && client.peppolId ? (
                  <div className="flex items-center space-x-1">
                    <Icon name="Network" size={10} className="sm:w-3 sm:h-3 text-success flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono truncate">{client.peppolId}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground truncate">Peppol: Non configuré</span>
                )}
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleClientSelect(client)}
                  iconName="Eye"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleClientDelete(client.id)}
                  iconName="Trash2"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

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
                  <Icon name="Users" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des Clients</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez vos relations clients avec une vue d'ensemble complète
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  onClick={() => {
                    setSelectedClient(null);
                    setIsModalOpen(true);
                  }}
                  iconName="Plus"
                  iconPosition="left"
                  className="text-xs sm:text-sm"
                >
                  Nouveau Client
                </Button>
              </div>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  iconName="Search"
                />
              </div>
              <FilterToolbar filters={filters} onFiltersChange={setFilters} />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{clients.length}</p>
                </div>
                <Icon name="Users" size={18} className="sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Particuliers</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {clients.filter(c => c.type === 'individual').length}
                  </p>
                </div>
                <Icon name="User" size={18} className="sm:w-6 sm:h-6 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Professionnels</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {clients.filter(c => c.type === 'professional').length}
                  </p>
                </div>
                <Icon name="Building2" size={18} className="sm:w-6 sm:h-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">CA Total</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {clients.reduce((sum, client) => sum + client.totalRevenue, 0).toLocaleString()}€
                  </p>
                </div>
                <Icon name="Euro" size={18} className="sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>

            {/* Analytics Boxes - Top Row */}
            <div className="col-span-2 lg:col-span-2">
              <RevenueOverview analytics={analytics} isLoading={isAnalyzing} />
            </div>
          </div>

          {/* Additional Analytics - Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <TopClients analytics={analytics} isLoading={isAnalyzing} />
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
          </div>

          {/* Clients Data Display */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {/* View Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-border">
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

            {/* Content */}
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Icon name="Users" size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Aucun client trouvé</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Vous n\'avez pas encore ajouté de clients.'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                  iconName="RotateCcw"
                  iconPosition="left"
                >
                  {searchTerm ? 'Effacer la recherche' : 'Actualiser'}
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'table' && renderTableView()}
                {viewMode === 'card' && renderCardView()}
              </>
            )}
          </div>

          {/* Analytics Section - Below Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <AIRecommendations analytics={analytics} isLoading={isAnalyzing} />
            <RiskFactors analytics={analytics} isLoading={isAnalyzing} />
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Icon name="BarChart3" size={14} className="sm:w-4 sm:h-4 text-primary" />
                <h3 className="text-xs sm:text-sm font-medium text-foreground">Performance</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taux de conversion</span>
                  <span className="font-medium">85%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Satisfaction client</span>
                  <span className="font-medium">4.8/5</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Temps de réponse</span>
                  <span className="font-medium">2.4h</span>
                </div>
              </div>
            </div>
          </div>

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
      </main>
    </div>
  );
};

export default ClientManagement;