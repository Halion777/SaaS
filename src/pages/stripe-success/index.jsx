import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RegistrationService from '../../services/registrationService';
import { getStripeSession } from '../../services/stripeSessionService';
import Icon from '../../components/AppIcon';

const StripeSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Get session ID from URL
        const sessionId = searchParams.get('session_id');
        console.log('Session ID from URL:', sessionId);
        
        if (!sessionId) {
          console.error('No session ID found in URL');
          setErrorDetails('Missing session ID from payment confirmation');
          setStatus('error');
          return;
        }

        // Fetch real Stripe session data first to determine if this is a new registration or resubscription
        
        const { data: stripeSessionData, error: stripeError } = await getStripeSession(sessionId);
        
        if (stripeError) {
          console.error('Error fetching Stripe session:', stripeError);
          setErrorDetails('Failed to retrieve payment information. Please contact support with session ID: ' + sessionId);
          setStatus('error');
          return;
        }

        console.log('Real Stripe session data retrieved:', stripeSessionData);
        
        // Check if this is a resubscription (user already exists) or new registration
        const userId = stripeSessionData.metadata?.userId;
        const isResubscription = stripeSessionData.metadata?.isResubscription === 'true';
        
        // Get pending registration data - check both possible keys
        let pendingRegistration = sessionStorage.getItem('pendingRegistration');
        if (!pendingRegistration) {
          pendingRegistration = sessionStorage.getItem('registration_pending');
        }
        
        // If no registration data but we have userId from metadata, this is likely a resubscription
        if (!pendingRegistration && userId && (isResubscription || stripeSessionData.subscription)) {
          console.log('Resubscription detected - user already exists, subscription will be handled by webhook');
          
          // For resubscriptions, the webhook already handles subscription creation
          // We just need to verify and redirect
          setStatus('success');
          
          // Redirect to subscription page to show success
          setTimeout(() => {
            navigate('/subscription?success=true', { replace: true });
          }, 2000);
          return;
        }
        
        // If no registration data and no userId, this is an error
        if (!pendingRegistration) {
          console.error('No pending registration data found in sessionStorage');
          console.error('Available sessionStorage keys:', Object.keys(sessionStorage));
          setErrorDetails('Registration data was lost during payment redirect. This may be due to browser privacy settings. Please try registering again or contact support with session ID: ' + sessionId);
          setStatus('error');
          return;
        }

        try {
          const registrationData = JSON.parse(pendingRegistration);
          console.log('Parsed registration data:', { 
            userId: registrationData.userId,
            email: registrationData.email,
            plan: registrationData.selectedPlan
          });
          
          // Create session data object with REAL Stripe IDs
          const sessionData = {
            id: sessionId,
            payment_status: stripeSessionData.payment_status || 'paid',
            subscription: stripeSessionData.subscription, // Real Stripe subscription ID
            customer: stripeSessionData.customer, // Real Stripe customer ID
            payment_intent: stripeSessionData.payment_intent,
            amount_total: stripeSessionData.plan_amount || stripeSessionData.amount_total || 0, // Use plan_amount for trials
            currency: stripeSessionData.currency || 'eur',
            subscription_status: stripeSessionData.subscription_details?.status || 'trialing',
            trial_start: stripeSessionData.subscription_details?.trial_start,
            trial_end: stripeSessionData.subscription_details?.trial_end,
            current_period_start: stripeSessionData.subscription_details?.current_period_start,
            current_period_end: stripeSessionData.subscription_details?.current_period_end,
            subscription_items: stripeSessionData.subscription_details?.items
          };

          console.log('Session data with real Stripe IDs:', {
            subscription: sessionData.subscription,
            customer: sessionData.customer,
            payment_intent: sessionData.payment_intent,
            amount_total: sessionData.amount_total,
            plan_amount: stripeSessionData.plan_amount,
            is_trial: sessionData.subscription_status === 'trialing'
          });

          console.log('Starting registration completion...');
          
          // Use RegistrationService to complete registration
          await RegistrationService.completeRegistration(sessionData, registrationData);
          
          console.log('Registration completed successfully');
          
          // Clear all registration data (both possible keys)
          sessionStorage.removeItem('pendingRegistration');
          sessionStorage.removeItem('registration_pending');
          sessionStorage.removeItem('registration_complete');
          
          setStatus('success');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          
        } catch (error) {
          console.error('Error completing registration:', error);
          setErrorDetails(error.message || 'Database error while creating your account. Please contact support with session ID: ' + sessionId);
          setStatus('error');
        }
      } catch (error) {
        console.error('Error handling Stripe success:', error);
        setErrorDetails(error.message || 'Unexpected error occurred');
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
              {errorDetails || t('stripeSuccess.error.description')}
            </p>
            {errorDetails && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-800 break-all">{errorDetails}</p>
              </div>
            )}
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