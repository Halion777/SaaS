import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../../services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Footer from '../../components/Footer';

const ForgotPasswordPage = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        setError(resetError.message || t('errors.passwordResetFailed'));
      } else {
        setIsSubmitted(true);
      }
    } catch (error) {
      setError(t('errors.passwordResetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('meta.forgotPassword.title')}</title>
        <meta name="description" content={t('meta.forgotPassword.description')} />
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
        
        {/* Login Link */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{t('forgotPassword.rememberPassword')}</span>
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center space-x-1">
              <span>{t('nav.login')}</span>
              <Icon name="LogIn" size={16} />
            </Link>
          </div>
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
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('forgotPassword.title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('forgotPassword.subtitle')}
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
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    variant="login"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? t('ui.buttons.loading') : t('forgotPassword.resetButton')}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Check" size={32} color="var(--color-success)" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('forgotPassword.emailSent')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('forgotPassword.checkInbox')}
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    {t('forgotPassword.backToLogin')}
                  </Button>
                </Link>
              </div>
            )}
            
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

export default ForgotPasswordPage; 