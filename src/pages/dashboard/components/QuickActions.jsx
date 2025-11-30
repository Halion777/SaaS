import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import { useMultiUser } from '../../../context/MultiUserContext';

const QuickActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, companyProfiles, hasPermission } = useMultiUser();

  // Check if user can access subscription (admin or no profiles set up)
  const canAccessSubscription = companyProfiles.length === 0 || isAdmin();

  const actions = [
    {
      id: 'create-quote',
      label: t('dashboard.quickActions.actions.0.label'),
      description: t('dashboard.quickActions.actions.0.description'),
      icon: 'Plus',
      variant: 'default',
      path: '/quote-creation',
      permission: 'quoteCreation',
      requiredLevel: 'full_access'
    },
    {
      id: 'follow-clients',
      label: t('dashboard.quickActions.actions.1.label'),
      description: t('dashboard.quickActions.actions.1.description'),
      icon: 'Phone',
      variant: 'outline',
      path: '/client-management',
      permission: 'clientManagement',
      requiredLevel: 'view_only'
    },
    {
      id: 'view-invoices',
      label: t('dashboard.quickActions.actions.2.label'),
      description: t('dashboard.quickActions.actions.2.description'),
      icon: 'Receipt',
      variant: 'outline',
      path: '/invoices-management',
      permission: 'clientInvoices',
      requiredLevel: 'view_only'
    },
    {
      id: 'manage-subscription',
      label: t('dashboard.quickActions.actions.3.label', 'Manage Subscription'),
      description: t('dashboard.quickActions.actions.3.description', 'Upgrade, downgrade, or manage your plan'),
      icon: 'CreditCard',
      variant: 'outline',
      path: '/subscription',
      adminOnly: true
    }
  ];

  // Filter actions based on permissions
  const filteredActions = actions.filter(action => {
    if (action.adminOnly) {
      return canAccessSubscription;
    }
    if (action.permission) {
      return hasPermission(action.permission, action.requiredLevel || 'view_only');
    }
    return true;
  });

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">{t('dashboard.quickActions.title')}</h3>
      <div className="space-y-3 sm:space-y-4">
        {filteredActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            fullWidth
            iconName={action.icon}
            iconPosition="left"
            onClick={() => handleActionClick(action.path)}
            className="justify-start h-auto p-3 sm:p-4 text-sm"
          >
            <div className="text-left">
              <div className="font-medium">{action.label}</div>
              <div className="text-xs opacity-75 mt-1">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;