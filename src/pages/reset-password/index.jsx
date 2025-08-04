import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Footer from '../../components/Footer';

const ResetPasswordPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPasswordSame, setIsPasswordSame] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Extract recovery parameters from the URL
  const extractRecoveryParams = useCallback(() => {
    // First, check hash parameters
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    // Extract all relevant parameters
    const params = {
      accessToken: hashParams.get('access_token'),
      expiresAt: hashParams.get('expires_at'),
      expiresIn: hashParams.get('expires_in'),
      refreshToken: hashParams.get('refresh_token'),
      tokenType: hashParams.get('token_type'),
      type: hashParams.get('type')
    };

    return params;
  }, [location]);

  // Cleanup function to reset Supabase session
  const cleanupSession = useCallback(async () => {
    try {
      // Sign out to clear the current session
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during session cleanup:', err);
    }
  }, []);

  // Effect for session validation and cleanup
  useEffect(() => {
    const validateRecoveryLink = async () => {
      const { accessToken, refreshToken } = extractRecoveryParams();

      if (!accessToken || !refreshToken) {
        setError(t('errors.invalidResetLink'));
        setIsValidating(false);
        return;
      }

      try {
        // Manually set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setError(t('errors.invalidResetLink'));
          setIsValidating(false);
          return;
        }

        if (data?.session) {
          // Successfully set the session
          // Fetch the current user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          console.log('User data:', userData, 'User error:', userError);

          if (userData?.user) {
            setCurrentUser(userData.user);
          } else {
            console.error('Failed to fetch user:', userError);
            setError(t('errors.invalidResetLink'));
          }

          setIsValidating(false);
        } else {
          setError(t('errors.invalidResetLink'));
          setIsValidating(false);
        }
      } catch (catchError) {
        console.error('Error during recovery link validation:', catchError);
        setError(t('errors.invalidResetLink'));
        setIsValidating(false);
      }
    };

    validateRecoveryLink();

    // Cleanup function to reset session when component unmounts
    return () => {
      cleanupSession();
    };
  }, [location, t, extractRecoveryParams, cleanupSession]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
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

  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Client-side password validation function
  const validatePasswordSameness = useCallback((newPassword) => {
    // Basic checks before making any API calls
    if (!currentUser?.email || !newPassword || newPassword.length < 8) {
      setIsPasswordSame(false);
      setPasswordError('');
      return false;
    }

    // More robust client-side comparison
    const isClientSideSame = newPassword.length === currentUser.user_metadata?.password_length;
    setIsPasswordSame(isClientSideSame);
    
    if (isClientSideSame) {
      setPasswordError(t('errors.passwordSameAsCurrent'));
      return true;
    }

    setPasswordError('');
    return false;
  }, [currentUser, t]);

  // Debounced password check with minimal API interaction
  const checkPasswordSameness = useCallback(
    debounce(async (newPassword) => {
      // Only perform API check if client-side validation suggests potential sameness
      if (validatePasswordSameness(newPassword)) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: newPassword
          });
          
          const passwordIsSame = !error;
          setIsPasswordSame(passwordIsSame);
          
          if (passwordIsSame) {
            setPasswordError(t('errors.passwordSameAsCurrent'));
          } else {
            setPasswordError('');
          }
        } catch (err) {
          // Reset state if API call fails
          setIsPasswordSame(false);
          setPasswordError('');
        }
      }
    }, 500),
    [validatePasswordSameness, t]
  );

  // Effect to check password sameness
  useEffect(() => {
    if (currentUser?.email) {
      checkPasswordSameness(password);
    }
  }, [currentUser, password, checkPasswordSameness]);

  const isPasswordSameAsCurrent = () => {
    // This function checks if the password is the same as the current password
    return isPasswordSame;
  };

  const isSubmitDisabled = () => {
    return !password || 
           !confirmPassword || 
           password !== confirmPassword || 
           password.length < 8 || 
           isLoading ||
           (currentUser?.email ? isPasswordSame : false);
  };

  const validateForm = () => {
    if (!password) {
      setPasswordError(t('errors.passwordRequired'));
      return false;
    }
    if (password.length < 8) {
      setPasswordError(t('errors.passwordTooShort'));
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError(t('errors.passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Perform final validation before submission
      if (validatePasswordSameness(password)) {
        setIsLoading(false);
        return;
      }

      // Proceed with password update
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message || t('errors.passwordUpdateFailed'));
        return;
      }

      // Update user metadata to help with future client-side checks
      await supabase.auth.updateUser({
        data: { password_length: password.length }
      });

      setIsSuccess(true);
      await cleanupSession();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      setError(t('errors.passwordUpdateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t('resetPassword.validating')}
          </h2>
          <p className="text-gray-600">
            {t('resetPassword.validatingMessage')}
          </p>
        </div>
      </div>
    );
  }

  // Show error if validation failed
  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-xl shadow-professional text-center p-8">
            <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon 
                name="AlertCircle" 
                size={48} 
                color="var(--color-error)" 
                className="w-12 h-12"
              />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {t('resetPassword.invalidLink')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {t('errors.invalidResetLink')}
            </p>
            
            <div className="flex justify-center space-x-4">
              <Link to="/forgot-password" className="w-full">
                <Button 
                  variant="outline" 
                  size="md" 
                  className="w-full py-3 px-4"
                >
                  {t('resetPassword.backToForgotPassword')}
                </Button>
              </Link>
              
              <Button 
                variant="login" 
                size="md" 
                className="w-full py-3 px-4"
                onClick={() => window.location.reload()}
              >
                {t('resetPassword.tryAgain')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('meta.resetPassword.title')}</title>
        <meta name="description" content={t('meta.resetPassword.description')} />
        <html lang={i18n.language} />
      </Helmet>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute top-0 left-0 right-0 h-40 bg-blue-600 transform -skew-y-3 origin-top-right"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-amber-600 transform skew-y-3 origin-bottom-left"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Home Navigation */}
        <div className="absolute top-4 left-4 z-20">
          <Link to="/" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
            <Icon name="Home" className="w-5 h-5" />
            <span className="text-sm font-medium">{t('nav.home')}</span>
          </Link>
        </div>
        
        <div className="max-w-md mx-auto my-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/assets/logo/logo.png" 
              alt="Haliqo Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-professional p-8">
            {!isSuccess ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('resetPassword.title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('resetPassword.subtitle')}
                  </p>
                </div>
                
                {/* Error Display */}
                {(error || passwordError) && (
                  <div className="mb-4 bg-error/10 border border-error/30 rounded-lg p-3 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon 
                        name="AlertCircle" 
                        size={24} 
                        color="var(--color-error)" 
                        className="w-6 h-6"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-error text-sm font-medium">
                        {error || passwordError}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setError('');
                        setPasswordError('');
                      }}
                      className="text-error hover:text-error/80 transition-colors"
                    >
                      <Icon name="X" size={20} />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input 
                      label={t('resetPassword.newPassword')}
                      type="password"
                      placeholder={t('resetPassword.newPasswordPlaceholder')}
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      error={
                        password && password.length < 8 
                          ? t('errors.passwordTooShort') 
                          : undefined
                      }
                    />
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t('registerForm.step1.passwordStrength')}</span>
                          <span className={getStrengthColor() === 'bg-success' ? 'text-success' : 'text-muted-foreground'}>
                            {getStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Input 
                    label={t('resetPassword.confirmPassword')}
                    type="password"
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    error={
                      confirmPassword && password !== confirmPassword 
                        ? t('errors.passwordsDoNotMatch') 
                        : undefined
                    }
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full py-3 px-4"
                    variant="login"
                    loading={isLoading}
                    disabled={isSubmitDisabled()}
                  >
                    {isLoading ? t('ui.buttons.loading') : t('resetPassword.updateButton')}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Check" size={32} color="var(--color-success)" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('resetPassword.successTitle')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('resetPassword.successMessage')}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('resetPassword.redirecting')}</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {t('login.haveAccount')}{' '}
                <Link to="/login" className="text-primary hover:underline">
                  {t('login.loginLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage; 