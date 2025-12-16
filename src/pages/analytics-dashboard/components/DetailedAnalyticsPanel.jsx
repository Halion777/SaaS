import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const DetailedAnalyticsPanel = ({ data, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const renderSection = (title, items) => (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(items).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-3">
            <div className="bg-muted/20 rounded-full p-2">
              <Icon 
                name={
                  key === 'paid' ? 'CheckCircle' :
                  key === 'pending' ? 'Clock' :
                  key === 'overdue' ? 'AlertTriangle' :
                  key === 'newClients' ? 'UserPlus' :
                  key === 'returningClients' ? 'Users' :
                  key === 'inactiveClients' ? 'UserX' :
                  key === 'totalRevenue' ? 'Euro' :
                  key === 'averageInvoice' ? 'TrendingUp' :
                  key === 'totalInvoices' ? 'FileText' :
                  key === 'totalQuotes' ? 'FileText' :
                  key === 'acceptedQuotes' ? 'CheckCircle' :
                  key === 'rejectedQuotes' ? 'XCircle' :
                  key === 'pendingQuotes' ? 'Clock' : 'Info'
                } 
                size={20} 
                className="text-primary"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </p>
              <p className="text-base font-semibold text-foreground">
                {isLoading ? '...' : (typeof value === 'number' 
                  ? (() => {
                      // totalInvoices should be displayed as number only (no € symbol)
                      if (key === 'totalInvoices') {
                        return value;
                      }
                      // Revenue and averageInvoice should have € symbol
                      if (key.includes('Revenue') || key === 'averageInvoice') {
                        // Always use comma as decimal separator (fr-FR format) to match quote creation flow
                        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);
                      }
                      // Other numeric values
                      return `${value}${key.includes('Clients') ? '%' : ''}`;
                    })()
                  : value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderSection(t('analyticsDashboard.detailedAnalytics.paymentStatus.title'), data.paymentStatus)}
      {renderSection(t('analyticsDashboard.detailedAnalytics.clientActivity.title'), data.clientActivity)}
      {renderSection(t('analyticsDashboard.detailedAnalytics.invoiceStatistics.title'), data.invoiceStatistics)}
      {renderSection(t('analyticsDashboard.detailedAnalytics.quoteOverview.title'), data.quoteOverview)}
    </div>
  );
};

export default DetailedAnalyticsPanel;