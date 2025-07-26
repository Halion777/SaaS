import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import peppolService from '../../../services/peppolService';

const PeppolWidget = () => {
  const navigate = useNavigate();
  const [peppolData, setPeppolData] = useState({
    settings: {
      isConfigured: false,
      peppolId: '',
      businessName: '',
      sandboxMode: true
    },
    stats: {
      totalSent: 0,
      totalReceived: 0,
      sentThisMonth: 0,
      receivedThisMonth: 0,
      pending: 0,
      failed: 0,
      successRate: 0,
      lastActivity: null
    },
    connectionStatus: 'disconnected'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeppolData();
  }, []);

  const loadPeppolData = async () => {
    try {
      setLoading(true);
      
      // Load settings
      const settingsResult = await peppolService.getPeppolSettings();
      const settings = settingsResult.success ? settingsResult.data : {
        isConfigured: false,
        peppolId: '',
        businessName: '',
        sandboxMode: true
      };

      // Load statistics
      const statsResult = await peppolService.getStatistics();
      const stats = statsResult.success ? statsResult.data : {
        totalSent: 0,
        totalReceived: 0,
        sentThisMonth: 0,
        receivedThisMonth: 0,
        pending: 0,
        failed: 0,
        successRate: 0,
        lastActivity: null
      };

      setPeppolData({
        settings,
        stats,
        connectionStatus: settings.isConfigured ? 'connected' : 'disconnected'
      });
    } catch (error) {
      console.error('Error loading Peppol data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'disconnected':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return 'CheckCircle';
      case 'disconnected':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Network" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Peppol Network</h3>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Network" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Peppol Network</h3>
            <div className="flex items-center space-x-2">
              <Icon 
                name={getStatusIcon(peppolData.connectionStatus)} 
                size={16} 
                className={getStatusColor(peppolData.connectionStatus)} 
              />
              <span className={`text-sm font-medium ${getStatusColor(peppolData.connectionStatus)}`}>
                {peppolData.connectionStatus === 'connected' ? 'Connecté' : 'Non connecté'}
              </span>
              {peppolData.settings.sandboxMode && (
                <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                  Sandbox
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/services/peppol')}
          iconName="ArrowRight"
          iconPosition="right"
        >
          Configurer
        </Button>
      </div>

      {/* Content */}
      {peppolData.settings.isConfigured ? (
        <div className="space-y-4">
          {/* Connection Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Peppol ID:</span>
              <span className="font-mono text-foreground">{peppolData.settings.peppolId}</span>
            </div>
            {peppolData.settings.businessName && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Entreprise:</span>
                <span className="text-foreground">{peppolData.settings.businessName}</span>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon name="Send" size={20} className="text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{peppolData.stats.sentThisMonth}</div>
              <div className="text-xs text-muted-foreground">Sent This Month</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon name="Download" size={20} className="text-success" />
              </div>
              <div className="text-2xl font-bold text-foreground">{peppolData.stats.receivedThisMonth}</div>
              <div className="text-xs text-muted-foreground">Received This Month</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon name="Clock" size={20} className="text-warning" />
              </div>
              <div className="text-2xl font-bold text-foreground">{peppolData.stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon name="XCircle" size={20} className="text-error" />
              </div>
              <div className="text-2xl font-bold text-foreground">{peppolData.stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Success Rate */}
          {peppolData.stats.successRate > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success font-medium">Taux de succès</span>
                <span className="text-sm text-success font-bold">{peppolData.stats.successRate}%</span>
              </div>
            </div>
          )}

          {/* Last Activity */}
          {peppolData.stats.lastActivity && (
            <div className="text-xs text-muted-foreground text-center">
              Dernière activité: {formatDate(peppolData.stats.lastActivity)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Icon name="Network" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium text-foreground mb-2">Peppol non configuré</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Configurez votre intégration Peppol pour envoyer et recevoir des factures électroniques.
          </p>
          <Button
            onClick={() => navigate('/services/peppol')}
            iconName="Settings"
            iconPosition="left"
            size="sm"
          >
            Configurer Peppol
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      {peppolData.settings.isConfigured && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/services/peppol')}
              iconName="Send"
              iconPosition="left"
              className="flex-1"
            >
              Envoyer facture
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/services/peppol')}
              iconName="Download"
              iconPosition="left"
              className="flex-1"
            >
              Voir reçues
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeppolWidget; 