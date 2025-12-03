import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Footer from '../../components/Footer';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);
  const errorRef = useRef('');

  // Check if there's a redirect state from previous route
  const from = location.state?.from;

  useEffect(() => {
    // If already authenticated, let AuthContext handle role-based redirect
    // Don't redirect here as it interferes with role-based navigation
    if (isAuthenticated) {
      // AuthContext will handle the redirect based on user role
    }
  }, [isAuthenticated]);

  // Persist error through rerenders
  useEffect(() => {
    if (error) {
      errorRef.current = error;
    } else if (errorRef.current && !error) {
      // Restore error if it was cleared
      setError(errorRef.current);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError(t('errors.required'));
        setIsLoading(false);
        return;
      }

      // Attempt login
      const { data, error: loginError } = await login(email, password);

      if (loginError) {
        // Handle specific error types
        if (loginError.code === 'registration_incomplete') {
          // Don't show error message, just show the complete registration info box
          setShowCompleteRegistration(true);
          setError('');
          errorRef.current = '';
        } else {
          // Show error for other types (invalid credentials, etc.)
          const errorMessage = loginError.message?.includes('Invalid login credentials')
            ? t('errors.invalidCredentials')
            : loginError.message || t('errors.loginFailed');
          
          errorRef.current = errorMessage;
          setError(errorMessage);
          
          // Ensure error persists after any auth state changes from signOut
          setTimeout(() => {
            if (errorRef.current) {
              setError(errorRef.current);
            }
          }, 50);
        }
        
        setIsLoading(false);
      } else if (data) {
        // Successful login - navigation handled in AuthContext
        // No need to navigate here, AuthContext will handle role-based redirect
        setIsLoading(false);
      }
    } catch (err) {
      setError(t('errors.loginFailed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('meta.login.title')}</title>
        <meta name="description" content={t('meta.login.description')} />
        <meta name="keywords" content="login, sign in, haliqo, artisan account, construction management, business login" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={t('meta.login.title')} />
        <meta property="og:description" content={t('meta.login.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://haliqo.com/login`} />
        <meta property="og:image" content="https://haliqo.com/assets/images/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('meta.login.title')} />
        <meta name="twitter:description" content={t('meta.login.description')} />
        
        {/* Canonical */}
        <link rel="canonical" href="https://haliqo.com/login" />
        
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t('login.title')}
              </h2>
              <p className="text-gray-600">
                {t('login.subtitle')}
              </p>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <ErrorMessage 
                  message={error}
                  onClose={() => {
                    setError('');
                    errorRef.current = '';
                  }}
                />
              </div>
            )}
            
            {/* Complete Registration Info Box */}
            {showCompleteRegistration && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 mb-3">
                  {t('login.completeRegistrationMessage', 'Complete your registration to access your account.')}
                </p>
                <Link 
                  to={`/register?email=${encodeURIComponent(email)}&resume=true`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Icon name="CreditCard" size={16} className="mr-2" />
                  {t('login.completeRegistration', 'Complete Registration')}
                </Link>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label={t('login.email')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input 
                label={t('login.password')}
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                variant="login"
                loading={isLoading || loading}
                disabled={isLoading || loading}
              >
                {isLoading || loading ? t('ui.buttons.loading') : t('nav.login')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline">
                  {t('nav.register')}
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

export default Login;