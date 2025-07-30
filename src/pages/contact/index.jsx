import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ContactPage = () => {
  
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
    if (!formData.firstName) newErrors.firstName = 'Prénom est requis';
    if (!formData.lastName) newErrors.lastName = 'Nom est requis';
    
    if (!formData.email) {
      newErrors.email = 'Email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.subject) newErrors.subject = 'Sujet est requis';
    if (!formData.message) newErrors.message = 'Message est requis';
    
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
    { value: '', label: 'Sélectionnez un sujet' },
    { value: 'demo', label: 'Demande de démonstration' },
    { value: 'question', label: 'Question sur le produit' },
    { value: 'support', label: 'Assistance technique' },
    { value: 'partnership', label: 'Proposition de partenariat' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <>
      <Helmet>
        <title>Contact - HAVITAM</title>
        <meta name="description" content="Contactez l'équipe HAVITAM pour toute question sur notre plateforme pour artisans, pour une démonstration ou un support technique." />
        <meta name="keywords" content="contact, support, artisans, devis, facture, gestion" />
        <html lang="fr" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Main Content */}
        <main className="flex-grow">
        {/* Contact Header */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-[#12bf23]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn">
                <Icon name="MessageCircle" size={16} className="mr-2" />
                Contactez-nous
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Parlons de votre{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  projet
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Notre équipe d'experts est là pour vous accompagner dans votre transformation digitale
              </p>
              
              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>Réponse sous 24h</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>Support français</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>Accompagnement gratuit</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Form Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#0036ab]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#12bf23]/5 rounded-full blur-3xl"></div>
            </div>
            
          <div className="container mx-auto px-4 relative z-10">
            {/* Contact Layout - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Left Column - Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Parlons de votre projet</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Que vous soyez un artisan qui souhaite découvrir Havitam ou un client ayant besoin d'aide, nous sommes là pour vous accompagner.
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
                        <h3 className="font-semibold text-foreground text-lg mb-1">Email</h3>
                        <p className="text-muted-foreground mb-1">contact@havitam.com</p>
                        <p className="text-sm text-muted-foreground/70">Réponse sous 24h</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <Icon name="Phone" size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg mb-1">Téléphone</h3>
                        <p className="text-muted-foreground mb-1">+33 1 23 45 67 89</p>
                        <p className="text-sm text-muted-foreground/70">Lun-Ven, 9h-18h</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <Icon name="MapPin" size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg mb-1">Adresse</h3>
                        <p className="text-muted-foreground mb-1">123 Rue de la Paix, 75001 Paris</p>
                        <p className="text-sm text-muted-foreground/70">Siège social</p>
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
                    <h2 className="text-2xl font-bold text-foreground mb-3">Message envoyé !</h2>
                    <p className="text-muted-foreground mb-6">Nous vous répondrons dans les plus brefs délais.</p>
                    <Button 
                      onClick={() => setIsSubmitted(false)} 
                      variant="outline"
                    >
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un message</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name and Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Nom <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            error={errors.firstName}
                            placeholder="Votre nom"
                            required
                            className="h-11"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={errors.email}
                            placeholder="Votre email"
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Sujet <span className="text-red-500">*</span>
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
                          Message <span className="text-red-500">*</span>
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
                          placeholder="Décrivez votre demande..."
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
                          isLoading={isSubmitting}
                          disabled={isSubmitting}
                          className="w-full bg-[#0036ab] hover:bg-[#0036ab]/90 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                          iconName="Send"
                          iconPosition="left"
                        >
                          {isSubmitting ? "Envoi en cours..." : "Envoyer"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default ContactPage; 