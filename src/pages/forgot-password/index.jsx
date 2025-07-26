import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const ForgotPasswordPage = () => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('pageTitles.forgotPassword') || 'Réinitialiser le mot de passe | HAVITAM'}</title>
        <html lang={language} />
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
            <span className="text-sm text-muted-foreground">{t('forgotPassword.rememberPassword') || 'Vous vous souvenez de votre mot de passe ?'}</span>
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center space-x-1">
              <span>{t('nav.login') || 'Connexion'}</span>
              <Icon name="LogIn" size={16} />
            </Link>
          </div>
        </div>
        
        <div className="max-w-md mx-auto my-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mr-3">
              <Icon name="Hammer" size={36} color="white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Havitam</h1>
              <p className="text-sm text-muted-foreground">Artisan Pro</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-professional p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('forgotPassword.title') || 'Mot de passe oublié ?'}
                  </h2>
                  <p className="text-gray-600">
                    {t('forgotPassword.subtitle') || 'Saisissez votre adresse e-mail pour réinitialiser votre mot de passe'}
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input 
                    label={t('login.email') || 'Adresse email'}
                    type="email"
                    placeholder={t('login.emailPlaceholder') || 'votre@email.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    variant="login"
                    loading={isLoading}
                  >
                    {t('forgotPassword.resetButton') || 'Réinitialiser le mot de passe'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Check" size={32} color="var(--color-success)" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('forgotPassword.emailSent') || 'Email envoyé !'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('forgotPassword.checkInbox') || 'Veuillez vérifier votre boîte de réception pour les instructions de réinitialisation.'}
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    {t('forgotPassword.backToLogin') || 'Retour à la connexion'}
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {t('login.noAccount') || 'Pas encore de compte ?'}{' '}
                <Link to="/register" className="text-primary hover:underline">
                  {t('login.register') || 'S\'inscrire'}
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