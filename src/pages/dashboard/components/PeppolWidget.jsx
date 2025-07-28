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
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Icon name="Globe" size={14} className="sm:w-4 sm:h-4" color="var(--color-blue-600)" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Peppol Network</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Échange électronique de factures</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${getStatusColor(peppolData.connectionStatus)}`}>
            <Icon 
              name={getStatusIcon(peppolData.connectionStatus)} 
              size={12} 
              className="sm:w-[14px] sm:h-[14px]" 
              color="currentColor" 
            />
            <span className="text-xs sm:text-sm font-medium">
              {peppolData.connectionStatus === 'connected' ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          {peppolData.settings.sandboxMode && (
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-warning/10 text-warning rounded-full">
              Test
            </span>
          )}
        </div>
      </div>

      {!peppolData.settings.isConfigured ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Icon name="Globe" size={20} className="sm:w-6 sm:h-6" color="var(--color-muted-foreground)" />
          </div>
          <h4 className="text-sm sm:text-base font-medium text-foreground mb-2">Peppol non configuré</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            Configurez votre identifiant Peppol pour échanger des factures électroniques
          </p>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/services/peppol')}
            className="text-xs"
          >
            <span className="hidden sm:inline">Configurer Peppol</span>
            <span className="sm:hidden">Configurer</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Connection Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Hash" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-muted-foreground)" />
                <span className="text-xs sm:text-sm text-muted-foreground">ID Peppol</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {peppolData.settings.peppolId || 'Non défini'}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Building" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-muted-foreground)" />
                <span className="text-xs sm:text-sm text-muted-foreground">Entreprise</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {peppolData.settings.businessName || 'Non définie'}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-primary mb-1">
                {peppolData.stats.totalSent}
              </div>
              <div className="text-xs text-muted-foreground">Envoyées</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-success/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-success mb-1">
                {peppolData.stats.totalReceived}
              </div>
              <div className="text-xs text-muted-foreground">Reçues</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-warning/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-warning mb-1">
                {peppolData.stats.pending}
              </div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-error/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-error mb-1">
                {peppolData.stats.failed}
              </div>
              <div className="text-xs text-muted-foreground">Échouées</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Taux de succès</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {peppolData.stats.successRate}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ width: `${peppolData.stats.successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Send"
              iconPosition="left"
              onClick={() => navigate('/services/peppol')}
              className="text-xs flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Envoyer facture</span>
              <span className="sm:hidden">Envoyer</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Settings"
              iconPosition="left"
              onClick={() => navigate('/services/peppol')}
              className="text-xs flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Paramètres</span>
              <span className="sm:hidden">Config</span>
            </Button>
          </div>

          {/* Last Activity */}
          <div className="text-center text-xs text-muted-foreground">
            Dernière activité: {formatDate(peppolData.stats.lastActivity)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeppolWidget; 