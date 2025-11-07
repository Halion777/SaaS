import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';

const RecentQuotes = ({ quotes = [], loading = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  const getStatusConfig = (status) => {
    const statusMap = {
      'accepted': {
        label: t('dashboard.recentQuotes.statuses.signed.label') || 'Signé',
        color: t('dashboard.recentQuotes.statuses.signed.color') || 'text-success',
        bg: t('dashboard.recentQuotes.statuses.signed.bg') || 'bg-success/10',
        icon: 'CheckCircle'
      },
      'sent': {
        label: t('dashboard.recentQuotes.statuses.sent.label') || 'Envoyé',
        color: t('dashboard.recentQuotes.statuses.sent.color') || 'text-primary',
        bg: t('dashboard.recentQuotes.statuses.sent.bg') || 'bg-primary/10',
        icon: 'Send'
      },
      'draft': {
        label: t('dashboard.recentQuotes.statuses.draft.label') || 'Brouillon',
        color: t('dashboard.recentQuotes.statuses.draft.color') || 'text-muted-foreground',
        bg: t('dashboard.recentQuotes.statuses.draft.bg') || 'bg-muted',
        icon: 'Edit3'
      },
      'rejected': {
        label: t('dashboard.recentQuotes.statuses.rejected.label') || 'Rejeté',
        color: 'text-error',
        bg: 'bg-error/10',
        icon: 'XCircle'
      },
      'expired': {
        label: t('dashboard.recentQuotes.statuses.expired.label') || 'Expiré',
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: 'Clock'
      }
    };
    
    // Map status to config
    const config = statusMap[status] || statusMap['draft'];
    
    // Check if quote was viewed (has tracking data)
    if (status === 'sent' && quotes.find(q => q.id === quotes.find(q => q.status === 'sent')?.id)?.trackingData?.viewed_at) {
      return {
        label: t('dashboard.recentQuotes.statuses.viewed.label') || 'Vu',
        color: t('dashboard.recentQuotes.statuses.viewed.color') || 'text-info',
        bg: t('dashboard.recentQuotes.statuses.viewed.bg') || 'bg-info/10',
        icon: 'Eye'
      };
    }
    
    return config;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message="Chargement des devis..." />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.recentQuotes.title')}</h3>
        </div>
        <div className="text-center py-8">
          <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('dashboard.recentQuotes.noQuotes') || 'Aucun devis trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.recentQuotes.title')}</h3>
        <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
          <Icon name="MoreHorizontal" size={14} className="sm:w-4 sm:h-4" color="currentColor" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {quotes.slice(0, 5).map((quote) => {
          const statusConfig = getStatusConfig(quote.status);
          const clientName = quote.client?.name || quote.clientName || 'Client';
          const serviceName = quote.title || quote.description || 'Service';
          const amount = quote.total_amount || quote.final_amount || 0;
          
          return (
            <div key={quote.id} className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${statusConfig.bg}`}>
                <Icon 
                  name={statusConfig.icon} 
                  size={16} 
                  className={`sm:w-[18px] sm:h-[18px] ${statusConfig.color}`}
                  color="currentColor"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 space-y-1 sm:space-y-0">
                  <p className="text-sm font-medium text-foreground truncate">{clientName}</p>
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} w-fit text-center`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 space-y-0.5 sm:space-y-0">
                  <span className="text-xs font-medium text-foreground">{formatCurrency(amount)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 p-1 sm:p-1.5"
                  onClick={() => navigate(`/quotes-management?quote=${quote.id}`)}
                >
                  <Icon name="ExternalLink" size={12} className="sm:w-[14px] sm:h-[14px]" color="currentColor" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <Button 
          variant="outline" 
          fullWidth 
          className="text-sm"
          onClick={() => navigate('/quotes-management')}
        >
          {t('dashboard.recentQuotes.viewAllQuotes')}
        </Button>
      </div>
    </div>
  );
};

export default RecentQuotes;
