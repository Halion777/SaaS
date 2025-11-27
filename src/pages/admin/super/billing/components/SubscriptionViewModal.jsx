import React from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';

const SubscriptionViewModal = ({ isOpen, onClose, subscription }) => {
  if (!isOpen || !subscription) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Eye" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Subscription Details</h2>
                <p className="text-sm text-muted-foreground">View subscription information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          {/* Subscription Information */}
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {(subscription.users?.first_name && subscription.users?.last_name ? `${subscription.users.first_name} ${subscription.users.last_name}` : subscription.users?.first_name || subscription.users?.last_name || 'Unknown')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.users?.email || 'No email'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.users?.company_name || 'No company'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Plan Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.plan_name || 'Unknown Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan Type</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.plan_type || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Interval</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.interval || 'monthly'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(subscription.amount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.currency || 'EUR'}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Billing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current Period Start</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.current_period_start ? formatDate(subscription.current_period_start) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Period End</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trial Start</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.trial_start ? formatDate(subscription.trial_start) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trial End</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.trial_end ? formatDate(subscription.trial_end) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cancel at Period End</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.cancel_at_period_end ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cancelled At</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.cancelled_at ? formatDate(subscription.cancelled_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(subscription.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(subscription.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionViewModal;
