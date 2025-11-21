import { supabase } from './supabaseClient';

// Multi-User Profile Management Service
class MultiUserService {
  constructor() {
    this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_API_URL) || '/api';
  }

  // Get current user from auth
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Get user profile from users table
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get all profiles for the current company (user_id)
  async getCompanyProfiles(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      
      throw error;
    }
  }

  // Add a new profile
  async addProfile(userId, profileData) {
    try {
      // Store permissions as object format for better granular control
      let permissionsToStore = {};
      
      if (profileData.permissions) {
        if (Array.isArray(profileData.permissions)) {
          // Convert array format to object format
          const moduleKeys = [
            'dashboard', 'analytics', 'peppolAccessPoint', 'leadsManagement',
            'quoteCreation', 'quotesManagement', 'quotesFollowUp', 'invoicesFollowUp',
            'clientInvoices', 'supplierInvoices', 'clientManagement', 'creditInsurance', 'recovery'
          ];
          
          moduleKeys.forEach(moduleKey => {
            permissionsToStore[moduleKey] = profileData.permissions.includes(moduleKey) ? 'full_access' : 'no_access';
          });
        } else {
          // Already in object format, use as is
          permissionsToStore = profileData.permissions;
        }
      } else {
        // Default permissions if none specified
        const moduleKeys = [
          'dashboard', 'analytics', 'peppolAccessPoint', 'leadsManagement',
          'quoteCreation', 'quotesManagement', 'quotesFollowUp', 'invoicesFollowUp',
          'clientInvoices', 'supplierInvoices', 'clientManagement', 'creditInsurance', 'recovery'
        ];
        
        moduleKeys.forEach(moduleKey => {
          permissionsToStore[moduleKey] = 'no_access';
        });
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role,
          avatar: profileData.avatar,
          permissions: permissionsToStore,
          pin: profileData.pin || null,
          is_active: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      
      throw error;
    }
  }

  // Update a profile
  async updateProfile(userId, profileId, profileData) {
    try {
      // Store permissions as object format for better granular control
      let permissionsToStore = {};
      if (profileData.permissions) {
        if (Array.isArray(profileData.permissions)) {
          // Convert array format to object format
          const moduleKeys = [
            'dashboard', 'analytics', 'peppolAccessPoint', 'leadsManagement',
            'quoteCreation', 'quotesManagement', 'quotesFollowUp', 'invoicesFollowUp',
            'clientInvoices', 'supplierInvoices', 'clientManagement', 'creditInsurance', 'recovery'
          ];
          
          moduleKeys.forEach(moduleKey => {
            permissionsToStore[moduleKey] = profileData.permissions.includes(moduleKey) ? 'full_access' : 'no_access';
          });
        } else {
          // Already in object format, use as is
          permissionsToStore = profileData.permissions;
        }
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Only update fields that are provided
      if (profileData.name !== undefined) updateData.name = profileData.name;
      if (profileData.email !== undefined) updateData.email = profileData.email;
      if (profileData.role !== undefined) updateData.role = profileData.role;
      if (profileData.avatar !== undefined) updateData.avatar = profileData.avatar;
      if (profileData.pin !== undefined) updateData.pin = profileData.pin;
      if (profileData.permissions !== undefined) {
        updateData.permissions = permissionsToStore;
      }
      if (profileData.is_active !== undefined) updateData.is_active = profileData.is_active;
      if (profileData.last_active !== undefined) updateData.last_active = profileData.last_active;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', profileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in updateProfile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  // Get profile by ID
  async getProfileById(userId, profileId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a profile (only admin can delete)
  async deleteProfile(userId, profileId) {
    try {
      // Check if current user is admin
      const currentProfile = await this.getCurrentProfile(userId);
      if (!currentProfile || currentProfile.role !== 'admin') {
        throw new Error('Only admin can delete profiles');
      }

      // Don't allow admin to delete their own profile
      if (currentProfile.id === profileId) {
        throw new Error('Cannot delete your own profile');
      }

      // Get profile to check if it has an avatar
      const profileToDelete = await this.getProfileById(userId, profileId);
      const avatarUrl = profileToDelete?.avatar;

      // Delete the profile from database
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId);

      if (error) throw error;

      // Delete avatar from storage if it exists
      if (avatarUrl) {
        await this.deleteAvatar(avatarUrl);
      }
      
      return { success: true };
    } catch (error) {
      
      throw error;
    }
  }

  // Switch to a different profile
  async switchProfile(userId, profileId) {
    try {
      // First, deactivate ALL profiles for this user to ensure only one is active
      const { error: deactivateAllError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (deactivateAllError) {
        console.error('Error deactivating all profiles:', deactivateAllError);
        throw deactivateAllError;
      }
      
      // Now activate the target profile
      const { data: activatedProfile, error: activateError } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          last_active: new Date().toISOString()
        })
        .eq('id', profileId)
        .eq('user_id', userId)
        .select('*')
        .single();
      
      if (activateError) {
        console.error('Error activating target profile:', activateError);
        throw activateError;
      }
      
      // Store the current profile ID in sessionStorage (not localStorage) for this session only
      sessionStorage.setItem(`current-profile-id-${userId}`, profileId);
      
      return activatedProfile;
    } catch (error) {
      console.error('Error switching profile:', error);
      throw error;
    }
  }

  // Get the current active profile for a user
  async getCurrentProfile(userId) {
    try {
      // First try to get the active profile from the database
      const { data: activeProfiles, error: activeError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (activeError) {
        console.error('Error getting active profiles:', activeError);
        throw activeError;
      }
      
      if (activeProfiles && activeProfiles.length > 0) {
        if (activeProfiles.length === 1) {
          // Only one active profile - perfect
          const activeProfile = activeProfiles[0];
          sessionStorage.setItem(`current-profile-id-${userId}`, activeProfile.id);
          return activeProfile;
        } else {
          // Multiple active profiles - this is the problem we're fixing
          // Keep the first one active, deactivate the rest
          const [keepActive, ...deactivateThese] = activeProfiles;
          
          // Deactivate the extra profiles
          for (const profile of deactivateThese) {
            await supabase
              .from('user_profiles')
              .update({
                is_active: false,
                last_active: new Date().toISOString()
              })
              .eq('id', profile.id);
          }
          
          sessionStorage.setItem(`current-profile-id-${userId}`, keepActive.id);
          return keepActive;
        }
      }
      
      // If no active profile found, get all profiles for this user
      const { data: allProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (profilesError) {
        console.error('Error getting all profiles:', profilesError);
        throw profilesError;
      }
      
      if (!allProfiles || allProfiles.length === 0) {
        return null;
      }

      // If there's only one profile, make it active
      if (allProfiles.length === 1) {
        const { data: singleProfile, error: singleError } = await supabase
          .from('user_profiles')
          .update({
            is_active: true,
            last_active: new Date().toISOString()
          })
          .eq('id', allProfiles[0].id)
          .select('*')
          .single();
        
        if (singleError) {
          console.error('Error activating single profile:', singleError);
          throw singleError;
        }
        
        sessionStorage.setItem(`current-profile-id-${userId}`, singleProfile.id);
        return singleProfile;
      }
      
      // If multiple profiles exist but none are active, this means user needs to select one
      return null;
    } catch (error) {
      console.error('Error getting current profile:', error);
      throw error;
    }
  }

  // Get all profiles for a user
  async getProfiles(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting profiles:', error);
      throw error;
    }
  }

  // Check if user has a specific permission
  async hasPermission(userId, permission) {
    try {
      const currentProfile = await this.getCurrentProfile(userId);
      if (!currentProfile) {
        return false;
      }

      // Handle both array and object formats for permissions
      let permissions = currentProfile.permissions;
      
      if (Array.isArray(permissions)) {
        // Array format (from database)
        return permissions.includes(permission);
      } else if (typeof permissions === 'object' && permissions !== null) {
        // Object format (fallback for old data)
        return permissions[permission] && permissions[permission] !== 'none';
      }
      
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get user's role
  async getUserRole(userId) {
    try {
      const currentProfile = await this.getCurrentProfile(userId);
      return currentProfile?.role || 'none'; // No profile = no role
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'none';
    }
  }

  // Check if account is Premium (for multi-user features)
  async isPremiumAccount(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile.subscription_status === 'active' || 
             userProfile.subscription_status === 'trial' ||
             userProfile.selected_plan === 'pro';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  // Get subscription limits
  async getSubscriptionLimits(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const isPremium = await this.isPremiumAccount(userId);
      
      if (isPremium) {
        return {
          maxProfiles: 10,
          maxStorage: '100GB',
          features: ['multi-user', 'advanced-analytics', 'priority-support']
        };
      } else {
        return {
          maxProfiles: 1,
          maxStorage: '10GB',
          features: ['basic']
        };
      }
    } catch (error) {
      console.error('Error getting subscription limits:', error);
      return {
        maxProfiles: 1,
        maxStorage: '10GB',
        features: ['basic']
      };
    }
  }

  // Upload avatar to Supabase storage
  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Delete avatar from storage
  async deleteAvatar(avatarUrl) {
    try {
      if (!avatarUrl) return;
      
      // Extract file path from URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userId = pathParts[pathParts.length - 2];
      const filePath = `${userId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting avatar:', error);
        // Don't throw error, just log it
      } else {
        console.log('Avatar deleted successfully:', filePath);
      }
    } catch (error) {
      console.error('Error in deleteAvatar:', error);
      // Don't throw error, just log it
    }
  }

  // Update profile avatar with cleanup
  async updateProfileAvatar(userId, profileId, newAvatarUrl) {
    try {
      // Get current profile to check if there's an existing avatar
      const currentProfile = await this.getProfileById(userId, profileId);
      const oldAvatarUrl = currentProfile?.avatar;
      
      // Update profile with new avatar
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ avatar: newAvatarUrl })
        .eq('id', profileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Delete old avatar if it exists and is different from new one
      if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
        await this.deleteAvatar(oldAvatarUrl);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating profile avatar:', error);
      throw error;
    }
  }

  // Create initial admin profile for new user
  async createInitialProfile(userId, userData) {
    try {
      console.log('=== CREATE INITIAL PROFILE START ===');
      console.log('Creating initial profile for user:', userId, 'with data:', userData);
      
      // Check if user already has profiles
      const existingProfiles = await this.getCompanyProfiles(userId);
      console.log('Existing profiles found:', existingProfiles.length);
      
      // Check if there's already an admin profile
      const existingAdminProfile = existingProfiles.find(profile => profile.role === 'admin');
      if (existingAdminProfile) {
        console.log('Admin profile already exists, returning:', existingAdminProfile);
        return existingAdminProfile;
      }
      
      // If there are existing profiles but no admin profile, delete them and create admin
      if (existingProfiles.length > 0) {
        console.log('Found non-admin profiles, deleting them to create admin profile');
        for (const profile of existingProfiles) {
          await supabase
            .from('user_profiles')
            .delete()
            .eq('id', profile.id);
        }
      }

      // Create admin profile for the user using provided data with full permissions
      // Use array format for permissions as expected by the database
      const profileData = {
        user_id: userId,
        name: userData.full_name || userData.email?.split('@')[0] || 'Admin',
        email: userData.email,
        role: 'admin',
        avatar: null, // No avatar needed initially, user can update later
        permissions: [
          'dashboard',
          'analytics',
          'peppolAccessPoint',
          'leadsManagement',
          'quoteCreation',
          'quotesManagement',
          'quotesFollowUp',
          'invoicesFollowUp',
          'clientInvoices',
          'supplierInvoices',
          'clientManagement',
          'creditInsurance',
          'recovery'
        ],
        is_active: true
      };
      
      console.log('Profile data:', JSON.stringify(profileData, null, 2));
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Database error during profile creation:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      console.log('=== END CREATE INITIAL PROFILE ===');
      
      return data;
    } catch (error) {
      console.error('Error in createInitialProfile:', error);
      throw error;
    }
  }

  // Clean up all avatars for a user (when deleting account)
  async cleanupUserAvatars(userId) {
    try {
      // Get all profiles for the user
      const profiles = await this.getCompanyProfiles(userId);
      
      // Delete all avatars
      for (const profile of profiles) {
        if (profile.avatar) {
          await this.deleteAvatar(profile.avatar);
        }
      }
      
    } catch (error) {
      console.error('Error cleaning up user avatars:', error);
      // Don't throw error, just log it
    }
  }
}

export default new MultiUserService(); 