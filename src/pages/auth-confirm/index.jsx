import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../services/supabaseClient';
import emailVerificationService from '../../services/emailVerificationService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

/**
 * Auth Confirmation Page
 * Handles email verification when user clicks the link in their email
 * This page should NOT show navigation/header
 */
const AuthConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let subscription = null;
    let timeoutId = null;

    const handleVerificationSuccess = async (user) => {
      // Update verification status in public.users table
      try {
        await emailVerificationService.updateVerificationStatus(user.id);
      } catch (updateError) {
        console.error('Error updating verification status:', updateError);
        // Continue anyway - email is verified in auth
      }

      setStatus('success');
      setMessage('Your email has been verified successfully!');

      // Redirect based on registration status
      timeoutId = setTimeout(async () => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('registration_completed')
            .eq('id', user.id)
            .single();

          if (!userData || !userData.registration_completed) {
            // Registration not complete, redirect to registration
            navigate('/register');
          } else {
            // Registration complete, redirect to dashboard
            navigate('/dashboard');
          }
        } catch (error) {
          // If error checking, assume registration not complete
          navigate('/register');
        }
      }, 2000);
    };

    const confirmEmail = async () => {
      try {
        // Extract hash from URL if present
        const hash = location.hash;
        
        // Listen for auth state changes (Supabase processes hash fragments automatically)
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session?.user) {
            const user = session.user;
            console.log('User signed in:', user.email, 'Email confirmed:', user.email_confirmed_at);
            
            if (user.email_confirmed_at) {
              handleVerificationSuccess(user);
            } else {
              // User signed in but email not confirmed - might be a different flow
              console.log('User signed in but email not confirmed yet');
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            const user = session.user;
            if (user.email_confirmed_at) {
              handleVerificationSuccess(user);
            }
          }
        });

        subscription = authSubscription;

        // Wait a bit for Supabase to process hash fragments
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check current session (Supabase may have already processed hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          // Don't fail immediately - wait for auth state change
          setTimeout(() => {
            if (status === 'verifying') {
              setStatus('error');
              setMessage('Invalid or expired verification link. Please try requesting a new verification email.');
            }
          }, 3000);
          return;
        }

        if (session?.user) {
          const user = session.user;
          console.log('Session found:', user.email, 'Email confirmed:', user.email_confirmed_at);
          
          if (user.email_confirmed_at) {
            handleVerificationSuccess(user);
            return;
          } else {
            // Session exists but email not confirmed - wait a bit more
            console.log('Session exists but email not confirmed, waiting...');
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession?.user?.email_confirmed_at) {
                handleVerificationSuccess(retrySession.user);
              } else if (status === 'verifying') {
                setStatus('error');
                setMessage('Email verification failed. The link may have expired. Please try requesting a new verification email.');
              }
            }, 2000);
            return;
          }
        }

        // No session found - wait a bit more for Supabase to process hash
        console.log('No session found, waiting for hash processing...');
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          console.log('Retry session:', retrySession?.user?.email, 'Email confirmed:', retrySession?.user?.email_confirmed_at);
          
          if (retrySession?.user && retrySession.user.email_confirmed_at) {
            handleVerificationSuccess(retrySession.user);
          } else if (!retrySession?.user && status === 'verifying') {
            setStatus('error');
            setMessage('Invalid or expired verification link. Please try requesting a new verification email.');
          }
        }, 2500);

      } catch (error) {
        console.error('Verification exception:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or contact support.');
      }
    };

    confirmEmail();

    // Cleanup on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

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
                <span>Redirecting...</span>
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
                  onClick={() => navigate('/register')} 
                  className="w-full"
                >
                  Go to Registration
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

