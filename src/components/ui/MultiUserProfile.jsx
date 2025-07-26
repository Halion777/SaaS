import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import Select from './Select';

const MultiUserProfile = ({ 
  currentUser, 
  companyUsers = [], 
  onProfileSwitch, 
  onAddProfile, 
  onEditProfile, 
  onDeleteProfile,
  isPremium = false,
  maxProfiles = 5 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
    permissions: []
  });

  const availableRoles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Gestionnaire' },
    { value: 'accountant', label: 'Comptable' },
    { value: 'sales', label: 'Commercial' },
    { value: 'viewer', label: 'Lecteur' }
  ];

  const availablePermissions = [
    { value: 'quotes', label: 'Gestion des devis' },
    { value: 'invoices', label: 'Gestion des factures' },
    { value: 'clients', label: 'Gestion des clients' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'settings', label: 'Paramètres' },
    { value: 'users', label: 'Gestion des utilisateurs' }
  ];

  // Check if current user is admin
  const isCurrentUserAdmin = currentUser?.role === 'admin';
  
  // Check if user can edit a specific profile
  const canEditProfile = (profile) => {
    // Admin can edit any profile
    if (isCurrentUserAdmin) return true;
    
    // Non-admin users cannot edit any profiles
    return false;
  };
  
  // Check if user can delete a specific profile
  const canDeleteProfile = (profile) => {
    // Cannot delete yourself
    if (profile.id === currentUser?.id) return false;
    
    // Admin can delete any other profile
    if (isCurrentUserAdmin) return true;
    
    // Non-admin users cannot delete any profiles
    return false;
  };

  const handleOpenModal = (profile = null) => {
    // Only admins can open the modal
    if (!isCurrentUserAdmin) {
      alert("Seuls les administrateurs peuvent gérer les profils.");
      return;
    }
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        permissions: profile.permissions || []
      });
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        role: 'viewer',
        avatar: '',
        permissions: ['quotes', 'invoices']
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProfile) {
      onEditProfile(editingProfile.id, formData);
    } else {
      onAddProfile(formData);
    }
    
    setIsModalOpen(false);
    setEditingProfile(null);
    setFormData({ name: '', role: '', avatar: '', permissions: [] });
  };

  const handleDelete = (profileId) => {
    const profileToDelete = companyUsers.find(user => user.id === profileId);
    
    // Check permissions before deleting
    if (!profileToDelete) {
      alert('Profil non trouvé.');
      return;
    }
    
    if (!canDeleteProfile(profileToDelete)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce profil.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil "${profileToDelete.name}" ?`)) {
      onDeleteProfile(profileId);
    }
  };

  const getAvatarInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  if (!isPremium) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Profils multiples</h3>
        <p className="text-muted-foreground mb-4">
          Cette fonctionnalité est disponible uniquement pour les comptes Premium.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
          Passer à Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Profile Display */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getAvatarInitials(currentUser.name)
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getRoleColor(currentUser.role)} border-2 border-card`}></div>
            </div>
            <div>
              <h3 className="font-medium">{currentUser.name}</h3>
              <p className="text-sm text-muted-foreground">{getRoleLabel(currentUser.role)}</p>
              <p className="text-xs text-muted-foreground">
                {isCurrentUserAdmin ? 'Administrateur - Peut gérer tous les profils' : 'Utilisateur - Accès limité'}
              </p>
            </div>
          </div>
          {isCurrentUserAdmin && (
            <Button variant="outline" size="sm" onClick={() => handleOpenModal()}>
              <Icon name="Plus" size={16} className="mr-2" />
              Ajouter un profil
            </Button>
          )}
        </div>
      </div>

      {/* Profile Switching Notice */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Icon name="Info" size={16} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pour changer de profil, utilisez le menu déroulant dans la barre latérale.
          </p>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {companyUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-card border border-border rounded-lg p-4 transition-all duration-200 ${
              currentUser.id === user.id ? 'ring-2 ring-primary' : ''
            } ${!isCurrentUserAdmin ? 'opacity-75' : ''}`}
          >
            <div className="text-center">
              <div className="relative mx-auto mb-3">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getAvatarInitials(user.name)
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getRoleColor(user.role)} border-2 border-card`}></div>
              </div>
              
              <h4 className="font-medium text-sm mb-1">{user.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{getRoleLabel(user.role)}</p>
              {currentUser.id === user.id && (
                <div className="text-xs text-primary font-medium mb-2">
                  Profil actuel
                </div>
              )}
              
              {isCurrentUserAdmin && (
                <div className="flex justify-center space-x-1">
                  {canEditProfile(user) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(user);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Modifier"
                    >
                      <Icon name="Edit" size={12} />
                    </button>
                  )}
                  {canDeleteProfile(user) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors text-destructive"
                      title="Supprimer"
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingProfile ? 'Modifier le profil' : 'Ajouter un profil'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nom complet
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom de l'utilisateur"
                  required
                  disabled={!isCurrentUserAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rôle
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={availableRoles}
                  placeholder="Sélectionner un rôle"
                  disabled={!isCurrentUserAdmin}
                />
                {!isCurrentUserAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Seuls les administrateurs peuvent modifier les rôles
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.value)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...formData.permissions, permission.value]
                            : formData.permissions.filter(p => p !== permission.value);
                          setFormData({ ...formData, permissions: newPermissions });
                        }}
                        className="rounded border-border"
                        disabled={!isCurrentUserAdmin}
                      />
                      <span className={`text-sm ${!isCurrentUserAdmin ? 'text-muted-foreground' : ''}`}>
                        {permission.label}
                      </span>
                    </label>
                  ))}
                </div>
                {!isCurrentUserAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Seuls les administrateurs peuvent modifier les permissions
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                {isCurrentUserAdmin && (
                  <Button type="submit">
                    {editingProfile ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiUserProfile; 