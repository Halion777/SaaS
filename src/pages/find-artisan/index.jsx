import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const FindArtisanPage = () => {
  const { t, language } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    address: '',
    zipCode: '',
    description: '',
    priceRange: '',
    completionDate: '',
    fullName: '',
    phone: '',
    email: '',
    projectImages: []
  });
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Store the file objects in the state
      setFormData(prev => ({
        ...prev,
        projectImages: [...prev.projectImages, ...files]
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      projectImages: prev.projectImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    // Check if category is selected before proceeding
    if (formData.category === '') {
      return;
    }
    
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const priceRanges = [
    { value: '0-500', label: '0–500€' },
    { value: '500-1000', label: '500–1,000€' },
    { value: '1000-2500', label: '1,000–2,500€' },
    { value: '2500-5000', label: '2,500–5,000€' },
    { value: '5000-7000', label: '5,000–7,000€' },
    { value: '7000-10000', label: '7,000–10,000€' },
    { value: '10000-20000', label: '10,000–20,000€' },
    { value: '20000+', label: '20,000+€' }
  ];

  const workCategories = [
    { 
      value: 'plumbing', 
      label: t('findArtisan.filters.plumbing') || 'Plumbing',
      icon: 'Wrench'
    },
    { 
      value: 'electrical', 
      label: t('findArtisan.filters.electrical') || 'Electrical',
      icon: 'Zap'
    },
    { 
      value: 'painting', 
      label: t('findArtisan.filters.painting') || 'Painting',
      icon: 'Brush'
    },
    { 
      value: 'carpentry', 
      label: t('findArtisan.filters.carpentry') || 'Carpentry',
      icon: 'Hammer'
    },
    { 
      value: 'tiling', 
      label: t('findArtisan.filters.tiling') || 'Tiling',
      icon: 'Hammer'
    },
    { 
      value: 'roofing', 
      label: t('findArtisan.filters.roofing') || 'Roofing',
      icon: 'Hammer'
    },
    { 
      value: 'masonry', 
      label: t('findArtisan.filters.masonry') || 'Masonry',
      icon: 'Hammer'
    },
    { 
      value: 'heating', 
      label: t('findArtisan.filters.heating') || 'Heating',
      icon: 'Zap'
    },
    { 
      value: 'gardening', 
      label: t('findArtisan.filters.gardening') || 'Gardening',
      icon: 'Shovel'
    },
    { 
      value: 'other', 
      label: t('findArtisan.filters.other') || 'Other',
      icon: 'Hammer'
    }
  ];

  const steps = [
    {
      number: 1,
      title: t('findArtisan.steps.category.title') || 'Work category',
      description: t('findArtisan.steps.category.description') || 'Select the type of work'
    },
    {
      number: 2,
      title: t('findArtisan.steps.location.title') || 'Work location',
      description: t('findArtisan.steps.location.description') || 'Provide the work address'
    },
    {
      number: 3,
      title: t('findArtisan.steps.description.title') || 'Project description',
      description: t('findArtisan.steps.description.description') || 'Describe your work in detail'
    },
    {
      number: 4,
      title: t('findArtisan.steps.contact.title') || 'Your contact details',
      description: t('findArtisan.steps.contact.description') || 'So craftsmen can contact you'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{t('pageTitles.findArtisan')}</title>
        <meta name="description" content={t('findArtisan.metaDescription') || "Trouvez un artisan qualifié près de chez vous pour vos projets de rénovation et construction."} />
        <html lang={language} />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t('findArtisan.hero.title') || "Trouvez un artisan qualifié"}
              </h1>
              <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                {t('findArtisan.hero.description') || "Décrivez vos travaux et recevez rapidement des devis d'artisans près de chez vous"}
              </p>
            </div>
          </div>
        </section>

        {/* Progress Steps */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-start space-y-8 md:space-y-0 md:space-x-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center text-center flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg mb-4 bg-blue-600">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-gray-900 leading-tight mb-2">{step.title}</div>
                      <div className="text-sm text-gray-500 leading-tight">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main Form Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-foreground mb-8">
                  {t('findArtisan.form.title') || "Décrivez votre projet"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Work Category */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.category') || "Work category"} *
                    </label>
                    <div className="relative">
                      {/* Custom Dropdown Button */}
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full h-11 pl-10 pr-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left flex items-center"
                      >
                        <div className="absolute left-3 text-muted-foreground">
                          <Icon name="Briefcase" className="w-5 h-5" />
                        </div>
                        <span className={formData.category ? 'text-foreground' : 'text-muted-foreground'}>
                          {formData.category 
                            ? workCategories.find(cat => cat.value === formData.category)?.label
                            : t('findArtisan.form.selectCategory') || "Select a category"
                          }
                        </span>
                        <div className="absolute right-3 text-muted-foreground">
                          <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {/* Dropdown Options */}
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {workCategories.map(category => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => {
                                handleInputChange('category', category.value);
                                setDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center ${
                                formData.category === category.value ? 'bg-primary/10 text-primary' : 'text-foreground'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                                formData.category === category.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                              }`}>
                                <Icon name={category.icon} className="w-3 h-3" />
                              </div>
                              <span className="text-sm">{category.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Error message if no category selected */}
                    {formSubmitted && formData.category === '' && (
                      <p className="text-sm text-destructive mt-2">
                        {t('findArtisan.form.categoryRequired') || "Please select a work category"}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.address') || "Adresse ou ville du chantier"} *
                    </label>
                    <Input
                      type="text"
                      placeholder={t('findArtisan.form.addressPlaceholder') || "Ex: 123 Rue de la Paix, Paris"}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.zipCode') || "Code postal"} *
                    </label>
                    <Input
                      type="text"
                      placeholder={t('findArtisan.form.zipCodePlaceholder') || "Ex: 75001"}
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      required
                    />
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.description') || "Description du projet"} *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder={t('findArtisan.form.descriptionPlaceholder') || "Décrivez vos travaux en détail : nature, dimensions, matériaux souhaités..."}
                      className="w-full h-32 px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      required
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.priceRange') || "Fourchette de prix"}
                    </label>
                    <div className="relative">
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
                            : t('findArtisan.form.selectPriceRange') || "Select price range"
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

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.projectImages') || "Photos du projet"} <span className="text-muted-foreground text-xs">{t('findArtisan.form.optional') || "(Optionnel)"}</span>
                    </label>
                    <div className="space-y-3">
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Icon name="Upload" className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t('findArtisan.form.uploadInstructions') || "Cliquez pour ajouter des photos"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('findArtisan.form.uploadFormats') || "JPG, PNG ou PDF jusqu'à 5 MB"}
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
                                  src={URL.createObjectURL(file)} 
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

                  {/* Completion Date */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.completionDate') || "Date souhaitée de réalisation"}
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={t('findArtisan.form.datePlaceholder') || "Sélectionnez une date"}
                        value={formData.completionDate}
                        onChange={(e) => handleInputChange('completionDate', e.target.value)}
                        icon="Calendar"
                        iconPosition="right"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-4">
                      {t('findArtisan.form.contactInfo') || "Vos coordonnées"}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('findArtisan.form.fullName') || "Nom / Prénom"} *
                        </label>
                        <Input
                          type="text"
                          placeholder={t('findArtisan.form.fullNamePlaceholder') || "Votre nom complet"}
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('findArtisan.form.phone') || "Téléphone"}
                        </label>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('findArtisan.form.email') || "Email"} *
                    </label>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-semibold"
                      iconName="ArrowRight"
                      iconPosition="right"
                    >
                      {t('findArtisan.form.submit') || "Envoyer ma demande"}
                    </Button>
                  </div>
                </form>
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