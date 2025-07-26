import React, { useState } from 'react';
import { useMultiUser } from '../../context/MultiUserContext';
import Icon from '../AppIcon';
import Button from './Button';

const ProfileSwitcher = ({ className = '' }) => {
  const { 
    currentProfile, 
    companyProfiles, 
    switchProfile, 
    isPremium, 
    getProfileAvatar, 
    getRoleColor, 
    getRoleLabel 
  } = useMultiUser();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileSwitch = async (profileId) => {
    try {
      await switchProfile(profileId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  };

  if (!isPremium || !currentProfile) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {getProfileAvatar(currentProfile)}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getRoleColor(currentProfile.role)} border-2 border-background`}></div>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-foreground">{currentProfile.name}</div>
          <div className="text-xs text-muted-foreground">{getRoleLabel(currentProfile.role)}</div>
        </div>
        <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
      </button>

      {/* Profile Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Changer de profil</h3>
            
            <div className="space-y-2">
              {companyProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSwitch(profile.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    currentProfile.id === profile.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentProfile.id === profile.id
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {getProfileAvatar(profile)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getRoleColor(profile.role)} border-2 border-background`}></div>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs opacity-75">{getRoleLabel(profile.role)}</div>
                  </div>
                  
                  {currentProfile.id === profile.id && (
                    <Icon name="Check" size={16} />
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/multi-user-profiles';
                }}
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Gérer les profils
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSwitcher; 