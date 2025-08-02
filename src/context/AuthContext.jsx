import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as authService from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { sessionManager } from '../services/supabaseClient';

// Create a custom storage manager for auth synchronization
const authSyncStorage = {
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    // Dispatch a custom event to notify other tabs
    window.dispatchEvent(new Event('auth-storage-change'));
  },
  getItem: (key) => localStorage.getItem(key),
  removeItem: (key) => {
    localStorage.removeItem(key);
    // Dispatch a custom event to notify other tabs
    window.dispatchEvent(new Event('auth-storage-change'));
  }
};

// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Automatic login function
  const autoLogin = useCallback(async () => {
    try {
      // Check for existing session in localStorage
      const storedAccessToken = authSyncStorage.getItem('sb-access-token');
      const storedRefreshToken = authSyncStorage.getItem('sb-refresh-token');

      if (storedAccessToken && storedRefreshToken) {
        // Attempt to set the session using stored tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: storedAccessToken,
          refresh_token: storedRefreshToken
        });

        if (data.session) {
          // Successfully restored session
          setSession(data.session);
          setUser(data.session.user);

          // Sync to storage for cross-tab communication
          authSyncStorage.setItem('sb-access-token', data.session.access_token);
          authSyncStorage.setItem('sb-refresh-token', data.session.refresh_token);
          authSyncStorage.setItem('sb-user', JSON.stringify(data.session.user));

          // Navigate to dashboard if on a public path
          const currentPath = location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
          
          if (publicPaths.includes(currentPath)) {
            navigate('/dashboard');
          }

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Auto login error:', error);
      return false;
    }
  }, [location, navigate]);

  // Cross-tab authentication synchronization
  const syncAuthState = useCallback(async () => {
    const storedSession = authSyncStorage.getItem('sb-access-token');
    const storedUser = authSyncStorage.getItem('sb-user');

    if (storedSession && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Validate the session with Supabase
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setUser(parsedUser);
          setSession(data.session);
        } else {
          setUser(null);
          setSession(null);
          authSyncStorage.removeItem('sb-access-token');
          authSyncStorage.removeItem('sb-refresh-token');
          authSyncStorage.removeItem('sb-user');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        setUser(null);
        setSession(null);
      }
    } else {
      setUser(null);
      setSession(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    async function loadUserSession() {
      setLoading(true);
      
      try {
        // First, try auto login
        const autoLoginSuccess = await autoLogin();
        
        if (!autoLoginSuccess) {
          // If auto login fails, proceed with normal session check
          const currentSession = await authService.checkAndRefreshSession();
          setSession(currentSession);
          
          // Get user data if session exists and is valid
          if (currentSession && currentSession.access_token) {
            try {
              const userData = await authService.getCurrentUser();
              setUser(userData);
              
              // Sync to storage for cross-tab communication
              if (userData) {
                authSyncStorage.setItem('sb-access-token', currentSession.access_token);
                authSyncStorage.setItem('sb-user', JSON.stringify(userData));
              }
            } catch (error) {
              console.error('Error getting user data:', error);
              setSession(null);
              setUser(null);
              authSyncStorage.removeItem('sb-access-token');
              authSyncStorage.removeItem('sb-user');
            }
          }
        }
        
        // Check if user just completed registration and returned from Stripe
        const registrationComplete = sessionStorage.getItem('registration_complete');
        
        if (registrationComplete === 'true' && (session?.user || user)) {
          // Clear the registration flag
          sessionStorage.removeItem('registration_complete');
          
          // Redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserSession();
    
    // Set up auth state listener
    const { data: authListener } = authService.onAuthStateChange((session, event) => {
      setSession(session);
      setUser(session?.user || null);
      
      // Sync to storage for cross-tab communication
      if (session?.user) {
        authSyncStorage.setItem('sb-access-token', session.access_token);
        authSyncStorage.setItem('sb-refresh-token', session.refresh_token);
        authSyncStorage.setItem('sb-user', JSON.stringify(session.user));
      } else {
        authSyncStorage.removeItem('sb-access-token');
        authSyncStorage.removeItem('sb-refresh-token');
        authSyncStorage.removeItem('sb-user');
      }
      
      // Handle auth events
      switch(event) {
        case 'SIGNED_IN':
          // Check if this is a post-registration sign in
          const registrationComplete = sessionStorage.getItem('registration_complete');
          
          if (registrationComplete === 'true' && session?.user) {
            // Don't redirect yet - let the Stripe success page handle it
            return;
          }

          // Precise navigation for sign-in
          const currentPath = location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
          
          if (currentPath === '/login') {
            navigate('/dashboard');
          } else if (currentPath === '/reset-password') {
            // Stay on reset password page if authenticated
            return;
          } else if (publicPaths.includes(currentPath)) {
            navigate('/dashboard');
          }
          break;
        
        case 'SIGNED_OUT':
          navigate('/login');
          break;
        
        default:
          break;
      }
    });
    
    // Listen for storage changes in other tabs
    window.addEventListener('auth-storage-change', syncAuthState);
    window.addEventListener('storage', (e) => {
      if (e.key === 'sb-access-token' || e.key === 'sb-user') {
        syncAuthState();
      }
    });
    
    // Cleanup subscription
    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('auth-storage-change', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, [navigate, location, syncAuthState, autoLogin]);

  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await authService.signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Use secure session manager to clear all auth data
      sessionManager.clearAllAuthData();
      
      // Clear local and cross-tab storage
      authSyncStorage.removeItem('sb-access-token');
      authSyncStorage.removeItem('sb-user');
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sign up function
  const register = async (email, password, fullName, companyName) => {
    setLoading(true);
    const { data, error } = await authService.signUp(email, password, fullName, companyName);
    setLoading(false);
    
    if (error) return { error };
    
    // Set user and session
    setUser(data?.user || null);
    setSession(data?.session || null);
    
    // Don't redirect to dashboard - let the registration flow handle it
    // The user will be redirected to Stripe checkout, then to dashboard after payment
    
    return { data };
  };
  
  // Update user profile
  const updateUserProfile = async (profileData) => {
    setLoading(true);
    const { data, error } = await authService.updateProfile(profileData);
    setLoading(false);
    
    if (error) return { error };
    
    // Update local user data
    setUser(prevUser => ({
      ...prevUser,
      ...profileData
    }));
    
    return { data };
  };
  
  // Password reset
  const sendPasswordReset = async (email) => {
    setLoading(true);
    const { data, error } = await authService.resetPassword(email);
    setLoading(false);
    
    return { data, error };
  };
  
  // Auth context value
  const value = {
    user,
    session,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    sendPasswordReset,
    isAuthenticated: !!user && !!session
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export for backwards compatibility
export default {
  AuthContext,
  AuthProvider,
  useAuth
}; 