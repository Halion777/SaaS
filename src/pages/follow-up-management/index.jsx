import React, { useState, useEffect } from 'react';

import Button from '../../components/ui/Button';

import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import FollowUpTimeline from './components/FollowUpTimeline';
import AutomationRules from './components/AutomationRules';
import FollowUpModal from './components/FollowUpModal';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import { generateFollowUpContent } from '../../services/openaiService';

const FollowUpManagement = () => {
  const [followUps, setFollowUps] = useState([
    {
      id: 1,
      clientName: 'Jean Dupont',
      clientId: 1,
      type: 'quote_followup',
      status: 'pending',
      scheduledDate: '2025-07-20',
      subject: 'Suivi devis cuisine',
      content: 'Bonjour Jean, j\'espère que vous allez bien. Je me permets de revenir vers vous concernant...',
      priority: 'high',
      channel: 'email',
      createdAt: '2025-07-18'
    },
    {
      id: 2,
      clientName: 'SARL Construction Plus',
      clientId: 2,
      type: 'payment_reminder',
      status: 'sent',
      scheduledDate: '2025-07-19',
      subject: 'Rappel facture #2025-001',
      content: 'Madame, Monsieur, Nous vous rappelons que la facture...',
      priority: 'medium',
      channel: 'email',
      createdAt: '2025-07-15',
      sentAt: '2025-07-19T10:30:00'
    }
  ]);

  const [automationRules, setAutomationRules] = useState([
    {
      id: 1,
      name: 'Suivi devis automatique',
      trigger: 'quote_sent',
      delay: 3,
      delayUnit: 'days',
      action: 'send_followup',
      template: 'quote_followup_template',
      isActive: true
    }
  ]);

  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all'
  });
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'quote_followup', label: 'Suivi de devis' },
    { value: 'payment_reminder', label: 'Rappel de paiement' },
    { value: 'project_update', label: 'Mise à jour projet' },
    { value: 'satisfaction_survey', label: 'Enquête satisfaction' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'opened', label: 'Ouvert' },
    { value: 'replied', label: 'Répondu' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Toutes les priorités' },
    { value: 'high', label: 'Haute' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Basse' }
  ];

  const channelOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'mail', label: 'Courrier' }
  ];

  const filteredFollowUps = followUps.filter(followUp => {
    return (
      (filters.status === 'all' || followUp.status === filters.status) &&
      (filters.type === 'all' || followUp.type === filters.type) &&
      (filters.priority === 'all' || followUp.priority === filters.priority)
    );
  });

  const handleFollowUpSelect = (followUp) => {
    setSelectedFollowUp(followUp);
    setIsModalOpen(true);
  };

  const handleFollowUpSave = async (followUpData) => {
    if (selectedFollowUp) {
      // Update existing follow-up
      setFollowUps(prev => prev.map(fu => 
        fu.id === selectedFollowUp.id 
          ? { ...fu, ...followUpData }
          : fu
      ));
    } else {
      // Add new follow-up
      const newFollowUp = {
        id: Date.now(),
        ...followUpData,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setFollowUps(prev => [...prev, newFollowUp]);
    }
    setIsModalOpen(false);
    setSelectedFollowUp(null);
  };

  const handleGenerateContent = async (clientInfo, type) => {
    setIsGeneratingContent(true);
    try {
      const context = `Type: ${type}, Client: ${clientInfo?.name || 'Client'}`;
      const content = await generateFollowUpContent(clientInfo, context);
      return content;
    } catch (error) {
      console.error('Content generation error:', error);
      return `Bonjour ${clientInfo?.name || 'Client'}, nous vous contactons pour faire le point sur votre projet...`;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSendFollowUp = (followUpId) => {
    setFollowUps(prev => prev.map(fu => 
      fu.id === followUpId 
        ? { ...fu, status: 'sent', sentAt: new Date().toISOString() }
        : fu
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'opened': return 'text-green-600 bg-green-100';
      case 'replied': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type) => {
    const typeOption = typeOptions.find(option => option.value === type);
    return typeOption?.label || type;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Suivis</h1>
          <p className="text-muted-foreground">
            Orchestrez vos communications clients avec intelligence artificielle
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedFollowUp(null);
            setIsModalOpen(true);
          }}
          iconName="Plus"
          iconPosition="left"
        >
          Nouveau Suivi
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <Select
            placeholder="Statut"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            className="min-w-[150px]"
          />
          <Select
            placeholder="Type"
            options={typeOptions}
            value={filters.type}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            className="min-w-[150px]"
          />
          <Select
            placeholder="Priorité"
            options={priorityOptions}
            value={filters.priority}
            onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            className="min-w-[150px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suivis actifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {followUps.filter(fu => fu.status === 'pending').length}
                  </p>
                </div>
                <Icon name="Clock" size={24} color="var(--color-primary)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Envoyés</p>
                  <p className="text-2xl font-bold text-foreground">
                    {followUps.filter(fu => fu.status === 'sent').length}
                  </p>
                </div>
                <Icon name="Send" size={24} color="var(--color-blue)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
                  <p className="text-2xl font-bold text-foreground">
                    {followUps.length > 0 ? Math.round((followUps.filter(fu => fu.status === 'opened').length / followUps.length) * 100) : 0}%
                  </p>
                </div>
                <Icon name="Eye" size={24} color="var(--color-green)" />
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Réponses</p>
                  <p className="text-2xl font-bold text-foreground">
                    {followUps.filter(fu => fu.status === 'replied').length}
                  </p>
                </div>
                <Icon name="MessageCircle" size={24} color="var(--color-purple)" />
              </div>
            </div>
          </div>

          {/* Follow-ups Timeline */}
          <FollowUpTimeline 
            followUps={filteredFollowUps}
            onFollowUpSelect={handleFollowUpSelect}
            onSendFollowUp={handleSendFollowUp}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getTypeLabel={getTypeLabel}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Automation Rules */}
          <AutomationRules 
            rules={automationRules}
            onRulesChange={setAutomationRules}
          />
          
          {/* Performance Analytics */}
          <PerformanceAnalytics followUps={followUps} />
        </div>
      </div>

      {/* Follow-up Modal */}
      {isModalOpen && (
        <FollowUpModal
          followUp={selectedFollowUp}
          onSave={handleFollowUpSave}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFollowUp(null);
          }}
          onGenerateContent={handleGenerateContent}
          isGeneratingContent={isGeneratingContent}
          channelOptions={channelOptions}
          typeOptions={typeOptions.filter(option => option.value !== 'all')}
          priorityOptions={priorityOptions.filter(option => option.value !== 'all')}
        />
      )}
    </div>
  );
};

export default FollowUpManagement;