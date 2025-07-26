import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [permissions, setPermissions] = useState([]);

  // Mock company ID - in real app, this would come from auth context
  const companyId = 'artisan-pro-001';

  useEffect(() => {
    initializeMultiUser();
  }, []);

  const initializeMultiUser = async () => {
    try {
      setLoading(true);
      
      // Check if account is premium
      const premium = await multiUserService.isPremiumAccount(companyId);
      setIsPremium(premium);
      
      // Set mock premium for demo
      localStorage.setItem(`subscription-${companyId}`, 'premium');
      setIsPremium(true);
      
      // Get subscription limits
      const limits = await multiUserService.getSubscriptionLimits(companyId);
      setSubscriptionLimits(limits);
      
      // Get company profiles
      const profiles = await multiUserService.getCompanyProfiles(companyId);
      setCompanyProfiles(profiles);
      
      // Get current profile
      const current = await multiUserService.getCurrentProfile(companyId);
      setCurrentProfile(current);
      
      // Set permissions based on current profile
      if (current) {
        setPermissions(current.permissions || []);
      }
      
    } catch (error) {
      console.error('Error initializing multi-user context:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (profileId) => {
    try {
      console.log('MultiUserContext: Switching to profile:', profileId);
      console.log('MultiUserContext: Company ID:', companyId);
      
      const newProfile = await multiUserService.switchProfile(companyId, profileId);
      console.log('MultiUserContext: New profile received:', newProfile);
      
      setCurrentProfile(newProfile);
      setPermissions(newProfile.permissions || []);
      
      // Reload profiles to update active status
      const profiles = await multiUserService.getCompanyProfiles(companyId);
      console.log('MultiUserContext: Updated profiles:', profiles);
      setCompanyProfiles(profiles);
      
      return newProfile;
    } catch (error) {
      console.error('Error switching profile:', error);
      throw error;
    }
  };

  const addProfile = async (profileData) => {
    try {
      const newProfile = await multiUserService.addProfile(companyId, profileData);
      setCompanyProfiles(prev => [...prev, newProfile]);
      return newProfile;
    } catch (error) {
      console.error('Error adding profile:', error);
      throw error;
    }
  };

  const updateProfile = async (profileId, profileData) => {
    try {
      const updatedProfile = await multiUserService.updateProfile(companyId, profileId, profileData);
      setCompanyProfiles(prev => prev.map(profile => 
        profile.id === profileId ? updatedProfile : profile
      ));
      
      // Update current profile if it's the one being edited
      if (currentProfile?.id === profileId) {
        setCurrentProfile(updatedProfile);
        setPermissions(updatedProfile.permissions || []);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      await multiUserService.deleteProfile(companyId, profileId);
      setCompanyProfiles(prev => prev.filter(profile => profile.id !== profileId));
      
      // If current profile is deleted, switch to admin profile
      if (currentProfile?.id === profileId) {
        const adminProfile = companyProfiles.find(profile => profile.role === 'admin' && profile.id !== profileId);
        if (adminProfile) {
          await switchProfile(adminProfile.id);
        }
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!currentProfile) return false;
    
    // Admin has all permissions
    if (currentProfile.role === 'admin') return true;
    
    return permissions.includes(permission);
  };

  const getUserRole = () => {
    return currentProfile?.role || 'viewer';
  };

  const isAdmin = () => {
    return currentProfile?.role === 'admin';
  };

  const canManageUsers = () => {
    return hasPermission('users') || isAdmin();
  };

  const canManageQuotes = () => {
    return hasPermission('quotes') || isAdmin();
  };

  const canManageInvoices = () => {
    return hasPermission('invoices') || isAdmin();
  };

  const canManageClients = () => {
    return hasPermission('clients') || isAdmin();
  };

  const canViewAnalytics = () => {
    return hasPermission('analytics') || isAdmin();
  };

  const canManageSettings = () => {
    return hasPermission('settings') || isAdmin();
  };

  const getProfileAvatar = (profile) => {
    if (profile.avatar) {
      return profile.avatar;
    }
    
    // Generate initials from name
    return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const value = {
    // State
    currentProfile,
    companyProfiles,
    isPremium,
    subscriptionLimits,
    loading,
    permissions,
    
    // Actions
    switchProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    
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
    
    // Company info
    companyId
  };

  return (
    <MultiUserContext.Provider value={value}>
      {children}
    </MultiUserContext.Provider>
  );
}; 