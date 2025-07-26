import React, { useState, useEffect } from 'react';
import MultiUserProfile from '../../components/ui/MultiUserProfile';
import multiUserService from '../../services/multiUserService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import { useMultiUser } from '../../context/MultiUserContext';

const MultiUserProfilesPage = () => {
  const [companyUsers, setCompanyUsers] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer',
    permissions: ['quotes', 'invoices']
  });
  const [sidebarOffset, setSidebarOffset] = useState(288); // Default sidebar width

  // Use global context instead of local state
  const { currentProfile, companyProfiles, switchProfile, addProfile, updateProfile, deleteProfile } = useMultiUser();

  // Mock company ID - in real app, this would come from auth context
  const companyId = 'artisan-pro-001';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check sidebar state for layout adjustment
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    setSidebarOffset(isCollapsed ? 64 : 288); // 64px for collapsed, 288px (72*4) for expanded
    
    // Listen for sidebar collapse/expand events
    const handleStorage = (e) => {
      if (e.key === 'sidebar-collapsed') {
        const isCollapsed = JSON.parse(e.newValue);
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Check for mobile
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setSidebarOffset(0);
      } else {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load subscription status
      const premium = await multiUserService.isPremiumAccount(companyId);
      setIsPremium(premium);
      
      // Set mock premium for demo
      localStorage.setItem(`subscription-${companyId}`, 'premium');
      setIsPremium(true);
      
      // Load subscription limits
      const limits = await multiUserService.getSubscriptionLimits(companyId);
      setSubscriptionLimits(limits);
      
      // Use global context data instead of loading separately
      setCompanyUsers(companyProfiles);
      
      // Load pending invitations
      const pendingInvitations = await multiUserService.getPendingInvitations(companyId);
      setInvitations(pendingInvitations);
      
    } catch (error) {
      console.error('Error loading multi-user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSwitch = async (profileId) => {
    try {
      await switchProfile(profileId);
      setCompanyUsers(companyProfiles);
      alert(`Profil changé vers ${currentProfile.name}`);
    } catch (error) {
      console.error('Error switching profile:', error);
      alert('Erreur lors du changement de profil');
    }
  };

  const handleAddProfile = async (profileData) => {
    try {
      await addProfile(profileData);
      setCompanyUsers(companyProfiles);
      alert('Profil ajouté avec succès');
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Erreur lors de l\'ajout du profil');
    }
  };

  const handleEditProfile = async (profileId, profileData) => {
    try {
      await updateProfile(profileId, profileData);
      setCompanyUsers(companyProfiles);
      alert('Profil modifié avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la modification du profil');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      await deleteProfile(profileId);
      setCompanyUsers(companyProfiles);
      alert('Profil supprimé avec succès');
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Erreur lors de la suppression du profil');
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const invitation = await multiUserService.inviteUser(
        companyId,
        inviteForm.email,
        inviteForm.role,
        inviteForm.permissions
      );
      
      setInvitations(prev => [...prev, invitation]);
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'viewer', permissions: ['quotes', 'invoices'] });
      alert('Invitation envoyée avec succès');
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await multiUserService.cancelInvitation(companyId, invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      alert('Invitation annulée');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Erreur lors de l\'annulation de l\'invitation');
    }
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

  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <MainSidebar />
      
      {/* Main Content */}
      <div 
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
          transition: 'margin-left 0.3s ease-out'
        }}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Icon name="Users" size={24} className="text-primary mr-3" />
                <h1 className="text-2xl font-bold text-foreground">Gestion des profils utilisateurs</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez les profils de votre équipe et leurs permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isPremium && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <Icon name="Mail" size={16} className="mr-2" />
                  Inviter un utilisateur
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
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
                <div className="text-2xl font-bold">{companyUsers.length}/{subscriptionLimits.maxProfiles}</div>
                <div className="text-sm opacity-90">Profils créés</div>
              </div>
            </div>
          </div>
        )}

        {/* Multi-User Profile Component */}
        <MultiUserProfile
          currentUser={currentProfile}
          companyUsers={companyProfiles}
          onProfileSwitch={handleProfileSwitch}
          onAddProfile={handleAddProfile}
          onEditProfile={handleEditProfile}
          onDeleteProfile={handleDeleteProfile}
          isPremium={isPremium}
          maxProfiles={subscriptionLimits.maxProfiles}
        />

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
                            {invitation.role}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}
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

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Inviter un utilisateur</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rôle
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="viewer">Lecteur</option>
                    <option value="sales">Commercial</option>
                    <option value="accountant">Comptable</option>
                    <option value="manager">Gestionnaire</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    Envoyer l'invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default MultiUserProfilesPage; 