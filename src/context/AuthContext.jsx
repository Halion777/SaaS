import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as authService from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { sessionManager } from '../services/supabaseClient';

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Automatic login function
  const autoLogin = useCallback(async () => {
    try {
      // Clear potentially stale tokens before attempting to restore session
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Get current session directly from Supabase
      const { data, error } = await supabase.auth.getSession();

      if (data.session) {
        // Successfully restored session
        setSession(data.session);
        setUser(data.session.user);

        // Navigate to dashboard if on a public path
        const currentPath = location.pathname;
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        
        if (publicPaths.includes(currentPath)) {
          navigate('/dashboard');
        }

        return true;
      }

      // If no session, attempt to sign out to clear any lingering auth state
      await supabase.auth.signOut();
      
      return false;
    } catch (error) {
      console.error('Auto login error:', error);
      
      // Ensure complete logout in case of any session restoration issues
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error during forced sign out:', signOutError);
      }
      
      setUser(null);
      setSession(null);
      
      return false;
    }
  }, [location, navigate]);

  // Cross-tab authentication synchronization
  const syncAuthState = useCallback(async () => {
    const storedSession = localStorage.getItem('sb-access-token');
    const storedUser = localStorage.getItem('sb-user');

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
          localStorage.removeItem('sb-access-token');
          localStorage.removeItem('sb-refresh-token');
          localStorage.removeItem('sb-user');
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
  }, [autoLogin]);

  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await authService.signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // Explicitly set user and session
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Force navigation to dashboard
        navigate('/dashboard');
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
      // Use Supabase sign out method first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      // Use secure session manager to clear all auth data
      sessionManager.clearAllAuthData();
      
      // Clear local and cross-tab storage comprehensively
      const keysToRemove = [
        'sb-access-token', 
        'sb-refresh-token', 
        'sb-provider-token',
        'sb-user',
        'user_data',
        'registration_complete'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Fallback cleanup
      setUser(null);
      setSession(null);
      navigate('/login');
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
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for potential direct use
export default AuthContext; 