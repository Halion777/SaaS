import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LeadManagementService from '../../services/leadManagementService';
import { getCountryOptions, getRegionOptionsForCountry } from '../../constants/countriesAndRegions';

const FindArtisanPage = () => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formData, setFormData] = useState({
    categories: [],
    country: 'BE', // Default to Belgium
    region: '',
    streetNumber: '',
    fullAddress: '',
    zipCode: '',
    city: '',
    description: '',
    priceRange: '',
    completionDate: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    clientAddress: '',
    communicationPreferences: {
      email: true,
      phone: false,
      sms: false
    },
    languagePreference: 'fr', // Default to French
    projectImages: [], // Store File objects for preview
    uploadedFilePaths: [] // Store uploaded file paths for submission
  });
  const fileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const priceDropdownRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const regionDropdownRef = useRef(null);
  const captchaRef = useRef(null);

  // Handle click outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close category dropdown if clicked outside
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      // Close price dropdown if clicked outside
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target)) {
        setPriceDropdownOpen(false);
      }

      // Close country dropdown if clicked outside
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }

      // Close region dropdown if clicked outside
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target)) {
        setRegionDropdownOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup uploaded files when component unmounts (if form wasn't submitted)
  useEffect(() => {
    return () => {
      // If there are uploaded files and form wasn't submitted, clean them up
      if (formData.uploadedFilePaths.length > 0 && !formSubmitted) {
        LeadManagementService.deleteProjectFiles(formData.uploadedFilePaths)
          .catch(error => console.error('Error cleaning up files on unmount:', error));
      }
    };
  }, [formData.uploadedFilePaths, formSubmitted]);

  // Load Google reCAPTCHA script and render CAPTCHA
  useEffect(() => {
    // Check if CAPTCHA is disabled via environment variable
    const captchaDisabled = import.meta.env.VITE_DISABLE_CAPTCHA === 'true' || import.meta.env.VITE_DISABLE_CAPTCHA === '1';
    if (captchaDisabled) {
      console.log('CAPTCHA is disabled via VITE_DISABLE_CAPTCHA environment variable.');
      return;
    }
    
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    
    // Don't load CAPTCHA if site key is not configured
    if (!siteKey) {
      console.warn('reCAPTCHA site key not found. Please set VITE_RECAPTCHA_SITE_KEY in your environment variables.');
      return;
    }

    const renderCaptcha = () => {
      if (window.grecaptcha && captchaRef.current && !captchaRef.current.hasChildNodes()) {
        try {
          window.grecaptcha.render(captchaRef.current, {
            'sitekey': siteKey,
            'callback': handleCaptchaChange,
            'expired-callback': () => {
              setCaptchaToken(null);
              if (errors.captcha) {
                setErrors(prev => ({
                  ...prev,
                  captcha: t('findArtisan.form.captchaExpired') || 'CAPTCHA expired. Please verify again.'
                }));
              }
            },
            'error-callback': () => {
              setCaptchaToken(null);
              setErrors(prev => ({
                ...prev,
                captcha: t('findArtisan.form.captchaError') || 'CAPTCHA verification failed. Please try again.'
              }));
            }
          });
        } catch (error) {
          console.error('Error rendering reCAPTCHA:', error);
          setErrors(prev => ({
            ...prev,
            captcha: t('findArtisan.form.captchaError') || 'Failed to load CAPTCHA. Please refresh the page.'
          }));
        }
      }
    };

    // Check if script already exists
    if (document.querySelector('script[src*="recaptcha"]')) {
      // Script already loaded, just render CAPTCHA
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderCaptcha);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderCaptcha);
      }
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      setErrors(prev => ({
        ...prev,
        captcha: t('findArtisan.form.captchaError') || 'Failed to load CAPTCHA. Please check your internet connection.'
      }));
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: reset CAPTCHA but don't remove script (might be used elsewhere)
      if (window.grecaptcha && captchaRef.current) {
        try {
          const widgetId = captchaRef.current.getAttribute('data-widget-id');
          if (widgetId) {
            window.grecaptcha.reset(widgetId);
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  // CAPTCHA callback
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (errors.captcha) {
      setErrors(prev => ({
        ...prev,
        captcha: ''
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Auto-fill client address when work address changes
    if (field === 'streetNumber' || field === 'fullAddress' || field === 'zipCode') {
      const newAddress = `${formData.streetNumber || ''} ${formData.fullAddress || ''}, ${formData.zipCode || ''}`.trim();
      if (newAddress && newAddress !== ', ') {
        setFormData(prev => ({
          ...prev,
          clientAddress: newAddress
        }));
      }
    }

    // Reset region when country changes
    if (field === 'country') {
      setFormData(prev => ({
        ...prev,
        region: ''
      }));
      // Clear region error when country changes
      if (errors.region) {
        setErrors(prev => ({
          ...prev,
          region: ''
        }));
      }
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const currentCategories = prev.categories;
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(cat => cat !== category)
        : [...currentCategories, category];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
    
    // Clear category error when user selects a category
    if (errors.categories) {
      setErrors(prev => ({
        ...prev,
        categories: ''
      }));
    }
  };

  const handleCommunicationPreferenceChange = (preference) => {
    setFormData(prev => ({
      ...prev,
      communicationPreferences: {
        ...prev.communicationPreferences,
        [preference]: !prev.communicationPreferences[preference]
      }
    }));
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length > 0) {
      try {
        // Store the actual File objects for preview
        setFormData(prev => ({
          ...prev,
          projectImages: [...prev.projectImages, ...files]
        }));
        
        // Upload files to Supabase Storage in background
        const { success, data: uploadedFiles, error } = await LeadManagementService.uploadProjectFiles(files);
        
        if (success) {
          // Store the uploaded file URLs for submission (instead of paths)
          setFormData(prev => ({
            ...prev,
            uploadedFilePaths: [...prev.uploadedFilePaths, ...uploadedFiles.map(f => f.url)]
          }));
        } else {
          console.error('File upload failed:', error);
          // Remove the files from preview if upload failed
          setFormData(prev => ({
            ...prev,
            projectImages: prev.projectImages.filter(file => !files.includes(file))
          }));
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        // Remove the files from preview if upload failed
        setFormData(prev => ({
          ...prev,
          projectImages: prev.projectImages.filter(file => !files.includes(file))
        }));
      }
    }
  };

  const removeImage = async (index) => {
    try {
      // Get the file URL to delete from storage
      const fileUrlToDelete = formData.uploadedFilePaths[index];
      
      if (fileUrlToDelete) {
        // Extract file path from URL for deletion
        const urlParts = fileUrlToDelete.split('/');
        const filePath = urlParts.slice(-2).join('/'); // Get last two parts: temp-upload/filename
        
        // Delete file from Supabase Storage
        const { success, error } = await LeadManagementService.deleteProjectFiles([filePath]);
        
        if (!success) {
          console.error('Failed to delete file from storage:', error);
          // You could show a user-friendly error message here
        }
      }
      
      // Remove from local state
      setFormData(prev => {
        const newProjectImages = prev.projectImages.filter((_, i) => index !== i);
        const newUploadedFilePaths = prev.uploadedFilePaths.filter((_, i) => index !== i);
        
        return {
          ...prev,
          projectImages: newProjectImages,
          uploadedFilePaths: newUploadedFilePaths
        };
      });
      
    } catch (error) {
      console.error('Error removing image:', error);
      // Even if storage deletion fails, remove from local state to avoid UI issues
      setFormData(prev => {
        const newProjectImages = prev.projectImages.filter((_, i) => index !== i);
        const newUploadedFilePaths = prev.uploadedFilePaths.filter((_, i) => index !== i);
        
        return {
          ...prev,
          projectImages: newProjectImages,
          uploadedFilePaths: newUploadedFilePaths
        };
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Project Information
    if (formData.categories.length === 0) {
      newErrors.categories = t('findArtisan.form.categoryError') || 'Please select at least one category';
    }
    
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = t('findArtisan.form.descriptionError') || 'Project description is required';
    }
    
    // Location Information
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }
    
    if (!formData.region) {
      newErrors.region = 'Please select a region';
    }
    
    if (!formData.zipCode || formData.zipCode.trim() === '') {
      newErrors.zipCode = t('findArtisan.form.zipCodeError') || 'Zip code is required';
    }
    
    if (!formData.city || formData.city.trim() === '') {
      newErrors.city = t('findArtisan.form.cityError') || 'City is required';
    }
    
    if (!formData.streetNumber || formData.streetNumber.trim() === '') {
      newErrors.streetNumber = t('findArtisan.form.streetNumberError') || 'Street number is required';
    }
    
    if (!formData.fullAddress || formData.fullAddress.trim() === '') {
      newErrors.fullAddress = t('findArtisan.form.fullAddressError') || 'Full address is required';
    }
    
    // Contact Information
    if (!formData.firstName || formData.firstName.trim() === '') {
      newErrors.firstName = t('findArtisan.form.firstNameError') || 'First name is required';
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      newErrors.lastName = t('findArtisan.form.lastNameError') || 'Last name is required';
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = t('findArtisan.form.phoneError') || 'Phone number is required';
    }
    
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = t('findArtisan.form.emailError') || 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('findArtisan.form.emailInvalid') || 'Please enter a valid email address';
    }
    
    if (!formData.clientAddress || formData.clientAddress.trim() === '') {
      newErrors.clientAddress = t('findArtisan.form.clientAddressError') || 'Client address is required';
    }
    
    // CAPTCHA validation (skip if disabled via environment variable)
    const captchaDisabled = import.meta.env.VITE_DISABLE_CAPTCHA === 'true' || import.meta.env.VITE_DISABLE_CAPTCHA === '1';
    if (!captchaDisabled && !captchaToken) {
      newErrors.captcha = t('findArtisan.form.captchaError') || 'Please complete the CAPTCHA verification';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setFormSubmitted(true);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false); // Reset success state
    
    try {
      // Prepare data for submission (use uploaded file URLs instead of File objects)
      // Only include files that are still in the uploadedFilePaths array
      // Combine firstName and lastName into fullName for backend
      const submissionData = {
        ...formData,
        fullName: [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim(),
        projectImages: formData.uploadedFilePaths // Use uploaded URLs for submission
        // Note: CAPTCHA is validated frontend-only (no backend verification needed)
      };
      
      // Create the lead request using our service
      const { success, data: lead, error } = await LeadManagementService.createLeadRequest(submissionData);
      
      if (success) {
        // Success! Lead created - reset validation state and show success
        setFormSubmitted(false); // Reset validation errors
        setSubmitSuccess(true); // Set success state
        setErrors({}); // Clear all errors
        setCaptchaToken(null); // Reset CAPTCHA
        
        // Clear form data
        setFormData({
          categories: [],
          country: 'BE',
          region: '',
          streetNumber: '',
          fullAddress: '',
          zipCode: '',
          city: '',
          description: '',
          priceRange: '',
          completionDate: '',
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          clientAddress: '',
          communicationPreferences: {
            email: true,
            phone: false,
            sms: false
          },
          languagePreference: 'fr',
          projectImages: [],
          uploadedFilePaths: []
        });
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Reset CAPTCHA (only if not disabled)
        const captchaDisabled = import.meta.env.VITE_DISABLE_CAPTCHA === 'true' || import.meta.env.VITE_DISABLE_CAPTCHA === '1';
        if (!captchaDisabled && window.grecaptcha && captchaRef.current) {
          try {
            const widgetId = captchaRef.current.getAttribute('data-widget-id');
            if (widgetId) {
              window.grecaptcha.reset(widgetId);
            } else if (captchaRef.current.querySelector('[data-widget-id]')) {
              const widgetElement = captchaRef.current.querySelector('[data-widget-id]');
              const id = widgetElement.getAttribute('data-widget-id');
              window.grecaptcha.reset(id);
            }
          } catch (e) {
            // If reset fails, just clear the container and re-render
            if (captchaRef.current) {
              captchaRef.current.innerHTML = '';
            }
          }
        }
        
      } else {
        throw error;
      }
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      setSubmitError('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
      // Reset CAPTCHA on error (only if not disabled)
      const captchaDisabled = import.meta.env.VITE_DISABLE_CAPTCHA === 'true' || import.meta.env.VITE_DISABLE_CAPTCHA === '1';
      if (!captchaDisabled && window.grecaptcha) {
        window.grecaptcha.reset();
      }
      if (!captchaDisabled) {
        setCaptchaToken(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceRanges = [
    { value: 'unknown', label: t('findArtisan.priceRanges.dontKnow') },
    { value: '0-500', label: t('findArtisan.priceRanges.range1') },
    { value: '500-1000', label: t('findArtisan.priceRanges.range2') },
    { value: '1000-2500', label: t('findArtisan.priceRanges.range3') },
    { value: '2500-5000', label: t('findArtisan.priceRanges.range4') },
    { value: '5000-7000', label: t('findArtisan.priceRanges.range5') },
    { value: '7000-10000', label: t('findArtisan.priceRanges.range6') },
    { value: '10000-20000', label: t('findArtisan.priceRanges.range7') },
    { value: '20000+', label: t('findArtisan.priceRanges.range8') }
  ];

  const workCategories = [
    { 
      value: 'plumbing', 
      label: t('findArtisan.categories.plumbing'),
      icon: 'Wrench'
    },
    { 
      value: 'electrical', 
      label: t('findArtisan.categories.electrical'),
      icon: 'Zap'
    },
    { 
      value: 'painting', 
      label: t('findArtisan.categories.painting'),
      icon: 'Brush'
    },
    { 
      value: 'carpentry', 
      label: t('findArtisan.categories.carpentry'),
      icon: 'Hammer'
    },
    { 
      value: 'tiling', 
      label: t('findArtisan.categories.tiling'),
      icon: 'Square'
    },
    { 
      value: 'roofing', 
      label: t('findArtisan.categories.roofing'),
      icon: 'Home'
    },
    { 
      value: 'masonry', 
      label: t('findArtisan.categories.masonry'),
      icon: 'Building'
    },
    { 
      value: 'heating', 
      label: t('findArtisan.categories.heating'),
      icon: 'Thermometer'
    },
    { 
      value: 'renovation', 
      label: t('findArtisan.categories.renovation'),
      icon: 'Hammer'
    },
    { 
      value: 'cleaning', 
      label: t('findArtisan.categories.cleaning'),
      icon: 'Sparkles'
    },
    { 
      value: 'solar', 
      label: t('findArtisan.categories.solar'),
      icon: 'Sun'
    },
    { 
      value: 'gardening', 
      label: t('findArtisan.categories.gardening'),
      icon: 'TreePine'
    },
    { 
      value: 'locksmith', 
      label: t('findArtisan.categories.locksmith'),
      icon: 'Key'
    },
    { 
      value: 'glazing', 
      label: t('findArtisan.categories.glazing'),
      icon: 'Square'
    },
    { 
      value: 'insulation', 
      label: t('findArtisan.categories.insulation'),
      icon: 'Shield'
    },
    { 
      value: 'airConditioning', 
      label: t('findArtisan.categories.airConditioning'),
      icon: 'Thermometer'
    },
    { 
      value: 'other', 
      label: t('findArtisan.categories.other'),
      icon: 'Tool'
    }
  ];

  const steps = [
    {
      number: 1,
      title: t('findArtisan.steps.step1.title'),
      description: t('findArtisan.steps.step1.description')
    },
    {
      number: 2,
      title: t('findArtisan.steps.step2.title'),
      description: t('findArtisan.steps.step2.description')
    },
    {
      number: 3,
      title: t('findArtisan.steps.step3.title'),
      description: t('findArtisan.steps.step3.description')
    },
    {
      number: 4,
      title: t('findArtisan.steps.step4.title'),
      description: t('findArtisan.steps.step4.description')
    }
  ];

  // Get country and region options
  const countryOptions = getCountryOptions();
  const regionOptions = getRegionOptionsForCountry(formData.country);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('meta.findArtisan.title')}</title>
        <meta name="description" content={t('meta.findArtisan.description')} />
        <meta name="keywords" content={t('meta.findArtisan.keywords')} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph */}
        <meta property="og:title" content={t('meta.findArtisan.title')} />
        <meta property="og:description" content={t('meta.findArtisan.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('meta.findArtisan.title')} />
        <meta name="twitter:description" content={t('meta.findArtisan.description')} />
      </Helmet>
      
      <Header />
      
      {/* Main Content */}
      <main>
        {/* Find Artisan Header */}
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
                <Icon name="Search" size={16} className="mr-2" />
                {t('findArtisan.hero.badge')}
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                {t('findArtisan.hero.title.prefix')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">
                  {t('findArtisan.hero.title.highlight')}
                </span>{' '}
                {t('findArtisan.hero.title.suffix')}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                {t('findArtisan.hero.subtitle')}
              </p>
              
              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('findArtisan.hero.benefits.certified')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('findArtisan.hero.benefits.freeQuotes')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="CheckCircle" size={16} className="mr-2 text-[#12bf23]" />
                  <span>{t('findArtisan.hero.benefits.qualityGuarantee')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Steps */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Desktop View */}
              <div className="hidden md:flex flex-row justify-between items-start space-x-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center text-center flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg mb-4 bg-[#0036ab]">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-gray-900 leading-tight mb-2">{step.title}</div>
                      <div className="text-sm text-gray-500 leading-tight">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mobile View - Compact with icons in one row */}
              <div className="md:hidden">
                <div className="flex justify-between items-center">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm bg-[#0036ab] mb-2">
                        {step.number}
                      </div>
                      <div className="text-xs font-semibold text-gray-900 leading-tight max-w-16">
                        {step.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Form Section */}
        <section className="py-2">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-foreground mb-8">
                  {t('findArtisan.form.title')}
                </h2>
                
                {submitSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon name="CheckCircle" className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      {t('findArtisan.form.success.title')}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t('findArtisan.form.success.message')}
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setFormSubmitted(false);
                      }}
                      variant="outline"
                    >
                      {t('findArtisan.form.success.sendAnother')}
                    </Button>
                  </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project Information */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="Briefcase" size={20} />
                        {t('findArtisan.form.projectInfo', 'Project Information')}
                      </h3>

                      <div className="space-y-4">
                    {/* Work Category */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('findArtisan.form.category')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative" ref={categoryDropdownRef}>
                        {/* Custom Dropdown Button */}
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className={`w-full h-11 pl-10 pr-4 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-all text-left flex items-center ${
                            errors.categories 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                              : 'border-border focus:ring-primary/20 focus:border-primary'
                          }`}
                        >
                          <div className="absolute left-3 text-muted-foreground">
                            <Icon name="Briefcase" className="w-5 h-5" />
                          </div>
                          <span className={`flex-1 truncate ${formData.categories.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {formData.categories.length > 0 
                              ? (
                                <>
                                  <span className="hidden sm:inline">
                                    {formData.categories.map(cat => workCategories.find(c => c.value === cat)?.label).join(', ')}
                                  </span>
                                  <span className="sm:hidden">
                                    {formData.categories.length === 1 
                                      ? workCategories.find(c => c.value === formData.categories[0])?.label
                                      : `${formData.categories.length} ${t('findArtisan.form.categoriesSelected', 'categories selected')}`
                                    }
                                  </span>
                                </>
                              )
                              : t('findArtisan.form.selectCategory')
                            }
                          </span>
                          <div className="absolute right-3 text-muted-foreground flex-shrink-0">
                            <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        {/* Dropdown Options */}
                        {dropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {workCategories.map(category => (
                              <button
                                key={category.value}
                                type="button"
                                onClick={() => handleCategoryToggle(category.value)}
                                className={`w-full px-3 py-2 text-left text-sm outline-none transition-transform duration-200 hover:scale-[1.02] flex items-center rounded-sm ${
                                  formData.categories.includes(category.value) ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                                  formData.categories.includes(category.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon name={category.icon} className="w-3 h-3" />
                                </div>
                                <span className="flex-1">{category.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Error message if no category selected */}
                      {errors.categories && (
                        <p className="text-sm text-red-500 mt-2">
                          {errors.categories}
                        </p>
                      )}
                    </div>

                        {/* Project Description */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('findArtisan.form.description')} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder={t('findArtisan.form.descriptionPlaceholder')}
                            className={`w-full h-32 px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-all resize-none ${
                              errors.description 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                                : 'border-border focus:ring-primary/20 focus:border-primary'
                            }`}
                            required
                          />
                          {errors.description && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.description}
                            </p>
                          )}
                        </div>

                        {/* Price Range */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('findArtisan.form.priceRange')}
                          </label>
                          <div className="relative" ref={priceDropdownRef}>
                            {/* Custom Dropdown Button */}
                            <button
                              type="button"
                              onClick={() => setPriceDropdownOpen(!priceDropdownOpen)}
                              className="w-full h-11 pl-10 pr-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left flex items-center"
                            >
                              <div className="absolute left-3 text-muted-foreground">
                                <Icon name="Euro" className="w-5 h-5" />
                              </div>
                              <span className={formData.priceRange ? 'text-foreground' : 'text-muted-foreground'}>
                                {formData.priceRange 
                                  ? priceRanges.find(range => range.value === formData.priceRange)?.label
                                  : t('findArtisan.form.selectPriceRange')
                                }
                              </span>
                              <div className="absolute right-3 text-muted-foreground">
                                <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${priceDropdownOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            
                            {/* Dropdown Options */}
                            {priceDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                {priceRanges.map(range => (
                                  <button
                                    key={range.value}
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('priceRange', range.value);
                                      setPriceDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center ${
                                      formData.priceRange === range.value ? 'bg-primary/10 text-primary' : 'text-foreground'
                                    }`}
                                  >
                                    <span className="text-sm">{range.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Completion Date */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('findArtisan.form.completionDate')}
                          </label>
                          <Input
                            type="date"
                            value={formData.completionDate}
                            onChange={(e) => handleInputChange('completionDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        {/* Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('findArtisan.form.photos')} <span className="text-muted-foreground text-xs">({t('findArtisan.form.optional')})</span>
                          </label>
                          <div className="space-y-3">
                            <div 
                              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Icon name="Upload" className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {t('findArtisan.form.clickToAddPhotos')}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('findArtisan.form.fileTypes')}
                              </p>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                              />
                            </div>
                            
                            {/* Preview uploaded images */}
                            {formData.projectImages.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                {formData.projectImages.map((file, index) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-video rounded-md overflow-hidden bg-muted">
                                      <img 
                                        src={file instanceof File ? URL.createObjectURL(file) : file} 
                                        alt={`Project ${index}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Icon name="X" className="w-4 h-4 text-destructive" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="MapPin" size={20} />
                        {t('findArtisan.form.locationInfo', 'Location Information')}
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Pays <span className="text-red-500">*</span>
                      </label>
                      <div className="relative" ref={countryDropdownRef}>
                        {/* Custom Dropdown Button */}
                        <button
                          type="button"
                          onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                          className={`w-full h-11 pl-10 pr-4 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-all text-left flex items-center ${
                            errors.country 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                              : 'border-border focus:ring-primary/20 focus:border-primary'
                          }`}
                        >
                          <div className="absolute left-3 text-muted-foreground">
                            <Icon name="Globe" className="w-5 h-5" />
                          </div>
                          <span className={formData.country ? 'text-foreground' : 'text-muted-foreground'}>
                            {formData.country 
                              ? countryOptions.find(c => c.value === formData.country)?.label
                              : 'Sélectionner le pays'
                            }
                          </span>
                          <div className="absolute right-3 text-muted-foreground">
                            <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        {/* Dropdown Options */}
                        {countryDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {countryOptions.map(country => (
                              <button
                                key={country.value}
                                type="button"
                                onClick={() => {
                                  handleInputChange('country', country.value);
                                  setCountryDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm outline-none transition-transform duration-200 hover:scale-[1.02] flex items-center rounded-sm ${
                                  formData.country === country.value ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                                  formData.country === country.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon name="Flag" className="w-3 h-3" />
                                </div>
                                <span className="flex-1">{country.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Region Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Région/Province *
                      </label>
                      <div className="relative" ref={regionDropdownRef}>
                        {/* Custom Dropdown Button */}
                        <button
                          type="button"
                          onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                          disabled={!formData.country}
                          className={`w-full h-11 pl-10 pr-4 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-all text-left flex items-center ${
                            !formData.country ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            errors.region 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                              : 'border-border focus:ring-primary/20 focus:border-primary'
                          }`}
                        >
                          <div className="absolute left-3 text-muted-foreground">
                            <Icon name="MapPin" className="w-5 h-5" />
                          </div>
                          <span className={formData.region ? 'text-foreground' : 'text-muted-foreground'}>
                            {formData.region 
                              ? formData.region
                              : formData.country ? 'Sélectionner la région' : 'Sélectionnez d\'abord un pays'
                            }
                          </span>
                          <div className="absolute right-3 text-muted-foreground">
                            <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        {/* Dropdown Options */}
                        {regionDropdownOpen && formData.country && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {regionOptions.map(region => (
                              <button
                                key={region.value}
                                type="button"
                                onClick={() => {
                                  handleInputChange('region', region.value);
                                  setRegionDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm outline-none transition-transform duration-200 hover:scale-[1.02] flex items-center rounded-sm ${
                                  formData.region === region.value ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                                  formData.region === region.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon name="MapPin" className="w-3 h-3" />
                                </div>
                                <span className="flex-1">{region.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Error message if no region selected */}
                      {errors.region && (
                        <p className="text-sm text-red-500 mt-2">
                          {errors.region}
                        </p>
                      )}
                      {errors.country && (
                        <p className="text-sm text-red-500 mt-2">
                          {errors.country}
                        </p>
                      )}
                          </div>
                    </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('findArtisan.form.zipCode')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder={t('findArtisan.form.zipCodePlaceholder')}
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        error={errors.zipCode}
                        required
                      />
                    </div>

                          {/* City */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              {t('findArtisan.form.city', 'City')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="text"
                              placeholder={t('findArtisan.form.cityPlaceholder', 'Enter city')}
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              error={errors.city}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Street Number */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('findArtisan.form.streetNumber')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder={t('findArtisan.form.streetNumberPlaceholder')}
                        value={formData.streetNumber}
                        onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                        error={errors.streetNumber}
                        required
                      />
                    </div>

                    {/* Full Address */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('findArtisan.form.fullAddress')} *
                      </label>
                      <Input
                        type="text"
                        placeholder={t('findArtisan.form.fullAddressPlaceholder')}
                        value={formData.fullAddress}
                        onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                        error={errors.fullAddress}
                        required
                      />
                    </div>
                    </div>
                          </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="User" size={20} />
                        {t('findArtisan.form.contactInfo')}
                      </h3>

                      <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('registerForm.step1.firstName', 'First Name')} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder={t('registerForm.step1.firstNamePlaceholder', 'John')}
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            error={errors.firstName}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('registerForm.step1.lastName', 'Last Name')} *
                          </label>
                          <Input
                            type="text"
                            placeholder={t('registerForm.step1.lastNamePlaceholder', 'Doe')}
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            error={errors.lastName}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('findArtisan.form.phone')} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="tel"
                            placeholder={t('findArtisan.form.phonePlaceholder')}
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            error={errors.phone}
                            required
                          />
                        </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('findArtisan.form.email')} *
                        </label>
                        <Input
                          type="email"
                          placeholder={t('findArtisan.form.emailPlaceholder')}
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          error={errors.email}
                          required
                        />
                      </div>
                        </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('findArtisan.form.clientAddress')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder={t('findArtisan.form.clientAddressPlaceholder')}
                          value={formData.clientAddress}
                          onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                          error={errors.clientAddress}
                          required
                        />
                        </div>
                      </div>
                    </div>

                    {/* Communication Preferences */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="MessageSquare" size={20} />
                        {t('findArtisan.form.communicationPreferences')}
                      </h3>

                      <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        {t('findArtisan.form.communicationPreferences')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="pref-email"
                            checked={formData.communicationPreferences.email}
                            onChange={() => handleCommunicationPreferenceChange('email')}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <label htmlFor="pref-email" className="text-sm text-foreground">
                            {t('findArtisan.form.preferences.email')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="pref-phone"
                            checked={formData.communicationPreferences.phone}
                            onChange={() => handleCommunicationPreferenceChange('phone')}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <label htmlFor="pref-phone" className="text-sm text-foreground">
                            {t('findArtisan.form.preferences.phone')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="pref-sms"
                            checked={formData.communicationPreferences.sms}
                            onChange={() => handleCommunicationPreferenceChange('sms')}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <label htmlFor="pref-sms" className="text-sm text-foreground">
                            {t('findArtisan.form.preferences.sms')}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Language Preference */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                        {t('findArtisan.form.languagePreference', 'Préférence de langue')}
                      </label>
                      <Select
                        value={formData.languagePreference || 'fr'}
                        onChange={(e) => handleInputChange('languagePreference', e.target.value)}
                        options={[
                          { value: 'fr', label: '🇫🇷 Français' },
                          { value: 'en', label: '🇬🇧 English' },
                          { value: 'nl', label: '🇳🇱 Nederlands' }
                        ]}
                      />
                          <p className="text-xs text-muted-foreground mt-2">
                        {t('findArtisan.form.languagePreferenceHelp', 'Nous communiquerons avec vous dans cette langue')}
                      </p>
                        </div>
                      </div>
                    </div>

                    {/* CAPTCHA */}
                    {!(import.meta.env.VITE_DISABLE_CAPTCHA === 'true' || import.meta.env.VITE_DISABLE_CAPTCHA === '1') && (
                      <div className="pt-4">
                        <div className="flex flex-col items-center">
                          <div 
                            ref={captchaRef}
                            id="recaptcha-container"
                          />
                          {errors.captcha && (
                            <p className="text-sm text-red-500 mt-2">
                              {errors.captcha}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg font-semibold"
                        iconName="ArrowRight"
                        iconPosition="right"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('findArtisan.form.submitting') : t('findArtisan.form.submit')}
                      </Button>
                      {submitError && (
                        <p className="text-sm text-destructive mt-2 text-center">{submitError}</p>
                      )}
                      {submitSuccess && (
                        <p className="text-sm text-green-600 mt-2 text-center font-medium">
                          Votre demande a été envoyée avec succès ! Nous vous contacterons bientôt.
                        </p>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FindArtisanPage; 