import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import TableLoader from '../../../components/ui/TableLoader';

const TopClients = ({ clients = [], loading = false }) => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language || 'fr', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language || 'fr', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusConfig = (isActive) => {
    const configs = {
      true: {
        label: t('dashboard.topClients.statuses.active.label'),
        color: t('dashboard.topClients.statuses.active.color'),
        bg: t('dashboard.topClients.statuses.active.bg')
      },
      false: {
        label: t('dashboard.topClients.statuses.inactive.label'),
        color: t('dashboard.topClients.statuses.inactive.color'),
        bg: t('dashboard.topClients.statuses.inactive.bg')
      }
    };
    return configs[isActive] || configs.false;
  };

  const getSignatureRateColor = (rate) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-error';
  };

  // Calculate total revenue
  const totalRevenue = clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message="Chargement des clients..." />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.topClients.title')}</h3>
        </div>
        <div className="text-center py-8">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('dashboard.topClients.noClients') || 'Aucun client trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.topClients.title')}</h3>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className="text-xs text-muted-foreground">{t('dashboard.topClients.sortedBy')}</span>
          <Icon name="TrendingUp" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-success)" />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {clients.map((client, index) => {
          const statusConfig = getStatusConfig(client.isActive !== false);
          const clientName = client.name || client.company_name || 'Client';
          const companyName = client.client_type === 'company' ? (client.company_name || client.name) : '';
          
          // Calculate signature rate (accepted quotes / total quotes)
          const quotesCount = client.projectsCount || 0;
          // For now, we'll use a placeholder for signature rate since we don't have quote status data here
          const signatureRate = 0; // This would need to be calculated from quote data

          return (
            <div key={client.id || index} className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <span className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  {/* Remove profile picture, use icon instead */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="User" size={16} className="sm:w-5 sm:h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 space-y-1 sm:space-y-0">
                    <p className="text-sm font-medium text-foreground break-words leading-tight">{clientName}</p>
                    <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} w-fit text-center flex-shrink-0`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {companyName && (
                    <p className="text-xs text-muted-foreground break-words leading-tight">{companyName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(client.totalRevenue || 0)}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 space-y-0.5 sm:space-y-0">
                  <span className="text-xs text-muted-foreground">{quotesCount} {t('dashboard.topClients.quotes')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('dashboard.topClients.totalRevenue', { amount: formatCurrency(totalRevenue) })}</span>
          <Icon name="Users" size={12} className="sm:w-[14px] sm:h-[14px]" color="var(--color-muted-foreground)" />
        </div>
      </div>
    </div>
  );
};

export default TopClients;
