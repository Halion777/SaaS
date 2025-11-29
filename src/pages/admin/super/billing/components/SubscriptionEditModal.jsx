import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Select from 'components/ui/Select';
import { supabase } from 'services/supabaseClient';
import SubscriptionNotificationService from 'services/subscriptionNotificationService';

const SubscriptionEditModal = ({ isOpen, onClose, subscription, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [formData, setFormData] = useState({
    plan_type: '',
    status: '',
    interval: '',
    cancel_at_period_end: false
  });

  React.useEffect(() => {
    if (subscription) {
      // Normalize status - convert 'trial' to 'trialing' for consistency
      const normalizedStatus = subscription.status === 'trial' ? 'trialing' : subscription.status;
      
      setFormData({
        plan_type: subscription.plan_type || '',
        status: normalizedStatus || '',
        interval: subscription.interval || '',
        cancel_at_period_end: subscription.cancel_at_period_end || false
      });
    }
  }, [subscription]);

  const planOptions = [
    { value: 'starter', label: 'Starter Plan' },
    { value: 'pro', label: 'Pro Plan' }
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
    setStripeError(null);

    try {
      // Store original subscription data for comparison
      const originalSubscription = {
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        amount: subscription.amount,
        interval: subscription.interval,
        status: subscription.status
      };

      // Get pricing from database (customizable in app settings)
      const pricingResult = await SubscriptionNotificationService.getPricingInfo(
        formData.plan_type, 
        formData.interval
      );
      
      let plan_name = `${formData.plan_type.charAt(0).toUpperCase() + formData.plan_type.slice(1)} Plan`;
      let amount = formData.plan_type === 'pro' ? 49.99 : 29.99; // Fallback values
      
      if (pricingResult.success && pricingResult.data) {
        plan_name = pricingResult.data.plan_name;
        amount = pricingResult.data.amount;
      }
      
      // Determine what changed
      const isPlanChange = formData.plan_type !== originalSubscription.plan_type || 
                          formData.interval !== originalSubscription.interval;
      const isCancellation = formData.status === 'cancelled' && originalSubscription.status !== 'cancelled';
      const isReactivation = originalSubscription.status === 'cancelled' && formData.status === 'active';

      // ============================================
      // STEP 1: Update Stripe FIRST (if user has Stripe subscription)
      // ============================================
      const hasStripeSubscription = subscription.stripe_subscription_id && 
                                    !subscription.stripe_subscription_id.includes('placeholder') &&
                                    !subscription.stripe_subscription_id.includes('temp_');
      
      if (hasStripeSubscription) {
        try {
          let stripeAction = null;
          let stripePayload = {
            userId: subscription.user_id,
            stripeSubscriptionId: subscription.stripe_subscription_id
          };

          if (isPlanChange) {
            stripeAction = 'update_plan';
            stripePayload = {
              ...stripePayload,
              action: stripeAction,
              planType: formData.plan_type,
              billingInterval: formData.interval
            };
          } else if (isCancellation) {
            stripeAction = 'cancel';
            stripePayload = {
              ...stripePayload,
              action: stripeAction,
              cancelAtPeriodEnd: formData.cancel_at_period_end
            };
          } else if (isReactivation) {
            stripeAction = 'reactivate';
            stripePayload = {
              ...stripePayload,
              action: stripeAction
            };
          }

          if (stripeAction) {
            console.log('Calling Stripe update with:', stripePayload);
            
            const { data: stripeResult, error: stripeError } = await supabase.functions.invoke(
              'admin-update-subscription',
              { body: stripePayload }
            );

            if (stripeError) {
              console.error('Stripe update error:', stripeError);
              setStripeError(`Stripe sync failed: ${stripeError.message}. Database will still be updated.`);
            } else if (!stripeResult?.success) {
              console.error('Stripe update failed:', stripeResult?.error);
              setStripeError(`Stripe sync failed: ${stripeResult?.error || 'Unknown error'}. Database will still be updated.`);
            } else {
              console.log('Stripe updated successfully:', stripeResult);
            }
          }
        } catch (stripeCallError) {
          console.error('Error calling Stripe edge function:', stripeCallError);
          setStripeError(`Stripe sync error: ${stripeCallError.message}. Database will still be updated.`);
        }
      }

      // ============================================
      // STEP 2: Update Supabase database
      // ============================================
      const updateData = {
        plan_name: plan_name,
        plan_type: formData.plan_type,
        status: formData.status,
        interval: formData.interval,
        amount: amount,
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

      // ============================================
      // STEP 3: Send notification email if subscription changed
      // ============================================
      try {
        // Get user data for notification
        const userResult = await SubscriptionNotificationService.getUserData(subscription.user_id);
        if (userResult.success) {
          const userData = userResult.data;
          
          // Determine notification type based on changes
          const isUpgrade = amount > parseFloat(originalSubscription.amount);
          const isDowngrade = amount < parseFloat(originalSubscription.amount);
          const isStatusChange = formData.status !== originalSubscription.status;
          
          // Prepare subscription data for notification
          const notificationData = {
            plan_name: plan_name,
            plan_type: formData.plan_type,
            amount: amount,
            billing_interval: formData.interval,
            status: formData.status,
            oldPlanName: originalSubscription.plan_name,
            oldAmount: originalSubscription.amount,
            newPlanName: plan_name,
            newAmount: amount,
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

      alert(stripeError 
        ? `Subscription updated in database. Warning: ${stripeError}`
        : 'Subscription updated successfully (both Stripe and database)!'
      );
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
                    {(subscription.users?.first_name && subscription.users?.last_name ? `${subscription.users.first_name} ${subscription.users.last_name}` : subscription.users?.first_name || subscription.users?.last_name || 'Unknown')}
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

            {/* Stripe Sync Info */}
            {subscription.stripe_subscription_id && !subscription.stripe_subscription_id.includes('placeholder') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="CreditCard" size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Stripe Connected</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This subscription is linked to Stripe. Changes will be synced automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
