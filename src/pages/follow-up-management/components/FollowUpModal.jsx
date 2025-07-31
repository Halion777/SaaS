import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';


const FollowUpModal = ({ 
  followUp, 
  onSave, 
  onClose, 
  onGenerateContent, 
  isGeneratingContent,
  channelOptions,
  typeOptions,
  priorityOptions
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientId: null,
    type: 'quote_followup',
    subject: '',
    content: '',
    scheduledDate: '',
    priority: 'medium',
    channel: 'email'
  });

  // Mock client data - in real app this would come from API
  const mockClients = [
    { id: 1, name: 'Jean Dupont' },
    { id: 2, name: 'SARL Construction Plus' },
    { id: 3, name: 'Marie Martin' }
  ];

  const clientOptions = mockClients.map(client => ({
    value: client.id,
    label: client.name
  }));

  useEffect(() => {
    if (followUp) {
      setFormData({
        clientName: followUp.clientName || '',
        clientId: followUp.clientId || null,
        type: followUp.type || 'quote_followup',
        subject: followUp.subject || '',
        content: followUp.content || '',
        scheduledDate: followUp.scheduledDate || '',
        priority: followUp.priority || 'medium',
        channel: followUp.channel || 'email'
      });
    } else {
      // Set default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [followUp]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Update client name when client ID changes
      if (field === 'clientId') {
        const selectedClient = mockClients.find(client => client.id === value);
        newData.clientName = selectedClient?.name || '';
      }
      
      return newData;
    });
  };

  const handleGenerateAIContent = async () => {
    const selectedClient = mockClients.find(client => client.id === formData.clientId);
    if (selectedClient && formData.type) {
      try {
        const content = await onGenerateContent(selectedClient, formData.type);
        setFormData(prev => ({ 
          ...prev, 
          content,
          subject: `${getTypeSubject(formData.type)} - ${selectedClient.name}`
        }));
      } catch (error) {
        console.error('Content generation failed:', error);
      }
    }
  };

  const getTypeSubject = (type) => {
    switch (type) {
      case 'quote_followup': return 'Suivi de votre devis';
      case 'payment_reminder': return 'Rappel de paiement';
      case 'project_update': return 'Mise à jour de votre projet';
      case 'satisfaction_survey': return 'Enquête de satisfaction';
      default: return 'Suivi client';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isFormValid = formData.clientName && formData.subject && formData.content && formData.scheduledDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {followUp ? 'Modifier le Suivi' : 'Nouveau Suivi'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Client *"
              options={clientOptions}
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              placeholder="Sélectionner un client"
              required
            />
            
            <Select
              label="Type de suivi *"
              options={typeOptions}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              required
            />
          </div>

          <Input
            label="Objet *"
            type="text"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Objet du message"
            required
          />

          {/* Content with AI Generation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Contenu du message *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAIContent}
                disabled={!formData.clientId || !formData.type || isGeneratingContent}
                iconName={isGeneratingContent ? "Loader2" : "Sparkles"}
                iconPosition="left"
                className={isGeneratingContent ? "animate-pulse" : ""}
              >
                {isGeneratingContent ? 'Génération...' : 'Générer avec IA'}
              </Button>
            </div>
            
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Contenu du message de suivi..."
              className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Schedule and Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date programmée *"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
              required
            />
            
            <Select
              label="Priorité"
              options={priorityOptions}
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            />
            
            <Select
              label="Canal de communication"
              options={channelOptions}
              value={formData.channel}
              onChange={(e) => handleChange('channel', e.target.value)}
            />
          </div>

          {/* Preview */}
          {formData.content && (
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium text-foreground mb-2">Aperçu du message</h4>
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {formData.content}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              iconName="Save"
              iconPosition="left"
            >
              {followUp ? 'Mettre à jour' : 'Programmer le suivi'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FollowUpModal;