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

    // If successful and no error, insert user record to our users table
    if (data?.user && !error) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          company_name: companyName
        });

      if (profileError) console.error('Error creating user profile:', profileError);
    }

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
 * Get the current authenticated user
 * @returns {Promise<User|null>} User object if authenticated, null otherwise
 */
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
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
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch (error) {
    console.error('Error getting session:', error);
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
 * Set up an auth state change listener
 * @param {function} callback - Function to call on auth state change
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });
} 