import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const [isProfileSelected, setIsProfileSelected] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    targetProfileId: null,
    targetProfileName: '',
    action: null // 'switch', 'edit', 'delete'
  });

  const navigate = useNavigate();
  const location = useLocation();
  const authListenerRef = useRef(null);
  const autoLoginRef = useRef(false);

  // Auto login function with profile selection
  const autoLogin = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return false;
      }
      
      if (data.session) {
        setUser(data.session.user);
        setSession(data.session);
        
        // Check if user has multiple profiles
        try {
          const multiUserService = (await import('../services/multiUserService')).default;
          
          // Get the current active profile from database
          const currentProfile = await multiUserService.getCurrentProfile(data.session.user.id);
          
          if (currentProfile) {
            // User has an active profile, no need for selection
            setIsProfileSelected(true);
            return true;
          } else {
            // No active profile - check if user has profiles that need selection
            const profiles = await multiUserService.getProfiles(data.session.user.id);
            
            if (profiles.length > 1) {
              // Multiple profiles exist but none are active - show selection
              setShowProfileSelection(true);
              setIsProfileSelected(false);
              return true;
            } else if (profiles.length === 1) {
              // Only one profile - it should have been auto-activated by getCurrentProfile
              // If we're here, something went wrong, so let's try to activate it
              try {
                await multiUserService.switchProfile(data.session.user.id, profiles[0].id);
                setIsProfileSelected(true);
                return true;
              } catch (switchError) {
                console.error('Error auto-activating single profile:', switchError);
                setShowProfileSelection(true);
                setIsProfileSelected(false);
                return true;
              }
            } else {
              // No profiles exist - this is normal for new users
              setIsProfileSelected(false);
              return true;
            }
          }
        } catch (profileError) {
          console.error('Error checking profiles during auto-login:', profileError);
          setIsProfileSelected(false);
          return true;
        }
      }

      // If no session, clear any lingering auth state
      setUser(null);
      setSession(null);
      setIsProfileSelected(false);
      
      return false;
    } catch (error) {
      console.error('Auto login error:', error);
      
      setUser(null);
      setSession(null);
      setIsProfileSelected(false);
      
      return false;
    }
  }, [isProfileSelected]);

  // Simple role-based redirect function
  const redirectBasedOnRole = async (userId) => {
    try {
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!roleError && userData?.role) {
        const currentPath = window.location.pathname;
        
        if (userData.role === 'superadmin' && !currentPath.startsWith('/admin/super')) {
          navigate('/admin/super/dashboard');
        } else if (userData.role === 'admin' && currentPath.startsWith('/admin/super')) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    // Prevent multiple listeners
    if (authListenerRef.current) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setSession(session);
          // Redirect based on role after sign in
          if (session.user) {
            redirectBasedOnRole(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsProfileSelected(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setUser(prevUser => {
            if (prevUser?.id !== session.user?.id) {
              return session.user;
            }
            return prevUser;
          });
          setSession(session);
        }
      }
    );

    authListenerRef.current = subscription;

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    async function loadUserSession() {
      if (!isMounted || autoLoginRef.current) return;
      
      autoLoginRef.current = true;
      setLoading(true);
      
      try {
        const autoLoginSuccess = await autoLogin();
        
        if (!autoLoginSuccess && isMounted) {
          const currentSession = await authService.checkAndRefreshSession();
          if (isMounted) {
            setSession(currentSession);
          }
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadUserSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (user && isProfileSelected && !loading) {
      const currentPath = location.pathname;
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      
      if (publicPaths.includes(currentPath)) {
        // Redirect based on role instead of always going to dashboard
        redirectBasedOnRole(user.id);
      }
    }
  }, [user, isProfileSelected, loading, location.pathname]);

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
        
        // Check if user has multiple profiles
        try {
          const multiUserService = (await import('../services/multiUserService')).default;
          const profiles = await multiUserService.getCompanyProfiles(data.user.id);
          
          // Redirect based on role
          redirectBasedOnRole(data.user.id);

          if (profiles.length > 1 && !isProfileSelected) {
            // Multiple profiles exist and no profile is selected yet, show profile selection
            // All profiles will require PIN (including admin)
            setShowProfileSelection(true);
            setIsProfileSelected(false);
          } else if (profiles.length === 1 && !isProfileSelected) {
            // Only one profile and no profile is selected yet, auto-select it (no PIN required)
            const profile = profiles[0];
            await multiUserService.switchProfile(data.user.id, profile.id);
            setIsProfileSelected(true);
            
            // Force navigation to dashboard
            navigate('/dashboard');
          } else if (profiles.length === 0) {
            // No profiles exist, this is normal for workers
            setIsProfileSelected(false);
            navigate('/dashboard');
          } else {
            // Profile is already selected, navigate to dashboard
            navigate('/dashboard');
          }
        } catch (profileError) {
          console.error('Error checking profiles during login:', profileError);
          setIsProfileSelected(false);
          navigate('/dashboard');
        }
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
      
      // Clear profile selection data from sessionStorage
      if (user) {
        sessionStorage.removeItem(`current-profile-id-${user.id}`);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setShowProfileSelection(false);
      setIsProfileSelected(false);
      
      // Navigate to login page
      navigate('/login');
      
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error };
    }
  };

  // Register new user
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

  // Handle profile selection
  const handleProfileSelect = async (profile) => {
    try {
      console.log('Profile selected in AuthContext:', profile);
      
      // The profile switching is now handled by the ProfileSelectionModal
      // which calls switchToProfile from MultiUserContext
      
      setShowProfileSelection(false);
      setIsProfileSelected(true);
      
      // Redirect based on role
      redirectBasedOnRole(user.id);
    } catch (error) {
      console.error('Error selecting profile:', error);
    }
  };

  // Close profile selection
  const closeProfileSelection = () => {
    setShowProfileSelection(false);
    // If user closes profile selection, log them out
    logout();
  };

  // Auth context value
  const value = useMemo(() => ({
    user,
    session,
    loading,
    showProfileSelection,
    isProfileSelected,
    login,
    register,
    logout,
    updateUserProfile,
    sendPasswordReset,
    handleProfileSelect,
    closeProfileSelection,
    isAuthenticated: !!user && !!session
  }), [user, session, loading, showProfileSelection, isProfileSelected, login, register, logout, updateUserProfile, sendPasswordReset, handleProfileSelect, closeProfileSelection]);
  
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