import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';

const FollowUpManagement = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [followUps, setFollowUps] = useState([
    {
      id: 1,
      name: 'Pierre Leblanc',
      project: 'DEV-2024-003 - Pose de parquet',
      daysAgo: 5,
      nextFollowUp: '2024-01-20',
      potentialRevenue: 2800,
      priority: 'high',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Sophie Durand',
      project: 'DEV-2024-004 - Rénovation cuisine',
      daysAgo: 3,
      nextFollowUp: '2024-01-18',
      potentialRevenue: 8500,
      priority: 'high',
      status: 'scheduled'
    },
    {
      id: 3,
      name: 'Michel Bernard',
      project: 'DEV-2024-005 - Installation électrique',
      daysAgo: 8,
      nextFollowUp: '2024-01-22',
      potentialRevenue: 1200,
      priority: 'medium',
      status: 'pending'
    }
  ]);

  // Handle sidebar offset for responsive layout
  useEffect(() => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Normale';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'scheduled': return 'Programmée';
      case 'sent': return 'Envoyée';
      default: return 'Inconnu';
    }
  };

  const handleFollowUp = (id) => {
    console.log('Follow up for:', id);
    // Handle follow up action
  };

  const handleQuickAI = (id) => {
    console.log('Quick AI for:', id);
    // Handle AI quick action
  };

  const pendingCount = followUps.filter(fu => fu.status === 'pending').length;
  const highPriorityCount = followUps.filter(fu => fu.priority === 'high').length;
  const totalPotentialRevenue = followUps.reduce((sum, fu) => sum + fu.potentialRevenue, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Icon name="MessageCircle" size={24} color="var(--color-primary)" />
              <h1 className="text-2xl font-bold text-foreground">Relances</h1>
            </div>
            <p className="text-muted-foreground">
              Relancez vos prospects automatiquement et intelligemment
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Relances en attente</h3>
                <Icon name="Clock" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">À traiter</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Priorité haute</h3>
                <Icon name="MessageCircle" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">CA potentiel</h3>
                <Icon name="FileText" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">{totalPotentialRevenue.toLocaleString()}€</div>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>

          {/* Follow-up Items */}
          <div className="space-y-4">
            {followUps.map((followUp) => (
              <div key={followUp.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  {/* Left side - Client info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-semibold text-foreground">{followUp.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.priority)}`}>
                        {getPriorityLabel(followUp.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                        {getStatusLabel(followUp.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="FileText" size={14} />
                        <span>{followUp.project}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="Clock" size={14} />
                        <span>Il y a {followUp.daysAgo} jours</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="Calendar" size={14} />
                        <span>Prochaine relance: {followUp.nextFollowUp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Revenue and actions */}
                  <div className="flex flex-col items-end space-y-4">
                    <div className="text-lg font-bold text-green-600">
                      {followUp.potentialRevenue.toLocaleString()}€
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFollowUp(followUp.id)}
                        iconName="Mail"
                        iconPosition="left"
                      >
                        Relancer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAI(followUp.id)}
                        iconName="Zap"
                        iconPosition="left"
                      >
                        IA Rapide
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FollowUpManagement;