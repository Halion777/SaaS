import React, { useState, useEffect } from 'react';
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

  // Check if there's a redirect state from previous route
  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    // If already authenticated, redirect to dashboard or previous page
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError(t('errors.required'));
        return;
      }

      // Attempt login
      const { data, error: loginError } = await login(email, password);

      if (loginError) {
        // Handle specific error types
        if (loginError.message.includes('Invalid login credentials')) {
          setError(t('errors.invalidCredentials'));
        } else {
          setError(loginError.message || t('errors.loginFailed'));
        }
      } else if (data) {
        // Successful login - navigation handled in AuthContext
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('meta.login.title')}</title>
        <meta name="description" content={t('meta.login.description')} />
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
              <ErrorMessage 
                message={error}
                onClose={() => setError('')}
              />
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