import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentQuotes = () => {
  const { t } = useTranslation();
  const quotes = [
    {
      id: 'DEV-2025-001',
      client: t('dashboard.recentQuotes.quotes.0.client'),
      service: t('dashboard.recentQuotes.quotes.0.service'),
      amount: t('dashboard.recentQuotes.quotes.0.amount'),
      status: 'signed',
      date: t('dashboard.recentQuotes.quotes.0.date'),
      aiScore: 92
    },
    {
      id: 'DEV-2025-002',
      client: t('dashboard.recentQuotes.quotes.1.client'),
      service: t('dashboard.recentQuotes.quotes.1.service'),
      amount: t('dashboard.recentQuotes.quotes.1.amount'),
      status: 'viewed',
      date: t('dashboard.recentQuotes.quotes.1.date'),
      aiScore: 78
    },
    {
      id: 'DEV-2025-003',
      client: t('dashboard.recentQuotes.quotes.2.client'),
      service: t('dashboard.recentQuotes.quotes.2.service'),
      amount: t('dashboard.recentQuotes.quotes.2.amount'),
      status: 'sent',
      date: t('dashboard.recentQuotes.quotes.2.date'),
      aiScore: 85
    },
    {
      id: 'DEV-2025-004',
      client: t('dashboard.recentQuotes.quotes.3.client'),
      service: t('dashboard.recentQuotes.quotes.3.service'),
      amount: t('dashboard.recentQuotes.quotes.3.amount'),
      status: 'signed',
      date: t('dashboard.recentQuotes.quotes.3.date'),
      aiScore: 88
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      signed: {
        label: t('dashboard.recentQuotes.statuses.signed.label'),
        color: t('dashboard.recentQuotes.statuses.signed.color'),
        bg: t('dashboard.recentQuotes.statuses.signed.bg'),
        icon: 'CheckCircle'
      },
      viewed: {
        label: t('dashboard.recentQuotes.statuses.viewed.label'),
        color: t('dashboard.recentQuotes.statuses.viewed.color'),
        bg: t('dashboard.recentQuotes.statuses.viewed.bg'),
        icon: 'Eye'
      },
      sent: {
        label: t('dashboard.recentQuotes.statuses.sent.label'),
        color: t('dashboard.recentQuotes.statuses.sent.color'),
        bg: t('dashboard.recentQuotes.statuses.sent.bg'),
        icon: 'Send'
      },
      draft: {
        label: t('dashboard.recentQuotes.statuses.draft.label'),
        color: t('dashboard.recentQuotes.statuses.draft.color'),
        bg: t('dashboard.recentQuotes.statuses.draft.bg'),
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
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.recentQuotes.title')}</h3>
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
                  className={`sm:w-[18px] sm:h-[18px] ${statusConfig.color}`}
                  color="currentColor"
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
          {t('dashboard.recentQuotes.viewAllQuotes')}
        </Button>
      </div>
    </div>
  );
};

export default RecentQuotes;