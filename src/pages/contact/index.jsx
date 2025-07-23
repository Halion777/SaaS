import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LanguageDropdown from '../../components/LanguageDropdown';
import { useTranslation } from '../../context/TranslationContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ContactPage = () => {
  const { t, language } = useTranslation();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = t('contact.form.firstName') + ' ' + t('errors.required');
    if (!formData.lastName) newErrors.lastName = t('contact.form.lastName') + ' ' + t('errors.required');
    
    if (!formData.email) {
      newErrors.email = t('contact.form.email') + ' ' + t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }
    
    if (!formData.subject) newErrors.subject = t('contact.form.subject') + ' ' + t('errors.required');
    if (!formData.message) newErrors.message = t('contact.form.message') + ' ' + t('errors.required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  // Subject options
  const subjectOptions = [
    { value: '', label: t('contact.form.selectSubject') },
    { value: 'demo', label: t('subjectOptions.demo') || 'Demande de démonstration' },
    { value: 'question', label: t('subjectOptions.question') || 'Question sur le produit' },
    { value: 'support', label: t('subjectOptions.support') || 'Assistance technique' },
    { value: 'partnership', label: t('subjectOptions.partnership') || 'Proposition de partenariat' },
    { value: 'other', label: t('subjectOptions.other') || 'Autre' }
  ];

  return (
    <>
      <Helmet>
        <title>{t('pageTitles.contact')}</title>
        <meta name="description" content="Contactez l'équipe HAVITAM pour toute question sur notre plateforme pour artisans, pour une démonstration ou un support technique." />
        <meta name="keywords" content="contact, support, artisans, devis, facture, gestion" />
        <html lang={language} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header/Navigation */}
        <Header />
        
        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('contact.title')}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('contact.subtitle')}
              </p>
            </div>
            
            {/* Contact Form and Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Contact Form */}
              <div className="lg:col-span-2 p-6 md:p-8">
                {isSubmitted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6">
                      <Icon name="Check" size={32} color="var(--color-success)" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">{t('contact.success.title')}</h2>
                    <p className="text-muted-foreground mb-8">{t('contact.success.message')}</p>
                    <Button 
                      onClick={() => setIsSubmitted(false)} 
                      variant="outline"
                    >
                      {t('contact.success.button')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input 
                          label={t('contact.form.firstName')}
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          error={errors.firstName}
                          required
                        />
                      </div>
                      <div>
                        <Input 
                          label={t('contact.form.lastName')}
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          error={errors.lastName}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input 
                          label={t('contact.form.email')}
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={errors.email}
                          required
                        />
                      </div>
                      <div>
                        <Input 
                          label={t('contact.form.phone')}
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          error={errors.phone}
                        />
                      </div>
                    </div>
                    
                    {/* Subject */}
                    <div>
                      <Select
                        label={t('contact.form.subject')}
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        options={subjectOptions}
                        error={errors.subject}
                        required
                      />
                    </div>
                    
                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('contact.form.message')} <span className="text-error">*</span>
                      </label>
                      <textarea
                        name="message"
                        rows={5}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.message ? 'border-error' : 'border-border'
                        } focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                      {errors.message && (
                        <p className="mt-1 text-error text-sm">{errors.message}</p>
                      )}
                    </div>
                    
                    {/* Submit Button */}
                    <div>
                      <Button 
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        fullWidth
                      >
                        {t('contact.form.sendButton')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
              
              {/* Contact Information */}
              <div className="bg-primary text-white p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6">{t('contact.info.title')}</h2>
                
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <Icon name="Mail" size={20} color="white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('contact.info.email')}</h3>
                      <p className="mt-1">{t('contact.info.emailValue')}</p>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <Icon name="MapPin" size={20} color="white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('contact.info.address')}</h3>
                      <p className="mt-1 whitespace-pre-line">{t('contact.info.addressValue')}</p>
                    </div>
                  </div>
                  
                  {/* Hours */}
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <Icon name="Clock" size={20} color="white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t('contact.info.hours')}</h3>
                      <p className="mt-1 whitespace-pre-line">{t('contact.info.hoursValue')}</p>
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  <div>
                    <h3 className="font-medium mb-3">{t('contact.info.social')}</h3>
                    <div className="flex space-x-4">
                      <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Icon name="Twitter" size={18} color="white" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Icon name="Linkedin" size={18} color="white" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Icon name="Facebook" size={18} color="white" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Icon name="Instagram" size={18} color="white" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* FAQ */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Questions fréquentes</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Consultez notre FAQ pour obtenir des réponses rapides à vos questions.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {/* FAQ Item 1 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Comment fonctionne l'essai gratuit ?
                </h3>
                <p className="text-muted-foreground">
                  Notre essai gratuit de 14 jours vous donne un accès complet à toutes les fonctionnalités de HAVITAM. Vous pouvez l'annuler à tout moment sans frais.
                </p>
              </div>
              
              {/* FAQ Item 2 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Comment puis-je contacter le support technique ?
                </h3>
                <p className="text-muted-foreground">
                  Notre équipe de support est disponible par email à contact@havitam.com.
                </p>
              </div>
              
              {/* FAQ Item 3 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Est-il possible d'obtenir une démonstration personnalisée ?
                </h3>
                <p className="text-muted-foreground">
                  Oui, nous proposons des démonstrations personnalisées pour vous montrer comment HAVITAM peut répondre à vos besoins spécifiques. Contactez notre équipe commerciale pour prendre rendez-vous.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default ContactPage; 