import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../AppIcon';
import Image from '../AppImage';
import PinModal from './PinModal';
import { useMultiUser } from '../../context/MultiUserContext';

const ProfileSelectionModal = ({ isOpen, onProfileSelect, onClose }) => {
  const { t } = useTranslation();
  const { companyProfiles, getProfileAvatar, getRoleLabel, getRoleColor, switchProfile } = useMultiUser();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileClick = async (profile) => {
    setSelectedProfile(profile);
    
    // Check if profile has PIN (stored in database, not localStorage)
    const hasPin = profile.pin && profile.pin.trim() !== '';
    
    if (hasPin) {
      // Show PIN modal for all profiles with PIN (including admin when multiple profiles exist)
      setShowPinModal(true);
    } else {
      // No PIN required, directly select profile
      await selectProfile(profile);
    }
  };

  const selectProfile = async (profile) => {
    try {
      setIsLoading(true);
      console.log('Selecting profile:', profile);
      
      // Use the switchProfile function from context
      await switchProfile(profile.id);
      
      // Call the parent's onProfileSelect callback
      onProfileSelect(profile);
    } catch (error) {
      console.error('Error selecting profile:', error);
      setPinError(t('profileSelection.errors.selectError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinConfirm = async (pin) => {
    if (!selectedProfile) return;
    
    try {
      setIsLoading(true);
      
      // Check PIN against the profile's stored PIN
      if (pin === selectedProfile.pin) {
        setPinError('');
        setShowPinModal(false);
        await selectProfile(selectedProfile);
      } else {
        setPinError(t('profileSelection.errors.incorrectPin'));
      }
    } catch (error) {
      console.error('Error confirming PIN:', error);
      setPinError(t('profileSelection.errors.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setSelectedProfile(null);
    setPinError('');
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Profile Selection Modal - Full Screen */}
      <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-3xl font-bold text-foreground">{t('profileSelection.title')}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
            >
              <AppIcon name="X" size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl">
              {t('profileSelection.subtitle')}
            </p>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl w-full">
              {companyProfiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileClick(profile)}
                  className="bg-card border border-border rounded-xl p-8 cursor-pointer hover:border-primary hover:shadow-2xl transition-all duration-300 group transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-6">
                    {/* Avatar */}
                    <div className="relative">
                      {profile.avatar ? (
                        <Image
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-border group-hover:border-primary transition-colors shadow-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center font-bold text-4xl text-primary-foreground border-4 border-border group-hover:border-primary transition-colors shadow-lg">
                          {getProfileAvatar(profile)}
                        </div>
                      )}
                      <div className={`absolute -bottom-3 -right-3 w-8 h-8 rounded-full ${getRoleColor(profile.role)} border-4 border-background shadow-lg`}></div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-foreground">{profile.name}</h3>
                      <p className="text-lg text-muted-foreground">{getRoleLabel(profile.role)}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>

                    {/* PIN Indicator */}
                    {profile.pin && profile.pin.trim() !== '' && (
                      <div className="flex items-center space-x-3 text-base text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                        <AppIcon name="Lock" size={18} />
                        <span>{t('profileSelection.pinRequired')}</span>
                      </div>
                    )}

                    {/* Active Status */}
                    {profile.is_active && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <AppIcon name="CheckCircle" size={16} className="mr-2" />
                        {t('profileSelection.active')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && selectedProfile && (
        <PinModal
          isOpen={showPinModal}
          onClose={handlePinModalClose}
          onConfirm={handlePinConfirm}
          title={t('profileSelection.enterPinFor', { name: selectedProfile.name })}
          error={pinError}
          isLoading={isLoading}
        />
      )}
    </>,
    document.body
  );
};

export default ProfileSelectionModal; 