// Multi-User Profile Management Service
class MultiUserService {
  constructor() {
    this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_API_URL) || '/api';
    this.storageKey = 'company-profiles';
  }

  // Get all profiles for the current company
  async getCompanyProfiles(companyId) {
    try {
      // For demo purposes, using localStorage
      const stored = localStorage.getItem(`${this.storageKey}-${companyId}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Mock data for demonstration
      const mockProfiles = [
        {
          id: '1',
          name: 'Jean Dupont',
          role: 'admin',
          avatar: '',
          permissions: ['quotes', 'invoices', 'clients', 'analytics', 'settings', 'users'],
          email: 'jean.dupont@artisanpro.fr',
          isActive: true,
          lastActive: new Date().toISOString(),
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Marie Martin',
          role: 'accountant',
          avatar: '',
          permissions: ['invoices', 'analytics'],
          email: 'marie.martin@artisanpro.fr',
          isActive: false,
          lastActive: '2024-01-20T14:30:00Z',
          createdAt: '2024-01-18T09:00:00Z'
        },
        {
          id: '3',
          name: 'Pierre Durand',
          role: 'sales',
          avatar: '',
          permissions: ['quotes', 'clients'],
          email: 'pierre.durand@artisanpro.fr',
          isActive: false,
          lastActive: '2024-01-22T11:00:00Z',
          createdAt: '2024-01-22T11:00:00Z'
        }
      ];

      localStorage.setItem(`${this.storageKey}-${companyId}`, JSON.stringify(mockProfiles));
      return mockProfiles;
    } catch (error) {
      console.error('Error fetching company profiles:', error);
      throw error;
    }
  }

  // Add a new profile
  async addProfile(companyId, profileData) {
    try {
      const profiles = await this.getCompanyProfiles(companyId);
      const newProfile = {
        id: Date.now().toString(),
        ...profileData,
        email: profileData.email || `${profileData.name.toLowerCase().replace(' ', '.')}@artisanpro.fr`,
        isActive: false,
        lastActive: null,
        createdAt: new Date().toISOString()
      };

      const updatedProfiles = [...profiles, newProfile];
      localStorage.setItem(`${this.storageKey}-${companyId}`, JSON.stringify(updatedProfiles));
      
      return newProfile;
    } catch (error) {
      console.error('Error adding profile:', error);
      throw error;
    }
  }

  // Update an existing profile
  async updateProfile(companyId, profileId, profileData) {
    try {
      const profiles = await this.getCompanyProfiles(companyId);
      const updatedProfiles = profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, ...profileData, updatedAt: new Date().toISOString() }
          : profile
      );

      localStorage.setItem(`${this.storageKey}-${companyId}`, JSON.stringify(updatedProfiles));
      
      return updatedProfiles.find(profile => profile.id === profileId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Delete a profile
  async deleteProfile(companyId, profileId) {
    try {
      const profiles = await this.getCompanyProfiles(companyId);
      const updatedProfiles = profiles.filter(profile => profile.id !== profileId);
      
      localStorage.setItem(`${this.storageKey}-${companyId}`, JSON.stringify(updatedProfiles));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Switch to a different profile
  async switchProfile(companyId, profileId) {
    try {
      console.log('MultiUserService: Switching profile for company:', companyId, 'to profile:', profileId);
      
      const profiles = await this.getCompanyProfiles(companyId);
      console.log('MultiUserService: Available profiles:', profiles);
      
      const targetProfile = profiles.find(profile => profile.id === profileId);
      console.log('MultiUserService: Target profile found:', targetProfile);
      
      if (!targetProfile) {
        throw new Error('Profile not found');
      }

      // Update last active time for current profile
      const currentProfileId = localStorage.getItem('current-profile-id');
      console.log('MultiUserService: Current profile ID:', currentProfileId);
      
      if (currentProfileId) {
        await this.updateProfile(companyId, currentProfileId, {
          lastActive: new Date().toISOString(),
          isActive: false
        });
      }

      // Set new profile as active
      await this.updateProfile(companyId, profileId, {
        lastActive: new Date().toISOString(),
        isActive: true
      });

      // Store current profile ID
      localStorage.setItem('current-profile-id', profileId);
      console.log('MultiUserService: Profile switch completed successfully');
      
      return targetProfile;
    } catch (error) {
      console.error('Error switching profile:', error);
      throw error;
    }
  }

  // Get current active profile
  async getCurrentProfile(companyId) {
    try {
      const currentProfileId = localStorage.getItem('current-profile-id');
      if (!currentProfileId) {
        // Return the first admin profile as default
        const profiles = await this.getCompanyProfiles(companyId);
        const adminProfile = profiles.find(profile => profile.role === 'admin');
        if (adminProfile) {
          localStorage.setItem('current-profile-id', adminProfile.id);
          return adminProfile;
        }
        return null;
      }

      const profiles = await this.getCompanyProfiles(companyId);
      return profiles.find(profile => profile.id === currentProfileId);
    } catch (error) {
      console.error('Error getting current profile:', error);
      throw error;
    }
  }

  // Check if user has permission for specific action
  async hasPermission(companyId, permission) {
    try {
      const currentProfile = await this.getCurrentProfile(companyId);
      if (!currentProfile) return false;

      // Admin has all permissions
      if (currentProfile.role === 'admin') return true;

      return currentProfile.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get user's role
  async getUserRole(companyId) {
    try {
      const currentProfile = await this.getCurrentProfile(companyId);
      return currentProfile?.role || 'viewer';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'viewer';
    }
  }

  // Check if account is Premium (for multi-user features)
  async isPremiumAccount(companyId) {
    try {
      // Mock premium check - in real app, this would check subscription status
      const subscription = localStorage.getItem(`subscription-${companyId}`);
      return subscription === 'premium' || subscription === 'enterprise';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  // Get subscription limits
  async getSubscriptionLimits(companyId) {
    try {
      const isPremium = await this.isPremiumAccount(companyId);
      
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

  // Invite a new user (send invitation email)
  async inviteUser(companyId, email, role, permissions) {
    try {
      // Mock invitation - in real app, this would send an email
      const invitation = {
        id: Date.now().toString(),
        email,
        role,
        permissions,
        companyId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const invitations = JSON.parse(localStorage.getItem(`invitations-${companyId}`) || '[]');
      invitations.push(invitation);
      localStorage.setItem(`invitations-${companyId}`, JSON.stringify(invitations));

      return invitation;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  // Get pending invitations
  async getPendingInvitations(companyId) {
    try {
      const invitations = JSON.parse(localStorage.getItem(`invitations-${companyId}`) || '[]');
      return invitations.filter(inv => inv.status === 'pending' && new Date(inv.expiresAt) > new Date());
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  // Cancel invitation
  async cancelInvitation(companyId, invitationId) {
    try {
      const invitations = JSON.parse(localStorage.getItem(`invitations-${companyId}`) || '[]');
      const updatedInvitations = invitations.map(inv => 
        inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv
      );
      localStorage.setItem(`invitations-${companyId}`, JSON.stringify(updatedInvitations));
      
      return { success: true };
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  }
}

export default new MultiUserService(); 