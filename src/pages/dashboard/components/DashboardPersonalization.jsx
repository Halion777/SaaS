import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DashboardPersonalization = ({ isOpen, onClose, onSave }) => {
  const { t, i18n } = useTranslation();
  const [widgetSettings, setWidgetSettings] = useState({
    metricsCards: true,
    invoiceOverview: true,
    quoteChart: true,
    revenueChart: true,
    recentQuotes: true,
    topClients: true,
    taskList: true,
    quickActions: true,
    peppolWidget: true,
    sponsoredBanner: true,
    upcomingEvents: true,
    recentActivity: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWidgetSettings();
  }, []);

  const loadWidgetSettings = () => {
    try {
      const defaultSettings = {
        metricsCards: true,
        invoiceOverview: true,
        quoteChart: true,
        revenueChart: true,
        recentQuotes: true,
        topClients: true,
        taskList: true,
        quickActions: true,
        peppolWidget: true,
        sponsoredBanner: true,
        upcomingEvents: true,
        recentActivity: true
      };
      
      const savedSettings = localStorage.getItem('dashboard-widget-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure new widgets are included
        setWidgetSettings({ ...defaultSettings, ...parsed });
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
      quoteChart: true,
      revenueChart: true,
      recentQuotes: true,
      topClients: true,
      taskList: true,
      quickActions: true,
      peppolWidget: true,
      sponsoredBanner: true,
      upcomingEvents: true,
      recentActivity: true
    };
    setWidgetSettings(defaultSettings);
  };

  const widgetDefinitions = [
    {
      key: 'metricsCards',
      title: t('dashboard.personalization.widgets.metricsCards.title'),
      description: t('dashboard.personalization.widgets.metricsCards.description'),
      icon: 'BarChart3',
      category: t('dashboard.personalization.widgetCategories.Analytics')
    },
    {
      key: 'invoiceOverview',
      title: t('dashboard.personalization.widgets.invoiceOverview.title'),
      description: t('dashboard.personalization.widgets.invoiceOverview.description'),
      icon: 'Receipt',
      category: t('dashboard.personalization.widgetCategories.Finance')
    },
    {
      key: 'quoteChart',
      title: t('dashboard.personalization.widgets.quoteChart.title'),
      description: t('dashboard.personalization.widgets.quoteChart.description'),
      icon: 'BarChart',
      category: t('dashboard.personalization.widgetCategories.Graph')
    },
    {
      key: 'revenueChart',
      title: t('dashboard.personalization.widgets.revenueChart.title'),
      description: t('dashboard.personalization.widgets.revenueChart.description'),
      icon: 'TrendingUp',
      category: t('dashboard.personalization.widgetCategories.Graph')
    },
    {
      key: 'recentQuotes',
      title: t('dashboard.personalization.widgets.recentQuotes.title'),
      description: t('dashboard.personalization.widgets.recentQuotes.description'),
      icon: 'FileText',
      category: t('dashboard.personalization.widgetCategories.Sales')
    },
    {
      key: 'topClients',
      title: t('dashboard.personalization.widgets.topClients.title'),
      description: t('dashboard.personalization.widgets.topClients.description'),
      icon: 'Users',
      category: t('dashboard.personalization.widgetCategories.Clients')
    },
    {
      key: 'taskList',
      title: t('dashboard.personalization.widgets.taskList.title'),
      description: t('dashboard.personalization.widgets.taskList.description'),
      icon: 'CheckSquare',
      category: t('dashboard.personalization.widgetCategories.Productivity')
    },
    {
      key: 'quickActions',
      title: t('dashboard.personalization.widgets.quickActions.title'),
      description: t('dashboard.personalization.widgets.quickActions.description'),
      icon: 'Zap',
      category: t('dashboard.personalization.widgetCategories.Navigation')
    },
    {
      key: 'peppolWidget',
      title: t('dashboard.personalization.widgets.peppolWidget.title'),
      description: t('dashboard.personalization.widgets.peppolWidget.description'),
      icon: 'Network',
      category: t('dashboard.personalization.widgetCategories.Integration')
    },
    {
      key: 'sponsoredBanner',
      title: t('dashboard.personalization.widgets.sponsoredBanner.title'),
      description: t('dashboard.personalization.widgets.sponsoredBanner.description'),
      icon: 'Gift',
      category: t('dashboard.personalization.widgetCategories.Marketing')
    },
    {
      key: 'upcomingEvents',
      title: t('dashboard.personalization.widgets.upcomingEvents.title', 'Upcoming Events'),
      description: t('dashboard.personalization.widgets.upcomingEvents.description', 'View your upcoming events and deadlines'),
      icon: 'Calendar',
      category: t('dashboard.personalization.widgetCategories.Productivity')
    },
    {
      key: 'recentActivity',
      title: t('dashboard.personalization.widgets.recentActivity.title', 'Recent Activity'),
      description: t('dashboard.personalization.widgets.recentActivity.description', 'Track your recent quotes and invoices'),
      icon: 'Activity',
      category: t('dashboard.personalization.widgetCategories.Analytics')
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
              <h2 className="text-xl font-semibold text-foreground">{t('dashboard.personalization.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.personalization.subtitle')}
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
              {t('dashboard.personalization.buttons.reset')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.personalization.buttons.widgetsActive', {
                count: Object.values(widgetSettings).filter(Boolean).length,
                total: Object.keys(widgetSettings).length
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t('dashboard.personalization.buttons.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              iconName={loading ? "Loader2" : "Save"}
              iconPosition="left"
            >
              {loading 
                ? t('dashboard.personalization.buttons.saving') 
                : t('dashboard.personalization.buttons.save')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPersonalization; 