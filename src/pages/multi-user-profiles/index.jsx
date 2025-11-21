import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';
import Button from '../../components/ui/Button';
import PinModal from '../../components/ui/PinModal';
import FileUpload from '../../components/ui/FileUpload';
import EnhancedSelect from '../../components/ui/EnhancedSelect';
import MainSidebar from '../../components/ui/MainSidebar';
import GlobalProfile from '../../components/ui/GlobalProfile';

const MultiUserProfilesPage = () => {
  const { t } = useTranslation();
  const [expandedProfiles, setExpandedProfiles] = useState(new Set());
  const { user } = useAuth();
  const {
    companyProfiles,
    currentProfile,
    permissions,
    isPremium,
    subscriptionLimits,
    loading,
    isAdmin,
    canManageUsers,
    switchProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    getCompanyProfiles,
    uploadAndUpdateAvatar,
    
  } = useMultiUser();

  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    targetProfileId: null,
    targetProfileName: '',
    action: null // 'switch', 'edit', 'delete'
  });

  

  // Access control configuration - simplified to match sidebar structure
  const accessPermissions = {
    dashboard: {
      label: t('multiUserProfiles.modules.dashboard.label'),
      description: t('multiUserProfiles.modules.dashboard.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    analytics: {
      label: t('multiUserProfiles.modules.analytics.label'),
      description: t('multiUserProfiles.modules.analytics.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    peppolAccessPoint: {
      label: t('multiUserProfiles.modules.peppolAccessPoint.label'),
      description: t('multiUserProfiles.modules.peppolAccessPoint.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    leadsManagement: {
      label: t('multiUserProfiles.modules.leadsManagement.label'),
      description: t('multiUserProfiles.modules.leadsManagement.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quoteCreation: {
      label: t('multiUserProfiles.modules.quoteCreation.label'),
      description: t('multiUserProfiles.modules.quoteCreation.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quotesManagement: {
      label: t('multiUserProfiles.modules.quotesManagement.label'),
      description: t('multiUserProfiles.modules.quotesManagement.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quotesFollowUp: {
      label: t('multiUserProfiles.modules.quotesFollowUp.label'),
      description: t('multiUserProfiles.modules.quotesFollowUp.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    invoicesFollowUp: {
      label: t('multiUserProfiles.modules.invoicesFollowUp.label'),
      description: t('multiUserProfiles.modules.invoicesFollowUp.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    clientInvoices: {
      label: t('multiUserProfiles.modules.clientInvoices.label'),
      description: t('multiUserProfiles.modules.clientInvoices.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    supplierInvoices: {
      label: t('multiUserProfiles.modules.supplierInvoices.label'),
      description: t('multiUserProfiles.modules.supplierInvoices.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    clientManagement: {
      label: t('multiUserProfiles.modules.clientManagement.label'),
      description: t('multiUserProfiles.modules.clientManagement.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    creditInsurance: {
      label: t('multiUserProfiles.modules.creditInsurance.label'),
      description: t('multiUserProfiles.modules.creditInsurance.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    },
    recovery: {
      label: t('multiUserProfiles.modules.recovery.label'),
      description: t('multiUserProfiles.modules.recovery.description'),
      permissions: ['no_access', 'view_only', 'full_access']
    }
  };

  // Predefined role templates - updated with new permission structure
  const roleTemplates = {
    admin: {
      name: t('multiUserProfiles.roles.admin.name'),
      description: t('multiUserProfiles.roles.admin.description'),
      role: 'admin',
      permissions: {
        dashboard: 'full_access',
        analytics: 'full_access',
        peppolAccessPoint: 'full_access', // Only available for business users
        leadsManagement: 'full_access',
        quoteCreation: 'full_access',
        quotesManagement: 'full_access',
        quotesFollowUp: 'full_access',
        invoicesFollowUp: 'full_access',
        clientInvoices: 'full_access',
        supplierInvoices: 'full_access',
        clientManagement: 'full_access',
        creditInsurance: 'full_access',
        recovery: 'full_access'
      }
    },
    manager: {
      name: t('multiUserProfiles.roles.manager.name'),
      description: t('multiUserProfiles.roles.manager.description'),
      role: 'manager',
      permissions: {
        dashboard: 'full_access',
        analytics: 'full_access',
        peppolAccessPoint: 'no_access',
        leadsManagement: 'full_access',
        quoteCreation: 'full_access',
        quotesManagement: 'full_access',
        quotesFollowUp: 'full_access',
        invoicesFollowUp: 'full_access',
        clientInvoices: 'full_access',
        supplierInvoices: 'view_only',
        clientManagement: 'full_access',
        creditInsurance: 'view_only',
        recovery: 'view_only'
      }
    },
    accountant: {
      name: t('multiUserProfiles.roles.accountant.name'),
      description: t('multiUserProfiles.roles.accountant.description'),
      role: 'accountant',
      permissions: {
        dashboard: 'view_only',
        analytics: 'full_access',
        peppolAccessPoint: 'view_only',
        leadsManagement: 'view_only',
        quoteCreation: 'view_only',
        quotesManagement: 'view_only',
        quotesFollowUp: 'view_only',
        invoicesFollowUp: 'full_access',
        clientInvoices: 'full_access',
        supplierInvoices: 'full_access',
        clientManagement: 'view_only',
        creditInsurance: 'view_only',
        recovery: 'view_only'
      }
    },
    sales: {
      name: t('multiUserProfiles.roles.sales.name'),
      description: t('multiUserProfiles.roles.sales.description'),
      role: 'sales',
      permissions: {
        dashboard: 'view_only',
        analytics: 'view_only',
        peppolAccessPoint: 'no_access',
        leadsManagement: 'full_access',
        quoteCreation: 'full_access',
        quotesManagement: 'view_only',
        quotesFollowUp: 'view_only',
        invoicesFollowUp: 'view_only',
        clientInvoices: 'view_only',
        supplierInvoices: 'no_access',
        clientManagement: 'full_access',
        creditInsurance: 'no_access',
        recovery: 'no_access'
      }
    },
    viewer: {
      name: t('multiUserProfiles.roles.viewer.name'),
      description: t('multiUserProfiles.roles.viewer.description'),
      role: 'viewer',
      permissions: {
        dashboard: 'view_only',
        analytics: 'view_only',
        peppolAccessPoint: 'no_access',
        leadsManagement: 'view_only',
        quoteCreation: 'no_access',
        quotesManagement: 'view_only',
        quotesFollowUp: 'view_only',
        invoicesFollowUp: 'view_only',
        clientInvoices: 'view_only',
        supplierInvoices: 'no_access',
        clientManagement: 'view_only',
        creditInsurance: 'no_access',
        recovery: 'no_access'
      }
    }
  };

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: 'viewer',
    selectedTemplate: 'viewer',
    pin: '', // PIN for profile access
    permissions: {
      dashboard: 'view_only',
      analytics: 'view_only',
      peppolAccessPoint: 'no_access',
      leadsManagement: 'view_only',
      quoteCreation: 'no_access',
      quotesManagement: 'view_only',
      quotesFollowUp: 'view_only',
      invoicesFollowUp: 'view_only',
      clientInvoices: 'view_only',
      supplierInvoices: 'no_access',
      clientManagement: 'view_only',
      creditInsurance: 'no_access',
      recovery: 'no_access'
    }
  });

  // Handle sidebar offset for responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (!isMobile && !isTablet) {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    handleResize();

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

 
  const handleProfileSwitch = async (profileId) => {
    try {
      // Check if profile has PIN protection
      const targetProfile = companyProfiles.find(p => p.id === profileId);
      const hasPin = targetProfile?.pin && targetProfile.pin.trim() !== '';
      
      if (hasPin) {
        // Show PIN modal for protected profile
        setPinModal({
          isOpen: true,
          targetProfileId: profileId,
          targetProfileName: targetProfile.name,
          action: 'switch'
        });
        return;
      }
      
      // No PIN required, switch directly
      await performProfileSwitch(profileId);
    } catch (error) {
      console.error('Error switching profile:', error);
      alert('Erreur lors du changement de profil');
    }
  };

  const performProfileSwitch = async (profileId) => {
    try {
      await switchProfile(profileId);
      alert(t('multiUserProfiles.messages.profileSwitched', { name: currentProfile?.name }));
    } catch (error) {
      console.error('Error performing profile switch:', error);
      alert('Erreur lors du changement de profil');
    }
  };

  const handlePinConfirm = async (pin) => {
    const targetProfile = companyProfiles.find(p => p.id === pinModal.targetProfileId);
    
    if (pin !== targetProfile?.pin) {
      throw new Error('Incorrect PIN');
    }
    
    // PIN is correct, perform the action
    if (pinModal.action === 'switch') {
      await performProfileSwitch(pinModal.targetProfileId);
    }
    
    // Close the modal
    setPinModal({
      isOpen: false,
      targetProfileId: null,
      targetProfileName: '',
      action: null
    });
  };

  const handlePinModalClose = () => {
    setPinModal({
      isOpen: false,
      targetProfileId: null,
      targetProfileName: '',
      action: null
    });
  };

  // Handle template selection
  const handleTemplateChange = (templateKey) => {
    const template = roleTemplates[templateKey];
    
    setProfileForm(prev => {
      const updated = {
        ...prev,
        selectedTemplate: templateKey,
        role: templateKey,
        permissions: template.permissions
      };
      return updated;
    });
  };

  // Handle individual permission changes
  const handlePermissionChange = (module, permission) => {
    setProfileForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: permission
      }
    }));
  };

  // Get permission label
  const getPermissionLabel = (permission) => {
    return t(`dashboard.permissions.labels.${permission}`) || permission;
  };

  // Check if user has specific permission
  const hasPermission = (module, requiredPermission) => {
    const userPermission = profileForm.permissions[module];
    const permissionLevels = {
      no_access: 0,
      view_only: 1,
      full_access: 2
    };
    
    return permissionLevels[userPermission] >= permissionLevels[requiredPermission];
  };

  // Get module icon
  const getModuleIcon = (moduleKey) => {
    const icons = {
      dashboard: 'LayoutDashboard',
      analytics: 'BarChart3',
      peppolAccessPoint: 'Network',
      leadsManagement: 'Target',
      quoteCreation: 'FileText',
      quotesManagement: 'FolderOpen',
      quotesFollowUp: 'MessageCircle',
      invoicesFollowUp: 'Bell',
      clientInvoices: 'Receipt',
      supplierInvoices: 'FileText',
      clientManagement: 'Users',
      creditInsurance: 'Shield',
      recovery: 'Banknote'
    };
    return icons[moduleKey] || 'Settings';
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    
    try {
      const newProfile = await addProfile({
        name: profileForm.name,
        email: profileForm.email,
        role: profileForm.role,
        permissions: profileForm.permissions,
        pin: profileForm.pin || '' // Include PIN in initial creation
      });
      
      setShowAddProfileModal(false);
      setProfileForm({ 
        name: '', 
        email: '', 
        role: 'viewer', 
        selectedTemplate: 'viewer',
        pin: '',
        permissions: {
          dashboard: 'view_only',
          analytics: 'view_only',
          peppolAccessPoint: 'no_access',
          leadsManagement: 'view_only',
          quoteCreation: 'no_access',
          quotesManagement: 'view_only',
          quotesFollowUp: 'view_only',
          invoicesFollowUp: 'view_only',
          clientInvoices: 'view_only',
          supplierInvoices: 'no_access',
          clientManagement: 'view_only',
          creditInsurance: 'no_access',
          recovery: 'no_access'
        }
      });
      
      // Check if this is the second profile (multiple profiles scenario)
      const allProfiles = await getCompanyProfiles();
      const hasMultipleProfiles = allProfiles.length > 1;
      
      if (hasMultipleProfiles) {
        // Multiple profiles exist - update the new profile with PIN if not already set
        if (!profileForm.pin) {
          // Set default PIN if none provided
          const defaultPin = '1234';
          await updateProfile(newProfile.id, { pin: defaultPin });
        }
        
        // Also set PIN for existing admin profile if it doesn't have one
        const adminProfile = allProfiles.find(p => p.role === 'admin' && p.id !== newProfile.id);
        if (adminProfile && !adminProfile.pin) {
          const adminPin = '0000'; // Special PIN for admin
          await updateProfile(adminProfile.id, { pin: adminPin });
        }
      }
    } catch (error) {
      console.error('Error adding profile:', error);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile) {
      console.error('No editing profile found');
      return;
    }
    
    try {
      await updateProfile(editingProfile.id, {
        name: profileForm.name,
        email: profileForm.email,
        role: profileForm.role,
        permissions: profileForm.permissions,
        pin: profileForm.pin || '' // Include PIN in update
      });
      setShowEditProfileModal(false);
      setEditingProfile(null);
      setProfileForm({ 
        name: '', 
        email: '', 
        role: 'viewer', 
        selectedTemplate: 'viewer',
        pin: '',
        permissions: {
          dashboard: 'view_only',
          analytics: 'view_only',
          peppolAccessPoint: 'no_access',
          leadsManagement: 'view_only',
          quoteCreation: 'no_access',
          quotesManagement: 'view_only',
          quotesFollowUp: 'view_only',
          invoicesFollowUp: 'view_only',
          clientInvoices: 'view_only',
          supplierInvoices: 'no_access',
          clientManagement: 'view_only',
          creditInsurance: 'no_access',
          recovery: 'no_access'
        }
      });
      alert(t('multiUserProfiles.messages.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('multiUserProfiles.messages.profileUpdateError'));
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!confirm(t('multiUserProfiles.messages.deleteConfirm'))) return;
    
    try {
      await deleteProfile(profileId);
      alert(t('multiUserProfiles.messages.profileDeleted'));
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert(t('multiUserProfiles.messages.profileDeleteError'));
    }
  };

  

  

  const handleAvatarUpload = async (profileId, file) => {
    try {
      setUploadingAvatar(true);
      await uploadAndUpdateAvatar(profileId, file);
      alert(t('multiUserProfiles.messages.avatarUpdated'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(t('multiUserProfiles.messages.avatarUpdateError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditModal = (profile) => {
    // Convert permissions from array to object format for the form
    const permissionsObject = {};
    
    // Initialize all permissions to 'view_only' by default
    Object.keys(accessPermissions).forEach(moduleKey => {
      permissionsObject[moduleKey] = 'view_only';
    });
    
    // Map existing permissions from array to object
    if (Array.isArray(profile.permissions)) {
      profile.permissions.forEach(permission => {
        // Find which module this permission belongs to
        Object.keys(accessPermissions).forEach(moduleKey => {
          const module = accessPermissions[moduleKey];
          if (module.permissions.includes(permission)) {
            permissionsObject[moduleKey] = permission;
          }
        });
      });
    }

    // Determine the selected template based on the role
    let selectedTemplate = 'viewer';
    Object.entries(roleTemplates).forEach(([key, template]) => {
      if (template.role === profile.role) {
        selectedTemplate = key;
      }
    });

    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      selectedTemplate: selectedTemplate,
      pin: profile.pin || '', // Include PIN field
      permissions: permissionsObject
    });
    setShowEditProfileModal(true);
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

  const getProfileAvatar = (profile) => {
    if (profile.avatar) {
      return profile.avatar;
    }
    return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleProfileExpanded = (profileId) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('multiUserProfiles.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <GlobalProfile />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-16 pt-4' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Users" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('multiUserProfiles.title')}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('multiUserProfiles.subtitle')}
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {isPremium && isAdmin() && companyProfiles.length < subscriptionLimits.maxProfiles && (
                  <Button onClick={() => setShowAddProfileModal(true)}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    {t('multiUserProfiles.addProfile')}
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Subscription Status */}
          {isPremium && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-8 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{t('multiUserProfiles.premiumAccount.title')}</h3>
                  <p className="opacity-90">
                    {t('multiUserProfiles.premiumAccount.description', { max: subscriptionLimits.maxProfiles })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{companyProfiles.length}/{subscriptionLimits.maxProfiles}</div>
                  <div className="text-sm opacity-90">{t('multiUserProfiles.premiumAccount.profilesCreated')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Current User Profile */}
          {currentProfile ? (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('multiUserProfiles.currentProfile.title')}</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground">{currentProfile.name}</h4>
                  <p className="text-sm text-muted-foreground">{getRoleLabel(currentProfile.role)}</p>
                  <p className="text-xs text-muted-foreground">{currentProfile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    <strong>{t('multiUserProfiles.currentProfile.role')}</strong> {getRoleLabel(currentProfile.role)}
                  </p>
                  {currentProfile.is_active && (
                    <p className="text-xs text-green-600">
                      <strong>{t('multiUserProfiles.currentProfile.status')}</strong> {t('multiUserProfiles.currentProfile.active')}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t('multiUserProfiles.currentProfile.switchHint')}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('multiUserProfiles.noProfile.title')}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('multiUserProfiles.noProfile.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyProfiles.length > 0 ? (
              companyProfiles.map((profile) => (
                <div key={profile.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {profile.avatar ? (
                          <Image
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-semibold text-lg text-primary-foreground">
                            {getProfileAvatar(profile)}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getRoleColor(profile.role)} border-2 border-background`}></div>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground">{getRoleLabel(profile.role)}</p>
                      </div>
                    </div>
                    {isAdmin() && profile.id !== currentProfile?.id && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(profile)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Icon name="Edit" size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-1 rounded hover:bg-muted transition-colors text-destructive"
                        >
                          <Icon name="Trash" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    
                    {/* Permissions Section */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-foreground">{t('multiUserProfiles.permissions')}</h5>
                      
                      {/* All Permissions with Scrollbar */}
                      <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="grid grid-cols-1 gap-1">
                          {(() => {
                            // Convert permissions array to object format
                            const permissionsObject = {};
                            Object.keys(accessPermissions).forEach(moduleKey => {
                              permissionsObject[moduleKey] = 'no_access';
                            });
                            
                            // Handle both array and object formats
                            if (Array.isArray(profile.permissions)) {
                              // If permissions is an array of module names, set them to 'full_access'
                              profile.permissions.forEach(moduleName => {
                                if (accessPermissions[moduleName]) {
                                  permissionsObject[moduleName] = 'full_access';
                                }
                              });
                            } else if (profile.permissions && typeof profile.permissions === 'object') {
                              // If permissions is already an object with permission levels, use it directly
                              Object.keys(profile.permissions).forEach(moduleKey => {
                                if (accessPermissions[moduleKey]) {
                                  permissionsObject[moduleKey] = profile.permissions[moduleKey];
                                }
                              });
                            }
                            
                            // Show all permissions
                            return Object.entries(permissionsObject).map(([moduleKey, permission]) => (
                              <div key={moduleKey} className="flex items-center justify-between p-1.5 bg-muted/20 rounded">
                                <div className="flex items-center space-x-2">
                                  <Icon name={getModuleIcon(moduleKey)} size={10} className="text-primary" />
                                  <span className="text-xs text-foreground">
                                    {accessPermissions[moduleKey]?.label}
                                  </span>
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  permission === 'full_access' 
                                    ? 'bg-green-100 text-green-800' 
                                    : permission === 'view_only' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {getPermissionLabel(permission)}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {profile.is_active && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {t('multiUserProfiles.currentProfile.active')}
                      </span>
                    )}
                  </div>

                  {/* Avatar Upload for own profile */}
                  {profile.id === currentProfile?.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        {t('multiUserProfiles.changeAvatar')}
                      </label>
                      <FileUpload
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB
                        onFileSelect={(file) => handleAvatarUpload(profile.id, file)}
                        disabled={uploadingAvatar}
                        loading={uploadingAvatar}
                        label={t('multiUserProfiles.selectImage')}
                        description={t('multiUserProfiles.imageDescription')}
                        id={`avatar-upload-${profile.id}`}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full bg-card border border-border rounded-lg p-8 text-center">
                <div className="mb-4">
                  <Icon name="Users" size={48} className="mx-auto text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('multiUserProfiles.noProfilesConfigured.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('multiUserProfiles.noProfilesConfigured.description')}
                </p>
                {isAdmin() && (
                  <Button
                    onClick={() => setShowAddProfileModal(true)}
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                  >
                    {t('multiUserProfiles.noProfilesConfigured.createFirst')}
                  </Button>
                )}
              </div>
            )}
          </div>

          
          {/* Add Profile Modal */}
          {showAddProfileModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="UserPlus" size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{t('multiUserProfiles.modals.addProfile.title')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('multiUserProfiles.modals.addProfile.subtitle')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddProfileModal(false)}
                    iconName="X"
                  />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <form onSubmit={handleAddProfile} className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="User" size={18} className="mr-2 text-primary" />
                          {t('multiUserProfiles.modals.addProfile.basicInfo')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              {t('multiUserProfiles.modals.addProfile.profileName')} <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder={t('multiUserProfiles.modals.addProfile.profileName')}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              {t('multiUserProfiles.modals.addProfile.email')} <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="email@exemple.com"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              {t('multiUserProfiles.modals.addProfile.pin')}
                            </label>
                            <input
                              type="password"
                              value={profileForm.pin}
                              onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder={t('multiUserProfiles.modals.addProfile.pinPlaceholder')}
                              minLength="4"
                              maxLength="8"
                            />
                            <p className="text-xs text-muted-foreground">
                              {companyProfiles.length > 0 
                                ? t('multiUserProfiles.modals.addProfile.pinHintMultiple')
                                : t('multiUserProfiles.modals.addProfile.pinHintSingle')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Role Template Selection */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Icon name="Shield" size={18} className="mr-2 text-primary" />
                        {t('multiUserProfiles.modals.addProfile.roleTemplate')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('multiUserProfiles.modals.addProfile.roleTemplateDescription')}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(roleTemplates).map(([key, template]) => (
                          <div
                            key={key}
                            onClick={() => handleTemplateChange(key)}
                            className={`group relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              profileForm.selectedTemplate === key
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50 bg-card'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-foreground">{template.name}</h4>
                              {profileForm.selectedTemplate === key && (
                                <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                                  <Icon name="Check" size={14} className="text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                            {profileForm.selectedTemplate === key && (
                              <div className="absolute top-2 right-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Permissions */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Icon name="Settings" size={18} className="mr-2 text-primary" />
                        {t('multiUserProfiles.modals.addProfile.detailedPermissions')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('multiUserProfiles.modals.addProfile.detailedPermissionsDescription')}
                      </p>
                      <div className="space-y-4">
                        {Object.entries(accessPermissions).map(([moduleKey, module]) => (
                          <div key={moduleKey} className="border border-border rounded-lg p-5 bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Icon name={getModuleIcon(moduleKey)} size={16} className="text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{module.label}</h4>
                                    <p className="text-sm text-muted-foreground">{module.description}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <EnhancedSelect
                                  options={module.permissions.map(permission => ({
                                    value: permission,
                                    label: getPermissionLabel(permission)
                                  }))}
                                  value={profileForm.permissions[moduleKey] || 'view'}
                                  onChange={(value) => handlePermissionChange(moduleKey, value)}
                                  placeholder="Sélectionner une permission"
                                  size="default"
                                  variant="outline"
                                  className="min-w-[160px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Icon name="CheckCircle" size={18} className="mr-2 text-primary" />
                        {t('multiUserProfiles.modals.addProfile.permissionsSummary')}
                      </h3>
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(profileForm.permissions).map(([moduleKey, permission]) => (
                            <div key={moduleKey} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                                  <Icon name={getModuleIcon(moduleKey)} size={12} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{accessPermissions[moduleKey]?.label}</span>
                              </div>
                              <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                {getPermissionLabel(permission)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div className="flex items-center space-x-4">
                        
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddProfileModal(false)}
                        >
                          {t('multiUserProfiles.modals.addProfile.cancel')}
                        </Button>
                        <Button type="submit" className="min-w-[120px]">
                          {t('multiUserProfiles.modals.addProfile.createProfile')}
                        </Button>
                      </div>
                  </div>

                  </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center space-x-4">
                   
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {showEditProfileModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="UserEdit" size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{t('multiUserProfiles.modals.editProfile.title')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('multiUserProfiles.modals.editProfile.subtitle')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditProfileModal(false)}
                    iconName="X"
                  />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <form onSubmit={handleEditProfile} className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="User" size={18} className="mr-2 text-primary" />
                          Informations de base
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              Nom du profil <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Entrez le nom du profil"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              Email <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="email@exemple.com"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              Code PIN (optionnel)
                            </label>
                            <input
                              type="password"
                              value={profileForm.pin}
                              onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="1234 (4 chiffres minimum)"
                              minLength="4"
                              maxLength="8"
                            />
                            <p className="text-xs text-muted-foreground">
                              {companyProfiles.length > 1 
                                ? "PIN requis pour tous les profils (y compris admin) quand plusieurs profils existent. Laissez vide pour utiliser le code PIN par défaut (1234)."
                                : "Laissez vide pour utiliser le code PIN par défaut (1234)"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Template Selection */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="Shield" size={18} className="mr-2 text-primary" />
                          Modèle de rôle
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Sélectionnez un modèle prédéfini ou personnalisez les permissions
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(roleTemplates).map(([key, template]) => (
                            <div
                              key={key}
                              onClick={() => handleTemplateChange(key)}
                              className={`group relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                profileForm.selectedTemplate === key
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border hover:border-primary/50 bg-card'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-foreground">{template.name}</h4>
                                {profileForm.selectedTemplate === key && (
                                  <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                                    <Icon name="Check" size={14} className="text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                              {profileForm.selectedTemplate === key && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Permissions */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="Settings" size={18} className="mr-2 text-primary" />
                          Permissions détaillées
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Personnalisez les permissions pour chaque module
                        </p>
                        <div className="space-y-4">
                          {Object.entries(accessPermissions).map(([moduleKey, module]) => (
                            <div key={moduleKey} className="border border-border rounded-lg p-5 bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Icon name={getModuleIcon(moduleKey)} size={16} className="text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-foreground">{module.label}</h4>
                                      <p className="text-sm text-muted-foreground">{module.description}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <EnhancedSelect
                                    options={module.permissions.map(permission => ({
                                      value: permission,
                                      label: getPermissionLabel(permission)
                                    }))}
                                    value={profileForm.permissions[moduleKey] || 'view'}
                                    onChange={(value) => handlePermissionChange(moduleKey, value)}
                                    placeholder="Sélectionner une permission"
                                    size="default"
                                    variant="outline"
                                    className="min-w-[160px]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="CheckCircle" size={18} className="mr-2 text-primary" />
                          Résumé des permissions
                        </h3>
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(profileForm.permissions).map(([moduleKey, permission]) => (
                              <div key={moduleKey} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                                    <Icon name={getModuleIcon(moduleKey)} size={12} className="text-primary" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{accessPermissions[moduleKey]?.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                  {getPermissionLabel(permission)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div className="flex items-center space-x-4">
                        
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditProfileModal(false)}
                        >
                          Annuler
                        </Button>
                        <Button type="submit" className="min-w-[120px]">
                          {t('multiUserProfiles.modals.editProfile.updateProfile')}
                        </Button>
                      </div>
                    </div>

                  </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center space-x-4">
                    

                  </div>
                  <div className="flex items-center space-x-2">
                   
                  
                  </div>
                </div>
              </div>
            </div>
          )}

          

          {/* PIN Modal for Profile Switching */}
          <PinModal
            isOpen={pinModal.isOpen}
            onClose={handlePinModalClose}
            onConfirm={handlePinConfirm}
            profileName={pinModal.targetProfileName}
            title="Code PIN requis"
            message="Entrez le code PIN pour accéder à ce profil"
          />
        </div>
      </main>
    </div>
  );
};

export default MultiUserProfilesPage; 