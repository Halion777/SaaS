import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../services/supabaseClient';
import emailVerificationService from '../../services/emailVerificationService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

/**
 * Auth Confirmation Page
 * Handles email verification when user clicks the link in their email
 */
const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link. Please try requesting a new verification email.');
          return;
        }

        // Verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type || 'signup'
        });

        if (error) {
          console.error('Verification error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may have expired.');
          return;
        }

        if (data?.user) {
          // Update verification status in public.users table
          await emailVerificationService.updateVerificationStatus(data.user.id);
        }

        // Success!
        setStatus('success');
        setMessage('Your email has been verified successfully!');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Verification exception:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or contact support.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <>
      <Helmet>
        <title>Email Verification - Haliqo</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card rounded-lg border border-border p-8 shadow-lg text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Email...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your email address</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Redirecting to dashboard...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertCircle" size={32} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthConfirm;

