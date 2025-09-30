import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RegistrationService from '../../services/registrationService';
import Icon from '../../components/AppIcon';

const StripeSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Get session ID from URL
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          console.error('No session ID found in URL');
          setStatus('error');
          return;
        }

        // Get pending registration data
        const pendingRegistration = sessionStorage.getItem('pendingRegistration');
        if (!pendingRegistration) {
          console.error('No pending registration data found');
          setStatus('error');
          return;
        }

        try {
          const registrationData = JSON.parse(pendingRegistration);
          
          // Create session data object from URL and registration data
          // We'll use the registration data and session ID to complete registration
          const sessionData = {
            id: sessionId,
            payment_status: 'paid', // Assume paid since we're on success page
            subscription: 'sub_placeholder', // Will be updated by webhook later
            customer: 'cus_placeholder', // Will be updated by webhook later
            amount_total: 0, // Will be updated by webhook later
            currency: 'eur',
            subscription_status: 'trialing', // Default to trial
            trial_start: Math.floor(Date.now() / 1000),
            trial_end: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
            payment_intent: null,
            invoice: null
          };

          // Use RegistrationService to complete registration
          await RegistrationService.completeRegistration(sessionData, registrationData);
          
          console.log('Registration completed successfully');
          
          // Clear all registration data
          sessionStorage.removeItem('pendingRegistration');
          sessionStorage.removeItem('registration_complete');
          sessionStorage.removeItem('registration_pending');
          
          setStatus('success');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          
        } catch (error) {
          console.error('Error completing registration:', error);
          setStatus('error');
        }
      } catch (error) {
        console.error('Error handling Stripe success:', error);
        setStatus('error');
      }
    };

    // Handle success immediately
    handleSuccess();
  }, [navigate, searchParams]);

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