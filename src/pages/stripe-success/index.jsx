import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { createUserAfterPayment } from '../../services/authService';
import Icon from '../../components/AppIcon';

const StripeSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Check if user is authenticated
        if (isAuthenticated) {
          // Check if we have pending registration data
          const pendingRegistration = sessionStorage.getItem('pendingRegistration');
          
          if (pendingRegistration) {
            try {
              const registrationData = JSON.parse(pendingRegistration);
              
              // Create user record in database after successful payment
              const { error } = await createUserAfterPayment(
                registrationData.userId,
                registrationData
              );
              
              if (error) {
                console.error('Error creating user after payment:', error);
                setStatus('error');
                return;
              }
            } catch (error) {
              console.error('Error processing registration data:', error);
              setStatus('error');
              return;
            }
          }
          
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // If not authenticated, redirect to login
          setStatus('redirecting');
          setTimeout(() => {
            navigate('/login', { 
              replace: true,
              state: { 
                from: '/dashboard',
                message: 'Please log in to access your dashboard'
              }
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling Stripe success:', error);
        setStatus('error');
      }
    };

    if (!loading) {
      handleSuccess();
    }
  }, [isAuthenticated, loading, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('stripeSuccess.processing.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('stripeSuccess.processing.description')}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('stripeSuccess.success.title')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('stripeSuccess.success.description')}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>{t('stripeSuccess.success.redirecting')}</span>
            </div>
          </div>
        );

      case 'redirecting':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="LogIn" size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('stripeSuccess.redirecting.title')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('stripeSuccess.redirecting.description')}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>{t('stripeSuccess.redirecting.redirecting')}</span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="AlertCircle" size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('stripeSuccess.error.title')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('stripeSuccess.error.description')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('stripeSuccess.error.loginButton')}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-professional p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StripeSuccessPage; 