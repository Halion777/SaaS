import { supabase } from './supabaseClient';
import { sessionManager } from './supabaseClient';

/**
 * Check if user can register with given email
 * @param {string} email - User email
 * @returns {Promise<{data, error}>} Check result
 */
export async function checkUserRegistration(email) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-user-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: data };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error checking user registration:', error);
    return { data: null, error };
  }
}

/**
 * Sign in user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data, error}>} Authentication result
 */
export async function signIn(email, password) {
  try {
    // Clear any existing session data before login
    sessionManager.clearAllAuthData();

    // Perform login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return { data: null, error };
    }

    // Check if user has completed payment/registration
    if (data?.user) {
      try {
        // Check if user exists in public.users table (indicates completed registration)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, registration_completed')
          .eq('id', data.user.id)
          .single();

        if (userError || !userData) {
          // User doesn't exist in public.users table - registration incomplete
          console.log('User registration incomplete, blocking login');
          
          // Sign out the user immediately
          await supabase.auth.signOut();
          
          return { 
            data: null, 
            error: { 
              message: 'Registration incomplete. Please complete your payment to access your account.',
              code: 'registration_incomplete'
            } 
          };
        }

        if (!userData.registration_completed) {
          // User exists but registration not completed
          console.log('User registration not completed, blocking login');
          
          // Sign out the user immediately
          await supabase.auth.signOut();
          
          return { 
            data: null, 
            error: { 
              message: 'Registration incomplete. Please complete your payment to access your account.',
              code: 'registration_incomplete'
            } 
          };
        }

        // Registration is complete, proceed with login
        sessionStorage.setItem('user_email', data.user.email);
        sessionStorage.setItem('user_id', data.user.id);
        
        // Track the login immediately
        trackUserLogin(data.user.id);
        
      } catch (storageError) {
        console.error('Error checking user registration status:', storageError);
        return { data: null, error: storageError };
      }
    }

    return { data, error: null };
  } catch (unexpectedError) {
    console.error('Unexpected login error:', unexpectedError);
    return { data: null, error: unexpectedError };
  }
}

/**
 * Sign up user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} companyName - User's company name
 * @returns {Promise<{data, error}>} Registration result
 */
export async function signUp(email, password, fullName, companyName) {
  try {
    // Clear any existing session data before registration
    sessionManager.clearAllAuthData();

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName
        }
      }
    });

    if (error) {
      console.error('Registration error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (unexpectedError) {
    console.error('Unexpected registration error:', unexpectedError);
    return { data: null, error: unexpectedError };
  }
}

/**
 * Sign out user
 * @returns {Promise<{error}>} Logout result
 */
export async function signOut() {
  try {
    // Use session manager to clear all auth data
    sessionManager.clearAllAuthData();
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error };
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<{data, error}>} User data
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get current user error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (unexpectedError) {
    console.error('Unexpected get user error:', unexpectedError);
    return { data: null, error: unexpectedError };
  }
}

/**
 * Get current session
 * @returns {Promise<{data, error}>} Session data
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return { data: null, error };
    }

    return { data: data.session, error: null };
  } catch (unexpectedError) {
    console.error('Unexpected get session error:', unexpectedError);
    return { data: null, error: unexpectedError };
  }
}

/**
 * Check and refresh session
 * @returns {Promise<{session, user}>} Current session
 */
export async function checkAndRefreshSession() {
  try {
    // Attempt to get current session
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session check error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      
      // Attempt to sign out to clear any invalid session
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error during forced sign out:', signOutError);
      }
      
      return null;
    }

    // Return the session if it exists
    return data.session;
  } catch (unexpectedError) {
    console.error('Unexpected session check error:', unexpectedError);
    
    // Attempt to sign out to clear any invalid session
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Error during forced sign out:', signOutError);
    }
    
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
 * Get analytics objectives for the current user
 * @returns {Promise<{data, error}>} Objectives data or error
 */
export async function getAnalyticsObjectives() {
  try {
    const { data: user, error: userError } = await getCurrentUser();
    if (userError || !user) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
      .from('users')
      .select('analytics_objectives')
      .eq('id', user.id)
      .single();
    
    if (error) return { error };
    
    // Return default structure if null
    const objectives = data?.analytics_objectives || {
      revenueTarget: null,
      clientTarget: null,
      projectsTarget: null
    };
    
    return { data: objectives, error: null };
  } catch (error) {
    console.error('Error getting analytics objectives:', error);
    return { error };
  }
}

/**
 * Update analytics objectives for the current user
 * @param {Object} objectives - Objectives object { revenueTarget, clientTarget, projectsTarget }
 * @returns {Promise<{data, error}>} Supabase response
 */
