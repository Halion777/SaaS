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

  const [invitations, setInvitations] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
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

  const [inviteForm, setInviteForm] = useState({
    email: '',
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
  });

  // Access control configuration - simplified to match sidebar structure
  const accessPermissions = {
    dashboard: {
      label: 'Tableau de bord',
      description: 'Accès au tableau de bord principal',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    analytics: {
      label: 'Analytics',
      description: 'Accès aux rapports et analyses',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    peppolAccessPoint: {
      label: 'Point d\'accès PEPPOL',
      description: 'Accès aux services PEPPOL',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    leadsManagement: {
      label: 'Gestion des Leads',
      description: 'Gestion des prospects et opportunités',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quoteCreation: {
      label: 'Créer un devis',
      description: 'Création de nouveaux devis',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quotesManagement: {
      label: 'Gestion des devis',
      description: 'Gestion et suivi des devis',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    quotesFollowUp: {
      label: 'Relances devis',
      description: 'Suivi et relances des devis',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    invoicesFollowUp: {
      label: 'Relances factures',
      description: 'Suivi et relances des factures',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    clientInvoices: {
      label: 'Factures clients',
      description: 'Gestion des factures clients',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    supplierInvoices: {
      label: 'Factures fournisseurs',
      description: 'Gestion des factures fournisseurs',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    clientManagement: {
      label: 'Gestion clients',
      description: 'Gestion de la base de données clients',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    creditInsurance: {
      label: 'Assurance crédit',
      description: 'Services d\'assurance crédit',
      permissions: ['no_access', 'view_only', 'full_access']
    },
    recovery: {
      label: 'Recouvrement',
      description: 'Services de recouvrement',
      permissions: ['no_access', 'view_only', 'full_access']
    }
  };

  // Predefined role templates - updated with new permission structure
  const roleTemplates = {
    admin: {
      name: 'Administrateur',
      description: 'Accès complet à toutes les fonctionnalités',
      role: 'admin',
      permissions: {
        dashboard: 'full_access',
        analytics: 'full_access',
        peppolAccessPoint: 'full_access',
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
      name: 'Gestionnaire',
      description: 'Gestion des équipes et approbation des documents',
      role: 'manager',
      permissions: {
        dashboard: 'full_access',
        analytics: 'full_access',
        peppolAccessPoint: 'view_only',
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
      name: 'Comptable',
      description: 'Gestion financière et facturation',
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
      name: 'Commercial',
      description: 'Gestion des ventes et relations clients',
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
      name: 'Lecteur',
      description: 'Accès en lecture seule aux données',
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

  // Load invitations when component mounts
  useEffect(() => {
    if (user && isPremium) {
      loadInvitations();
    }
  }, [user, isPremium]);

  const loadInvitations = async () => {
    try {
      const pendingInvitations = await getPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

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
      alert(`Profil changé vers ${currentProfile?.name}`);
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
      alert('Profil modifié avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la modification du profil');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;
    
    try {
      await deleteProfile(profileId);
      alert('Profil supprimé avec succès');
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Erreur lors de la suppression du profil');
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      await inviteUser(inviteForm.email, inviteForm.role, inviteForm.permissions);
      setInvitations(prev => [...prev, { 
        id: Date.now().toString(),
        email: inviteForm.email,
        role: inviteForm.role,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);
      setShowInviteModal(false);
      setInviteForm({ 
        email: '', 
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
      });
      alert('Invitation envoyée avec succès');
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      alert('Invitation annulée');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Erreur lors de l\'annulation de l\'invitation');
    }
  };

  const handleAvatarUpload = async (profileId, file) => {
    try {
      setUploadingAvatar(true);
      await uploadAndUpdateAvatar(profileId, file);
      alert('Avatar mis à jour avec succès');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erreur lors du téléchargement de l\'avatar');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des profils...</p>
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
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des profils utilisateurs</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez les profils de votre équipe et leurs permissions
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {isPremium && canManageUsers() && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Icon name="Mail" size={16} className="mr-2" />
                    Inviter un utilisateur
                  </Button>
                )}
                {isPremium && isAdmin() && companyProfiles.length < subscriptionLimits.maxProfiles && (
                  <Button onClick={() => setShowAddProfileModal(true)}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Ajouter un profil
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
                  <h3 className="text-xl font-semibold mb-2 text-white">Compte Premium</h3>
                  <p className="opacity-90">
                    Vous pouvez créer jusqu'à {subscriptionLimits.maxProfiles} profils utilisateurs
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{companyProfiles.length}/{subscriptionLimits.maxProfiles}</div>
                  <div className="text-sm opacity-90">Profils créés</div>
                </div>
              </div>
            </div>
          )}

          {/* Current User Profile */}
          {currentProfile ? (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Mon profil actuel</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground">{currentProfile.name}</h4>
                  <p className="text-sm text-muted-foreground">{getRoleLabel(currentProfile.role)}</p>
                  <p className="text-xs text-muted-foreground">{currentProfile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Rôle:</strong> {getRoleLabel(currentProfile.role)}
                  </p>
                  {currentProfile.is_active && (
                    <p className="text-xs text-green-600">
                      <strong>Statut:</strong> Actif
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Pour changer de profil, utilisez le menu déroulant dans la barre latérale.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Aucun profil disponible</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas encore de profil configuré. Contactez votre administrateur pour obtenir un profil avec les permissions appropriées.
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
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.permissions?.map((permission) => (
                        <span key={permission} className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                          {permission}
                        </span>
                      ))}
                    </div>
                    {profile.is_active && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Actif
                      </span>
                    )}
                  </div>

                  {/* Avatar Upload for own profile */}
                  {profile.id === currentProfile?.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Changer l'avatar
                      </label>
                      <FileUpload
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB
                        onFileSelect={(file) => handleAvatarUpload(profile.id, file)}
                        disabled={uploadingAvatar}
                        loading={uploadingAvatar}
                        label="Choisir une image"
                        description="Glissez-déposez ou cliquez pour sélectionner"
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
                <h3 className="text-lg font-semibold mb-2">Aucun profil configuré</h3>
                <p className="text-muted-foreground mb-4">
                  Aucun profil n'a été créé pour votre compte. Seuls les administrateurs peuvent créer des profils.
                </p>
                {isAdmin() && (
                  <Button
                    onClick={() => setShowAddProfileModal(true)}
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Créer le premier profil
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {isPremium && invitations.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Invitations en attente</h3>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Rôle</th>
                        <th className="text-left p-4 font-medium">Date d'invitation</th>
                        <th className="text-left p-4 font-medium">Expire le</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((invitation) => (
                        <tr key={invitation.id} className="border-t border-border">
                          <td className="p-4">{invitation.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getRoleLabel(invitation.role)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              Annuler
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                      <h2 className="text-xl font-semibold text-foreground">Ajouter un profil</h2>
                      <p className="text-sm text-muted-foreground">
                        Créez un nouveau profil avec des permissions personnalisées
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
                              {companyProfiles.length > 0 
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
                      <p className="text-sm text-muted-foreground">
                        Sélectionnez un modèle de rôle ou personnalisez les permissions
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddProfileModal(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" className="min-w-[120px]">
                        Créer le profil
                      </Button>
                    </div>
                  </div>

                  </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground">
                      Tous les champs marqués d'un * sont obligatoires
                    </p>
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
                      <h2 className="text-xl font-semibold text-foreground">Modifier le profil</h2>
                      <p className="text-sm text-muted-foreground">
                        Modifiez les informations et permissions du profil
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
                        <p className="text-sm text-muted-foreground">
                          Sélectionnez un modèle de rôle ou personnalisez les permissions
                        </p>
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
                          Modifier le profil
                        </Button>
                      </div>
                    </div>

                  </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground">
                      Tous les champs marqués d'un * sont obligatoires
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Info" size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Les modifications seront appliquées immédiatement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Mail" size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Inviter un utilisateur</h2>
                      <p className="text-sm text-muted-foreground">
                        Envoyez une invitation à un nouvel utilisateur
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                    iconName="X"
                  />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <form onSubmit={handleInviteUser} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-6">
                  <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="UserPlus" size={18} className="mr-2 text-primary" />
                          Informations de l'utilisateur
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="email@exemple.com"
                      required
                    />
                  </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                              Rôle <span className="text-destructive">*</span>
                    </label>
                            <EnhancedSelect
                              options={[
                                { value: 'viewer', label: 'Lecteur' },
                                { value: 'sales', label: 'Commercial' },
                                { value: 'accountant', label: 'Comptable' },
                                { value: 'manager', label: 'Gestionnaire' },
                                { value: 'admin', label: 'Administrateur' }
                              ]}
                      value={inviteForm.role}
                              onChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                              placeholder="Sélectionner un rôle"
                              size="default"
                              variant="outline"
                            />
                          </div>
                        </div>
                      </div>
                  </div>

                    {/* Role Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                          <Icon name="Shield" size={18} className="mr-2 text-primary" />
                          Informations sur le rôle
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon name={getModuleIcon('users')} size={16} className="text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{roleTemplates[inviteForm.role]?.name || 'Rôle sélectionné'}</h4>
                              <p className="text-sm text-muted-foreground">{roleTemplates[inviteForm.role]?.description || 'Description du rôle'}</p>
                            </div>
                          </div>
                          {inviteForm.role && roleTemplates[inviteForm.role] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {Object.entries(roleTemplates[inviteForm.role].permissions).map(([moduleKey, permission]) => (
                                <div key={moduleKey} className="flex items-center justify-between p-2 bg-background/50 rounded-md border border-border/50">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-primary/10 rounded-sm flex items-center justify-center">
                                      <Icon name={getModuleIcon(moduleKey)} size={10} className="text-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-foreground">{accessPermissions[moduleKey]?.label}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                    {getPermissionLabel(permission)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground">
                      L'utilisateur recevra un email d'invitation avec un lien de connexion
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteModal(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      onClick={handleInviteUser}
                      className="min-w-[140px]"
                    >
                      Envoyer l'invitation
                    </Button>
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