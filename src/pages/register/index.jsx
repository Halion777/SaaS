import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { completeRegistration, checkUserRegistration } from '../../services/authService';
import { createCheckoutSession } from '../../services/stripeService';
import { optimizePaymentFlow } from '../../utils/paymentOptimization';
import { supabase } from '../../services/supabaseClient';
import { getCountryName } from '../../utils/countryCodes';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ProcessingOverlay from '../../components/ui/ProcessingOverlay';
import StepOne from './components/StepOne';
import StepTwo from './components/StepTwo';
import StepThree from './components/StepThree';
import ProgressIndicator from './components/ProgressIndicator';
import TestimonialCard from './components/TestimonialCard';
import TrustSignals from './components/TrustSignals';
import Footer from '../../components/Footer';

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isResumingRegistration, setIsResumingRegistration] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    emailVerified: false,
    phone: '',
    companyName: '',
    vatNumber: '',
    profession: [],
    country: 'BE',
    businessSize: '',
    selectedPlan: 'pro',
    billingCycle: 'monthly',
    acceptTerms: false,
    // Company information fields for Step 2
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
    companyState: '',
    companyWebsite: '',
    companyIban: '',
    companyAccountName: '',
    companyBankName: ''
  });
  const [errors, setErrors] = useState({});

  // Save Step 1 fields to users table before payment
  const saveUserDataBeforePayment = async (userId, formData) => {
    try {
      const userRecord = {
        id: userId,
        email: formData.email.toLowerCase().trim(),
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        company_name: formData.companyName || null,
        vat_number: formData.vatNumber || null,
        phone: formData.phone || null,
        profession: formData.profession || null,
        country: formData.country || 'BE',
        business_size: formData.businessSize || null,
        selected_plan: formData.selectedPlan || 'pro',
        registration_completed: false, // Keep as false until payment succeeds
        subscription_status: 'trial', // Will be updated after payment
        email_verified: formData.emailVerified || false
      };

      // Use upsert to create or update user record
      await supabase
        .from('users')
        .upsert(userRecord, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
    } catch (error) {
      // Silently fail - don't block registration if user data save fails
    }
  };

  // Save Step 2 fields to company_profiles table before payment
  const saveCompanyProfileBeforePayment = async (userId, formData) => {
    try {
      console.log('=== Saving company profile before payment ===');
      console.log('User ID:', userId);
      console.log('Form data for company profile:', {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyCity: formData.companyCity,
        companyPostalCode: formData.companyPostalCode,
        companyState: formData.companyState,
        companyWebsite: formData.companyWebsite,
        companyIban: formData.companyIban,
        companyAccountName: formData.companyAccountName,
        companyBankName: formData.companyBankName
      });

      // Check if company profile already exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing company profile:', checkError);
      }
      console.log('Existing company profile:', existingCompany);

      const companyProfile = {
        user_id: userId,
        profile_id: null, // Will be set after user profile is created
        company_name: formData.companyName || '',
        vat_number: formData.vatNumber || null,
        address: formData.companyAddress || null,
        city: formData.companyCity || null,
        postal_code: formData.companyPostalCode || null,
        state: formData.companyState || null,
        country: getCountryName(formData.country || 'BE'),
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.companyWebsite || null,
        iban: formData.companyIban || null,
        account_name: formData.companyAccountName || null,
        bank_name: formData.companyBankName || null,
        is_default: true
      };

      let result;
      if (existingCompany) {
        // Update existing company profile
        
        result = await supabase
          .from('company_profiles')
          .update(companyProfile)
          .eq('id', existingCompany.id);
      } else {
        // Create new company profile
       
        result = await supabase
          .from('company_profiles')
          .insert(companyProfile);
      }

      if (result.error) {
        console.error('Error saving company profile:', result.error);
        throw result.error;
      } 
    } catch (error) {
      console.error('Failed to save company profile before payment:', error);
      // Don't block registration if company profile save fails, but log it
    }
  };

  // Fetch and auto-fill user data when resuming registration
  const fetchUserDataForResume = async (email) => {
    try {
      console.log('=== Auto-detecting incomplete registration ===');
      console.log('Email:', email);
      
      // First, use checkUserRegistration to get userId
      const checkResult = await checkUserRegistration(email.toLowerCase().trim());
      console.log('Check result:', checkResult);
      
      if (!checkResult.data?.userExists || !checkResult.data?.userId) {
        console.log('User does not exist or userId not found');
        return;
      }

      // Check if registration is incomplete
      if (checkResult.data.registrationComplete) {
        console.log('Registration is complete, not resuming');
        return;
      }

      // Set resuming flag
      setIsResumingRegistration(true);
      console.log('Incomplete registration detected, setting resume flag');

      const userId = checkResult.data.userId;

      // Get user data from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Get company profile data (contains Step 2 fields)
      // Use data from checkUserRegistration edge function to bypass RLS
      // The edge function uses service role and can access company_profiles
      let companyProfile = checkResult.data?.companyProfile || null;
      
      // Fallback: try direct query if edge function didn't return it (for backward compatibility)
      if (!companyProfile) {
        const { data: companyProfileData, error: companyError } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!companyError && companyProfileData) {
          companyProfile = companyProfileData;
        }
      }

      // Parse profession from JSON string or array
      let professionArray = [];
      if (userData?.profession) {
        try {
          if (typeof userData.profession === 'string') {
            // Try to parse as JSON string
            professionArray = JSON.parse(userData.profession);
          } else if (Array.isArray(userData.profession)) {
            // Already an array
            professionArray = userData.profession;
          } else {
            // Single value, convert to array
            professionArray = [userData.profession];
          }
        } catch (e) {
          // If parsing fails, treat as single value
          console.warn('Failed to parse profession, treating as single value:', e);
          professionArray = [userData.profession];
        }
      }
      
      // Auto-fill form data from database
      const dataToFill = {
        email: email.toLowerCase().trim(),
        // Step 1 fields from users table
        firstName: userData?.first_name || '',
        lastName: userData?.last_name || '',
        phone: userData?.phone || companyProfile?.phone || '',
        companyName: userData?.company_name || companyProfile?.company_name || '',
        vatNumber: userData?.vat_number || companyProfile?.vat_number || '',
        profession: professionArray, // Keep as array for multiple select
        country: userData?.country || 'BE',
        businessSize: userData?.business_size || '',
        selectedPlan: userData?.selected_plan || 'pro',
        billingCycle: 'monthly', // Default, as this isn't stored in users table
        // Step 2 fields from company_profiles table
        companyAddress: companyProfile?.address || '',
        companyCity: companyProfile?.city || '',
        companyPostalCode: companyProfile?.postal_code || '',
        companyState: companyProfile?.state || '',
        companyWebsite: companyProfile?.website || '',
        companyIban: companyProfile?.iban || '',
        companyAccountName: companyProfile?.account_name || '',
        companyBankName: companyProfile?.bank_name || '',
      };

      // Update form data
      let filledCount = 0;
      Object.keys(dataToFill).forEach(key => {
        // For profession, always update even if empty array (to clear previous values)
        // For other fields, only update if value exists
        if (key === 'profession' || dataToFill[key]) {
          updateFormData(key, dataToFill[key]);
          filledCount++;
        }
      });
      console.log(`Filled ${filledCount} fields with data`);

      // Check if email is already verified
      if (userData?.email_verified) {
        updateFormData('emailVerified', true);
      }
    } catch (error) {
      // Silently fail - don't block registration if we can't fetch data
    }
  };

  // Clear any existing session storage data when component mounts
  useEffect(() => {
    // Clear any pending registration data from previous attempts
    sessionStorage.removeItem('pendingRegistration');
    sessionStorage.removeItem('registration_complete');
    
    // Check if email is provided in URL (from login page redirect)
    const emailParam = searchParams.get('email');
    const resumeParam = searchParams.get('resume');
    
    if (emailParam) {
      updateFormData('email', emailParam);
      if (resumeParam === 'true') {
        setIsResumingRegistration(true);
        // Fetch and auto-fill user data
        fetchUserDataForResume(emailParam);
      }
    }
    
    // Expose fetchUserDataForResume to window for StepOne to call
    window.fetchUserDataForResume = fetchUserDataForResume;
    
    return () => {
      // Cleanup
      delete window.fetchUserDataForResume;
    };
  }, [searchParams]);

  // Clear email error when email is verified
  useEffect(() => {
    if (formData.emailVerified && errors.email === t('errors.emailNotVerified')) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  }, [formData.emailVerified, errors.email, t]);

  const testimonials = [
    {
      id: 1,
      name: t('register.testimonials.testimonial1.name'),
      trade: t('register.testimonials.testimonial1.trade'),
      location: t('register.testimonials.testimonial1.location'),
      rating: 5,
      quote: t('register.testimonials.testimonial1.quote'),
      avatar: "/assets/images/no profile.jpg"
    },
    {
      id: 2,
      name: t('register.testimonials.testimonial2.name'),
      trade: t('register.testimonials.testimonial2.trade'),
      location: t('register.testimonials.testimonial2.location'),
      rating: 5,
      quote: t('register.testimonials.testimonial2.quote'),
      avatar: "/assets/images/no profile.jpg"
    }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear email error when email is verified
    if (field === 'emailVerified' && value === true && errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateStep = async (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = t('errors.required');
      if (!formData.lastName.trim()) newErrors.lastName = t('errors.required');
      if (!formData.profession) newErrors.profession = t('errors.required');
      if (!formData.email.trim()) newErrors.email = t('errors.required');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('errors.invalidEmail');
      else {
        // Check if email already exists
        try {
          const { data: checkData, error: checkError } = await checkUserRegistration(formData.email.toLowerCase().trim());
          
          if (checkError) {
            newErrors.email = t('errors.registrationFailed');
          } else if (checkData && !checkData.canRegister) {
            // Email already exists and registration is complete
            newErrors.email = checkData.message || t('errors.emailAlreadyExists');
          } else if (checkData && checkData.userExists && checkData.registrationComplete) {
            // User exists and has completed registration
            newErrors.email = checkData.message || t('errors.emailAlreadyExists');
          } else if (checkData && checkData.userExists && !checkData.registrationComplete) {
            // User exists with incomplete registration - skip email verification requirement
            // Auto-fill data if not already filled
            if (!isResumingRegistration) {
              setIsResumingRegistration(true);
              await fetchUserDataForResume(formData.email.toLowerCase().trim());
            }
            // Don't require email verification for incomplete registrations
            // The email was already verified in the previous attempt
          } else if (!formData.emailVerified) {
            // New user - require email verification
            newErrors.email = t('errors.emailNotVerified');
          }
        } catch (error) {
          console.error('Error checking email uniqueness:', error);
          // If check fails, still require email verification for new users
          if (!formData.emailVerified) {
            newErrors.email = t('errors.emailNotVerified');
          }
        }
      }
      if (!formData.password) newErrors.password = t('errors.required');
      else if (formData.password.length < 8) newErrors.password = t('errors.tooShort');
      if (!formData.phone.trim()) newErrors.phone = t('errors.required');
      else {
        // Phone number validation - should be between 9-15 digits with optional + prefix
        const phoneRegex = /^\+?[0-9]{9,15}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = t('errors.invalidPhone');
        }
      }
      if (!formData.country) newErrors.country = t('errors.required');
    }

    if (step === 2) {
      if (!formData.businessSize) newErrors.businessSize = t('errors.required');
      if (!formData.companyName.trim()) newErrors.companyName = t('errors.required');
      if (!formData.vatNumber.trim()) newErrors.vatNumber = t('errors.required');
      if (!formData.companyAddress.trim()) newErrors.companyAddress = t('errors.required');
      if (!formData.companyCity.trim()) newErrors.companyCity = t('errors.required');
      if (!formData.companyPostalCode.trim()) newErrors.companyPostalCode = t('errors.required');
      if (!formData.companyState.trim()) newErrors.companyState = t('errors.required');
    }

    if (step === 3) {
      if (!formData.selectedPlan) newErrors.selectedPlan = t('errors.required');
      if (!formData.acceptTerms) newErrors.acceptTerms = t('errors.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setIsValidatingEmail(true);
    }
    try {
      const isValid = await validateStep(currentStep);
      if (isValid) {
        setCurrentStep(prev => prev + 1);
      }
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Modify handleSubmit to add more precise registration completion flag
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    
    // Optimize payment flow to reduce API calls
    const cleanupOptimization = optimizePaymentFlow();
    
    try {
      // Step 0: Check if user can register with this email
      const { data: checkData, error: checkError } = await checkUserRegistration(formData.email.toLowerCase().trim());
      
      console.log('Check user registration result:', checkData);
      
      if (checkError) {
        setErrors({ general: t('errors.registrationFailed') });
        setIsLoading(false);
        cleanupOptimization();
        return;
      }
      
      if (!checkData.canRegister) {
        setErrors({ email: checkData.message || t('errors.emailAlreadyExists') });
        setIsLoading(false);
        cleanupOptimization();
        return;
      }
      
      // Check if this is resuming an incomplete registration
      if (checkData.userExists && !checkData.registrationComplete) {
        // Resume incomplete registration
        console.log('Resuming incomplete registration for user:', checkData.userId);
        setIsResumingRegistration(true);
        
        // Set registration pending flag BEFORE signing in to prevent dashboard redirect
        sessionStorage.setItem('registration_pending', JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          plan: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          timestamp: Date.now(),
          resumingRegistration: true
        }));
        
        // First, try to sign in with the password provided
        let signInData, signInError;
        const signInResult = await supabase.auth.signInWithPassword({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        });
        
        signInData = signInResult.data;
        signInError = signInResult.error;
        
        // If password doesn't match (user might have entered a different password)
        if (signInError && (signInError.message?.includes('Invalid') || signInError.message?.includes('credentials'))) {
          // Show helpful error message with options
          setErrors({ 
            general: t('register.passwordMismatch') || `This email is already registered but payment was not completed.\n\nPlease either:\n1. Use your original password, or\n2. Use "Forgot Password" to reset it, then try registering again.`
          });
          setIsLoading(false);
          cleanupOptimization();
          setIsResumingRegistration(false);
          sessionStorage.removeItem('registration_pending');
          return;
        }
        
        // If other sign-in error occurred
        if (signInError) {
          setErrors({ 
            general: signInError.message || t('register.resumeError') || 'Unable to resume registration. Please contact support.'
          });
          setIsLoading(false);
          cleanupOptimization();
          setIsResumingRegistration(false);
          sessionStorage.removeItem('registration_pending');
          return;
        }
        
        // Update user metadata with new form data
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            vat_number: formData.vatNumber,
            phone: formData.phone,
            profession: formData.profession,
            country: formData.country,
            business_size: formData.businessSize,
            selected_plan: formData.selectedPlan
          }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          // Continue anyway - metadata update is not critical
        }
        
        // Save Step 1 fields to users table BEFORE payment
        // This ensures data is preserved even if payment fails
        await saveUserDataBeforePayment(signInData.user.id, formData);
        
        // Save Step 2 fields to company_profiles table BEFORE payment
        // This ensures data is preserved even if payment fails
        await saveCompanyProfileBeforePayment(signInData.user.id, formData);

        // Proceed directly to Stripe checkout with updated user data
        const { data: stripeData, error: stripeError } = await createCheckoutSession({
          planType: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          userId: signInData.user.id,
          // Include all form data for user record creation in webhook
          userData: {
            email: formData.email.toLowerCase().trim(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
            vatNumber: formData.vatNumber,
            phone: formData.phone,
            profession: formData.profession,
            country: formData.country,
            businessSize: formData.businessSize,
            companyAddress: formData.companyAddress,
            companyCity: formData.companyCity,
            companyPostalCode: formData.companyPostalCode,
            companyState: formData.companyState,
            companyWebsite: formData.companyWebsite,
            companyIban: formData.companyIban,
            companyAccountName: formData.companyAccountName,
            companyBankName: formData.companyBankName
          }
        });

        if (stripeError) {
          setErrors({ general: t('errors.paymentFailed') });
          setIsLoading(false);
          cleanupOptimization();
          setIsResumingRegistration(false);
          sessionStorage.removeItem('registration_pending');
          return;
        }

        // Redirect to Stripe checkout
        if (stripeData?.url) {
          // Show resuming message before redirect
          setErrors({ 
            general: t('register.resumingRegistration') || 'Resuming incomplete registration. Redirecting to payment...'
          });
          
          // Small delay to show message before redirect
          setTimeout(() => {
            // Update registration pending with complete user data
            sessionStorage.setItem('registration_pending', JSON.stringify({
            userId: signInData.user.id,
            email: formData.email.toLowerCase().trim(),
          firstName: formData.firstName,
          lastName: formData.lastName,
            companyName: formData.companyName,
            vatNumber: formData.vatNumber,
            phone: formData.phone,
            profession: formData.profession,
            country: formData.country,
            businessSize: formData.businessSize,
            selectedPlan: formData.selectedPlan,
            billingCycle: formData.billingCycle,
          companyAddress: formData.companyAddress,
          companyCity: formData.companyCity,
          companyPostalCode: formData.companyPostalCode,
          companyState: formData.companyState,
          companyWebsite: formData.companyWebsite,
          companyIban: formData.companyIban,
          companyAccountName: formData.companyAccountName,
          companyBankName: formData.companyBankName,
            timestamp: Date.now(),
            resumingRegistration: true
          }));
          
          // Redirect to Stripe checkout
          window.location.href = stripeData.url;
          }, 1500); // Show message for 1.5 seconds before redirect
        } else {
          setErrors({ general: t('errors.paymentFailed') });
          setIsLoading(false);
          cleanupOptimization();
          setIsResumingRegistration(false);
        }
        
        return;
      }
      
      // Set registration pending flag BEFORE creating auth user to prevent dashboard redirect
      sessionStorage.setItem('registration_pending', JSON.stringify({
        email: formData.email.toLowerCase().trim(),
        plan: formData.selectedPlan,
        billingCycle: formData.billingCycle,
        timestamp: Date.now()
      }));
      
      // Step 1: Complete user registration (only for new users)
      const { data: authData, error: authError } = await completeRegistration(formData);
      
      if (authError) {
        if (authError.code === 'user_already_exists' || authError.message?.includes('already registered')) {
          setErrors({ email: t('errors.emailAlreadyExists') });
        } else {
          setErrors({ general: authError.message || t('errors.registrationFailed') });
        }
        setIsLoading(false);
        cleanupOptimization(); // Clean up optimization
        // Clear registration pending flag on error
        sessionStorage.removeItem('registration_pending');
        return;
      }

      // Step 1.5: Save Step 1 fields to users table BEFORE payment
      // This ensures data is preserved even if payment fails
      await saveUserDataBeforePayment(authData.user.id, formData);
      
      // Step 1.6: Save Step 2 fields to company_profiles table BEFORE payment
      // This ensures data is preserved even if payment fails
      await saveCompanyProfileBeforePayment(authData.user.id, formData);

      // Step 2: Create Stripe checkout session with 14-day trial
      const { data: stripeData, error: stripeError } = await createCheckoutSession({
        planType: formData.selectedPlan,
        billingCycle: formData.billingCycle,
        userId: authData.user.id
      });

      if (stripeError) {
        setErrors({ general: t('errors.paymentFailed') });
        setIsLoading(false);
        cleanupOptimization(); // Clean up optimization
        // Clear registration pending flag on error
        sessionStorage.removeItem('registration_pending');
        return;
      }

      // Step 3: Redirect to Stripe checkout
      if (stripeData?.url) {
        // Update registration pending with complete user data
        sessionStorage.setItem('registration_pending', JSON.stringify({
          userId: authData.user.id,
          email: formData.email.toLowerCase().trim(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          vatNumber: formData.vatNumber,
          phone: formData.phone,
          profession: formData.profession,
          country: formData.country,
          businessSize: formData.businessSize,
          selectedPlan: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          companyAddress: formData.companyAddress,
          companyCity: formData.companyCity,
          companyPostalCode: formData.companyPostalCode,
          companyState: formData.companyState,
          companyWebsite: formData.companyWebsite,
          companyIban: formData.companyIban,
          companyAccountName: formData.companyAccountName,
          companyBankName: formData.companyBankName,
          timestamp: Date.now()
        }));
        
        // Redirect to Stripe checkout - DO NOT redirect to dashboard yet
        window.location.href = stripeData.url;
      } else {
        // Fallback - show error
        setErrors({ general: t('errors.paymentFailed') });
        setIsLoading(false);
        cleanupOptimization(); // Clean up optimization
      }
      
    } catch (error) {
      setErrors({ general: t('errors.registrationFailed') });
      cleanupOptimization(); // Clean up optimization
      // Clear registration pending flag on error
      sessionStorage.removeItem('registration_pending');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    // Show success message if form was submitted
    if (formSubmitted) {
      return (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('register.success.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('register.success.description')}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>{t('register.success.redirecting')}</span>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <StepOne 
            formData={formData} 
            updateFormData={updateFormData} 
            errors={errors}
            onIncompleteRegistrationDetected={async (email) => {
              // Auto-detect incomplete registration and auto-fill data
              setIsResumingRegistration(true);
              await fetchUserDataForResume(email);
            }}
          />
        );
      case 2:
        return <StepTwo formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 3:
        return <StepThree formData={formData} updateFormData={updateFormData} errors={errors} />;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (currentStep === 3) return t('ui.buttons.startTrial');
    return t('ui.buttons.continue');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative overflow-hidden">
      <Helmet>
        <title>{t('meta.register.title')}</title>
        <meta name="description" content={t('meta.register.description')} />
        <meta name="keywords" content="register, sign up, create account, haliqo, artisan registration, construction management, business signup" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={t('meta.register.title')} />
        <meta property="og:description" content={t('meta.register.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://haliqo.com/register`} />
        <meta property="og:image" content="https://haliqo.com/assets/images/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('meta.register.title')} />
        <meta name="twitter:description" content={t('meta.register.description')} />
        
        {/* Canonical */}
        <link rel="canonical" href="https://haliqo.com/register" />
        
        <html lang={i18n.language} />
      </Helmet>
      
      {/* Processing Overlay */}
      <ProcessingOverlay 
        isVisible={isLoading}
        message={t('register.processing')}
        id="registration-processing-overlay"
        preventNavigation={false}
      />
      
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
            <span className="text-sm text-muted-foreground">{t('register.alreadyRegistered')}</span>
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center space-x-1">
              <span>{t('nav.login')}</span>
              <Icon name="LogIn" size={16} />
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-8">
              <div className="max-w-2xl mx-auto">
                <ProgressIndicator currentStep={currentStep} totalSteps={3} />
                
                <div className="bg-card rounded-lg border border-border p-6 lg:p-8 shadow-sm">
                  {errors.general && (
                    <ErrorMessage 
                      message={errors.general} 
                      onClose={() => {
                        setErrors(prev => ({ ...prev, general: '' }));
                        setIsResumingRegistration(false);
                      }}
                    />
                  )}
                  {isResumingRegistration && !errors.general && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Icon name="Info" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {t('register.resumingRegistration') || 'Resuming incomplete registration'}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('register.resumingRegistrationDesc') || 'We found an incomplete registration for this email. You will be redirected to complete payment.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {renderStep()}

                  {/* Terms and Conditions for Step 3 */}
                  {currentStep === 3 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Checkbox
                        label={
                          <span className="text-sm">
                            {t('register.acceptTerms')}{' '}
                            <Link to="/terms" className="text-primary hover:underline">
                              {t('footer.legal.terms')}
                            </Link>{' '}
                            {t('register.and')}{' '}
                            <Link to="/privacy" className="text-primary hover:underline">
                              {t('footer.legal.privacy')}
                            </Link>
                          </span>
                        }
                        checked={formData.acceptTerms}
                        onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                        error={errors.acceptTerms}
                        required
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    {currentStep > 1 ? (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        iconName="ChevronLeft"
                        iconPosition="left"
                      >
                        {t('ui.buttons.back')}
                      </Button>
                    ) : (
                      <div />
                    )}
                    
                    <Button
                      variant={currentStep === 3 ? "success" : "continue"}
                      onClick={currentStep === 3 ? handleSubmit : handleNext}
                      iconName={currentStep === 3 ? undefined : "ChevronRight"}
                      iconPosition="right"
                      disabled={isLoading || isValidatingEmail}
                      isLoading={isLoading || isValidatingEmail}
                    >
                      {isLoading || isValidatingEmail ? t('ui.buttons.loading') : getButtonText()}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Benefits, Testimonials and Trust Signals */}
            <div className="lg:col-span-4">
              <div className="space-y-6">
                {/* Benefits */}
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {t('register.benefits.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="TrendingUp" size={16} color="var(--color-success)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{t('register.benefits.signatures')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('register.benefits.signaturesDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="Clock" size={16} color="var(--color-primary)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{t('register.benefits.timeSaving')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('register.benefits.timeSavingDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="BarChart3" size={16} color="var(--color-accent)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{t('register.benefits.analytics')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('register.benefits.analyticsDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('register.testimonials.title')}
                  </h3>
                  {testimonials.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                  ))}
                </div>

                {/* Trust Signals */}
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                    {t('register.security.title')}
                  </h3>
                  <TrustSignals />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;