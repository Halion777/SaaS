import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Select from 'components/ui/Select';
import Input from 'components/ui/Input';
import { supabase } from 'services/supabaseClient';
import SubscriptionNotificationService from 'services/subscriptionNotificationService';

const SubscriptionEditModal = ({ isOpen, onClose, subscription, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: '',
    status: '',
    interval: '',
    amount: '',
    cancel_at_period_end: false
  });

  React.useEffect(() => {
    if (subscription) {
      setFormData({
        plan_name: subscription.plan_name || '',
        plan_type: subscription.plan_type || '',
        status: subscription.status || '',
        interval: subscription.interval || '',
        amount: subscription.amount || '',
        cancel_at_period_end: subscription.cancel_at_period_end || false
      });
    }
  }, [subscription]);

  const planOptions = [
    { value: 'starter', label: 'Starter Plan' },
    { value: 'pro', label: 'Pro Plan' },
    { value: 'enterprise', label: 'Enterprise Plan' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'trialing', label: 'Trialing' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'expired', label: 'Expired' },
    { value: 'payment_failed', label: 'Payment Failed' }
  ];

  const intervalOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Store original subscription data for comparison
      const originalSubscription = {
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        amount: subscription.amount,
        interval: subscription.interval,
        status: subscription.status
      };

      const updateData = {
        plan_name: formData.plan_name,
        plan_type: formData.plan_type,
        status: formData.status,
        interval: formData.interval,
        amount: parseFloat(formData.amount),
        cancel_at_period_end: formData.cancel_at_period_end,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) {
        console.error('Error updating subscription:', error);
        alert('Error updating subscription: ' + error.message);
        return;
      }

      // Also update the user's subscription status in the users table
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          subscription_status: formData.status,
          selected_plan: formData.plan_type
        })
        .eq('id', subscription.user_id);

      if (userError) {
        console.error('Error updating user subscription status:', userError);
        // Don't fail the whole operation for this
      }

      // Send notification email if subscription changed
      try {
        // Get user data for notification
        const userResult = await SubscriptionNotificationService.getUserData(subscription.user_id);
        if (userResult.success) {
          const userData = userResult.data;
          
          // Determine notification type based on changes
          const isUpgrade = parseFloat(formData.amount) > parseFloat(originalSubscription.amount);
          const isDowngrade = parseFloat(formData.amount) < parseFloat(originalSubscription.amount);
          const isStatusChange = formData.status !== originalSubscription.status;
          
          // Prepare subscription data for notification
          const notificationData = {
            plan_name: formData.plan_name,
            plan_type: formData.plan_type,
            amount: parseFloat(formData.amount),
            billing_interval: formData.interval,
            status: formData.status,
            oldPlanName: originalSubscription.plan_name,
            oldAmount: originalSubscription.amount,
            newPlanName: formData.plan_name,
            newAmount: parseFloat(formData.amount),
            effectiveDate: new Date().toLocaleDateString('fr-FR')
          };

          // Send appropriate notification
          if (isUpgrade) {
            await SubscriptionNotificationService.sendSubscriptionUpgradeNotification(notificationData, userData);
          } else if (isDowngrade) {
            await SubscriptionNotificationService.sendSubscriptionDowngradeNotification(notificationData, userData);
          } else if (isStatusChange) {
            // For status changes, determine if it's an upgrade or downgrade based on status
            if (formData.status === 'active' && originalSubscription.status === 'trialing') {
              await SubscriptionNotificationService.sendSubscriptionUpgradeNotification(notificationData, userData);
            } else if (formData.status === 'cancelled') {
              await SubscriptionNotificationService.sendSubscriptionCancellationNotification(notificationData, userData, 'Admin action');
            }
          }

          // Log the notification event
          await SubscriptionNotificationService.logSubscriptionNotificationEvent(
            subscription.user_id,
            isUpgrade ? 'upgraded' : isDowngrade ? 'downgraded' : 'status_changed',
            notificationData,
            { success: true }
          );
        }
      } catch (notificationError) {
        console.error('Error sending subscription notification:', notificationError);
        // Don't fail the main operation if notification fails
      }

      alert('Subscription updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error updating subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Edit" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Edit Subscription</h2>
                <p className="text-sm text-muted-foreground">Modify subscription details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
              disabled={isLoading}
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information (Read-only) */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.users?.full_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">
                    {subscription.users?.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Subscription Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Plan Name
                  </label>
                  <Input
                    value={formData.plan_name}
                    onChange={(e) => handleInputChange('plan_name', e.target.value)}
                    placeholder="Enter plan name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Plan Type
                  </label>
                  <Select
                    value={formData.plan_type}
                    onChange={(e) => handleInputChange('plan_type', e.target.value)}
                    options={planOptions}
                    placeholder="Select plan type"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    options={statusOptions}
                    placeholder="Select status"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Billing Interval
                  </label>
                  <Select
                    value={formData.interval}
                    onChange={(e) => handleInputChange('interval', e.target.value)}
                    options={intervalOptions}
                    placeholder="Select interval"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cancel_at_period_end"
                    checked={formData.cancel_at_period_end}
                    onChange={(e) => handleInputChange('cancel_at_period_end', e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="cancel_at_period_end" className="text-sm font-medium text-foreground">
                    Cancel at period end
                  </label>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changes to subscription details will be reflected immediately. 
                    Make sure to communicate any changes to the user.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                iconName={isLoading ? "Loader2" : "Save"}
                iconPosition="left"
              >
                {isLoading ? 'Updating...' : 'Update Subscription'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionEditModal;
