import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
import LoginHeader from './components/LoginHeader';
import SecurityBadges from './components/SecurityBadges';
import SocialProof from './components/SocialProof';
import TrialCallToAction from './components/TrialCallToAction';
import Footer from '../../components/Footer';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      const { error } = await login(formData.email, formData.password);
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setErrors({ general: t('errors.invalidCredentials') });
        } else {
          setErrors({ general: error.message || t('errors.loginFailed') });
        }
      } else {
        // Login successful - AuthContext will handle redirect to dashboard
        // or to the original intended destination
        const from = location.state?.from || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: t('errors.loginFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">


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
        
        {/* Register Link */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{t('login.noAccount')}</span>
            <Link to="/register" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center space-x-1">
              <span>{t('nav.register')}</span>
              <Icon name="UserPlus" size={16} />
            </Link>
          </div>
        </div>
        
        <div className="max-w-md mx-auto my-16">
          <LoginHeader />
          
          <div className="bg-white rounded-lg shadow-professional p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t('login.title')}
              </h2>
              <p className="text-gray-600">
                {t('login.subtitle')}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label={t('login.email')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
              />
              
              <div>
                <Input 
                  label={t('login.password')}
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={errors.password}
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline mt-2">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center">
                <Checkbox
                  id="remember"
                  label={t('login.rememberMe')}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </div>
              
              {errors.general && <ErrorMessage message={errors.general} />}

              <Button 
                type="submit" 
                className="w-full"
                variant="login"
                loading={isLoading}
              >
                {t('login.loginButton')}
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
          
          <div className="mt-8">
            <SecurityBadges />
            <SocialProof />
            <TrialCallToAction />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;