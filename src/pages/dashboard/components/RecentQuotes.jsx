import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentQuotes = () => {
  const quotes = [
    {
      id: 'DEV-2025-001',
      client: 'Marie Dubois',
      service: 'Plomberie salle de bain',
      amount: '2.450,00 €',
      status: 'signed',
      date: '2025-07-18',
      aiScore: 92
    },
    {
      id: 'DEV-2025-002',
      client: 'Pierre Martin',
      service: 'Installation électrique',
      amount: '1.850,00 €',
      status: 'viewed',
      date: '2025-07-17',
      aiScore: 78
    },
    {
      id: 'DEV-2025-003',
      client: 'Sophie Leroy',
      service: 'Peinture appartement',
      amount: '3.200,00 €',
      status: 'sent',
      date: '2025-07-16',
      aiScore: 85
    },
    {
      id: 'DEV-2025-004',
      client: 'Jean Moreau',
      service: 'Carrelage cuisine',
      amount: '1.650,00 €',
      status: 'signed',
      date: '2025-07-15',
      aiScore: 88
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      signed: {
        label: 'Signé',
        color: 'text-success',
        bg: 'bg-success/10',
        icon: 'CheckCircle'
      },
      viewed: {
        label: 'Consulté',
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: 'Eye'
      },
      sent: {
        label: 'Envoyé',
        color: 'text-primary',
        bg: 'bg-primary/10',
        icon: 'Send'
      },
      draft: {
        label: 'Brouillon',
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        icon: 'Edit3'
      }
    };
    return configs[status] || configs.draft;
  };

  const getAIScoreColor = (score) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Devis récents</h3>
        <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
          <Icon name="MoreHorizontal" size={14} className="sm:w-4 sm:h-4" color="currentColor" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {quotes.map((quote) => {
          const statusConfig = getStatusConfig(quote.status);
          return (
            <div key={quote.id} className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${statusConfig.bg}`}>
                <Icon 
                  name={statusConfig.icon} 
                  size={16} 
                  className="sm:w-[18px] sm:h-[18px]"
                  color="currentColor"
                  className={statusConfig.color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 space-y-1 sm:space-y-0">
                  <p className="text-sm font-medium text-foreground truncate">{quote.client}</p>
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} w-fit text-center`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{quote.service}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 space-y-0.5 sm:space-y-0">
                  <span className="text-xs font-medium text-foreground">{quote.amount}</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground">•</span>
                  <span className={`text-xs font-medium ${getAIScoreColor(quote.aiScore)}`}>
                    IA: {quote.aiScore}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{quote.date}</p>
                <Button variant="ghost" size="sm" className="mt-1 p-1 sm:p-1.5">
                  <Icon name="ExternalLink" size={12} className="sm:w-[14px] sm:h-[14px]" color="currentColor" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <Button variant="outline" fullWidth className="text-sm">
          Voir tous les devis
        </Button>
      </div>
    </div>
  );
};

export default RecentQuotes;