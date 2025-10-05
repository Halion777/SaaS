// src/services/registrationService.js

import { supabase } from './supabaseClient';
import SubscriptionNotificationService from './subscriptionNotificationService';


class RegistrationService {
  /**
   * Complete user registration after successful payment
   * @param {Object} sessionData - Stripe checkout session data
   * @param {Object} userData - User registration data
   */
  async completeRegistration(sessionData, userData) {
    try {
      console.log('Starting registration completion...')
      
      // 1. Update user record
      await this.updateUserRecord(sessionData, userData)
      
      // 2. Create user profile
      await this.createUserProfile(sessionData, userData)
      
      // 3. Create subscription record
      const subscriptionId = await this.createSubscriptionRecord(sessionData, userData)
      
      // 4. Create payment record
      await this.createPaymentRecord(sessionData, userData, subscriptionId)
      
      // 5. Send subscription notification email
      await this.sendRegistrationSubscriptionNotification(sessionData, userData, subscriptionId)
      
      console.log('Registration completed successfully')
      return { success: true }
      
    } catch (error) {
      console.error('Error completing registration:', error)
      throw error
    }
  }

  /**
   * Update user record with payment information
   */
  async updateUserRecord(sessionData, userData) {
    // Determine subscription status based on trial period
    const subscriptionStatus = sessionData.subscription_status === 'trialing' ? 'trial' : 'active'
    
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: subscriptionStatus,
        stripe_subscription_id: sessionData.subscription,
        stripe_customer_id: sessionData.customer,
        trial_start_date: sessionData.trial_start ? new Date(sessionData.trial_start * 1000).toISOString() : null,
        trial_end_date: sessionData.trial_end ? new Date(sessionData.trial_end * 1000).toISOString() : null,
        registration_completed: true
      })
      .eq('id', userData.userId)

    if (error) {
      console.error('Error updating user record:', error)
      throw error
    }
    
    console.log('User record updated successfully')
  }

  /**
   * Create user profile for multi-user system
   */
  async createUserProfile(sessionData, userData) {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userData.userId,
        name: userData.fullName,
        email: userData.email,
        role: 'admin',
        permissions: {
          dashboard: 'full_access',
          analytics: 'full_access',
          peppolAccessPoint: 'full_access',
          leadsManagement: 'full_access',
          quoteCreation: 'full_access',
          quotesManagement: 'full_access',
          quotesFollowUp: 'full_access',
          invoicesFollowUp: 'full_access',
          clientInvoices: 'full_access',
          supplierInvoices: 'full_access',
          clientManagement: 'full_access',
          creditInsurance: 'full_access',
          recovery: 'full_access'
        },
        is_active: true
      })

    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
    
    console.log('User profile created successfully')
  }

  /**
   * Create subscription record
   */
  async createSubscriptionRecord(sessionData, userData) {
    // Determine subscription status based on trial period
    const subscriptionStatus = sessionData.subscription_status === 'trialing' ? 'trial' : 'active'
    
    const subscriptionRecord = {
      user_id: userData.userId,
      stripe_subscription_id: sessionData.subscription,
      stripe_customer_id: sessionData.customer,
      plan_name: subscriptionStatus === 'trial' ? 'Trial' : userData.selectedPlan,
      plan_type: userData.selectedPlan,
      status: subscriptionStatus,
      interval: userData.billingCycle,
      amount: sessionData.subscription_items?.data?.[0]?.price?.unit_amount ? 
        sessionData.subscription_items.data[0].price.unit_amount / 100 : 
        (sessionData.amount_total / 100), // Fallback to session amount
      currency: sessionData.currency?.toUpperCase() || 'EUR',
      current_period_start: sessionData.current_period_start ? new Date(sessionData.current_period_start * 1000).toISOString() : null,
      current_period_end: sessionData.current_period_end ? new Date(sessionData.current_period_end * 1000).toISOString() : null,
      trial_start: sessionData.trial_start ? new Date(sessionData.trial_start * 1000).toISOString() : null,
      trial_end: sessionData.trial_end ? new Date(sessionData.trial_end * 1000).toISOString() : null
    }

    const { data: subscriptionData, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionRecord)
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription record:', error)
      throw error
    }
    
    console.log('Subscription record created successfully:', subscriptionData.id)
    return subscriptionData.id
  }

  /**
   * Create payment record
   */
  async createPaymentRecord(sessionData, userData, subscriptionId) {
    const paymentRecord = {
      subscription_id: subscriptionId,
      user_id: userData.userId,
      stripe_payment_intent_id: sessionData.payment_intent,
      stripe_invoice_id: sessionData.invoice,
      amount: sessionData.amount_total / 100, // Convert from cents
      currency: sessionData.currency?.toUpperCase() || 'EUR',
      status: sessionData.payment_status === 'paid' ? 'succeeded' : 'pending',
      payment_method: 'card',
      description: `${userData.selectedPlan} plan subscription`,
      paid_at: sessionData.payment_status === 'paid' ? new Date().toISOString() : null
    }

    const { error } = await supabase
      .from('payment_records')
      .insert(paymentRecord)

    if (error) {
      console.error('Error creating payment record:', error)
      throw error
    }
    
    console.log('Payment record created successfully')
  }

  /**
   * Send subscription notification email after successful registration
   */
  async sendRegistrationSubscriptionNotification(sessionData, userData, subscriptionId) {
    try {
      // Get the created subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (subscriptionError || !subscriptionData) {
        console.error('Error fetching subscription data for notification:', subscriptionError)
        return // Don't fail registration if notification fails
      }

      // Prepare user data for notification
      const userNotificationData = {
        id: userData.userId,
        email: userData.email,
        full_name: userData.fullName
      }

      // Determine notification type based on subscription status
      const isTrial = subscriptionData.status === 'trial' || subscriptionData.status === 'trialing'
      
      if (isTrial) {
        // Send trial notification
        const notificationData = {
          plan_name: subscriptionData.plan_name,
          plan_type: subscriptionData.plan_type,
          amount: subscriptionData.amount,
          billing_interval: subscriptionData.interval,
          status: subscriptionData.status,
          trial_end_date: subscriptionData.trial_end ? new Date(subscriptionData.trial_end).toLocaleDateString('fr-FR') : 'Bientôt',
          new_amount: `${subscriptionData.amount}€`
        }

        await SubscriptionNotificationService.sendTrialEndingNotification(notificationData, userNotificationData)
      } else {
        // Send subscription activated notification (treat as upgrade from trial to active)
        const notificationData = {
          plan_name: subscriptionData.plan_name,
          plan_type: subscriptionData.plan_type,
          amount: subscriptionData.amount,
          billing_interval: subscriptionData.interval,
          status: subscriptionData.status,
          oldPlanName: 'Trial',
          newPlanName: subscriptionData.plan_name,
          oldAmount: '0',
          newAmount: `${subscriptionData.amount}€`,
          effectiveDate: new Date().toLocaleDateString('fr-FR')
        }

        await SubscriptionNotificationService.sendSubscriptionActivationNotification(notificationData, userNotificationData)
      }

      // Log the notification event
      await SubscriptionNotificationService.logSubscriptionNotificationEvent(
        userData.userId,
        isTrial ? 'trial_started' : 'subscription_activated',
        subscriptionData,
        { success: true }
      )

      console.log('Registration subscription notification sent successfully')
      
    } catch (error) {
      console.error('Error sending registration subscription notification:', error)
      // Don't fail registration if notification fails
    }
  }

  /**
   * Resume incomplete registration
   * @param {string} userId - User ID
   */
  async resumeRegistration(userId) {
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Check if registration is already complete
      if (userData.registration_completed) {
        return { success: true, message: 'Registration already completed' }
      }

      // Get Stripe session data (you'll need to pass this from frontend)
      // This would come from the Stripe success page
      
      console.log('Resuming registration for user:', userId)
      return { success: true, userData }
      
    } catch (error) {
      console.error('Error resuming registration:', error)
      throw error
    }
  }
}

export default new RegistrationService()
