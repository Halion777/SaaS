import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Select from 'components/ui/Select';
import { supabase } from 'services/supabaseClient';
import SubscriptionNotificationService from 'services/subscriptionNotificationService';
import { formatCurrency } from 'utils/numberFormat';

const SubscriptionCancelModal = ({ isOpen, onClose, subscription, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelType, setCancelType] = useState('immediate');

  const cancelReasons = [
    { value: '', label: 'Select a reason...' },
    { value: 'user_request', label: 'User Request' },
    { value: 'payment_failed', label: 'Payment Failed' },
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'other', label: 'Other' }
  ];

  const cancelTypes = [
    { value: 'immediate', label: 'Cancel Immediately' },
    { value: 'end_of_period', label: 'Cancel at End of Period' }
  ];

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Please select a cancellation reason.');
      return;
    }

    setIsLoading(true);
    let stripeError = null;

    try {
      // ============================================
      // STEP 1: Update Stripe FIRST (if user has Stripe subscription)
      // ============================================
      const hasStripeSubscription = subscription.stripe_subscription_id && 
                                    !subscription.stripe_subscription_id.includes('placeholder') &&
                                    !subscription.stripe_subscription_id.includes('temp_');
      
      if (hasStripeSubscription) {
        try {
          const { data: stripeResult, error: stripeError } = await supabase.functions.invoke(
            'admin-update-subscription',
            { 
              body: {
                userId: subscription.user_id,
                stripeSubscriptionId: subscription.stripe_subscription_id,
                action: 'cancel',
                cancelAtPeriodEnd: cancelType === 'end_of_period'
              }
            }
          );

          if (stripeError) {
            console.error('Stripe cancel error:', stripeError);
            stripeError = `Stripe sync failed: ${stripeError.message}. Database will still be updated.`;
          } else if (!stripeResult?.success) {
            console.error('Stripe cancel failed:', stripeResult?.error);
            stripeError = `Stripe sync failed: ${stripeResult?.error || 'Unknown error'}. Database will still be updated.`;
          } else {
            console.log('Stripe cancelled successfully:', stripeResult);
          }
        } catch (stripeCallError) {
          console.error('Error calling Stripe edge function:', stripeCallError);
          stripeError = `Stripe sync error: ${stripeCallError.message}. Database will still be updated.`;
        }
      }

      // ============================================
      // STEP 2: Update Supabase database
      // ============================================
      const updateData = {
        status: 'cancelled',
        cancel_at_period_end: cancelType === 'end_of_period',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) {
        console.error('Error cancelling subscription:', error);
        alert('Error cancelling subscription: ' + error.message);
        return;
      }

      // Update user's subscription status (LIFETIME ACCESS PROTECTION)
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          subscription_status: 'cancelled'
        })
        .eq('id', subscription.user_id)
        .eq('has_lifetime_access', false); // Only update users WITHOUT lifetime access

      if (userError) {
        console.error('Error updating user subscription status:', userError);
        // Don't fail the whole operation for this
      }

      // Send cancellation notification email
      try {
        // Get user data for notification
        const userResult = await SubscriptionNotificationService.getUserData(subscription.user_id);
        if (userResult.success) {
          const userData = userResult.data;
          
          // Prepare subscription data for notification
          const notificationData = {
            plan_name: subscription.plan_name,
            plan_type: subscription.plan_type,
            amount: subscription.amount,
            billing_interval: subscription.interval,
            status: 'cancelled',
            effectiveDate: cancelType === 'immediate' 
              ? new Date().toLocaleDateString('fr-FR')
              : subscription.current_period_end 
                ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR')
                : new Date().toLocaleDateString('fr-FR')
          };

          // Send cancellation notification
          await SubscriptionNotificationService.sendSubscriptionCancellationNotification(
            notificationData, 
            userData, 
            cancelReason
          );

          // Log the notification event
          await SubscriptionNotificationService.logSubscriptionNotificationEvent(
            subscription.user_id,
            'cancelled',
            notificationData,
            { success: true }
          );
        }
      } catch (notificationError) {
        console.error('Error sending cancellation notification:', notificationError);
        // Don't fail the main operation if notification fails
      }

      alert(stripeError 
        ? `Subscription cancelled in database. Warning: ${stripeError}`
        : 'Subscription cancelled successfully (both Stripe and database)!'
      );
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error cancelling subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !subscription) return null;

  // LIFETIME ACCESS PROTECTION: Prevent cancelling subscriptions for lifetime access users
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
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Cannot Cancel Subscription</h4>
                <p className="text-sm text-yellow-700">
                  This user has <strong>LIFETIME ACCESS</strong> and their subscription cannot be cancelled through this interface.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  To revoke access, please use the <strong>User Management</strong> page to revoke their lifetime access first.
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Using centralized formatCurrency utility from utils/numberFormat.js
  // which formats with comma as decimal separator (European format)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Icon name="Trash2" size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Cancel Subscription</h2>
                <p className="text-sm text-muted-foreground">Cancel user subscription</p>
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

          {/* Subscription Information */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Subscription to Cancel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">User</p>
                <p className="text-sm font-medium text-foreground">
                  {(subscription.users?.first_name && subscription.users?.last_name ? `${subscription.users.first_name} ${subscription.users.last_name}` : subscription.users?.first_name || subscription.users?.last_name || 'Unknown')} ({subscription.users?.email || 'No email'})
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-medium text-foreground">
                  {subscription.plan_name || 'Unknown Plan'} - {formatCurrency(subscription.amount || 0)}/{subscription.interval || 'month'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Status</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {subscription.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Billing</p>
                <p className="text-sm font-medium text-foreground">
                  {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
              Cancellation Options
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cancellation Type
              </label>
              <Select
                value={cancelType}
                onChange={(e) => setCancelType(e.target.value)}
                options={cancelTypes}
                placeholder="Select cancellation type"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cancellation Reason
              </label>
              <Select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                options={cancelReasons}
                placeholder="Select a reason"
                required
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="AlertTriangle" size={16} className="text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  This action will cancel the user's subscription. This action cannot be undone easily. 
                  The user will lose access to premium features based on the cancellation type selected.
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
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
              iconName={isLoading ? "Loader2" : "Trash2"}
              iconPosition="left"
            >
              {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelModal;
