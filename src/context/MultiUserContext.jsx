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
    
    try {
      // Get all profiles for this user
      const profiles = await multiUserService.getProfiles(user.id);
      
      setCompanyProfiles(profiles);
      
      // Get the current active profile
      const currentProfile = await multiUserService.getCurrentProfile(user.id);
      
      if (currentProfile) {
        setCurrentProfile(currentProfile);
        setPermissions(currentProfile.permissions || []);
        
        // Set premium status based on role or profile count
        const isUserPremium = currentProfile.role === 'admin' || profiles.length > 1;
        setIsPremium(isUserPremium);
        
        // Set subscription limits (reasonable defaults)
        setSubscriptionLimits({
          maxProfiles: 10,
          maxUsers: 50,
          maxStorage: '10GB'
        });
      } else {
        // No active profile - user needs to select one
        setCurrentProfile(null);
        setPermissions([]);
        
        // Set default values
        setIsPremium(false);
        setSubscriptionLimits({
          maxProfiles: 1,
          maxUsers: 1,
          maxStorage: '1GB'
        });
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error initializing multi-user system:', error);
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

  const inviteUser = async (email, role, permissions) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      return await multiUserService.inviteUser(user.id, email, role, permissions);
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  };

  const getPendingInvitations = async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      return await multiUserService.getPendingInvitations(user.id);
    } catch (error) {
      console.error('Error getting pending invitations:', error);
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

  const cancelInvitation = async (invitationId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      return await multiUserService.cancelInvitation(user.id, invitationId);
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  };

  const hasPermission = (module, requiredPermission = 'view') => {
    if (!currentProfile) {
      return false;
    }

    // Admin has all permissions
    if (currentProfile.role === 'admin') {
      return true;
    }

    // Handle both array and object formats for permissions
    let permissions = currentProfile.permissions;
    
    if (Array.isArray(permissions)) {
      // Array format (from database) - simple check if module is in array
      return permissions.includes(module);
    } else if (typeof permissions === 'object' && permissions !== null) {
      // Object format (fallback for old data)
      const modulePermission = permissions[module];
      if (modulePermission) {
        return modulePermission !== 'none';
      }
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
    return hasPermission('users', 'invite');
  };

  const canManageQuotes = () => {
    return hasPermission('quotes', 'approve');
  };

  const canManageInvoices = () => {
    return hasPermission('invoices', 'approve');
  };

  const canManageClients = () => {
    return hasPermission('clients', 'delete');
  };

  const canViewAnalytics = () => {
    return hasPermission('analytics', 'full');
  };

  const canManageSettings = () => {
    return hasPermission('settings', 'full');
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
    inviteUser,
    getPendingInvitations,
    getCompanyProfiles,
    cancelInvitation,
    
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
    inviteUser,
    getPendingInvitations,
    getCompanyProfiles,
    cancelInvitation,
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