import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import Image from '../AppImage';
import Button from './Button';
import { useMultiUser } from '../../context/MultiUserContext';
import { useAuth } from '../../context/AuthContext';

const UserProfile = ({ user, onLogout, isCollapsed = false, isGlobal = false }) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [pinSettings, setPinSettings] = useState({
    hasPin: false,
    pin: '',
    confirmPin: '',
    isSettingPin: false
  });
  const dropdownRef = useRef(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');

  // Get multi-user context with fallback
  const multiUserContext = useMultiUser();
  const { 
    currentProfile, 
    companyProfiles, 
    switchProfile, 
    isPremium, 
    getProfileAvatar, 
    getRoleColor, 
    getRoleLabel,
    isAdmin
  } = multiUserContext || {
    currentProfile: null,
    companyProfiles: [],
    switchProfile: () => {},
    isPremium: false,
    getProfileAvatar: () => '',
    getRoleColor: () => '',
    getRoleLabel: () => '',
    isAdmin: () => false
  };

  // Get actual user data from AuthContext
  const { user: authUser } = useAuth();
  
  // Use actual user data or fallback to props
  const actualUser = authUser || user;
  
  // Get user display information
  const getUserDisplayInfo = () => {
    if (currentProfile) {
      return {
        name: currentProfile.name,
        email: currentProfile.email,
        role: getRoleLabel(currentProfile.role),
        avatar: getProfileAvatar(currentProfile)
      };
    }
    
    if (actualUser) {
      return {
        name: actualUser.user_metadata?.full_name || actualUser.email?.split('@')[0] || 'User',
        email: actualUser.email || '',
        role: actualUser.user_metadata?.company_name || 'User',
        avatar: actualUser.user_metadata?.avatar_url || '/assets/images/no profile.jpg'
      };
    }
    
    return {
      name: 'User',
      email: '',
      role: 'User',
      avatar: '/assets/images/no profile.jpg'
    };
  };

  const userInfo = getUserDisplayInfo();

  // Removed click outside handler since we have backdrop

  const toggleDropdown = () => {
    // console.log('Toggle dropdown clicked, current state:', isDropdownOpen);
    setIsDropdownOpen(!isDropdownOpen);
  };

  // console.log('UserProfile render - isDropdownOpen:', isDropdownOpen, 'isPremium:', isPremium, 'companyProfiles:', companyProfiles?.length, 'currentProfile:', currentProfile?.name);

  const handleAccountSettings = () => {
    setIsDropdownOpen(false);
    setIsAccountSettingsOpen(true);
    
    // Load current PIN settings
    if (currentProfile) {
      const savedPin = localStorage.getItem(`profile-pin-${currentProfile.id}`);
      setPinSettings(prev => ({
        ...prev,
        hasPin: !!savedPin,
        isSettingPin: false
      }));
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  const handleProfileSwitch = async (profileId) => {
    try {
      console.log('Attempting to switch to profile:', profileId);
      console.log('Current profiles:', companyProfiles);
      console.log('Current profile:', currentProfile);
      
      // Check if target profile has PIN protection
      const targetProfile = companyProfiles.find(p => p.id === profileId);
      const targetPin = localStorage.getItem(`profile-pin-${profileId}`);
      
      if (targetPin) {
        // Show PIN input modal
        const enteredPin = prompt(`Entrez le code PIN pour ${targetProfile.name}:`);
        if (enteredPin !== targetPin) {
          alert('Code PIN incorrect');
          return;
        }
      }
      
      const result = await switchProfile(profileId);
      console.log('Profile switch result:', result);
      
      setIsDropdownOpen(false);
      
      // Show success message
      console.log('Profile switched successfully to:', result.name);
      
      // Add a visual feedback
      const button = document.querySelector('[data-profile-switch="success"]');
      if (button) {
        button.style.backgroundColor = 'var(--color-primary)';
        button.style.color = 'var(--color-primary-foreground)';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.style.color = '';
        }, 1000);
      }
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  };

  const handleManageProfiles = () => {
    setIsDropdownOpen(false);
    window.location.href = '/multi-user-profiles';
  };

  const handleSetPin = () => {
    setPinSettings(prev => ({ ...prev, isSettingPin: true, pin: '', confirmPin: '' }));
  };

  const handleSavePin = () => {
    if (pinSettings.pin !== pinSettings.confirmPin) {
      alert('Les codes PIN ne correspondent pas');
      return;
    }
    
    if (pinSettings.pin.length < 4) {
      alert('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }
    
    if (currentProfile) {
      localStorage.setItem(`profile-pin-${currentProfile.id}`, pinSettings.pin);
      setPinSettings(prev => ({ 
        ...prev, 
        hasPin: true, 
        isSettingPin: false, 
        pin: '', 
        confirmPin: '' 
      }));
    }
  };

  const handleRemovePin = () => {
    if (currentProfile) {
      localStorage.removeItem(`profile-pin-${currentProfile.id}`);
      setPinSettings(prev => ({ 
        ...prev, 
        hasPin: false, 
        pin: '', 
        confirmPin: '' 
      }));
    }
  };

  // Check if user can edit PIN (admin or own profile)
  const canEditPin = () => {
    return isPremium && (isAdmin || currentProfile?.id === user?.id);
  };

  const handleCancelPin = () => {
    setPinSettings(prev => ({ 
      ...prev, 
      isSettingPin: false, 
      pin: '', 
      confirmPin: '' 
    }));
  };

  const settingsTabs = [
    { 
      id: 'account', 
      label: t('profile.settings.tabs.account'), 
      icon: 'User',
      content: () => (
        <div className="space-y-6">
          {/* Current Profile Info - existing code */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-semibold text-lg text-primary-foreground">
                  {getProfileAvatar(currentProfile)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getRoleColor(currentProfile.role)} border-2 border-background`}></div>
              </div>
              <div>
                <h4 className="font-medium text-foreground">{currentProfile.name}</h4>
                <p className="text-sm text-muted-foreground">{getRoleLabel(currentProfile.role)}</p>
                <p className="text-xs text-muted-foreground">{currentProfile.email}</p>
              </div>
            </div>
          </div>

          {/* Existing PIN Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">{t('profile.settings.account.pinSettings.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {pinSettings.hasPin 
                    ? t('profile.settings.account.pinSettings.configured') 
                    : t('profile.settings.account.pinSettings.notConfigured')
                  }
                </p>
                {!canEditPin() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.settings.account.pinSettings.adminNote')}
                  </p>
                )}
              </div>
              {!pinSettings.isSettingPin && canEditPin() && (
                <Button
                  variant={pinSettings.hasPin ? "outline" : "default"}
                  size="sm"
                  onClick={pinSettings.hasPin ? handleRemovePin : handleSetPin}
                >
                  {pinSettings.hasPin ? t('common.remove') : t('common.configure')}
                </Button>
              )}
            </div>

            {pinSettings.isSettingPin && canEditPin() && (
              <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('profile.settings.account.pinSettings.newPinLabel')}
                  </label>
                  <input
                    type="password"
                    value={pinSettings.pin}
                    onChange={(e) => setPinSettings(prev => ({ ...prev, pin: e.target.value }))}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="••••"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('profile.settings.account.pinSettings.confirmPinLabel')}
                  </label>
                  <input
                    type="password"
                    value={pinSettings.confirmPin}
                    onChange={(e) => setPinSettings(prev => ({ ...prev, confirmPin: e.target.value }))}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="••••"
                    maxLength={6}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSavePin}>
                    {t('common.save')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelPin}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Permissions */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">{t('profile.settings.account.permissions.title')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {currentProfile.permissions?.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Icon name="Check" size={14} className="text-green-500" />
                  <span className="text-sm text-foreground capitalize">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    { 
      id: 'preferences', 
      label: t('profile.settings.tabs.preferences'), 
      icon: 'Settings',
      content: () => {
        // Get current language from localStorage
        const currentLanguage = localStorage.getItem('language') || 'fr';
        
        // Language options
        const languages = [
          { code: 'fr', name: 'Français', flag: '🇫🇷' },
          { code: 'en', name: 'English', flag: '🇬🇧' },
          { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
        ];

        // Find current language details
        const selectedLanguageDetails = languages.find(lang => lang.code === currentLanguage) || languages[0];

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">{t('profile.settings.preferences.applicationSettings')}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-foreground">{t('profile.settings.preferences.darkMode.title')}</h5>
                    <p className="text-xs text-muted-foreground">{t('profile.settings.preferences.darkMode.description')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('common.toggleButton')}
                  </Button>
                </div>
                
                {/* Language Selection */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-foreground">{t('profile.settings.preferences.language.title')}</h5>
                    <p className="text-xs text-muted-foreground">
                      {selectedLanguageDetails.name}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => {
                            // Update localStorage with selected language
                            localStorage.setItem('language', language.code);
                            
                            // Reload to apply translations
                            window.location.reload();
                          }}
                          className={`
                            p-1 rounded-full transition-all duration-150
                            ${currentLanguage === language.code 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'}
                          `}
                        >
                          <span className="text-2xl">{language.flag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-foreground">{t('profile.settings.preferences.notifications.title')}</h5>
                    <p className="text-xs text-muted-foreground">{t('profile.settings.preferences.notifications.description')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('common.configure')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    { 
      id: 'security', 
      label: t('profile.settings.tabs.security'), 
      icon: 'Shield',
      content: () => (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">{t('profile.settings.security.authentication.title')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-foreground">{t('profile.settings.security.authentication.twoFactor.title')}</h5>
                  <p className="text-xs text-muted-foreground">{t('profile.settings.security.authentication.twoFactor.status')}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t('common.configure')}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-foreground">{t('profile.settings.security.authentication.resetPassword.title')}</h5>
                  <p className="text-xs text-muted-foreground">{t('profile.settings.security.authentication.resetPassword.description')}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t('common.reset')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`relative overflow-hidden ${isGlobal ? 'w-auto' : ''}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log('Button clicked!');
          toggleDropdown();
        }}
        className={`
          transition-all duration-150 ease-in-out hover:bg-muted hover-reveal cursor-pointer
          ${isGlobal 
            ? 'p-2 rounded-full bg-muted hover:bg-muted/80' 
            : `w-full p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'} ${isDropdownOpen ? 'bg-muted' : ''}`
          }
        `}
      >
        <div className={`relative rounded-full overflow-hidden bg-muted flex-shrink-0 ${isGlobal ? 'w-8 h-8' : 'w-8 h-8'}`}>
          {currentProfile ? (
            <div className="w-full h-full bg-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">
              {getProfileAvatar(currentProfile)}
            </div>
          ) : (
            <Image
              src={userInfo.avatar}
              alt={userInfo.name}
              className="w-full h-full object-cover"
            />
          )}
          {isPremium && companyProfiles.length > 1 && !isGlobal && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <Icon name="Users" size={8} className="text-primary-foreground" />
            </div>
          )}
        </div>
        
        {!isCollapsed && !isGlobal && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userInfo.role}
              </p>
            </div>
            <Icon 
              name="ChevronUp" 
              size={16} 
              color="var(--color-muted-foreground)"
              className={`transition-transform duration-150 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className={`
          fixed bg-popover border border-border rounded-lg shadow-professional-lg z-[9999]
          ${isGlobal 
            ? 'right-4 w-64' 
            : isCollapsed ? 'left-16 w-48' : 'left-4 w-64'
          }
        `}
        style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          top: isGlobal ? '72px' : 'auto',
          bottom: isGlobal ? 'auto' : '80px'
        }}
        >
          <div className="py-2">
            {isCollapsed && (
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-popover-foreground">
                  {userInfo.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userInfo.role}
                </p>
              </div>
            )}
            
            <button
              onClick={handleAccountSettings}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
            >
              <Icon name="Settings" size={16} color="currentColor" />
              <span>{t('profile.dropdown.accountSettings')}</span>
            </button>
            
            {/* Current Profile Section */}
            {isPremium && currentProfile && (
              <div className="px-4 py-2 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground mb-2">{t('profile.dropdown.currentProfile')}</div>
                <div className="flex items-center space-x-2 px-2 py-1 rounded bg-muted/50">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-semibold text-xs text-primary-foreground">
                      {getProfileAvatar(currentProfile)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${getRoleColor(currentProfile.role)} border border-background`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-popover-foreground truncate">
                      {currentProfile.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getRoleLabel(currentProfile.role)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-User Profile Section */}
            {isPremium && (
              <>
                <div className="px-4 py-2 border-t border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {companyProfiles.length > 1 
                      ? t('profile.dropdown.availableProfiles') 
                      : t('profile.dropdown.manageProfiles')
                    }
                  </div>
                  {companyProfiles.length > 1 ? (
                    <div className="space-y-1">
                      {companyProfiles.filter(profile => profile.id !== currentProfile?.id).slice(0, 3).map((profile) => {
                        const hasPin = localStorage.getItem(`profile-pin-${profile.id}`);
                        return (
                          <button
                            key={profile.id}
                            onClick={() => handleProfileSwitch(profile.id)}
                            data-profile-switch="success"
                            className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors text-popover-foreground hover:bg-muted"
                          >
                            <div className="relative">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-semibold text-xs text-primary-foreground">
                                {getProfileAvatar(profile)}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${hasPin ? 'bg-yellow-500' : getRoleColor(profile.role)} border border-background`}></div>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="truncate">{profile.name}</span>
                              {hasPin && (
                                <Icon name="Lock" size={10} className="text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {companyProfiles.length > 4 && (
                        <button
                          onClick={handleManageProfiles}
                          className="w-full text-left text-xs text-muted-foreground hover:text-popover-foreground px-2 py-1"
                        >
                          +{companyProfiles.length - 4} {t('common.more')}...
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {t('profile.dropdown.noProfiles')}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleManageProfiles}
                  className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
                >
                  <Icon name="Users" size={16} color="currentColor" />
                  <span>
                    {companyProfiles.length > 1 
                      ? t('profile.dropdown.manageProfiles') 
                      : t('profile.dropdown.createProfiles')
                    }
                  </span>
                </button>
              </>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
            >
              <Icon name="LogOut" size={16} color="currentColor" />
              <span>{t('profile.dropdown.logout')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {isAccountSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-foreground">Paramètres du compte</h3>
              <button
                onClick={() => setIsAccountSettingsOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Settings Tabs Navigation */}
            <div className="flex border-b border-border mb-6">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 text-sm 
                    ${activeSettingsTab === tab.id 
                      ? 'border-b-2 border-primary text-primary' 
                      : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Settings Content */}
            {currentProfile && (
              <div>
                {settingsTabs.find(tab => tab.id === activeSettingsTab)?.content()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;