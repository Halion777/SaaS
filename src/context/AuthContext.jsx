import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    async function loadUserSession() {
      setLoading(true);
      
      // Check for existing session
      const currentSession = await authService.getSession();
      setSession(currentSession);
      
      // Get user data if session exists
      if (currentSession) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
      
      setLoading(false);
    }
    
    loadUserSession();
    
    // Set up auth state listener
    const { data: authListener } = authService.onAuthStateChange((session, event) => {
      setSession(session);
      setUser(session?.user || null);
      
      // Handle auth events
      switch(event) {
        case 'SIGNED_IN':
          // User signed in
          break;
        case 'SIGNED_OUT':
          navigate('/login');
          break;
        case 'TOKEN_REFRESHED':
          // Token was refreshed
          break;
        case 'USER_UPDATED':
          // User data was updated
          break;
        default:
          // Other events
          break;
      }
    });
    
    // Cleanup subscription
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);
  
  // Sign in function
  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await authService.signIn(email, password);
    setLoading(false);
    
    if (error) return { error };
    
    // Set user and session
    setUser(data?.user || null);
    setSession(data?.session || null);
    
    // Redirect to dashboard
    if (data?.user) navigate('/dashboard');
    
    return { data };
  };
  
  // Sign up function
  const register = async (email, password, fullName, companyName) => {
    setLoading(true);
    const { data, error } = await authService.signUp(email, password, fullName, companyName);
    setLoading(false);
    
    if (error) return { error };
    
    // If email confirmation is required
    if (data?.user?.identities?.length === 0) {
      return { 
        data, 
        message: 'Please check your email for confirmation link' 
      };
    }
    
    // Set user and session
    setUser(data?.user || null);
    setSession(data?.session || null);
    
    // Redirect to dashboard if auto-confirmed
    if (data?.session) navigate('/dashboard');
    
    return { data };
  };
  
  // Sign out function
  const logout = async () => {
    setLoading(true);
    const { error } = await authService.signOut();
    setLoading(false);
    
    if (error) return { error };
    
    // Clear user and session
    setUser(null);
    setSession(null);
    
    // Redirect to login
    navigate('/login');
    
    return { success: true };
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 