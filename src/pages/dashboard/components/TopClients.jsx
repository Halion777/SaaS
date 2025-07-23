import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TopClients = () => {
  const clients = [
    {
      id: 1,
      name: 'Marie Dubois',
      company: 'Résidence Les Jardins',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      revenue: '12.450,00 €',
      quotes: 8,
      signatureRate: 87,
      lastContact: '2025-07-18',
      status: 'active'
    },
    {
      id: 2,
      name: 'Pierre Martin',
      company: 'Copropriété Bellevue',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      revenue: '9.850,00 €',
      quotes: 6,
      signatureRate: 75,
      lastContact: '2025-07-17',
      status: 'active'
    },
    {
      id: 3,
      name: 'Sophie Leroy',
      company: 'Maison individuelle',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      revenue: '7.200,00 €',
      quotes: 4,
      signatureRate: 92,
      lastContact: '2025-07-16',
      status: 'prospect'
    },
    {
      id: 4,
      name: 'Jean Moreau',
      company: 'Restaurant Le Gourmet',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      revenue: '6.750,00 €',
      quotes: 5,
      signatureRate: 68,
      lastContact: '2025-07-15',
      status: 'active'
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        label: 'Actif',
        color: 'text-success',
        bg: 'bg-success/10'
      },
      prospect: {
        label: 'Prospect',
        color: 'text-warning',
        bg: 'bg-warning/10'
      },
      inactive: {
        label: 'Inactif',
        color: 'text-muted-foreground',
        bg: 'bg-muted/50'
      }
    };
    return configs[status] || configs.prospect;
  };

  const getSignatureRateColor = (rate) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Top clients</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Par CA</span>
          <Icon name="TrendingUp" size={14} color="var(--color-success)" />
        </div>
      </div>
      <div className="space-y-4">
        {clients.map((client, index) => {
          const statusConfig = getStatusConfig(client.status);
          return (
            <div key={client.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <span className="absolute -top-2 -left-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={client.avatar}
                      alt={client.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{client.revenue}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">{client.quotes} devis</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className={`text-xs font-medium ${getSignatureRateColor(client.signatureRate)}`}>
                    {client.signatureRate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">CA total: 36.250,00 €</span>
          <Icon name="Users" size={14} color="var(--color-muted-foreground)" />
        </div>
      </div>
    </div>
  );
};

export default TopClients;