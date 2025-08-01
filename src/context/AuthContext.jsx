import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    async function loadUserSession() {
      setLoading(true);
      
      try {
        // Check for existing session and refresh if needed
        const currentSession = await authService.checkAndRefreshSession();
        setSession(currentSession);
        
        // Get user data if session exists and is valid
        if (currentSession && currentSession.access_token) {
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            
            // If we have a valid session and user, redirect to dashboard if on login/register pages
            if (userData && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
              navigate('/dashboard');
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            // If there's an error getting user data, clear the session
            setSession(null);
            setUser(null);
          }
        } else {
          // No valid session, clear user data
          setUser(null);
        }
        
        // Check if user just completed registration and returned from Stripe
        const registrationComplete = sessionStorage.getItem('registration_complete');
        
        if (registrationComplete === 'true' && currentSession?.user) {
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
      
      // Handle auth events
      switch(event) {
        case 'SIGNED_IN':
          // Check if this is a post-registration sign in
          const registrationComplete = sessionStorage.getItem('registration_complete');
          
          if (registrationComplete === 'true' && session?.user) {
            // Clear the registration flag
            sessionStorage.removeItem('registration_complete');
            
            // Redirect to dashboard
            navigate('/dashboard');
          } else {
            // Regular sign in, redirect to dashboard
            navigate('/dashboard');
          }
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