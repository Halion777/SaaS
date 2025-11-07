import React from 'react';
import Icon from '../../../components/AppIcon';

const DetailedAnalyticsPanel = ({ data }) => {
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
                {typeof value === 'number' 
                  ? `${key.includes('Revenue') || key.includes('Invoice') ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value) : value}${key.includes('Clients') ? '%' : ''}` 
                  : value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderSection('Statut des paiements', data.paymentStatus)}
      {renderSection('Activité clients', data.clientActivity)}
      {renderSection('Statistiques factures', data.invoiceStatistics)}
      {renderSection('Vue d\'ensemble des devis', data.quoteOverview)}
    </div>
  );
};

export default DetailedAnalyticsPanel;