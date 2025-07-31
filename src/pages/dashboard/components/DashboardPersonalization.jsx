import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DashboardPersonalization = ({ isOpen, onClose, onSave }) => {
  const [widgetSettings, setWidgetSettings] = useState({
    metricsCards: true,
    invoiceOverview: true,
    recentQuotes: true,
    topClients: true,
    taskList: true,
    quickActions: true,
    aiPerformance: true,
    peppolWidget: true,
    sponsoredBanner: true,
    aiAlerts: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWidgetSettings();
  }, []);

  const loadWidgetSettings = () => {
    try {
      const savedSettings = localStorage.getItem('dashboard-widget-settings');
      if (savedSettings) {
        setWidgetSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  };

  const handleWidgetToggle = (widgetKey) => {
    setWidgetSettings(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('dashboard-widget-settings', JSON.stringify(widgetSettings));
      
      // Call parent save function
      if (onSave) {
        onSave(widgetSettings);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving widget settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      metricsCards: true,
      invoiceOverview: true,
      recentQuotes: true,
      topClients: true,
      taskList: true,
      quickActions: true,
      aiPerformance: true,
      peppolWidget: true,
      sponsoredBanner: true,
      aiAlerts: true
    };
    setWidgetSettings(defaultSettings);
  };

  const widgetDefinitions = [
    {
      key: 'metricsCards',
      title: 'Métriques principales',
      description: 'Affiche les KPIs principaux (CA, devis, clients)',
      icon: 'BarChart3',
      category: 'Analytics'
    },
    {
      key: 'invoiceOverview',
      title: 'Vue d\'ensemble des factures',
      description: 'Résumé des factures clients et fournisseurs',
      icon: 'Receipt',
      category: 'Finance'
    },
    {
      key: 'recentQuotes',
      title: 'Devis récents',
      description: 'Liste des derniers devis créés',
      icon: 'FileText',
      category: 'Sales'
    },
    {
      key: 'topClients',
      title: 'Meilleurs clients',
      description: 'Top 5 des clients par chiffre d\'affaires',
      icon: 'Users',
      category: 'Clients'
    },
    {
      key: 'taskList',
      title: 'Liste des tâches',
      description: 'Tâches en cours et à venir',
      icon: 'CheckSquare',
      category: 'Productivity'
    },
    {
      key: 'quickActions',
      title: 'Actions rapides',
      description: 'Accès rapide aux fonctionnalités principales',
      icon: 'Zap',
      category: 'Navigation'
    },
    {
      key: 'aiPerformance',
      title: 'Performance IA',
      description: 'Métriques et insights de l\'intelligence artificielle',
      icon: 'Brain',
      category: 'AI'
    },
    {
      key: 'peppolWidget',
      title: 'Réseau Peppol',
      description: 'Statut et métriques de l\'intégration Peppol',
      icon: 'Network',
      category: 'Integration'
    },
    {
      key: 'sponsoredBanner',
      title: 'Bannière sponsorisée',
      description: 'Promotions et offres spéciales',
      icon: 'Gift',
      category: 'Marketing'
    },
    {
      key: 'aiAlerts',
      title: 'Alertes IA',
      description: 'Notifications intelligentes et recommandations',
      icon: 'Bell',
      category: 'AI'
    }
  ];

  const groupedWidgets = widgetDefinitions.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Settings" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Personnalisation du tableau de bord</h2>
              <p className="text-sm text-muted-foreground">
                Choisissez les widgets que vous souhaitez afficher
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {Object.entries(groupedWidgets).map(([category, widgets]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-foreground mb-4 capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {widgets.map((widget) => (
                    <div
                      key={widget.key}
                      className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                        widgetSettings[widget.key]
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-border bg-muted/30'
                      }`}
                      onClick={() => handleWidgetToggle(widget.key)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Icon name={widget.icon} size={16} className="text-muted-foreground" />
                            <h4 className="font-medium text-foreground">{widget.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {widget.description}
                          </p>
                        </div>
                        {/* Toggle Switch */}
                        <div className="ml-4">
                          <button
                            type="button"
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              widgetSettings[widget.key] ? 'bg-primary' : 'bg-gray-200'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWidgetToggle(widget.key);
                            }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                widgetSettings[widget.key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleReset}
              iconName="RotateCcw"
              iconPosition="left"
            >
              Effacer
            </Button>
            <p className="text-sm text-muted-foreground">
              {Object.values(widgetSettings).filter(Boolean).length} / {Object.keys(widgetSettings).length} widgets activés
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              iconName={loading ? "Loader2" : "Save"}
              iconPosition="left"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPersonalization; 