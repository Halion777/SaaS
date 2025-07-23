import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

import Icon from '../../components/AppIcon';

import ClientModal from './components/ClientModal';
import ClientAnalytics from './components/ClientAnalytics';
import FilterToolbar from './components/FilterToolbar';
import { analyzeClientData } from '../../services/openaiService';

const ClientManagement = () => {
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
      paymentReliability: 95
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
      paymentReliability: 98
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos relations clients avec une vue d'ensemble complète
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          iconName="Plus"
          iconPosition="left"
        >
          Nouveau Client
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Clients List */}
        <div className="xl:col-span-3 space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                </div>
                <Icon name="Users" size={24} color="var(--color-primary)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Particuliers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.type === 'individual').length}
                  </p>
                </div>
                <Icon name="User" size={24} color="var(--color-blue)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Professionnels</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.type === 'professional').length}
                  </p>
                </div>
                <Icon name="Building2" size={24} color="var(--color-green)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CA Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clients.reduce((sum, client) => sum + client.totalRevenue, 0).toLocaleString()}€
                  </p>
                </div>
                <Icon name="Euro" size={24} color="var(--color-primary)" />
              </div>
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Client</th>
                    <th className="text-left p-4 font-medium text-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-foreground">Contact</th>
                    <th className="text-left p-4 font-medium text-foreground">Projets</th>
                    <th className="text-left p-4 font-medium text-foreground">CA Total</th>
                    <th className="text-left p-4 font-medium text-foreground">Statut</th>
                    <th className="text-left p-4 font-medium text-foreground">Actions</th>
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
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Icon name={getTypeIcon(client.type)} size={20} color="var(--color-primary)" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            {client.contactPerson && (
                              <p className="text-sm text-muted-foreground">Contact: {client.contactPerson}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          client.type === 'individual' ?'text-blue-600 bg-blue-100' :'text-green-600 bg-green-100'
                        }`}>
                          {client.type === 'individual' ? 'Particulier' : 'Professionnel'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-foreground">{client.email}</p>
                          <p className="text-muted-foreground">{client.phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">{client.projectsCount}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">
                          {client.totalRevenue.toLocaleString()}€
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClientSelect(client)}
                            iconName="Eye"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClientDelete(client.id)}
                            iconName="Trash2"
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-4">
          <ClientAnalytics analytics={analytics} isLoading={isAnalyzing} />
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
  );
};

export default ClientManagement;