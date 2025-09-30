// src/services/registrationService.js

import { supabase } from '../lib/supabase'

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
