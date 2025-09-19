import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { completeRegistration, checkUserRegistration } from '../../services/authService';
import { createCheckoutSession } from '../../services/stripeService';
import { optimizePaymentFlow } from '../../utils/paymentOptimization';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ErrorMessage from '../../components/ui/ErrorMessage';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    vatNumber: '',
    profession: '',
    country: 'BE',
    businessSize: '',
    selectedPlan: 'pro',
    billingCycle: 'monthly',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  // Clear any existing session storage data when component mounts
  useEffect(() => {
    // Clear any pending registration data from previous attempts
    sessionStorage.removeItem('pendingRegistration');
    sessionStorage.removeItem('registration_complete');
  }, []);

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
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = t('errors.required');
      if (!formData.companyName.trim()) newErrors.companyName = t('errors.required');
      if (!formData.profession) newErrors.profession = t('errors.required');
      if (!formData.email.trim()) newErrors.email = t('errors.required');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('errors.invalidEmail');
      if (!formData.password) newErrors.password = t('errors.required');
      else if (formData.password.length < 8) newErrors.password = t('errors.tooShort');
      if (!formData.phone.trim()) newErrors.phone = t('errors.required');
      else {
        // Phone number validation - should be between 10-15 digits with optional + prefix
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = t('errors.invalidPhone');
        }
      }
      if (!formData.country) newErrors.country = t('errors.required');
    }

    if (step === 2) {
      if (!formData.businessSize) newErrors.businessSize = t('errors.required');
    }

    if (step === 3) {
      if (!formData.selectedPlan) newErrors.selectedPlan = t('errors.required');
      if (!formData.acceptTerms) newErrors.acceptTerms = t('errors.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
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
      const { data: checkData, error: checkError } = await checkUserRegistration(formData.email);
      
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
      
      // Step 1: Complete user registration
      const { data: authData, error: authError } = await completeRegistration(formData);
      
      if (authError) {
        if (authError.code === 'user_already_exists' || authError.message?.includes('already registered')) {
          setErrors({ email: t('errors.emailAlreadyExists') });
        } else {
          setErrors({ general: authError.message || t('errors.registrationFailed') });
        }
        setIsLoading(false);
        cleanupOptimization(); // Clean up optimization
        return;
      }

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
        return;
      }

      // Step 3: Redirect to Stripe checkout
      if (stripeData?.url) {
        // Store detailed registration completion information
        sessionStorage.setItem('registration_pending', JSON.stringify({
          userId: authData.user.id,
          email: authData.user.email,
          plan: formData.selectedPlan,
          billingCycle: formData.billingCycle,
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
        return <StepOne formData={formData} updateFormData={updateFormData} errors={errors} />;
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
                      onClose={() => setErrors(prev => ({ ...prev, general: '' }))}
                    />
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
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      {isLoading ? t('ui.buttons.loading') : getButtonText()}
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