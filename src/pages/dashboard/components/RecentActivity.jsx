import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import TableLoader from '../../../components/ui/TableLoader';

const RecentActivity = ({ quotes = [], invoices = [], loading = false }) => {
  const { t, i18n } = useTranslation();

  // Combine and sort recent activities
  const activities = [
    ...(quotes || []).slice(0, 5).map(quote => ({
      id: `quote-${quote.id}`,
      type: 'quote',
      title: t('dashboard.recentActivity.quoteCreated', { number: quote.quote_number || 'N/A' }),
      time: new Date(quote.created_at).toLocaleString(i18n.language),
      icon: 'FileText',
      color: 'primary'
    })),
    ...(invoices || []).slice(0, 5).map(invoice => ({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      title: t('dashboard.recentActivity.invoiceCreated', { number: invoice.invoice_number || 'N/A' }),
      time: new Date(invoice.created_at).toLocaleString(i18n.language),
      icon: 'Receipt',
      color: 'success'
    }))
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message="Chargement de l'activité récente..." />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.recentActivity.title')}</h3>
        </div>
        <div className="text-center py-8">
          <Icon name="Activity" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('dashboard.recentActivity.noActivity')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.recentActivity.title')}</h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-${activity.color}/10 flex items-center justify-center flex-shrink-0`}>
              <Icon name={activity.icon} size={16} className={`sm:w-5 sm:h-5 text-${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;

