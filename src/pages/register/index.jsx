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
      quote: "Mes signatures ont augmenté de 45% en 2 mois. L\'IA optimise vraiment mes devis !",
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
      if (!formData.fullName.trim()) newErrors.fullName = 'Le nom est requis';
      if (!formData.companyName.trim()) newErrors.companyName = 'Le nom d\'entreprise est requis';
      if (!formData.profession) newErrors.profession = 'La profession est requise';
      if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.password) newErrors.password = 'Le mot de passe est requis';
      else if (formData.password.length < 8) newErrors.password = 'Minimum 8 caractères';
      if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
      if (!formData.country) newErrors.country = 'Le pays est requis';
    }

    if (step === 2) {
      if (!formData.businessSize) newErrors.businessSize = 'Sélectionnez la taille';
    }

    if (step === 3) {
      if (!formData.selectedPlan) newErrors.selectedPlan = 'Sélectionnez un plan';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Vous devez accepter les conditions';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Hammer" size={20} color="white" />
              </div>
              <span className="text-xl font-bold text-foreground">Havitam</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Déjà inscrit ?</span>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-8">
            <div className="max-w-2xl mx-auto">
              <ProgressIndicator currentStep={currentStep} totalSteps={3} />
              
              <div className="bg-card rounded-lg border border-border p-6 lg:p-8 shadow-professional">
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

                  {currentStep < 3 ? (
                    <Button
                      onClick={handleNext}
                      iconName="ChevronRight"
                      iconPosition="right"
                    >
                      {getButtonText()}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      loading={isLoading}
                      iconName="Zap"
                      iconPosition="left"
                      disabled={!formData.acceptTerms}
                    >
                      {getButtonText()}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="space-y-6">
              {/* Benefits */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-professional">
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
              <div className="bg-card rounded-lg border border-border p-6 shadow-professional">
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
  );
};

export default Register;