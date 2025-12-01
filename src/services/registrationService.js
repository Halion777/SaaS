// src/services/registrationService.js

import { supabase } from './supabaseClient';
import SubscriptionNotificationService from './subscriptionNotificationService';
import { COUNTRY_CODES } from '../utils/countryCodes';

// Helper function to convert country code to country name
const getCountryName = (countryCode) => {
  if (!countryCode) return 'Belgium'; // Default
  const country = COUNTRY_CODES.find(c => c.code === countryCode.toUpperCase());
  return country ? country.name : countryCode; // Fallback to code if not found
};


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
      
      // 6. Send welcome registration email
      await this.sendWelcomeRegistrationEmail(sessionData, userData, subscriptionId)
      
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
    const isTrial = sessionData.subscription_status === 'trialing'
    
    // Use upsert to create the record if it doesn't exist, or update if it does
    const userRecord = {
      id: userData.userId,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      company_name: userData.companyName,
      vat_number: userData.vatNumber,
      phone: userData.phone,
      profession: userData.profession,
      country: userData.country,
      business_size: userData.businessSize,
      selected_plan: userData.selectedPlan,
      subscription_status: subscriptionStatus,
      stripe_subscription_id: sessionData.subscription,
      stripe_customer_id: sessionData.customer,
      trial_start_date: sessionData.trial_start ? new Date(sessionData.trial_start * 1000).toISOString() : null,
      trial_end_date: sessionData.trial_end ? new Date(sessionData.trial_end * 1000).toISOString() : null,
      registration_completed: true,
      has_used_trial: isTrial // Mark that user has used their free trial
    }

    const { error } = await supabase
      .from('users')
      .upsert(userRecord, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error creating/updating user record:', error)
      throw error
    }
    
    console.log('User record created/updated successfully')
  }

  /**
   * Create user profile for multi-user system
   */
  async createUserProfile(sessionData, userData) {
    // Check if user profile already exists (idempotency)
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userData.userId)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing user profile:', checkError)
      // Continue anyway
    }
    
    if (existingProfile) {
      console.log('User profile already exists, skipping creation:', existingProfile.id)
      // Create company profile if company information is provided (using existing profile)
      if (userData.companyName && userData.companyAddress && userData.companyCity) {
        await this.createCompanyProfile(userData, existingProfile.id)
      }
      return
    }

    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userData.userId,
        name: `${userData.firstName} ${userData.lastName}`,
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
      .select('id')
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
    
    console.log('User profile created successfully:', newProfile.id)

    // Create company profile if company information is provided
    if (userData.companyName && userData.companyAddress && userData.companyCity) {
      await this.createCompanyProfile(userData, newProfile.id)
    }
  }

  /**
   * Create company profile during registration
   */
  async createCompanyProfile(userData, profileId) {
    try {
      // Check if company profile already exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', userData.userId)
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing company profile:', checkError)
        // Continue anyway
      }
      
      if (existingCompany) {
        console.log('Company profile already exists, skipping creation:', existingCompany.id)
        return
      }

      const companyProfile = {
        user_id: userData.userId,
        profile_id: profileId || null,
        company_name: userData.companyName,
        vat_number: userData.vatNumber || null,
        address: userData.companyAddress || null,
        city: userData.companyCity || null,
        postal_code: userData.companyPostalCode || null,
        state: userData.companyState || null,
        country: getCountryName(userData.country || 'BE'), // Convert country code to country name
        phone: userData.phone || null, // Use phone from Step 1
        email: userData.email || null, // Use email from Step 1
        website: userData.companyWebsite || null,
        iban: userData.companyIban || null,
        account_name: userData.companyAccountName || null,
        bank_name: userData.companyBankName || null,
        is_default: true // Set as default company profile
      }

      const { error } = await supabase
        .from('company_profiles')
        .insert(companyProfile)

      if (error) {
        console.error('Error creating company profile:', error)
        // Don't throw - company profile is not critical for registration
        return
      }
      
      console.log('Company profile created successfully')
    } catch (error) {
      console.error('Error in createCompanyProfile:', error)
      // Don't throw - company profile is not critical for registration
    }
  }

  /**
   * Create subscription record
   */
  async createSubscriptionRecord(sessionData, userData) {
    // Check if subscription already exists for this user (idempotency)
    const { data: existingSub, error: checkError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('user_id', userData.userId)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing subscription:', checkError)
      // Continue anyway - better to try creating than to fail
    }
    
    if (existingSub) {
      console.log('Subscription already exists for user, returning existing ID:', existingSub.id)
      return existingSub.id
    }
    
    // Determine subscription status based on trial period
    const subscriptionStatus = sessionData.subscription_status === 'trialing' ? 'trial' : 'active'
    
    // Map plan type to display name
    const planDisplayName = userData.selectedPlan === 'pro' ? 'Pro Plan' : 
                           userData.selectedPlan === 'starter' ? 'Starter Plan' : 
                           userData.selectedPlan;
    
    const subscriptionRecord = {
      user_id: userData.userId,
      stripe_subscription_id: sessionData.subscription,
      stripe_customer_id: sessionData.customer,
      plan_name: planDisplayName,
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
      // Handle duplicate key error gracefully (shouldn't happen with NULL, but just in case)
      if (error.code === '23505') {
        console.log('Duplicate key detected, fetching existing subscription for this user')
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userData.userId)
          .maybeSingle()
        
        if (existing) {
          console.log('Found existing subscription, returning ID:', existing.id)
          return existing.id
        }
      }
      
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
    console.log('Creating payment record for subscription:', subscriptionId)
    
    // Check if payment record already exists (idempotency)
    const { data: existingPayment, error: checkError } = await supabase
      .from('payment_records')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .eq('user_id', userData.userId)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing payment record:', checkError)
      // Continue anyway
    }
    
    if (existingPayment) {
      console.log('Payment record already exists, skipping creation:', existingPayment.id)
      return
    }
    
    const paymentRecord = {
      subscription_id: subscriptionId,
      user_id: userData.userId,
      stripe_payment_intent_id: sessionData.payment_intent || null,
      stripe_invoice_id: sessionData.invoice || null,
      amount: sessionData.amount_total ? (sessionData.amount_total / 100) : 0, // Convert from cents, default to 0
      currency: sessionData.currency?.toUpperCase() || 'EUR',
      status: sessionData.payment_status === 'paid' ? 'succeeded' : 'pending',
      payment_method: 'card',
      description: `${userData.selectedPlan} plan subscription - Trial period`,
      paid_at: sessionData.payment_status === 'paid' ? new Date().toISOString() : null
    }

    console.log('Payment record to insert:', {
      subscription_id: paymentRecord.subscription_id,
      user_id: paymentRecord.user_id,
      amount: paymentRecord.amount,
      status: paymentRecord.status,
      currency: paymentRecord.currency
    })

    const { data: insertedData, error } = await supabase
      .from('payment_records')
      .insert(paymentRecord)
      .select()

    if (error) {
      console.error('Error creating payment record:', error)
      console.error('Payment record that failed:', paymentRecord)
      throw error
    }
    
    console.log('Payment record created successfully:', insertedData)
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
        first_name: userData.firstName,
        last_name: userData.lastName,
        first_name: userData.firstName,
        last_name: userData.lastName,
        full_name: `${userData.firstName} ${userData.lastName}`
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
   * Send welcome registration email with PIN information
   */
  async sendWelcomeRegistrationEmail(sessionData, userData, subscriptionId) {
    try {
      // Get the created subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (subscriptionError || !subscriptionData) {
        console.error('Error fetching subscription data for welcome email:', subscriptionError)
        return // Don't fail registration if email fails
      }

      // Get user's language preference
      let userLanguage = 'fr'
      try {
        const { data: userRecord } = await supabase
          .from('users')
          .select('language_preference')
          .eq('id', userData.userId)
          .maybeSingle()
        
        if (userRecord?.language_preference) {
          userLanguage = userRecord.language_preference.split('-')[0] || 'fr'
        }
      } catch (error) {
        console.warn('Error fetching user language preference:', error)
      }

      // Prepare email data
      const welcomeEmailData = {
        emailType: 'welcome_registration',
        emailData: {
          user_email: userData.email,
          user_id: userData.userId,
          language: userLanguage,
          variables: {
            user_name: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
            user_email: userData.email,
            plan_name: subscriptionData.plan_name || '',
            amount: `${subscriptionData.amount}€`,
            billing_interval: subscriptionData.interval === 'year' ? 'annuel' : subscriptionData.interval === 'month' ? 'mensuel' : subscriptionData.interval || 'mensuel',
            account_settings_url: typeof window !== 'undefined' ? `${window.location.origin}/settings` : 'https://haliqo.com/settings',
            company_name: 'Haliqo'
          }
        }
      }

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-emails', {
        body: welcomeEmailData
      })

      if (error) {
        console.error('Error sending welcome registration email:', error)
        return // Don't fail registration if email fails
      }

      if (!data || !data.success) {
        console.error('Welcome registration email failed:', data?.error || 'Unknown error')
        return // Don't fail registration if email fails
      }

      console.log('Welcome registration email sent successfully')
      
    } catch (error) {
      console.error('Error sending welcome registration email:', error)
      // Don't fail registration if email fails
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
