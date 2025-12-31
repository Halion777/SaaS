import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Select from 'components/ui/Select';
import { supabase } from 'services/supabaseClient';
import SubscriptionNotificationService from 'services/subscriptionNotificationService';

const SubscriptionEditModal = ({ isOpen, onClose, subscription, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [applyImmediately, setApplyImmediately] = useState(true);
  const [formData, setFormData] = useState({
    plan_type: '',
    status: '',
    interval: ''
  });

  React.useEffect(() => {
    if (subscription) {
      // Normalize status - convert 'trial' to 'trialing' for consistency
      const normalizedStatus = subscription.status === 'trial' ? 'trialing' : subscription.status;
      
      setFormData({
        plan_type: subscription.plan_type || '',
        status: normalizedStatus || '',
        interval: subscription.interval || ''
      });
    }
  }, [subscription]);

  const planOptions = [
    { value: 'starter', label: 'Starter Plan' },
    { value: 'pro', label: 'Pro Plan' }
  ];

  // ONLY Stripe's official subscription statuses (excluding 'canceled' - use cancel button instead)
  // Ref: https://stripe.com/docs/api/subscriptions/object#subscription_object-status
  const statusOptions = [
    { value: 'trialing', label: 'Trialing' },
    { value: 'active', label: 'Active' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'incomplete', label: 'Incomplete' },
    { value: 'incomplete_expired', label: 'Incomplete Expired' }
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

    // Check if subscription is cancelled (Stripe uses 'canceled', database might use 'cancelled')
    const isCancelled = subscription.status === 'cancelled' || subscription.status === 'canceled';
    if (isCancelled) {
      alert('Cannot update a cancelled subscription. Stripe only allows updating cancellation_details and metadata for cancelled subscriptions.');
      setIsLoading(false);
      return;
    }

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
      let amount = formData.plan_type === 'pro' ? 69.99 : 39.99; // Fallback values
      
      if (pricingResult.success && pricingResult.data) {
        plan_name = pricingResult.data.plan_name;
        amount = pricingResult.data.amount;
      } else {
        console.warn('Using fallback pricing due to database issue:', pricingResult.error);
        // Continue with fallback values
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
      
      let stripeError = null;
      let stripeSuccess = false;
      
      if (hasStripeSubscription) {
        // Double-check: Don't attempt Stripe update if subscription is cancelled
        // Stripe only allows updating cancellation_details and metadata for cancelled subscriptions
        const isCancelled = subscription.status === 'cancelled' || subscription.status === 'canceled';
        if (isCancelled) {
          alert('Cannot update a cancelled subscription in Stripe. Stripe only allows updating cancellation_details and metadata for cancelled subscriptions.');
          setIsLoading(false);
          return;
        }

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
              billingInterval: formData.interval,
              prorationBehavior: applyImmediately ? 'always_invoice' : 'none'
            };
          } else if (isReactivation) {
            stripeAction = 'reactivate';
            stripePayload = {
              ...stripePayload,
              action: stripeAction
            };
          }

          if (stripeAction) {
          
            const { data: stripeResult, error: stripeErr } = await supabase.functions.invoke(
              'admin-update-subscription',
              { body: stripePayload }
            );

            if (stripeErr) {
              console.error('Stripe update error:', stripeErr);
              stripeError = `Stripe sync failed: ${stripeErr.message}`;
              stripeSuccess = false;
            } else if (!stripeResult?.success) {
              console.error('Stripe update failed:', stripeResult?.error);
              stripeError = `Stripe sync failed: ${stripeResult?.error || 'Unknown error'}`;
              stripeSuccess = false;
            } else {
              stripeSuccess = true;
            } 
          } else {
            // No Stripe action needed (e.g., only status change that doesn't require Stripe update)
            stripeSuccess = true;
          }
        } catch (stripeCallError) {
          console.error('Error calling Stripe edge function:', stripeCallError);
          stripeError = `Stripe sync error: ${stripeCallError.message}`;
          stripeSuccess = false;
        }
      } else {
        // No Stripe subscription, so we can proceed with database update
        stripeSuccess = true;
      }

      // ============================================
      // STEP 2: Update Supabase database (only if Stripe succeeded or no Stripe subscription)
      // ============================================
      
      // If Stripe update failed, don't update database to maintain consistency
      if (hasStripeSubscription && !stripeSuccess) {
        alert(`Subscription update failed.\n\nError: ${stripeError}\n\nThe database was not updated to maintain consistency with Stripe.`);
        setIsLoading(false);
        return;
      }

      const updateData = {
        plan_name: plan_name,
        plan_type: formData.plan_type,
        status: formData.status,
        interval: formData.interval,
        amount: amount,
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
          const isPlanChange = formData.plan_type !== originalSubscription.plan_type;
          const isIntervalChange = formData.interval !== originalSubscription.interval;
          const isCancellation = formData.status === 'canceled' || formData.status === 'cancelled';
          
          // ⚠️ IMPORTANT: Check cancellation FIRST before checking amount changes
          // because cancelling should always send cancellation email, not upgrade/downgrade
          if (isCancellation) {
            // Status changed to cancelled - send cancellation email
            await SubscriptionNotificationService.sendSubscriptionCancellationNotification(notificationData, userData, 'Admin action');
          } else if (isUpgrade) {
            // Amount increased - send upgrade email
            await SubscriptionNotificationService.sendSubscriptionUpgradeNotification(notificationData, userData);
          } else if (isDowngrade) {
            // Amount decreased - send downgrade email
            await SubscriptionNotificationService.sendSubscriptionDowngradeNotification(notificationData, userData);
          } else if (isStatusChange) {
            // Other status changes
            if (formData.status === 'active' && originalSubscription.status === 'trialing') {
              await SubscriptionNotificationService.sendSubscriptionUpgradeNotification(notificationData, userData);
            }
            // Note: Other status changes (past_due, unpaid, etc.) are typically handled by Stripe webhooks
            // and don't need manual email notifications from admin panel
          } else if (isPlanChange || isIntervalChange) {
            // Plan or interval changed without amount change - send "modified" email
            // Using downgrade template which is labeled as "subscription modified" in French
            await SubscriptionNotificationService.sendSubscriptionDowngradeNotification(notificationData, userData);
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

      // Success message
      if (hasStripeSubscription) {
        alert('Subscription updated successfully (both Stripe and database)!');
      } else {
        alert('Subscription updated successfully in database!');
      }
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

  // LIFETIME ACCESS PROTECTION: Prevent editing subscriptions for lifetime access users
  if (subscription.users?.has_lifetime_access) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <Icon name="Shield" size={24} className="text-yellow-500 mr-2" />
              Protected User
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-150"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Cannot Edit Subscription</h4>
                <p className="text-sm text-yellow-700">
                  This user has <strong>LIFETIME ACCESS</strong> and their subscription cannot be edited through this interface.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Lifetime access users maintain full access regardless of subscription status. To manage their access, please use the <strong>User Management</strong> page.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prevent editing cancelled subscriptions (Stripe restriction)
  // Check both 'cancelled' (database) and 'canceled' (Stripe) variants
  const isCancelled = subscription.status === 'cancelled' || subscription.status === 'canceled';
  if (isCancelled) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <Icon name="AlertTriangle" size={24} className="mr-2 text-red-600" />
              Cannot Edit Cancelled Subscription
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stripe does not allow editing cancelled subscriptions. Once a subscription is cancelled, you can only update its metadata and cancellation details.
            </p>
            <p className="text-sm text-muted-foreground">
              If you need to reactivate this subscription, please create a new subscription for the user.
            </p>
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    {subscription?.plan_type && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current: <span className="font-semibold capitalize">{subscription.plan_type}</span>)
                      </span>
                    )}
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
                    {subscription?.status && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current: <span className="font-semibold capitalize">{subscription.status === 'trial' ? 'trialing' : subscription.status}</span>)
                      </span>
                    )}
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
                    {subscription?.interval && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current: <span className="font-semibold capitalize">{subscription.interval}</span>)
                      </span>
                    )}
                  </label>
                  <Select
                    value={formData.interval}
                    onChange={(e) => handleInputChange('interval', e.target.value)}
                    options={intervalOptions}
                    placeholder="Select interval"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Apply Immediately Option */}
            {(formData.plan_type !== subscription.plan_type || formData.interval !== subscription.interval) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="Zap" size={16} className="text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 mb-3">Plan Change Timing</h4>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="apply_immediately"
                        checked={applyImmediately}
                        onChange={(e) => setApplyImmediately(e.target.checked)}
                        className="rounded border-yellow-300"
                      />
                      <label htmlFor="apply_immediately" className="text-sm font-semibold text-yellow-800 cursor-pointer">
                        Apply changes immediately and prorate
                      </label>
                    </div>
                    
                    {applyImmediately ? (
                      <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                        <p className="text-xs font-semibold text-green-800 flex items-center">
                          <Icon name="Check" size={14} className="mr-1" />
                          Immediate Change
                        </p>
                        <ul className="text-xs text-green-700 space-y-1 ml-5 list-disc">
                          <li>Changes take effect <strong>right now</strong></li>
                          <li>Prorated charges/credits will be calculated</li>
                          <li>User will see the new plan immediately</li>
                          <li>Invoice generated for any amount due</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                        <p className="text-xs font-semibold text-blue-800 flex items-center">
                          <Icon name="Calendar" size={14} className="mr-1" />
                          Scheduled Change
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1 ml-5 list-disc">
                          <li>Changes scheduled for <strong>next billing cycle</strong></li>
                          <li>Current plan continues until {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'period end'}</li>
                          <li>No immediate charges</li>
                          <li>User keeps current plan access</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
