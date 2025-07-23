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
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Devis récents</h3>
        <Button variant="ghost" size="sm">
          <Icon name="MoreHorizontal" size={16} color="currentColor" />
        </Button>
      </div>
      <div className="space-y-4">
        {quotes.map((quote) => {
          const statusConfig = getStatusConfig(quote.status);
          return (
            <div key={quote.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusConfig.bg}`}>
                <Icon 
                  name={statusConfig.icon} 
                  size={18} 
                  color="currentColor"
                  className={statusConfig.color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{quote.client}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{quote.service}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-medium text-foreground">{quote.amount}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className={`text-xs font-medium ${getAIScoreColor(quote.aiScore)}`}>
                    IA: {quote.aiScore}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{quote.date}</p>
                <Button variant="ghost" size="sm" className="mt-1">
                  <Icon name="ExternalLink" size={14} color="currentColor" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" fullWidth>
          Voir tous les devis
        </Button>
      </div>
    </div>
  );
};

export default RecentQuotes;