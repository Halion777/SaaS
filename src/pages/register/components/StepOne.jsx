import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { COUNTRY_PHONE_CODES } from '../../../utils/countryCodes';
import { supabase } from '../../../services/supabaseClient';
import emailVerificationService from '../../../services/emailVerificationService';


const StepOne = ({ formData, updateFormData, errors, onIncompleteRegistrationDetected }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    COUNTRY_PHONE_CODES[formData.country] || '+32'
  );
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailFormatError, setEmailFormatError] = useState('');
  const [professionDropdownOpen, setProfessionDropdownOpen] = useState(false);

  // Email validation function - checks for proper email format
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    // Trim and lowercase
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email starts with dot (invalid)
    if (trimmedEmail.startsWith('.')) return false;
    
    // RFC 5322 compliant regex (simplified but more strict than basic)
    const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    
    // Check basic format
    if (!emailRegex.test(trimmedEmail)) {
      return false;
    }
    
    // Additional checks
    // - Must not start or end with dot
    // - Must not have consecutive dots
    // - Domain must have at least one dot
    // - Must not have invalid characters at the end
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    
    // Local part checks
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;
    
    // Domain checks
    if (domain.length === 0 || domain.length > 253) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;
    if (!domain.includes('.')) return false;
    
    // Domain must have valid TLD (at least 2 characters after last dot)
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2) return false;
    
    // Check TLD - must be only letters (no numbers or invalid characters)
    // This catches cases like "email@gmail.com7" or "email@gmail.com89"
    if (!/^[a-z]+$/i.test(tld)) return false;
    
    // Check if domain has any invalid characters after TLD
    // Look for patterns like ".com89" or ".com" followed by numbers/invalid chars
    // Split domain by dots and check each part
    for (let i = 0; i < domainParts.length; i++) {
      const part = domainParts[i];
      // Each part should only contain letters, numbers, and hyphens (but not start/end with hyphen)
      if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(part)) return false;
      
      // For TLD (last part), it should only be letters
      if (i === domainParts.length - 1 && !/^[a-z]+$/i.test(part)) return false;
    }
    
    // Additional check: Look for numbers or invalid characters immediately after TLD in the full domain
    // This catches cases where someone might have "gmail.com89" as the domain
    const domainWithoutTLD = domainParts.slice(0, -1).join('.');
    const fullDomainPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]+$/i;
    if (!fullDomainPattern.test(domain)) return false;
    
    // Final check: Ensure the domain doesn't end with numbers or invalid characters
    // Extract everything after the last dot (TLD) and ensure it's only letters
    const lastDotIndex = domain.lastIndexOf('.');
    if (lastDotIndex === -1) return false;
    const tldPart = domain.substring(lastDotIndex + 1);
    if (!/^[a-z]+$/i.test(tldPart)) return false;
    
    return true;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    updateFormData('password', password);
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-error';
    if (passwordStrength < 50) return 'bg-warning';
    if (passwordStrength < 75) return 'bg-accent';
    return 'bg-success';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return t('registerForm.step1.passwordWeak');
    if (passwordStrength < 50) return t('registerForm.step1.passwordMedium');
    if (passwordStrength < 75) return t('registerForm.step1.passwordGood');
    return t('registerForm.step1.passwordExcellent');
  };

  // Recalculate password strength when component mounts or password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Check email verification status on mount and when email changes
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setEmailVerified(false);
        setVerificationSent(false);
        setVerificationError('');
        setVerificationSuccess(false);
        setResendCooldown(0);
        updateFormData('emailVerified', false);
        return;
      }

      try {
        // Check if user exists in auth and email is verified
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!error && user && user.email === formData.email.toLowerCase().trim()) {
          // User is signed in and email matches
          if (user.email_confirmed_at) {
            // Email is verified in auth
            setEmailVerified(true);
            updateFormData('emailVerified', true);
            setVerificationSent(false);
            setVerificationSuccess(true);
            setVerificationError('');
            return;
          }
        }

        // Check in public.users table if user exists
        const { checkUserRegistration } = await import('../../../services/authService');
        const checkResult = await checkUserRegistration(formData.email.toLowerCase().trim());
        
        if (checkResult.data?.userExists) {
          // Check if registration is incomplete (can resume)
          if (checkResult.data.userExists && !checkResult.data.registrationComplete) {
            // User exists with incomplete registration - skip verification requirement
            // Email was already verified in previous registration attempt
            setEmailVerified(true);
            updateFormData('emailVerified', true);
            setVerificationSent(false);
            setVerificationSuccess(true);
            setVerificationError('');
            
            // Notify parent component to auto-fill data and show resume message
            if (onIncompleteRegistrationDetected) {
              onIncompleteRegistrationDetected(formData.email.toLowerCase().trim());
            }
            return;
          }
          
          // User exists with completed registration, check if we can get their verification status
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('email_verified, email_verified_at')
              .eq('email', formData.email.toLowerCase().trim())
              .maybeSingle();

            if (userData?.email_verified) {
              // Email is verified in public.users
              setEmailVerified(true);
              updateFormData('emailVerified', true);
              setVerificationSent(false);
              setVerificationSuccess(true);
              setVerificationError('');
              return;
            }
          } catch (error) {
            // Continue to reset state if check fails
          }
        }

        // Email not verified - reset state
        setOtp('');
        setEmailVerified(false);
        setVerificationSent(false);
        setVerificationError('');
        setVerificationSuccess(false);
        setResendCooldown(0);
        updateFormData('emailVerified', false);
      } catch (error) {
        console.error('Error checking email verification:', error);
        // On error, assume not verified
        setEmailVerified(false);
        updateFormData('emailVerified', false);
      }
    };

    checkEmailVerification();
  }, [formData.email]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle send OTP verification email
  const handleSendVerification = async () => {
    // Validate email format before sending
    if (!formData.email || !isValidEmail(formData.email)) {
      setVerificationError(t('registerForm.step1.invalidEmail') || 'Please enter a valid email address (e.g., name@example.com)');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setVerificationSuccess(false);
    
    try {
      // First, check if email already exists with completed registration
      const { checkUserRegistration } = await import('../../../services/authService');
      const checkResult = await checkUserRegistration(formData.email.toLowerCase().trim());
      const checkData = checkResult.data;
      const checkError = checkResult.error;
      
      if (!checkError && checkData) {
        // If user exists and registration is complete, don't allow verification
        if (checkData.userExists && checkData.registrationComplete) {
          setVerificationError(checkData.message || 'This email is already registered. Please log in instead.');
          setIsVerifying(false);
          setVerificationSuccess(false);
          return;
        }
      }

      // Send OTP via Resend
      const result = await emailVerificationService.sendVerificationEmail(formData.email.toLowerCase().trim());

      if (result.success) {
        setVerificationSuccess(true);
        setVerificationSent(true);
        setVerificationError('');
        setOtp(''); // Reset OTP input
        // Start 30-second cooldown
        setResendCooldown(30);
      } else {
        // Handle error from edge function
        let errorMessage = result.error || 'Failed to send verification code. Please try again.';
        
        // Check for specific error messages from Resend API
        if (errorMessage.includes('Invalid `to` field') || errorMessage.includes('validation_error')) {
          errorMessage = t('registerForm.step1.invalidEmailFormat') || 'Invalid email format. Please check your email address and try again.';
        } else if (errorMessage.includes('Failed to send verification email')) {
          errorMessage = t('registerForm.step1.verificationError') || 'Failed to send verification email. Please check your email address and try again.';
        }
        
        setVerificationError(errorMessage);
        setVerificationSuccess(false);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      let errorMessage = t('registerForm.step1.verificationError') || 'Error sending verification email. Please try again.';
      
      // Check for specific error patterns
      if (error?.message?.includes('Invalid `to` field') || error?.message?.includes('validation_error')) {
        errorMessage = t('registerForm.step1.invalidEmailFormat') || 'Invalid email format. Please check your email address and try again.';
      }
      
      setVerificationError(errorMessage);
      setVerificationSuccess(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifyingOTP(true);
    setVerificationError('');

    try {
      const result = await emailVerificationService.verifyOTP(formData.email.toLowerCase().trim(), otp);

      if (result.success) {
        setEmailVerified(true);
        updateFormData('emailVerified', true);
        setVerificationSuccess(true);
        setVerificationError('');
        setOtp('');
      } else {
        setVerificationError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setVerificationError('An error occurred while verifying the code. Please try again.');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Update phone country code when country changes
  useEffect(() => {
    const code = COUNTRY_PHONE_CODES[formData.country] || '+32';
    setPhoneCountryCode(code);
  }, [formData.country]);

  // Close profession dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (professionDropdownOpen && !event.target.closest('.profession-dropdown-container')) {
        setProfessionDropdownOpen(false);
      }
    };

    if (professionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [professionDropdownOpen]);

  // Get the current unique value for the select
  const getCurrentSelectValue = () => {
    if (!phoneCountryCode) return '';
    // Find the country code that matches the current phone code and country
    const matchingCountry = Object.entries(COUNTRY_PHONE_CODES).find(
      ([countryCode, phoneCode]) => 
        phoneCode === phoneCountryCode && 
        (countryCode === formData.country || !formData.country)
    );
    if (matchingCountry) {
      return `${phoneCountryCode}_${matchingCountry[0]}`;
    }
    // Fallback: use first country with this phone code
    const firstMatch = Object.entries(COUNTRY_PHONE_CODES).find(
      ([, phoneCode]) => phoneCode === phoneCountryCode
    );
    return firstMatch ? `${phoneCountryCode}_${firstMatch[0]}` : '';
  };
  
  // Profession options with icons
  const professionOptions = [
    { 
      value: 'electrician', 
      label: t('registerForm.professions.electrician'),
      icon: <Icon name="Zap" size={16} />
    },
    { 
      value: 'plumber', 
      label: t('registerForm.professions.plumber'),
      icon: <Icon name="Wrench" size={16} />
    },
    { 
      value: 'painter', 
      label: t('registerForm.professions.painter'),
      icon: <Icon name="Brush" size={16} />
    },
    { 
      value: 'carpenter', 
      label: t('registerForm.professions.carpenter'),
      icon: <Icon name="Hammer" size={16} />
    },
    { 
      value: 'mason', 
      label: t('registerForm.professions.mason'),
      icon: <Icon name="Building" size={16} />
    },
    { 
      value: 'tiling', 
      label: t('registerForm.professions.tiling'),
      icon: <Icon name="Grid" size={16} />
    },
    { 
      value: 'roofing', 
      label: t('registerForm.professions.roofing'),
      icon: <Icon name="Home" size={16} />
    },
    { 
      value: 'heating', 
      label: t('registerForm.professions.heating'),
      icon: <Icon name="Thermometer" size={16} />
    },
    { 
      value: 'renovation', 
      label: t('registerForm.professions.renovation'),
      icon: <Icon name="Tool" size={16} />
    },
    { 
      value: 'cleaning', 
      label: t('registerForm.professions.cleaning'),
      icon: <Icon name="Sparkles" size={16} />
    },
    { 
      value: 'solar', 
      label: t('registerForm.professions.solar'),
      icon: <Icon name="Sun" size={16} />
    },
    { 
      value: 'gardening', 
      label: t('registerForm.professions.gardening'),
      icon: <Icon name="Flower" size={16} />
    },
    { 
      value: 'locksmith', 
      label: t('registerForm.professions.locksmith'),
      icon: <Icon name="Lock" size={16} />
    },
    { 
      value: 'glazing', 
      label: t('registerForm.professions.glazing'),
      icon: <Icon name="Square" size={16} />
    },
    { 
      value: 'insulation', 
      label: t('registerForm.professions.insulation'),
      icon: <Icon name="Shield" size={16} />
    },
    { 
      value: 'airConditioning', 
      label: t('registerForm.professions.airConditioning'),
      icon: <Icon name="Thermometer" size={16} />
    },
    { 
      value: 'other', 
      label: t('registerForm.professions.other'),
      icon: <Icon name="Tool" size={16} />
    }
  ];
  
  // Country options
  const countries = [
    
    { value: 'BE', label: t('registerForm.countries.BE'), icon: <Icon name="Flag" size={16} /> },
    { value: 'FR', label: t('registerForm.countries.FR'), icon: <Icon name="Flag" size={16} /> },
    { value: 'CH', label: t('registerForm.countries.CH'), icon: <Icon name="Flag" size={16} /> },
    { value: 'LU', label: t('registerForm.countries.LU'), icon: <Icon name="Flag" size={16} /> },
    { value: 'CA', label: t('registerForm.countries.CA'), icon: <Icon name="Flag" size={16} /> },
    { value: 'GB', label: t('registerForm.countries.GB'), icon: <Icon name="Flag" size={16} /> },
    { value: 'DE', label: t('registerForm.countries.DE'), icon: <Icon name="Flag" size={16} /> },
    { value: 'IT', label: t('registerForm.countries.IT'), icon: <Icon name="Flag" size={16} /> },
    { value: 'ES', label: t('registerForm.countries.ES'), icon: <Icon name="Flag" size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('registerForm.step1.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('registerForm.step1.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
        <Input
            label={t('registerForm.step1.firstName')}
          type="text"
            placeholder={t('registerForm.step1.firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            error={errors.firstName}
          required
        />
        <Input
            label={t('registerForm.step1.lastName')}
          type="text"
            placeholder={t('registerForm.step1.lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            error={errors.lastName}
          required
        />
        </div>
        
        {/* Profession Selection with Custom Dropdown */}
        <div className="profession-dropdown-container">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('registerForm.step1.profession')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfessionDropdownOpen(!professionDropdownOpen)}
              className={`w-full h-10 pl-4 pr-4 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all text-left flex items-center justify-between ${
                errors.profession ? 'border-destructive' : 'border-border'
              }`}
            >
              <span className={`flex-1 truncate ${(formData.profession || []).length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {(formData.profession || []).length > 0 
                  ? (
                    <>
                      <span className="hidden sm:inline">
                        {(formData.profession || []).map(prof => professionOptions.find(p => p.value === prof)?.label).filter(Boolean).join(', ')}
                      </span>
                      <span className="sm:hidden">
                        {(formData.profession || []).length === 1 
                          ? professionOptions.find(p => p.value === (formData.profession || [])[0])?.label
                          : `${(formData.profession || []).length} ${t('registerForm.step1.professionsSelected', 'professions selected')}`
                        }
                      </span>
                    </>
                  )
                  : t('registerForm.step1.professionPlaceholder')
                }
              </span>
              <div className="text-muted-foreground flex-shrink-0 ml-2">
                <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${professionDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {/* Dropdown Options */}
            {professionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 flex flex-col max-h-60">
                <div className="overflow-y-auto flex-1">
                  {professionOptions.map(profession => (
                    <button
                      key={profession.value}
                      type="button"
                      onClick={() => {
                        const currentProfessions = formData.profession || [];
                        const newProfessions = currentProfessions.includes(profession.value)
                          ? currentProfessions.filter(p => p !== profession.value)
                          : [...currentProfessions, profession.value];
                        updateFormData('profession', newProfessions);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground flex items-center rounded-sm ${
                        (formData.profession || []).includes(profession.value) ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center ${
                        (formData.profession || []).includes(profession.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {(formData.profession || []).includes(profession.value) && (
                          <Icon name="Check" className="w-3 h-3" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {profession.icon && (
                          <div className="flex-shrink-0">
                            {profession.icon}
                          </div>
                        )}
                        <span className="flex-1">{profession.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Done Button */}
                <div className="border-t border-border p-2 bg-popover sticky bottom-0">
                  <button
                    type="button"
                    onClick={() => setProfessionDropdownOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {t('registerForm.step1.done')}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Selected Professions Display */}
          {(formData.profession || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(formData.profession || []).map(professionValue => {
                const professionInfo = professionOptions.find(p => p.value === professionValue);
                return (
                  <span
                    key={professionValue}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                  >
                    <Icon name="CheckCircle" size={14} className="text-primary" />
                    {professionInfo?.label || professionValue}
                    <button
                      type="button"
                      onClick={() => {
                        const newProfessions = (formData.profession || []).filter(p => p !== professionValue);
                        updateFormData('profession', newProfessions);
                      }}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <Icon name="X" size={12} className="text-primary" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          
          {errors.profession && (
            <p className="text-sm text-destructive mt-1">
              {errors.profession}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1">
        <Input
          label={t('registerForm.step1.email')}
          type="email"
          placeholder={t('registerForm.step1.emailPlaceholder')}
          value={formData.email}
                  onChange={(e) => {
                    const emailValue = e.target.value;
                    updateFormData('email', emailValue);
                    setEmailVerified(false);
                    setVerificationSent(false);
                    setVerificationError('');
                    setVerificationSuccess(false);
                    updateFormData('emailVerified', false);
                    
                    // Validate email format in real-time - only if @ symbol is present
                    if (emailValue && emailValue.includes('@') && !isValidEmail(emailValue)) {
                      setEmailFormatError(t('registerForm.step1.invalidEmail') || 'Please enter a valid email address (e.g., name@example.com)');
                    } else {
                      setEmailFormatError('');
                    }
                  }}
          error={errors.email || (emailFormatError ? emailFormatError : null)}
          required
        />
              </div>
              {formData.email && (
                <Button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isVerifying || emailVerified || verificationSent || !isValidEmail(formData.email) || !!emailFormatError}
                  variant={
                    emailVerified ? "success" : 
                    verificationSuccess ? "success" : 
                    verificationError ? "destructive" : 
                    emailFormatError ? "destructive" :
                    "outline"
                  }
                  size="sm"
                  className="w-full sm:w-auto sm:flex-shrink-0 h-10 sm:mt-6"
                >
                {isVerifying ? (
                  <>
                    <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                    {t('registerForm.step1.verifying') || 'Sending...'}
                  </>
                ) : emailVerified ? (
                  <>
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    {t('registerForm.step1.verified') || 'Verified'}
                  </>
                ) : verificationSuccess ? (
                  <>
                    <Icon name="CheckCircle" size={16} />
                  </>
                ) : verificationError ? (
                  <>
                    <Icon name="XCircle" size={16} className="mr-2" />
                    {t('registerForm.step1.failed') || 'Failed'}
                  </>
                ) : (
                  <>
                    <Icon name="Mail" size={16} className="mr-2" />
                    {t('registerForm.step1.verify') || 'Verify'}
                  </>
                )}
                </Button>
              )}
            </div>
          </div>
          
          {/* OTP Input - Show after verification email is sent */}
          {verificationSent && !emailVerified && (
            <div className="space-y-3 mt-3 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={t('registerForm.step1.otpLabel') || 'Verification Code'}
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      setVerificationError('');
                    }}
                    maxLength={6}
                    error={verificationError}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={isVerifyingOTP || otp.length !== 6}
                  variant="default"
                  size="sm"
                  className="mb-0 h-10"
                >
                  {isVerifyingOTP ? (
                    <>
                      <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                      {t('registerForm.step1.verifying') || 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={16} className="mr-2" />
                      {t('registerForm.step1.confirm') || 'Confirm'}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('registerForm.step1.otpExpires') || 'Code expires in 10 minutes'}</span>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isVerifying || resendCooldown > 0}
                  className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    t('registerForm.step1.verifying') || 'Sending...'
                  ) : resendCooldown > 0 ? (
                    t('registerForm.step1.resendIn', { seconds: resendCooldown }) || `Resend in ${resendCooldown}s`
                  ) : (
                    t('registerForm.step1.resendCode') || 'Resend code'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Messages - Only show verification status, not format errors (format errors shown in input field) */}
          {formData.email && !verificationSent && !emailFormatError && (
            <div className="flex items-start gap-2 text-sm mt-2">
              {emailVerified ? (
                <>
                  <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <span className="text-success">{t('registerForm.step1.emailVerified') || 'Email verified successfully'}</span>
                </>
              ) : verificationError ? (
                <>
                  <Icon name="XCircle" size={16} className="text-error mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-error">{verificationError}</span>
                    {/* Show resend option if there was an error */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isVerifying || resendCooldown > 0}
                        className="text-primary hover:underline text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <>
                            <Icon name="Loader" size={12} className="inline mr-1 animate-spin" />
                            {t('registerForm.step1.verifying') || 'Sending...'}
                          </>
                        ) : resendCooldown > 0 ? (
                          t('registerForm.step1.resendIn', { seconds: resendCooldown }) || `Resend in ${resendCooldown}s`
                        ) : (
                          t('registerForm.step1.resendCode') || 'Resend code'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Input
              label={t('registerForm.step1.password')}
              type={showPassword ? "text" : "password"}
              placeholder={t('registerForm.step1.passwordPlaceholder')}
              value={formData.password}
              onChange={handlePasswordChange}
              error={errors.password}
              maxLength={128}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
            </button>
          </div>
          
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('registerForm.step1.passwordStrength')}</span>
                <span className={`font-medium ${
                  passwordStrength < 25 ? 'text-error' :
                  passwordStrength < 50 ? 'text-warning' :
                  passwordStrength < 75 ? 'text-accent' : 'text-success'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <Select
          label={t('registerForm.step1.country')}
          placeholder={t('registerForm.step1.countryPlaceholder')}
          options={countries}
          value={formData.country || 'BE'}
          onChange={(e) => updateFormData('country', e.target.value)}
          error={errors.country}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('registerForm.step1.phone')} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-48 flex-shrink-0">
              <Select
                label=""
                placeholder="Code"
                searchable={true}
                usePortal={true}
                maxHeight="300px"
                options={useMemo(() => 
                  Object.entries(COUNTRY_PHONE_CODES)
                    .map(([countryCode, phoneCode]) => {
                      return {
                        value: `${phoneCode}_${countryCode}`, // Make value unique by combining phone code and country code
                        phoneCode: phoneCode, // Store phone code separately
                        countryCode: countryCode, // Store country code separately
                        label: `${phoneCode} ${countryCode}`
                      };
                    })
                    .sort((a, b) => {
                      // Sort by phone code, then by country code
                      const codeA = a.phoneCode;
                      const codeB = b.phoneCode;
                      if (codeA !== codeB) {
                        return codeA.localeCompare(codeB);
                      }
                      return a.label.localeCompare(b.label);
                    }), [])}
                value={getCurrentSelectValue()}
                onChange={(e) => {
                  // Extract phone code and country code from the unique value
                  const [phoneCode, countryCode] = e.target.value.split('_');
                  setPhoneCountryCode(phoneCode);
                  if (countryCode && countryCode !== formData.country) {
                    updateFormData('country', countryCode);
                  }
                }}
                error={errors.phoneCountryCode}
              />
            </div>
            <div className="flex-1">
              <Input
                label=""
                type="tel"
                placeholder={t('registerForm.step1.phonePlaceholder')}
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                error={errors.phone}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Icon name="Zap" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              {t('registerForm.step1.aiBoost.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('registerForm.step1.aiBoost.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;