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
      // Check for existing session in localStorage
      const storedAccessToken = localStorage.getItem('sb-access-token');
      const storedRefreshToken = localStorage.getItem('sb-refresh-token');

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
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-user');
      
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