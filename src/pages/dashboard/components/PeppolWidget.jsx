import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';
import PeppolService from '../../../services/peppolService';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const PeppolWidget = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Create PeppolService instance (default to sandbox mode)
  const peppolService = useMemo(() => new PeppolService(true), []);
  const [peppolData, setPeppolData] = useState({
    settings: {
      isConfigured: false,
      peppolId: '',
      peppolId9925: null,
      peppolId0208: null,
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
  const hasLoadedData = useRef(false);

  useEffect(() => {
    // Reset the flag when user.id changes
    if (user?.id) {
      hasLoadedData.current = false;
      loadPeppolData();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const loadPeppolData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Prevent reloading if data was already loaded for this user
    if (hasLoadedData.current) return;

    try {
      hasLoadedData.current = true;
      setLoading(true);
      
      // Check if user is a business user first
      const isBusiness = await peppolService.isBusinessUser();
      if (!isBusiness) {
        // Individual users don't have access to Peppol
        setPeppolData({
          settings: { isConfigured: false, peppolId: '', businessName: '', sandboxMode: true },
          stats: { totalSent: 0, totalReceived: 0, sentThisMonth: 0, receivedThisMonth: 0, pending: 0, failed: 0, successRate: 0, lastActivity: null },
          connectionStatus: 'not_available'
        });
        setLoading(false);
        return;
      }
      
      // Load settings - use the same method as Peppol page
      const settingsResult = await peppolService.getPeppolSettings();
      
      if (!settingsResult.success) {
        console.error('Error loading Peppol settings:', settingsResult.error);
        setPeppolData(prev => ({
          ...prev,
          settings: { isConfigured: false, peppolId: '', peppolId9925: null, peppolId0208: null, name: '', businessName: '', sandboxMode: true },
          connectionStatus: 'disconnected'
        }));
        setLoading(false);
        return;
      }
      
      // Use the same logic as Peppol page - directly use settingsResult.data
      const settings = settingsResult.data || {
        isConfigured: false,
        peppolId: '',
        peppolId9925: null,
        peppolId0208: null,
        name: '',
        businessName: '',
        sandboxMode: true
      };
      
     

      // Load actual statistics from invoices and expense_invoices tables
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get sent client invoices (from invoices table where peppol_enabled = true)
      const { data: sentClientInvoices, error: sentClientError } = await supabase
        .from('invoices')
        .select('id, peppol_status, peppol_sent_at, created_at')
        .eq('user_id', user.id)
        .eq('peppol_enabled', true);

      // Get received expense invoices (from expense_invoices table where peppol_enabled = true)
      // Note: expense_invoices table does NOT have peppol_status column
      const { data: receivedExpenseInvoices, error: receivedExpenseError } = await supabase
        .from('expense_invoices')
        .select('id, peppol_received_at, created_at')
        .eq('user_id', user.id)
        .eq('peppol_enabled', true);

      if (sentClientError) console.error('Error loading sent client invoices:', sentClientError);
      if (receivedExpenseError) console.error('Error loading received expense invoices:', receivedExpenseError);

      // Calculate statistics
      const sentInvoices = sentClientInvoices || [];
      const receivedInvoices = receivedExpenseInvoices || [];
      
      const totalSent = sentInvoices.length;
      const totalReceived = receivedInvoices.length;
      
      // This month's counts
      const sentThisMonth = sentInvoices.filter(inv => {
        const sentDate = new Date(inv.peppol_sent_at || inv.created_at);
        return sentDate >= firstDayOfMonth;
      }).length;
      
      const receivedThisMonth = receivedInvoices.filter(inv => {
        const receivedDate = new Date(inv.peppol_received_at || inv.created_at);
        return receivedDate >= firstDayOfMonth;
      }).length;

      // Pending and failed counts
      const pending = sentInvoices.filter(inv => 
        inv.peppol_status === 'sent' || inv.peppol_status === 'pending'
      ).length;
      
      const failed = sentInvoices.filter(inv => 
        inv.peppol_status === 'failed'
      ).length;

      // Last activity
      const allActivities = [
        ...sentInvoices.map(inv => inv.peppol_sent_at || inv.created_at),
        ...receivedInvoices.map(inv => inv.peppol_received_at || inv.created_at)
      ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
      
      const lastActivity = allActivities.length > 0 ? allActivities[0] : null;

      // Success rate
      const totalInvoices = totalSent + totalReceived;
      const successRate = totalInvoices > 0 
        ? Math.round(((totalInvoices - failed) / totalInvoices) * 100) 
        : 0;

      const stats = {
        totalSent,
        totalReceived,
        sentThisMonth,
        receivedThisMonth,
        pending,
        failed,
        successRate,
        lastActivity
      };

      // Determine connection status - EXACTLY matching Peppol page logic
      // Peppol page shows "Connecté" when peppolSettings.isConfigured is true
      // Peppol page shows "Configuration requise" when !peppolSettings.isConfigured && peppolSettings.peppolId
      let connectionStatus = 'disconnected';
      
      // Match the exact logic from Peppol page (lines 803-814)
      if (settings.isConfigured) {
        connectionStatus = 'connected';
      } else if (!settings.isConfigured && settings.peppolId) {
        connectionStatus = 'configuration_required';
      } else {
        connectionStatus = 'disconnected';
      }

      setPeppolData({
        settings,
        stats,
        connectionStatus
      });
    } catch (error) {
      console.error('Error loading Peppol data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.never');
    return new Date(dateString).toLocaleDateString(i18n.language);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'disconnected':
        return 'text-error';
      case 'configuration_required':
        return 'text-warning';
      case 'not_available':
        return 'text-muted-foreground';
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
      case 'configuration_required':
        return 'AlertCircle';
      case 'not_available':
        return 'Building2';
      default:
        return 'HelpCircle';
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message="Chargement des données Peppol..." />
      </div>
    );
  }

  // Show special message for individual users
  if (peppolData.connectionStatus === 'not_available') {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
              <Icon name="Building2" size={14} className="sm:w-4 sm:h-4" color="var(--color-muted-foreground)" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.peppolWidget.title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.peppolWidget.businessOnly')}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            {t('dashboard.peppolWidget.individualUserMessage')}
          </p>
          <Button
            onClick={() => navigate('/subscription')}
            variant="outline"
            size="sm"
            iconName="Settings"
            iconPosition="left"
          >
            {t('dashboard.peppolWidget.upgradeAccount')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.peppolWidget.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.peppolWidget.subtitle')}</p>
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
              {t(`dashboard.peppolWidget.connectionStatus.${peppolData.connectionStatus}`)}
            </span>
          </div>
          {peppolData.settings.sandboxMode && (
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-warning/10 text-warning rounded-full">
              {t('dashboard.peppolWidget.sandboxMode')}
            </span>
          )}
        </div>
      </div>

      {!peppolData.settings.isConfigured ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Icon name="Globe" size={20} className="sm:w-6 sm:h-6" color="var(--color-muted-foreground)" />
          </div>
          <h4 className="text-sm sm:text-base font-medium text-foreground mb-2">{t('dashboard.peppolWidget.notConfigured.title')}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            {t('dashboard.peppolWidget.notConfigured.description')}
          </p>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/services/peppol')}
            className="text-xs"
          >
            <span className="hidden sm:inline">{t('dashboard.peppolWidget.notConfigured.buttonFull')}</span>
            <span className="sm:hidden">{t('dashboard.peppolWidget.notConfigured.buttonShort')}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Connection Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Hash" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-muted-foreground)" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.peppolWidget.connectionInfo.peppolId.label')}</span>
              </div>
              {/* Show both 0208 and 9925 for Belgium if both exist */}
              {peppolData.settings.peppolId0208 && peppolData.settings.peppolId9925 ? (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    <span className="text-muted-foreground">0208:</span> {peppolData.settings.peppolId0208}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    <span className="text-muted-foreground">9925:</span> {peppolData.settings.peppolId9925}
                  </p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {peppolData.settings.peppolId || t('dashboard.peppolWidget.connectionInfo.peppolId.notDefined')}
                </p>
              )}
            </div>
            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Building" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-muted-foreground)" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.peppolWidget.connectionInfo.businessName.label')}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {peppolData.settings.name || peppolData.settings.businessName || t('dashboard.peppolWidget.connectionInfo.businessName.notDefined')}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-primary mb-1">
                {peppolData.stats.totalSent}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.peppolWidget.statistics.totalSent')}</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-success/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-success mb-1">
                {peppolData.stats.totalReceived}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.peppolWidget.statistics.totalReceived')}</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-error/5 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-error mb-1">
                {peppolData.stats.failed}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.peppolWidget.statistics.failed')}</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.peppolWidget.successRate')}</span>
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

          {/* Last Activity */}
          <div className="text-center text-xs text-muted-foreground">
            {t('dashboard.peppolWidget.lastActivity', { date: formatDate(peppolData.stats.lastActivity) })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeppolWidget; 