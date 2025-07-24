import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MainSidebar from '../../../components/ui/MainSidebar';

const PeppolNetworkPage = () => {
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('sent');

  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    setSidebarOffset(isCollapsed ? 64 : 288);
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setSidebarOffset(0);
      } else {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mock data for sent invoices
  const sentInvoices = [
    {
      id: 'INV-001',
      recipient: 'Entreprise ABC',
      amount: 2500.00,
      date: '2024-01-15',
      status: 'delivered',
      peppolId: '0208:123456789'
    },
    {
      id: 'INV-002',
      recipient: 'Société XYZ',
      amount: 1800.50,
      date: '2024-01-14',
      status: 'delivered',
      peppolId: '0208:987654321'
    },
    {
      id: 'INV-003',
      recipient: 'Cabinet Legal',
      amount: 3200.00,
      date: '2024-01-13',
      status: 'pending',
      peppolId: '0208:456789123'
    }
  ];

  // Mock data for received invoices
  const receivedInvoices = [
    {
      id: 'INV-R-001',
      sender: 'Fournisseur Tech',
      amount: 1500.00,
      date: '2024-01-15',
      status: 'received',
      peppolId: '0208:111222333'
    },
    {
      id: 'INV-R-002',
      sender: 'Services Pro',
      amount: 2200.00,
      date: '2024-01-14',
      status: 'processed',
      peppolId: '0208:444555666'
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

  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Peppol Invoices</h1>
              <p className="text-muted-foreground">
                Factures envoyées et reçues via le réseau Peppol
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Factures envoyées</p>
                  <p className="text-2xl font-bold">{sentInvoices.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Send" size={24} className="text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Factures reçues</p>
                  <p className="text-2xl font-bold">{receivedInvoices.length}</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <Icon name="Download" size={24} className="text-success" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total envoyé</p>
                  <p className="text-2xl font-bold">
                    {sentInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-warning/10 p-3 rounded-lg">
                  <Icon name="Euro" size={24} className="text-warning" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total reçu</p>
                  <p className="text-2xl font-bold">
                    {receivedInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-info/10 p-3 rounded-lg">
                  <Icon name="Euro" size={24} className="text-info" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-border">
            <div className="flex space-x-8">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'sent'
                    ? 'border-b-2 border-primary text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('sent')}
              >
                Factures envoyées ({sentInvoices.length})
              </button>
              <button
                className={`pb-2 px-1 ${
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
            {activeTab === 'sent' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">N° Facture</th>
                        <th className="text-left p-4 font-medium">Destinataire</th>
                        <th className="text-left p-4 font-medium">Peppol ID</th>
                        <th className="text-left p-4 font-medium">Montant</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4 font-medium">{invoice.id}</td>
                          <td className="p-4">{invoice.recipient}</td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
                          <td className="p-4 font-medium">
                            {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {sentInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="Send" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune facture envoyée</h3>
                    <p className="text-muted-foreground">
                      Vous n'avez pas encore envoyé de factures via Peppol.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'received' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                      {receivedInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4 font-medium">{invoice.id}</td>
                          <td className="p-4">{invoice.sender}</td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
                          <td className="p-4 font-medium">
                            {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {receivedInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="Download" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune facture reçue</h3>
                    <p className="text-muted-foreground">
                      Vous n'avez pas encore reçu de factures via Peppol.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PeppolNetworkPage; 