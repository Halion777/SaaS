import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Image from '../AppImage';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import PinModal from './PinModal';
import ProcessingOverlay from './ProcessingOverlay';
import { useMultiUser } from '../../context/MultiUserContext';
import { useAuth } from '../../context/AuthContext';
import emailVerificationService from '../../services/emailVerificationService';
import { resetPassword } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import CompanyInfoModal from '../../pages/quote-creation/components/CompanyInfoModal';

const UserProfile = ({ user, onLogout, isCollapsed = false, isGlobal = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [pinSettings, setPinSettings] = useState({
    hasPin: false,
    pin: '',
    confirmPin: '',
    isSettingPin: false
  });
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    targetProfileId: null,
    targetProfileName: '',
    error: ''
  });
  const dropdownRef = useRef(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [userAccountData, setUserAccountData] = useState(null);
  const [loadingAccountData, setLoadingAccountData] = useState(false);
  const [isAccountInfoExpanded, setIsAccountInfoExpanded] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isCompanyInfoModalOpen, setIsCompanyInfoModalOpen] = useState(false);
  const [editingAccountData, setEditingAccountData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    country: '',
    business_size: ''
  });
  const [savingAccountData, setSavingAccountData] = useState(false);

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
    isAdmin,
    updateProfile,
    userProfile
  } = multiUserContext || {
    currentProfile: null,
    companyProfiles: [],
    switchProfile: () => {},
    isPremium: false,
    getProfileAvatar: () => '',
    getRoleColor: () => '',
    getRoleLabel: () => '',
    isAdmin: () => false,
    updateProfile: () => {},
    userProfile: null
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
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleAccountSettings = () => {
    setIsDropdownOpen(false);
    setIsAccountSettingsOpen(true);
    
    // Load current PIN settings
    if (currentProfile) {
      const hasPin = currentProfile.pin && currentProfile.pin.trim() !== '';
      setPinSettings(prev => ({
        ...prev,
        hasPin: hasPin,
        isSettingPin: false
      }));
    }
    
    // Load subscription data
    loadSubscriptionData();
    
    // Check email verification status
    checkEmailVerificationStatus();
    
    // Load account data
    loadAccountData();
  };

  // Check email verification status
  const checkEmailVerificationStatus = async () => {
    if (!actualUser?.id) return;
    
    try {
      const status = await emailVerificationService.getVerificationStatus(actualUser.id);
      setEmailVerified(status.verified);
    } catch (error) {
      console.error('Error checking email verification:', error);
    }
  };

  // Handle verify email button click
  const handleVerifyEmail = async () => {
    if (!actualUser?.email) {
      alert('No email address found');
      return;
    }

    if (emailVerified) {
      return; // Already verified
    }

    setSendingVerification(true);
    
    try {
      const result = await emailVerificationService.sendVerificationEmail(actualUser.email);
      
      if (result.success) {
        alert('✅ Verification email sent!\n\nPlease check your inbox and click the verification link.');
      } else {
        alert(`❌ Failed to send verification email:\n${result.error}`);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('An unexpected error occurred');
    } finally {
      setSendingVerification(false);
    }
  };

  // Handle reset password button click
  const handleResetPassword = async () => {
    if (!actualUser?.email) {
      alert('No email address found');
      return;
    }

    setSendingPasswordReset(true);
    
    try {
      const { error } = await resetPassword(actualUser.email);
      
      if (error) {
        alert(`❌ Failed to send password reset email:\n${error.message}`);
      } else {
        alert('✅ Password reset email sent!\n\nPlease check your inbox and click the link to reset your password.');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('An unexpected error occurred');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  // Handle change email
  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.trim()) {
      alert('Please enter a new email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (newEmail === actualUser?.email) {
      alert('New email is the same as current email');
      return;
    }

    setChangingEmail(true);
    
    try {
      const { supabase } = await import('../../services/supabaseClient');
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) {
        alert(`❌ Failed to update email:\n${error.message}`);
      } else {
        alert('✅ Email update confirmation sent!\n\nPlease check your new email inbox and click the confirmation link to complete the change.');
        setIsChangingEmail(false);
        setNewEmail('');
      }
    } catch (error) {
      console.error('Error changing email:', error);
      alert('An unexpected error occurred');
    } finally {
      setChangingEmail(false);
    }
  };

  // Load account data from database
  const loadAccountData = async () => {
    if (!actualUser?.id) {
      console.log('No user found, skipping account data load');
      return;
    }
    
    try {
      setLoadingAccountData(true);
      const { supabase } = await import('../../services/supabaseClient');
      
      const { data, error } = await supabase
        .from('users')
        .select('email, first_name, last_name, company_name, phone, country, vat_number, profession, business_size')
        .eq('id', actualUser.id)
        .single();

      if (error) {
        console.error('Error loading account data:', error);
        return;
      }

      // Construct full_name from first_name and last_name
      if (data) {
        data.full_name = (data.first_name && data.last_name 
          ? `${data.first_name} ${data.last_name}`.trim()
          : data.first_name || data.last_name || '');
      }

      // Load company info from company_profiles to get the correct company name
      try {
        const { loadCompanyInfo } = await import('../../services/companyInfoService');
        const companyInfo = await loadCompanyInfo(actualUser.id);
        if (companyInfo && companyInfo.name) {
          // Use company name from company_profiles if available (preferred over users.company_name)
          data.company_name = companyInfo.name;
        }
      } catch (companyError) {
        console.log('Could not load company info for account display:', companyError);
        // Continue with users.company_name if company_profiles is not available
      }

      setUserAccountData(data);
      // Initialize editing data
      setEditingAccountData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company_name: data.company_name || '',
        phone: data.phone || '',
        country: data.country || '',
        business_size: data.business_size || ''
      });
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoadingAccountData(false);
    }
  };

  // Save account data
  const saveAccountData = async () => {
    if (!actualUser?.id) return;
    
    // Validate phone number - should be between 9-15 digits with optional + prefix
    if (editingAccountData.phone && editingAccountData.phone.trim()) {
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      const phoneWithoutSpaces = editingAccountData.phone.replace(/\s/g, '');
      if (!phoneRegex.test(phoneWithoutSpaces)) {
        alert(t('errors.invalidPhone', 'Please enter a valid phone number (9-15 digits)'));
        return;
      }
    }
    
    try {
      setSavingAccountData(true);
      
      // Update user record in database
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editingAccountData.first_name,
          last_name: editingAccountData.last_name,
          company_name: editingAccountData.company_name,
          phone: editingAccountData.phone,
          country: editingAccountData.country,
          business_size: editingAccountData.business_size
        })
        .eq('id', actualUser.id);

      if (error) {
        console.error('Error saving account data:', error);
        alert(t('profile.settings.account.saveError', 'Failed to save account data. Please try again.'));
        return;
      }

      // Reload account data to reflect changes
      await loadAccountData();
      setIsEditingAccount(false);
    } catch (error) {
      console.error('Error saving account data:', error);
      alert(t('profile.settings.account.saveError', 'Failed to save account data. Please try again.'));
    } finally {
      setSavingAccountData(false);
    }
  };

  // Cancel editing
  const cancelEditingAccount = () => {
    if (userAccountData) {
      setEditingAccountData({
        first_name: userAccountData.first_name || '',
        last_name: userAccountData.last_name || '',
        company_name: userAccountData.company_name || '',
        phone: userAccountData.phone || '',
        country: userAccountData.country || '',
        business_size: userAccountData.business_size || ''
      });
    }
    setIsEditingAccount(false);
  };

  const loadSubscriptionData = async () => {
    if (!actualUser) {
      console.log('No user found, skipping subscription load');
      return;
    }
    
    try {
      setLoadingSubscription(true);
      const { supabase } = await import('../../services/supabaseClient');
      
      console.log('Loading subscription for user:', actualUser.id);
      
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', actualUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        // Don't set null if it's just "no rows" error
        if (error.code !== 'PGRST116') {
          setSubscription(null);
        }
        return;
      }

      console.log('Subscription data received:', subscriptionData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleManageBilling = () => {
    // Navigate to in-platform subscription management page
    navigate('/subscription');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trialing': 
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': 
      case 'trial': return 'Trial';
      case 'cancelled': return 'Cancelled';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  const handleProfileSwitch = async (profileId) => {
    try {
      // Check if target profile has PIN protection
      const targetProfile = companyProfiles.find(p => p.id === profileId);
      const hasPin = targetProfile?.pin && targetProfile.pin.trim() !== '';
      
      if (hasPin) {
        // Show PIN modal for protected profile
        setPinModal({
          isOpen: true,
          targetProfileId: profileId,
          targetProfileName: targetProfile.name,
          error: ''
        });
        return;
      }
      
      // No PIN required, switch directly
      await performProfileSwitch(profileId);
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  };

  const performProfileSwitch = async (profileId) => {
    try {
      const result = await switchProfile(profileId);
      
      setIsDropdownOpen(false);
      
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
      console.error('Error performing profile switch:', error);
      throw error;
    }
  };

  const handlePinConfirm = async (pin) => {
    try {
      const targetProfile = companyProfiles.find(p => p.id === pinModal.targetProfileId);
      
      if (pin !== targetProfile?.pin) {
        // Set error message for incorrect PIN
        setPinModal(prev => ({
          ...prev,
          error: 'Code PIN incorrect'
        }));
        return;
      }
      
      // Clear any previous error
      setPinModal(prev => ({
        ...prev,
        error: ''
      }));
      
      // PIN is correct, perform the switch
      await performProfileSwitch(pinModal.targetProfileId);
      
      // Close the modal
      setPinModal({
        isOpen: false,
        targetProfileId: null,
        targetProfileName: '',
        error: ''
      });
    } catch (error) {
      console.error('Error confirming PIN:', error);
      setPinModal(prev => ({
        ...prev,
        error: 'Erreur lors de la vérification du PIN'
      }));
    }
  };

  const handlePinModalClose = () => {
    setPinModal({
      isOpen: false,
      targetProfileId: null,
      targetProfileName: '',
      error: ''
    });
  };

  const handleManageProfiles = () => {
    setIsDropdownOpen(false);
    navigate('/multi-user-profiles');
  };

  const handleSetPin = () => {
    setPinSettings(prev => ({ ...prev, isSettingPin: true, pin: '', confirmPin: '' }));
  };

  const handleSavePin = async () => {
    if (pinSettings.pin !== pinSettings.confirmPin) {
      alert('Les codes PIN ne correspondent pas');
      return;
    }
    
    if (pinSettings.pin.length < 4) {
      alert('Le code PIN doit contenir au moins 4 chiffres');
      return;
    }
    
    if (currentProfile) {
      try {
        // Update the profile with the new PIN
        await updateProfile(currentProfile.id, { pin: pinSettings.pin });
        
        // Update local state
        setPinSettings(prev => ({ 
          ...prev, 
          hasPin: true, 
          isSettingPin: false, 
          pin: '', 
          confirmPin: '' 
        }));
        
        alert('Code PIN configuré avec succès');
      } catch (error) {
        console.error('Error saving PIN:', error);
        alert('Erreur lors de la configuration du code PIN');
      }
    } else {
      console.error('No current profile found');
      alert('Aucun profil actuel trouvé');
    }
  };

  const handleRemovePin = async () => {
    if (currentProfile) {
      try {
        // Remove the PIN from the profile
        await updateProfile(currentProfile.id, { pin: '' });
        
        // Update local state
        setPinSettings(prev => ({ 
          ...prev, 
          hasPin: false, 
          pin: '', 
          confirmPin: '' 
        }));
        
        alert('Code PIN supprimé');
      } catch (error) {
        console.error('Error removing PIN:', error);
        alert('Erreur lors de la suppression du code PIN');
      }
    }
  };

  // Check if user can edit PIN (admin or own profile)
  const canEditPin = () => {
    // Admin can always edit PIN, or if user owns the current profile
    if (isAdmin()) {
      return true;
    }
    // Check if current profile belongs to the current user
    if (currentProfile && user) {
      // Profile belongs to user if user_id matches or if it's the user's own profile
      return currentProfile.user_id === user.id || currentProfile.id === user.id;
    }
    return false;
  };

  const handleCancelPin = () => {
    setPinSettings(prev => ({ 
      ...prev, 
      isSettingPin: false, 
      pin: '', 
      confirmPin: '' 
    }));
  };

  // Check if user can manage subscription (admin or no profiles set up)
  const canManageSubscription = () => {
    return companyProfiles.length === 0 || isAdmin();
  };

  const renderSubscriptionSection = () => (
        <div className="space-y-3">
          {loadingSubscription ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : subscription ? (
            <>
              {/* Plan and Status */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {subscription.plan_name || 'Unknown Plan'}
                  </p>
                  {(subscription.status === 'trial' || subscription.status === 'trialing') && subscription.trial_end ? (
                    <>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('profile.settings.subscription.trialEnds', 'Trial ends {{date}}', { date: new Date(subscription.trial_end).toLocaleDateString() })}
                      </p>
                      <p className="text-xs font-medium text-foreground mt-1">
                        {t('profile.settings.subscription.thenAmount', 'Then €{{amount}}/{{period}}', { amount: subscription.amount || 0, period: subscription.billing_cycle || subscription.interval || 'month' })}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('profile.settings.subscription.amount', '€{{amount}}/{{period}}', { amount: subscription.amount || 0, period: subscription.billing_cycle || subscription.interval || 'month' })}
                    </p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                  {getStatusText(subscription.status)}
                </span>
              </div>

              {/* Action Button - Only visible to admins */}
              {canManageSubscription() && (
                <div className="pt-1">
                  <Button
                    onClick={handleManageBilling}
                    className="w-full flex items-center justify-center gap-1.5"
                    size="sm"
                  >
                    <Icon name="CreditCard" size={14} />
                    <span className="text-xs">{t('profile.settings.subscription.manageSubscription', 'Manage Subscription')}</span>
                  </Button>
                </div>
              )}
              {!canManageSubscription() && (
                <p className="text-xs text-muted-foreground text-center pt-1 italic">
                  {t('subscription.adminOnlyNote', 'Contact admin to manage subscription')}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Icon name="AlertCircle" size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">{t('profile.settings.subscription.noActiveSubscription', 'No active subscription')}</p>
              {canManageSubscription() && (
                <Button
                  onClick={handleManageBilling}
                  size="sm"
                >
                  {t('profile.settings.subscription.subscribeNow', 'Subscribe Now')}
                </Button>
              )}
            </div>
          )}
        </div>
  );

  const renderAccountSection = () => {
    const businessSizeOptions = [
      { value: 'solo', label: t('registerForm.step2.solo', 'Solo') },
      { value: 'small', label: t('registerForm.step2.small', 'Small') },
      { value: 'medium', label: t('registerForm.step2.medium', 'Medium') },
      { value: 'large', label: t('registerForm.step2.large', 'Large') }
    ];

    return (
      <div className="space-y-4">
        {/* Account Information */}
        {loadingAccountData ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : userAccountData && (
          <div className="pb-4 border-b border-border">
            {/* Email - Always Visible */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {userAccountData.email && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.email')}</label>
                    <p className="text-sm text-foreground mt-0.5">{userAccountData.email}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAccountInfoExpanded && (
                  <button
                    onClick={() => {
                      if (isEditingAccount) {
                        cancelEditingAccount();
                      } else {
                        setIsEditingAccount(true);
                      }
                    }}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    title={isEditingAccount ? t('profile.settings.account.cancel', 'Cancel') : t('profile.settings.account.edit', 'Edit')}
                  >
                    <Icon 
                      name={isEditingAccount ? "X" : "Edit"} 
                      size={18} 
                      className="text-muted-foreground"
                    />
                  </button>
                )}
                <button
                  onClick={() => setIsAccountInfoExpanded(!isAccountInfoExpanded)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <Icon 
                    name={isAccountInfoExpanded ? "ChevronUp" : "ChevronDown"} 
                    size={18} 
                    className="text-muted-foreground"
                  />
                </button>
              </div>
            </div>
            
            {/* Expanded Information */}
            {isAccountInfoExpanded && (
              <div className="space-y-3 mt-3 pt-3 border-t border-border">
                {isEditingAccount ? (
                  <>
                    {/* Full Name - Split into First and Last */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t('profile.settings.account.firstName', 'First Name')}
                        value={editingAccountData.first_name}
                        onChange={(e) => setEditingAccountData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder={t('profile.settings.account.firstNamePlaceholder', 'Enter first name')}
                      />
                      <Input
                        label={t('profile.settings.account.lastName', 'Last Name')}
                        value={editingAccountData.last_name}
                        onChange={(e) => setEditingAccountData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder={t('profile.settings.account.lastNamePlaceholder', 'Enter last name')}
                      />
                    </div>
                    
                    {/* Company Name */}
                    <Input
                      label={t('profile.settings.account.companyName')}
                      value={editingAccountData.company_name}
                      onChange={(e) => setEditingAccountData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder={t('profile.settings.account.companyNamePlaceholder', 'Enter company name')}
                    />
                    
                    {/* Phone */}
                    <Input
                      label={t('profile.settings.account.phone')}
                      value={editingAccountData.phone}
                      onChange={(e) => setEditingAccountData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t('profile.settings.account.phonePlaceholder', 'Enter phone number')}
                      type="tel"
                    />
                    
                    {/* Country */}
                    <Input
                      label={t('profile.settings.account.country')}
                      value={editingAccountData.country}
                      onChange={(e) => setEditingAccountData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder={t('profile.settings.account.countryPlaceholder', 'Enter country code')}
                    />
                    
                    {/* Business Size */}
                    <Select
                      label={t('profile.settings.account.businessSize', 'Company Size')}
                      options={businessSizeOptions}
                      value={editingAccountData.business_size}
                      onChange={(e) => setEditingAccountData(prev => ({ ...prev, business_size: e.target.value }))}
                      placeholder={t('profile.settings.account.businessSizePlaceholder', 'Select company size')}
                    />
                    
                    {/* Save/Cancel Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={saveAccountData}
                        disabled={savingAccountData}
                        className="flex-1"
                        size="sm"
                      >
                        {savingAccountData ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t('profile.settings.account.saving', 'Saving...')}
                          </>
                        ) : (
                          <>
                            <Icon name="Save" size={16} className="mr-2" />
                            {t('profile.settings.account.save', 'Save')}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditingAccount}
                        variant="outline"
                        disabled={savingAccountData}
                        className="flex-1"
                        size="sm"
                      >
                        <Icon name="X" size={16} className="mr-2" />
                        {t('profile.settings.account.cancel', 'Cancel')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Full Name */}
                    {userAccountData.full_name && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.fullName')}</label>
                        <p className="text-sm text-foreground mt-0.5">{userAccountData.full_name}</p>
                      </div>
                    )}
                    
                    {/* Company Name */}
                    {userAccountData.company_name && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.companyName')}</label>
                        <p className="text-sm text-foreground mt-0.5">{userAccountData.company_name}</p>
                      </div>
                    )}
                    
                    {/* Phone */}
                    {userAccountData.phone && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.phone')}</label>
                        <p className="text-sm text-foreground mt-0.5">{userAccountData.phone}</p>
                      </div>
                    )}
                    
                    {/* Country */}
                    {userAccountData.country && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.country')}</label>
                        <p className="text-sm text-foreground mt-0.5">{userAccountData.country}</p>
                      </div>
                    )}
                    
                    {/* Business Size */}
                    {userAccountData.business_size && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('profile.settings.account.businessSize', 'Company Size')}</label>
                        <p className="text-sm text-foreground mt-0.5 capitalize">
                          {businessSizeOptions.find(opt => opt.value === userAccountData.business_size)?.label || userAccountData.business_size}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* PIN Settings */}
        <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">{t('profile.settings.account.pinSettings.title')}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                  {pinSettings.hasPin 
                    ? t('profile.settings.account.pinSettings.configured') 
                    : t('profile.settings.account.pinSettings.notConfigured')
                  }
                </p>
                {!canEditPin() && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">
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
            <div className="space-y-3 bg-muted/30 rounded-lg p-4 mt-3">
                <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                    {t('profile.settings.account.pinSettings.newPinLabel')}
                  </label>
                  <input
                    type="password"
                    value={pinSettings.pin}
                    onChange={(e) => setPinSettings(prev => ({ ...prev, pin: e.target.value }))}
                  className="w-full p-2 text-sm border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••"
                    maxLength={6}
                  />
                </div>
                <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                    {t('profile.settings.account.pinSettings.confirmPinLabel')}
                  </label>
                  <input
                    type="password"
                    value={pinSettings.confirmPin}
                    onChange={(e) => setPinSettings(prev => ({ ...prev, confirmPin: e.target.value }))}
                  className="w-full p-2 text-sm border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="••••"
                    maxLength={6}
                  />
                </div>
              <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePin}>
                    {t('common.save')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelPin}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}

        {/* Company Settings */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Icon name="Building2" size={16} className="text-primary" />
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {t('profile.settings.account.companyInfo.title', 'Company Information')}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('profile.settings.account.companyInfo.description', 'Manage company details, logo, and signature')}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Close account settings first, then open company modal
              setIsAccountSettingsOpen(false);
              // Small delay to ensure account settings closes before opening company modal
              setTimeout(() => {
                setIsCompanyInfoModalOpen(true);
              }, 100);
            }}
            className="flex items-center gap-2"
          >
            <Icon name="Settings" size={16} />
            {t('profile.settings.account.companyInfo.manage', 'Manage')}
          </Button>
        </div>
      </div>
    );
  };

  const renderPreferencesSection = () => {
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
            <div className="space-y-4">
                {/* Language Selection */}
                <div className="flex items-center justify-between">
              <div className="flex-1">
                    <h5 className="text-sm font-medium text-foreground">{t('profile.settings.preferences.language.title')}</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLanguageDetails.flag} {selectedLanguageDetails.name}
                    </p>
                  </div>
              <div className="flex items-center gap-1">
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => {
                            localStorage.setItem('language', language.code);
                            window.location.reload();
                          }}
                          className={`
                      w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150
                            ${currentLanguage === language.code 
                        ? 'bg-primary/10 ring-2 ring-primary' 
                              : 'hover:bg-muted'}
                          `}
                    title={language.name}
                        >
                    <span className="text-xl">{language.flag}</span>
                        </button>
                      ))}
                  </div>
                </div>
            </div>
        );
  };

  // Check if user can manage security settings (admin or no profiles set up)
  const canManageSecuritySettings = () => {
    return companyProfiles.length === 0 || isAdmin();
  };

  const renderSecuritySection = () => (
          <div className="space-y-4">
          {/* Email Verification */}
              <div className="flex items-center justify-between">
            <div className="flex-1">
                  <h5 className="text-sm font-medium text-foreground">{t('profile.settings.security.authentication.twoFactor.title')}</h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                {emailVerified 
                  ? '✓ Email verified' 
                  : sendingVerification 
                    ? 'Sending verification email...' 
                    : t('profile.settings.security.authentication.twoFactor.status')
                }
              </p>
                </div>
            {emailVerified ? (
              <Icon name="CheckCircle" size={20} className="text-green-600" />
            ) : (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleVerifyEmail}
                disabled={sendingVerification}
              >
                {sendingVerification ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Verify'
                )}
                </Button>
            )}
              </div>
          
          {/* Reset Password - Admin only */}
          {canManageSecuritySettings() && (
              <div className="flex items-center justify-between">
            <div className="flex-1">
                  <h5 className="text-sm font-medium text-foreground">{t('profile.settings.security.authentication.resetPassword.title')}</h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sendingPasswordReset 
                  ? 'Sending reset email...' 
                  : t('profile.settings.security.authentication.resetPassword.description')
                }
              </p>
                </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetPassword}
              disabled={sendingPasswordReset}
            >
              {sendingPasswordReset ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                t('common.reset')
              )}
                </Button>
              </div>
          )}
          {!canManageSecuritySettings() && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-foreground">{t('profile.settings.security.authentication.resetPassword.title')}</h5>
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {t('profile.settings.security.adminOnlyNote', 'Contact admin to reset password')}
                </p>
              </div>
            </div>
          )}
            </div>
  );

  return (
    <div className={`relative overflow-hidden ${isGlobal ? 'w-auto' : ''}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
            currentProfile.avatar ? (
              <Image
                src={currentProfile.avatar}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">
                {getProfileAvatar(currentProfile)}
              </div>
            )
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
                    {currentProfile.avatar ? (
                      <Image
                        src={currentProfile.avatar}
                        alt={currentProfile.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-semibold text-xs text-primary-foreground">
                        {getProfileAvatar(currentProfile)}
                      </div>
                    )}
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
            {(isPremium || isAdmin() || companyProfiles.length > 1) && (
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
                        const hasPin = profile?.pin && profile.pin.trim() !== '';
                        return (
                          <button
                            key={profile.id}
                            onClick={() => handleProfileSwitch(profile.id)}
                            data-profile-switch="success"
                            className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors text-popover-foreground hover:bg-muted"
                          >
                            <div className="relative">
                              {profile.avatar ? (
                                <Image
                                  src={profile.avatar}
                                  alt={profile.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-semibold text-xs text-primary-foreground">
                                  {getProfileAvatar(profile)}
                                </div>
                              )}
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
                      : (userProfile?.selected_plan === 'starter' 
                          ? t('profile.dropdown.profile', 'Profile')
                          : t('profile.dropdown.createProfiles'))
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

      {/* Account Settings Panel - Nested View */}
      {isAccountSettingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-[9999] transition-opacity"
                onClick={() => setIsAccountSettingsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div 
                  className={`
              fixed bg-card border border-border rounded-lg shadow-2xl z-[10000]
              transition-all duration-300 ease-out
              ${isGlobal 
                ? 'right-4 top-20 w-96' 
                : isCollapsed 
                  ? 'left-20 bottom-24 w-96' 
                  : 'left-6 bottom-24 w-96'
              }
              max-h-[calc(100vh-120px)] flex flex-col
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon name="Settings" size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t('profile.dropdown.accountSettings')}
                  </h3>
                  <p className="text-xs text-muted-foreground">Manage your account preferences</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountSettingsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon name="X" size={18} />
                </button>
            </div>

            {/* All Settings Content - Stacked with Separators */}
            <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Account Section */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Icon name="User" size={16} className="text-primary" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('profile.settings.tabs.account')}
                  </h4>
              </div>
                {renderAccountSection()}
          </div>

              {/* Preferences Section */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Icon name="Settings" size={16} className="text-primary" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('profile.settings.tabs.preferences')}
                  </h4>
                </div>
                {renderPreferencesSection()}
              </div>

              {/* Security Section */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Icon name="Shield" size={16} className="text-primary" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('profile.settings.tabs.security')}
                  </h4>
                </div>
                {renderSecuritySection()}
              </div>

              {/* Subscription Section */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Icon name="CreditCard" size={16} className="text-primary" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('profile.settings.tabs.subscription') || 'Subscription'}
                  </h4>
                </div>
                {renderSubscriptionSection()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PIN Modal for Profile Switching */}
      <PinModal
        isOpen={pinModal.isOpen}
        onClose={handlePinModalClose}
        onConfirm={handlePinConfirm}
        profileName={pinModal.targetProfileName}
        title="Code PIN requis"
        message="Entrez le code PIN pour accéder à ce profil"
        error={pinModal.error}
      />

      {/* Company Info Modal */}
      <CompanyInfoModal
        isOpen={isCompanyInfoModalOpen}
        onClose={() => setIsCompanyInfoModalOpen(false)}
        onSave={(companyInfo) => {
          // Company info is saved automatically by the modal
          setIsCompanyInfoModalOpen(false);
        }}
        onCompanyInfoChange={(companyInfo) => {
          // Optional: Handle company info changes if needed
        }}
      />

    </div>
  );
};

export default UserProfile;