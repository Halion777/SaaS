import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FollowUpManagementPanel = ({ 
  selectedQuote, 
  followUps, 
  onSendFollowUp, 
  onStopFollowUps, 
  loading 
}) => {
  if (!selectedQuote) {
    return (
      <div className="text-center py-8">
        <Icon name="MessageCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Sélectionnez un devis</h3>
        <p className="text-muted-foreground">
          Cliquez sur un devis pour gérer ses relances
        </p>
      </div>
    );
  }

  const quoteFollowUps = followUps[selectedQuote.id] || [];
  const hasFollowUps = quoteFollowUps.length > 0;

  const getFollowUpStatusColor = (status) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      stopped: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getFollowUpStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      scheduled: 'Programmée',
      sent: 'Envoyée',
      failed: 'Échouée',
      stopped: 'Arrêtée'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Quote Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">{selectedQuote.number}</h3>
        <p className="text-sm text-muted-foreground mb-2">{selectedQuote.clientName}</p>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFollowUpStatusColor(selectedQuote.status)}`}>
            {selectedQuote.statusLabel}
          </span>
          <span className="text-sm font-medium text-foreground">
            {selectedQuote.amountFormatted}
          </span>
        </div>
      </div>

      {/* Follow-up Actions */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Actions</h4>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => onSendFollowUp(selectedQuote)}
            disabled={selectedQuote.status !== 'sent' || loading}
            iconName="Send"
            iconPosition="left"
            className="w-full"
          >
            Envoyer relance maintenant
          </Button>
          
          {hasFollowUps && (
            <Button
              variant="outline"
              onClick={() => onStopFollowUps(selectedQuote.id)}
              disabled={loading}
              iconName="Square"
              iconPosition="left"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Arrêter toutes les relances
            </Button>
          )}
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Relances programmées</h4>
          <span className="text-sm text-muted-foreground">
            {quoteFollowUps.length} relance(s)
          </span>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : hasFollowUps ? (
          <div className="space-y-3">
            {quoteFollowUps.map((followUp) => (
              <div key={followUp.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Étape {followUp.stage}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFollowUpStatusColor(followUp.status)}`}>
                    {getFollowUpStatusLabel(followUp.status)}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Icon name="Calendar" size={12} />
                    <span>Programmée: {formatDate(followUp.scheduled_at)}</span>
                  </div>
                  
                  {followUp.attempts > 0 && (
                    <div className="flex items-center space-x-2">
                      <Icon name="Repeat" size={12} />
                      <span>Tentatives: {followUp.attempts}</span>
                    </div>
                  )}
                  
                  {followUp.sent_at && (
                    <div className="flex items-center space-x-2">
                      <Icon name="CheckCircle" size={12} />
                      <span>Envoyée: {formatDate(followUp.sent_at)}</span>
                    </div>
                  )}
                  
                  {followUp.last_error && (
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertCircle" size={12} />
                      <span className="text-red-600">Erreur: {followUp.last_error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <Icon name="MessageCircle" size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune relance programmée
            </p>
            {selectedQuote.status === 'sent' && (
              <p className="text-xs text-muted-foreground mt-1">
                Cliquez sur "Envoyer relance maintenant" pour en créer une
              </p>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Rules Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Info" size={16} className="text-blue-600" />
          <h4 className="font-medium text-blue-900">Règles de relance</h4>
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Étape 1: 3 jours après envoi</p>
          <p>• Étape 2: 7 jours après envoi</p>
          <p>• Étape 3: 14 jours après envoi</p>
          <p>• Maximum: 3 étapes</p>
        </div>
      </div>
    </div>
  );
};

export default FollowUpManagementPanel;