export async function updateAnalyticsObjectives(objectives) {
  try {
    const { data: user, error: userError } = await getCurrentUser();
    if (userError || !user) return { error: { message: 'Not authenticated' } };
    
    if (!user.id) {
      return { error: { message: 'User ID not available' } };
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ analytics_objectives: objectives })
      .eq('id', user.id)
      .select('analytics_objectives')
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating analytics objectives:', error);
    return { error };
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<{data, error}>} Supabase response
 */
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Password reset request error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    return { data, error };
  } catch (error) {
    console.error('Unexpected error in resetPassword:', error);
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

    if (error) {
      console.error('Password update error:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    return { data, error };
  } catch (error) {
    console.error('Unexpected error in updatePassword:', error);
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
    console.log('=== COMPLETE REGISTRATION START ===');
    console.log('Form data:', formData);
    
    // Clear any existing session storage data first
    sessionStorage.removeItem('pendingRegistration');
    sessionStorage.removeItem('registration_complete');
    
    // Step 1: Create auth user (will fail if user already exists with completed registration)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          company_name: formData.companyName,
          vat_number: formData.vatNumber,
          phone: formData.phone,
          profession: formData.profession,
          country: formData.country,
          business_size: formData.businessSize,
          selected_plan: formData.selectedPlan
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { error: authError };
    }

    console.log('Auth user created:', authData.user.id);

    // Store registration data in sessionStorage for after payment
    const registrationData = {
      userId: authData.user.id,
      email: formData.email,
      fullName: formData.fullName,
      companyName: formData.companyName,
      vatNumber: formData.vatNumber,
      phone: formData.phone,
      profession: formData.profession,
      country: formData.country,
      businessSize: formData.businessSize,
      selectedPlan: formData.selectedPlan,
      registrationComplete: false // Will be set to true after payment
    };
    
    sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
    
    console.log('=== COMPLETE REGISTRATION END ===');
    console.log('Registration data stored for payment completion');
    
    return { data: authData, error: null };
  } catch (error) {
    console.error('Error in complete registration:', error);
    return { error };
  }
}

/**
 * Update user subscription data after successful payment
 * @param {string} userId - User ID
 * @param {object} userData - User data from registration
 * @returns {Promise<{data, error}>} Result
 */
export async function createUserAfterPayment(userId, userData) {
  try {
    

    // Step 1: Create user record in public.users table
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days

    const userRecord = {
      id: userId,
      email: userData.email,
      full_name: userData.fullName,
      company_name: userData.companyName,
      vat_number: userData.vatNumber,
      phone: userData.phone,
      profession: userData.profession,
      country: userData.country,
      business_size: userData.businessSize,
      selected_plan: userData.selectedPlan,
      subscription_status: 'active', // Changed from 'trial' to 'active' after payment
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      stripe_customer_id: null, // Will be updated by webhook
      stripe_subscription_id: null // Will be updated by webhook
    };

    console.log('Creating user record:', userRecord);

    const { data: userDataResult, error: userError } = await supabase
      .from('users')
      .upsert(userRecord, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record after payment:', userError);
      return { error: userError };
    }

    console.log('User record created successfully:', userDataResult);

    // Step 2: Create initial admin profile for the user
    try {
      console.log('Creating admin profile...');
      const multiUserService = (await import('./multiUserService')).default;
      await multiUserService.createInitialProfile(userId, {
        full_name: userData.fullName,
        company_name: userData.companyName,
        email: userData.email
      });
      console.log('Admin profile created successfully for user:', userId);
    } catch (profileError) {
      console.error('Error creating initial profile after payment:', profileError);
      // Don't fail the entire process if profile creation fails
    }

    // Step 3: Update registration data to mark as complete
    const updatedRegistrationData = {
      ...userData,
      userId: userId,
      registrationComplete: true
    };
    
    sessionStorage.setItem('pendingRegistration', JSON.stringify(updatedRegistrationData));

    return { data: userDataResult, error: null };
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
 * Track user login by updating last_login_at timestamp
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Update result
 */
export async function trackUserLogin(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error tracking user login:', error);
      return { data: null, error };
    }

    console.log('User login tracked successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error tracking login:', error);
    return { data: null, error };
  }
}

// Track if we've already processed a login for this session
let lastTrackedUserId = null;
let lastTrackedTime = null;

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function for auth state changes
 * @returns {Object} Subscription data
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    // Only track login on actual sign in events, not tab switches or token refreshes
    if (event === 'SIGNED_IN' && session?.user?.id) {
      const now = Date.now();
      const userId = session.user.id;
      
      // Only track if:
      // 1. This is a different user than last tracked
      // 2. OR it's been more than 5 minutes since last tracking for same user
      // 3. OR this is the first time tracking
      if (userId !== lastTrackedUserId || 
          !lastTrackedTime || 
          (now - lastTrackedTime) > 5 * 60 * 1000) { // 5 minutes
        
        trackUserLogin(userId);
        lastTrackedUserId = userId;
        lastTrackedTime = now;
      }
    }
    
    // Call provided callback
    callback(session, event);
  });
} 