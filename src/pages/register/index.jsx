import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ProgressIndicator from './components/ProgressIndicator';
import StepOne from './components/StepOne';
import StepTwo from './components/StepTwo';
import StepThree from './components/StepThree';
import TestimonialCard from './components/TestimonialCard';
import TrustSignals from './components/TrustSignals';
import Footer from '../../components/Footer';

const Register = () => {
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
    profession: '',
    country: 'FR',
    businessSize: '',
    selectedPlan: 'pro',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  const testimonials = [
    {
      id: 1,
      name: "Pierre Martin",
      trade: "Plombier",
      location: "Lyon",
      rating: 5,
      quote: "Mes signatures ont augmenté de 45% en 2 mois. L'IA optimise vraiment mes devis !",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Sophie Dubois",
      trade: "Électricienne",
      location: "Paris",
      rating: 5,
      quote: "Fini les relances manuelles ! Havitam gère tout automatiquement.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
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
      if (!formData.fullName.trim()) newErrors.fullName = 'Ce champ est requis';
      if (!formData.companyName.trim()) newErrors.companyName = 'Ce champ est requis';
      if (!formData.profession) newErrors.profession = 'Ce champ est requis';
      if (!formData.email.trim()) newErrors.email = 'Ce champ est requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.password) newErrors.password = 'Ce champ est requis';
      else if (formData.password.length < 8) newErrors.password = 'Trop court';
      if (!formData.phone.trim()) newErrors.phone = 'Ce champ est requis';
      if (!formData.country) newErrors.country = 'Ce champ est requis';
    }

    if (step === 2) {
      if (!formData.businessSize) newErrors.businessSize = 'Ce champ est requis';
    }

    if (step === 3) {
      if (!formData.selectedPlan) newErrors.selectedPlan = 'Ce champ est requis';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Ce champ est requis';
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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 2000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 2:
        return <StepTwo formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 3:
        return <StepThree formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (currentStep === 3) return 'Commencer l\'essai gratuit';
    return 'Continuer';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 relative">
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
            <span className="text-sm font-medium">Accueil</span>
          </Link>
        </div>
        
        {/* Login Link */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Déjà un compte?</span>
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center space-x-1">
              <span>Connexion</span>
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
                  {renderStep()}

                  {/* Terms and Conditions for Step 3 */}
                  {currentStep === 3 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Checkbox
                        label={
                          <span className="text-sm">
                            J'accepte les{' '}
                            <Link to="/terms" className="text-primary hover:underline">
                              conditions d'utilisation
                            </Link>{' '}
                            et la{' '}
                            <Link to="/privacy" className="text-primary hover:underline">
                              politique de confidentialité
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

                  {/* Boost signatures message for Step 1 */}
                  {currentStep === 1 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Icon name="Zap" size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Boost your signatures by 40%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Our AI automatically optimizes your quotes to maximize your chances of signing.
                          </p>
                        </div>
                      </div>
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
                        Retour
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
                      {isLoading ? 'Chargement...' : getButtonText()}
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
                    Pourquoi choisir Havitam ?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="TrendingUp" size={16} color="var(--color-success)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">+40% de signatures</h4>
                        <p className="text-sm text-muted-foreground">
                          L'IA optimise vos devis pour maximiser les conversions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="Clock" size={16} color="var(--color-primary)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Gain de temps</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatisation des relances et optimisations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="BarChart3" size={16} color="var(--color-accent)" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Analytics avancés</h4>
                        <p className="text-sm text-muted-foreground">
                          Suivez vos performances en temps réel
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Ils nous font confiance
                  </h3>
                  {testimonials.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                  ))}
                </div>

                {/* Trust Signals */}
                <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                    Sécurité & Conformité
                  </h3>
                  <TrustSignals />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Register;