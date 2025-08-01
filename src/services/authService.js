import { supabase } from './supabaseClient';

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} companyName - User's company name
 * @returns {Promise<{data, error}>} Supabase auth response
 */
export async function signUp(email, password, fullName, companyName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName
        }
      }
    });

    // Don't create user record immediately - it will be created after payment
    // The user record will be created in the completeRegistration function
    // or after successful Stripe payment

    return { data, error };
  } catch (error) {
    console.error('Error signing up:', error);
    return { error };
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data, error}>} Supabase auth response
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  } catch (error) {
    console.error('Error signing in:', error);
    return { error };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error}>} Error if any
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current user
 * @returns {Promise<User|null>} User object if authenticated, null otherwise
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get the current user's session
 * @returns {Promise<Session|null>} Session object if authenticated, null otherwise
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return data?.session || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if the current session is valid and refresh if needed
 * @returns {Promise<Session|null>} Valid session or null
 */
export async function checkAndRefreshSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    const session = data?.session;
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired or about to expire (within 5 minutes)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && (expiresAt - now) < fiveMinutes) {
      console.log('Session expiring soon, refreshing...');
      
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      
      return refreshData?.session || null;
    }
    
    return session;
  } catch (error) {
    console.error('Error checking/refreshing session:', error);
    return null;
  }
}

/**
 * Update the current user's profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<{data, error}>} Supabase response
 */
export async function updateProfile(profileData) {
  try {
    // First get current user
    const user = await getCurrentUser();
    if (!user) return { error: { message: 'Not authenticated' } };
    
    // Update auth metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: profileData
    });
    
    if (metadataError) return { error: metadataError };
    
    // Update profile in users table
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();
      
    return { data, error };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error };
  }
}

/**
 * Send a password reset email
 * @param {string} email - Email to send reset link to
 * @returns {Promise<{data, error}>} Supabase response
 */
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    return { data, error };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error };
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{data, error}>} Supabase response
 */
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error };
  }
}

/**
 * Complete user registration with all form data
 * @param {Object} formData - Complete registration form data
 * @returns {Promise<{data, error}>} Supabase auth response
 */
export async function completeRegistration(formData) {
  try {
    // Step 1: Create auth user (this is required for Supabase auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          company_name: formData.companyName,
          phone: formData.phone,
          profession: formData.profession,
          country: formData.country,
          business_size: formData.businessSize,
          selected_plan: formData.selectedPlan
        }
      }
    });

    if (authError) {
      return { error: authError };
    }

    // Step 2: Store registration data temporarily (don't create user record yet)
    // The user record will be created after successful payment
    if (authData?.user) {
      // Store registration data in sessionStorage for after payment
      const registrationData = {
        userId: authData.user.id,
        email: formData.email,
        fullName: formData.fullName,
        companyName: formData.companyName,
        phone: formData.phone,
        profession: formData.profession,
        country: formData.country,
        businessSize: formData.businessSize,
        selectedPlan: formData.selectedPlan,
        registrationComplete: true
      };
      
      sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Error in complete registration:', error);
    return { error };
  }
}

/**
 * Create user record after successful payment
 * @param {string} userId - User ID
 * @param {object} userData - User data from registration
 * @returns {Promise<{data, error}>} Result
 */
export async function createUserAfterPayment(userId, userData) {
  try {
    // Calculate trial end date (14 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days

    const userRecord = {
      id: userId,
      email: userData.email,
      full_name: userData.fullName,
      company_name: userData.companyName,
      phone: userData.phone,
      profession: userData.profession,
      country: userData.country,
      business_size: userData.businessSize,
      selected_plan: userData.selectedPlan,
      subscription_status: 'trial',
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      stripe_customer_id: null, // Will be updated by webhook
      stripe_subscription_id: null // Will be updated by webhook
    }

    const { data, error } = await supabase
      .from('users')
      .insert(userRecord)
      .select()
      .single()

    if (error) {
      console.error('Error creating user after payment:', error);
      return { error };
    }

    // Clear the pending registration data
    sessionStorage.removeItem('pendingRegistration');
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user after payment:', error);
    return { error };
  }
}

/**
 * Check if user is in trial period
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Trial status
 */
export async function checkTrialStatus(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('trial_start_date, trial_end_date, subscription_status')
      .eq('id', userId)
      .single();

    if (error) return { error };

    if (data.subscription_status === 'trial') {
      const now = new Date();
      const trialEnd = new Date(data.trial_end_date);
      
      if (now > trialEnd) {
        // Trial expired, update status
        await supabase
          .from('users')
          .update({ subscription_status: 'expired' })
          .eq('id', userId);
        
        return { data: { isTrialActive: false, trialExpired: true } };
      }
      
      return { data: { isTrialActive: true, trialExpired: false } };
    }

    return { data: { isTrialActive: false, trialExpired: false } };
  } catch (error) {
    console.error('Error checking trial status:', error);
    return { error };
  }
}

/**
 * Set up an auth state change listener
 * @param {function} callback - Function to call on auth state change
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });
} 