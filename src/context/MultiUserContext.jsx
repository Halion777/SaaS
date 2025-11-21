import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import multiUserService from '../services/multiUserService';

const MultiUserContext = createContext();

export const useMultiUser = () => {
  const context = useContext(MultiUserContext);
  if (!context) {
    throw new Error('useMultiUser must be used within a MultiUserProvider');
  }
  return context;
};

export const MultiUserProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && !initialized) {
      initializeMultiUser();
    } else if (!user) {
      // Clear state when user is null
      setCurrentProfile(null);
      setCompanyProfiles([]);
      setIsPremium(false);
      setSubscriptionLimits({});
      setPermissions({});
      setUserProfile(null);
      setInitialized(false);
      setLoading(false);
    }
  }, [user, initialized]);

  // Initialize multi-user system
  const initializeMultiUser = useCallback(async () => {
    if (!user || initialized) return;
    
    setLoading(true);
    try {
      // Get user profile to check subscription status
      const userProfileData = await multiUserService.getUserProfile(user.id);
      setUserProfile(userProfileData);
      
      // Get subscription limits based on actual subscription
      const limits = await multiUserService.getSubscriptionLimits(user.id);
      setSubscriptionLimits(limits);
      
      // Check premium status based on subscription
      const isUserPremium = await multiUserService.isPremiumAccount(user.id);
      setIsPremium(isUserPremium);
      
      // Get all profiles for this user
      const profiles = await multiUserService.getProfiles(user.id);
      setCompanyProfiles(profiles);
      
      // Get the current active profile
      const currentProfile = await multiUserService.getCurrentProfile(user.id);
      
      if (currentProfile) {
        setCurrentProfile(currentProfile);
        setPermissions(currentProfile.permissions || {});
      } else {
        // No active profile - user needs to select one
        setCurrentProfile(null);
        setPermissions({});
      }
      
      setLoading(false);
      setInitialized(true);
    } catch (error) {
      console.error('Error initializing multi-user system:', error);
      setLoading(false);
      setInitialized(true);
    }
  }, [user, initialized]);

  // Switch to a different profile
  const switchToProfile = useCallback(async (profileId) => {
    if (!user) return;
    
    try {
      const newProfile = await multiUserService.switchProfile(user.id, profileId);
      
      setCurrentProfile(newProfile);
      setPermissions(newProfile.permissions || []);
      
      // Update the profiles list to reflect the new active state
      setCompanyProfiles(prevProfiles => 
        prevProfiles.map(profile => ({
          ...profile,
          is_active: profile.id === profileId
        }))
      );
      
      return newProfile;
    } catch (error) {
      console.error('Error switching profile:', error);
      throw error;
    }
  }, [user]);

  const addProfile = async (profileData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const newProfile = await multiUserService.addProfile(user.id, profileData);
      
      setCompanyProfiles(prev => {
        const updated = [...prev, newProfile];
        return updated;
      });
      
      return newProfile;
    } catch (error) {
      console.error('MultiUserContext: Error adding profile:', error);
      throw error;
    }
  };

  const updateProfile = async (profileId, profileData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updatedProfile = await multiUserService.updateProfile(user.id, profileId, profileData);
      setCompanyProfiles(prev => prev.map(profile => 
        profile.id === profileId ? updatedProfile : profile
      ));
      
      // Update current profile if it's the one being edited
      if (currentProfile?.id === profileId) {
        setCurrentProfile(updatedProfile);
        setPermissions(updatedProfile.permissions || {});
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await multiUserService.deleteProfile(user.id, profileId);
      setCompanyProfiles(prev => prev.filter(profile => profile.id !== profileId));
      
      // If current profile is deleted, switch to admin profile
      if (currentProfile?.id === profileId) {
        const adminProfile = companyProfiles.find(profile => profile.role === 'admin' && profile.id !== profileId);
        if (adminProfile) {
          await switchToProfile(adminProfile.id);
        }
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      return await multiUserService.uploadAvatar(user.id, file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const updateProfileAvatar = async (profileId, avatarUrl) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updatedProfile = await multiUserService.updateProfileAvatar(user.id, profileId, avatarUrl);
      setCompanyProfiles(prev => prev.map(profile => 
        profile.id === profileId ? updatedProfile : profile
      ));
      
      // Update current profile if it's the one being edited
      if (currentProfile?.id === profileId) {
        setCurrentProfile(updatedProfile);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile avatar:', error);
      throw error;
    }
  };

  const uploadAndUpdateAvatar = async (profileId, file) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Upload new avatar
      const avatarUrl = await multiUserService.uploadAvatar(user.id, file);
      
      // Update profile with new avatar (this will also delete the old one)
      const updatedProfile = await multiUserService.updateProfileAvatar(user.id, profileId, avatarUrl);
      
      // Update local state
      setCompanyProfiles(prev => prev.map(profile => 
        profile.id === profileId ? updatedProfile : profile
      ));
      
      // Update current profile if it's the one being edited
      if (currentProfile?.id === profileId) {
        setCurrentProfile(updatedProfile);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error uploading and updating avatar:', error);
      throw error;
    }
  };

  const getCompanyProfiles = async () => {
    if (!user) return [];
    
    try {
      const profiles = await multiUserService.getProfiles(user.id);
      setCompanyProfiles(profiles);
      return profiles;
    } catch (error) {
      console.error('Error getting company profiles:', error);
      return [];
    }
  };

  const hasPermission = (module, requiredPermission = 'view') => {
    if (!currentProfile) {
      return false;
    }

    // Special handling for Peppol - only available for business users
    if (module === 'peppolAccessPoint') {
      // Check if user is a business user (not solo/individual)
      const businessSizes = ['small', 'medium', 'large'];
      const isBusiness = businessSizes.includes(userProfile?.business_size);
      
      if (!isBusiness) {
        return false; // Individual users cannot access Peppol
      }
    }

    // Admin has all permissions
    if (currentProfile.role === 'admin') {
      return true;
    }

    // Handle both array and object formats for permissions
    let permissions = currentProfile.permissions;
    
    if (Array.isArray(permissions)) {
      // Array format (legacy) - simple check if module is in array
      // If module is in array, it means full_access
      return permissions.includes(module);
    } else if (typeof permissions === 'object' && permissions !== null) {
      // Object format (current) - check permission level
      const modulePermission = permissions[module];
      
      if (!modulePermission || modulePermission === 'no_access') {
        return false;
      }
      
      // If requiredPermission is 'view' or 'view_only', allow both view_only and full_access
      if (requiredPermission === 'view' || requiredPermission === 'view_only') {
        return modulePermission === 'view_only' || modulePermission === 'full_access';
      }
      
      // If requiredPermission is 'full_access', only allow full_access
      if (requiredPermission === 'full_access') {
        return modulePermission === 'full_access';
      }
      
      // Default: check if permission exists and is not 'no_access'
      return modulePermission !== 'no_access';
    }
    
    return false;
  };

  const getUserRole = () => {
    return currentProfile?.role || 'none';
  };

  const isAdmin = () => {
    return currentProfile?.role === 'admin';
  };

  const canManageUsers = () => {
    return hasPermission('clientManagement', 'full_access');
  };

  const canManageQuotes = () => {
    return hasPermission('quotesManagement', 'full_access');
  };

  const canManageInvoices = () => {
    return hasPermission('clientInvoices', 'full_access');
  };

  const canManageClients = () => {
    return hasPermission('clientManagement', 'full_access');
  };

  const canViewAnalytics = () => {
    return hasPermission('analytics', 'view_only');
  };

  const canManageSettings = () => {
    return hasPermission('dashboard', 'full_access');
  };

  const getProfileAvatar = (profile) => {
    if (profile?.avatar) {
      return profile.avatar;
    }
    
    // Generate initials from name
    if (profile?.name) {
      return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    return 'U';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      accountant: 'bg-green-500',
      sales: 'bg-purple-500',
      viewer: 'bg-gray-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      admin: 'Administrateur',
      manager: 'Gestionnaire',
      accountant: 'Comptable',
      sales: 'Commercial',
      viewer: 'Lecteur'
    };
    return roleMap[role] || 'Utilisateur';
  };

  const value = useMemo(() => ({
    // State
    currentProfile,
    companyProfiles,
    isPremium,
    subscriptionLimits,
    loading,
    permissions,
    userProfile,
    
    // Actions
    switchProfile: switchToProfile, // Renamed to avoid conflict with useState
    addProfile,
    updateProfile,
    deleteProfile,
    uploadAvatar,
    updateProfileAvatar,
    uploadAndUpdateAvatar,
    getCompanyProfiles,
    
    // Permission checks
    hasPermission,
    getUserRole,
    isAdmin,
    canManageUsers,
    canManageQuotes,
    canManageInvoices,
    canManageClients,
    canViewAnalytics,
    canManageSettings,
    
    // Utility functions
    getProfileAvatar,
    getRoleColor,
    getRoleLabel,
    
    // User info
    userId: user?.id
  }), [
    currentProfile,
    companyProfiles,
    isPremium,
    subscriptionLimits,
    loading,
    permissions,
    userProfile,
    switchToProfile, // Renamed to avoid conflict with useState
    addProfile,
    updateProfile,
    deleteProfile,
    uploadAvatar,
    updateProfileAvatar,
    uploadAndUpdateAvatar,
    getCompanyProfiles,
    hasPermission,
    getUserRole,
    isAdmin,
    canManageUsers,
    canManageQuotes,
    canManageInvoices,
    canManageClients,
    canViewAnalytics,
    canManageSettings,
    getProfileAvatar,
    getRoleColor,
    getRoleLabel,
    user?.id
  ]);

  return (
    <MultiUserContext.Provider value={value}>
      {children}
    </MultiUserContext.Provider>
  );
}; 