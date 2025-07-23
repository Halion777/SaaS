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
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Page Title */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('contact.title')}</h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('contact.subtitle')}
              </p>
            </div>
            
            {/* Contact Layout - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Left Column - Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">{t('contact.projectTitle') || "Parlons de votre projet"}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t('contact.projectDescription') || "Que vous soyez un artisan qui souhaite découvrir Havitam ou un client ayant besoin d'aide, nous sommes là pour vous accompagner."}
                  </p>
                </div>
                
                {/* Contact Method Cards */}
                <div className="space-y-6">
                  {/* Email Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <Icon name="Mail" size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg mb-1">{t('contact.info.email')}</h3>
                        <p className="text-muted-foreground mb-1">{t('contact.info.emailValue')}</p>
                        <p className="text-sm text-muted-foreground/70">{t('contact.responseTime') || "Réponse sous 24h"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live Chat Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <Icon name="MessageCircle" size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg mb-1">{t('contact.liveChat') || "Chat en direct"}</h3>
                        <p className="text-muted-foreground mb-1">{t('contact.availability') || "Disponible de 9h à 18h"}</p>
                        <p className="text-sm text-muted-foreground/70">{t('contact.workDays') || "Du lundi au vendredi"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Contact Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <Icon name="Check" size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">{t('contact.success.title')}</h2>
                    <p className="text-muted-foreground mb-6">{t('contact.success.message')}</p>
                    <Button 
                      onClick={() => setIsSubmitted(false)} 
                      variant="outline"
                    >
                      {t('contact.success.button')}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-6">{t('contact.form.title') || "Envoyez-nous un message"}</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name and Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            {t('contact.form.name') || "Nom"} <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            error={errors.firstName}
                            placeholder={t('contact.form.namePlaceholder') || "Votre nom"}
                            required
                            className="h-11"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            {t('contact.form.email')} <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={errors.email}
                            placeholder={t('contact.form.emailPlaceholder') || "Votre email"}
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          {t('contact.form.subject')} <span className="text-red-500">*</span>
                        </label>
                        <Select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          options={subjectOptions}
                          error={errors.subject}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      {/* Message */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          {t('contact.form.message')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          rows={5}
                          className={`w-full px-4 py-3 rounded-lg border resize-none transition-all duration-200 ${
                            errors.message 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                              : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                          } focus:outline-none focus:ring-2`}
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder={t('contact.form.messagePlaceholder') || "Décrivez votre demande..."}
                          required
                        ></textarea>
                        {errors.message && (
                          <p className="text-red-500 text-sm font-medium mt-1">{errors.message}</p>
                        )}
                      </div>
                      
                      {/* Submit Button */}
                      <div className="pt-2">
                        <Button 
                          type="submit"
                          variant="primary"
                          isLoading={isSubmitting}
                          disabled={isSubmitting}
                          fullWidth
                          className="h-12 text-base font-semibold"
                          iconName="Send"
                          iconPosition="left"
                        >
                          {isSubmitting ? t('contact.form.sending') || "Envoi en cours..." : t('contact.form.sendButton')}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default ContactPage; 