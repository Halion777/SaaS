import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../services/supabaseClient';
import { uploadFile, getPublicUrl, deleteFile } from '../../../../services/storageService';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';
import SuperAdminSidebar from '../../../../components/ui/SuperAdminSidebar';
import TableLoader from '../../../../components/ui/TableLoader';

const Customization = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'banner', 'company', 'media', 'pricing'
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // Language for banner settings
  const [serviceSettings, setServiceSettings] = useState({
    creditInsurance: true,
    recovery: true
  });
  const [homePageServicesVisibility, setHomePageServicesVisibility] = useState({
    enabled: false
  });
  const [companyDetails, setCompanyDetails] = useState({
    email: 'support@haliqo.com',
    phone: '028846333',
    address: 'Brussels, Belgium',
    addressType: 'Headquarters',
    responseTime: 'Response within 24h',
    hours: 'Mon-Fri, 9am-6pm',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });
  const [mediaSettings, setMediaSettings] = useState({
    home: {
      heroImage: {
        fr: '',
        en: '',
        nl: ''
      },
      desktopImage: {
        fr: '',
        en: '',
        nl: ''
      },
      mobileImage: {
        fr: '',
        en: '',
        nl: ''
      },
      demoVideo: {
        fr: '',
        en: '',
        nl: ''
      },
      featureImages: {}
    },
    about: {
      heroImage: '',
      ourStoryLeft: '',
      ourStoryRight: '',
      ourFounder: '',
      multiPlatformDesktop: {
        fr: '',
        en: '',
        nl: ''
      },
      multiPlatformMobile: {
        fr: '',
        en: '',
        nl: ''
      },
      teamImages: {},
      officeImages: {}
    }
  });
  const [selectedMediaLanguage, setSelectedMediaLanguage] = useState('fr');
  const [uploadingFiles, setUploadingFiles] = useState({});
  
  // Refs for debouncing auto-save
  const mediaSaveTimeoutRef = useRef(null);
  const companySaveTimeoutRef = useRef(null);
  const bannerSaveTimeoutRef = useRef(null);
  const serviceSaveTimeoutRef = useRef(null);
  const pricingSaveTimeoutRef = useRef(null);
  const homeServicesSaveTimeoutRef = useRef(null);

  // Refs for file inputs
  const homeHeroImageRef = useRef(null);
  const homeDesktopImageRef = useRef(null);
  const homeMobileImageRef = useRef(null);
  const homeDemoVideoRef = useRef(null);
  const aboutHeroImageRef = useRef(null);
  const aboutOurStoryLeftRef = useRef(null);
  const aboutOurStoryRightRef = useRef(null);
  const aboutOurFounderRef = useRef(null);
  const aboutMultiPlatformDesktopRef = useRef(null);
  const aboutMultiPlatformMobileRef = useRef(null);
  const [sponsoredBannerSettings, setSponsoredBannerSettings] = useState({
    enabled: true,
    fr: {
      title: '',
      description: '',
      discount: '',
      buttonText: '',
      buttonLink: '',
      image: ''
    },
    en: {
      title: '',
      description: '',
      discount: '',
      buttonText: '',
      buttonLink: '',
      image: ''
    },
    nl: {
      title: '',
      description: '',
      discount: '',
      buttonText: '',
      buttonLink: '',
      image: ''
    }
  });
  const [pricingSettings, setPricingSettings] = useState({
    starter: {
      name: 'Starter Plan',
      description: 'An intelligent entry-level plan for craftsmen who want clean, compliant quotes and invoices with a tool that is very easy to use.',
      monthly: 39.99,
      yearly: 31.99, // 20% discount: €39,99 × 0.8 = €31,99/month when billed yearly
      popular: false
    },
    pro: {
      name: 'Pro Plan',
      description: 'The premium version of your back-office: an intelligent tool focused on AI, automation and growth, still very easy to use for any craftsman.',
      monthly: 69.99,
      yearly: 55.99, // 20% discount: €69,99 × 0.8 = €55,99/month when billed yearly
      popular: true
    }
  });

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  // Handle sidebar toggle and responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load service visibility settings
      const { data: serviceData, error: serviceError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'service_visibility')
        .maybeSingle();

      if (serviceError && serviceError.code !== 'PGRST116') {
        console.error('❌ Error loading service settings:', serviceError);
      } else if (serviceData && serviceData.setting_value) {
        setServiceSettings(serviceData.setting_value);
      }

      // Load home page services visibility settings
      const { data: homeServicesData, error: homeServicesError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'home_page_services_visibility')
        .maybeSingle();

      if (homeServicesError && homeServicesError.code !== 'PGRST116') {
        console.error('❌ Error loading home page services visibility settings:', homeServicesError);
      } else if (homeServicesData && homeServicesData.setting_value) {
        setHomePageServicesVisibility(homeServicesData.setting_value);
      } else {
        // Default to disabled if no setting exists
        setHomePageServicesVisibility({ enabled: false });
      }

      // Load company details settings
      const { data: companyData, error: companyError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'company_details')
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') {
        console.error('❌ Error loading company details:', companyError);
      } else if (companyData && companyData.setting_value) {
        
        // Ensure socialLinks exists
        const loadedDetails = companyData.setting_value;
        setCompanyDetails({
          ...loadedDetails,
          socialLinks: loadedDetails.socialLinks || {
            facebook: '',
            twitter: '',
            linkedin: '',
            instagram: ''
          }
        });
      }

      // Load pricing settings
      const { data: pricingData, error: pricingError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'pricing_settings')
        .maybeSingle();

      if (pricingError && pricingError.code !== 'PGRST116') {
        console.error('❌ Error loading pricing settings:', pricingError);
      } else if (pricingData && pricingData.setting_value) {
        setPricingSettings(pricingData.setting_value);
      } else {
        // Keep default values
      }

      // Load media settings
      const { data: mediaData, error: mediaError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'media_settings')
        .maybeSingle();

      if (mediaError && mediaError.code !== 'PGRST116') {
        console.error('❌ Error loading media settings:', mediaError);
      } else if (mediaData && mediaData.setting_value) {
    
        const loadedMedia = mediaData.setting_value;
        // Ensure proper structure with language support
        setMediaSettings({
          home: {
            heroImage: typeof loadedMedia.home?.heroImage === 'object' 
              ? loadedMedia.home.heroImage 
              : { fr: '', en: '', nl: '' },
            desktopImage: typeof loadedMedia.home?.desktopImage === 'object'
              ? loadedMedia.home.desktopImage
              : { fr: '', en: '', nl: '' },
            mobileImage: typeof loadedMedia.home?.mobileImage === 'object'
              ? loadedMedia.home.mobileImage
              : { fr: '', en: '', nl: '' },
            demoVideo: loadedMedia.home?.demoVideo || { fr: '', en: '', nl: '' },
            featureImages: loadedMedia.home?.featureImages || {}
          },
          about: {
            heroImage: loadedMedia.about?.heroImage || '',
            ourStoryLeft: loadedMedia.about?.ourStoryLeft || '',
            ourStoryRight: loadedMedia.about?.ourStoryRight || '',
            ourFounder: loadedMedia.about?.ourFounder || '',
            multiPlatformDesktop: loadedMedia.about?.multiPlatformDesktop || { fr: '', en: '', nl: '' },
            multiPlatformMobile: loadedMedia.about?.multiPlatformMobile || { fr: '', en: '', nl: '' },
            teamImages: loadedMedia.about?.teamImages || {},
            officeImages: loadedMedia.about?.officeImages || {}
          }
        });
      }

      // Load sponsored banner settings
      const { data: bannerData, error: bannerError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'sponsored_banner')
        .maybeSingle();

      if (bannerError && bannerError.code !== 'PGRST116') {
        console.error('❌Error loading banner settings:', bannerError);
      } else if (bannerData && bannerData.setting_value) {
        
        setSponsoredBannerSettings(bannerData.setting_value);
      } else {
        // Set default values if no settings found
        setSponsoredBannerSettings({
          enabled: true,
          fr: {
            title: 'Optimisez vos Devis avec l\'IA Premium',
            description: 'Augmentez votre taux de signature de 40% avec des suggestions intelligentes',
            discount: '30% de réduction',
            buttonText: 'Découvrir Premium',
            buttonLink: '/subscription',
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
          },
          en: {
            title: 'Optimize Your Quotes with Premium AI',
            description: 'Increase your signature rate by 40% with intelligent suggestions',
            discount: '30% discount',
            buttonText: 'Discover Premium',
            buttonLink: '/subscription',
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
          },
          nl: {
            title: 'Optimaliseer Uw Offertes met Premium AI',
            description: 'Verhoog uw handtekeningpercentage met 40% met intelligente suggesties',
            discount: '30% korting',
            buttonText: 'Ontdek Premium',
            buttonLink: '/subscription',
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
          }
        });
      }
    } catch (error) {
      console.error('❌ Exception loading settings:', error);

    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (service) => {
    const updated = {
      ...serviceSettings,
      [service]: !serviceSettings[service]
    };
    handleServiceSettingsChange(updated);
  };

  // Handle file upload
  const handleFileUpload = async (file, mediaType, pageType, language = null) => {
    if (!file) return;

    const fileKey = language ? `${pageType}_${mediaType}_${language}` : `${pageType}_${mediaType}`;
    setUploadingFiles(prev => ({ ...prev, [fileKey]: true }));

    try {
      // Determine folder based on page, media type, and language
      const folder = language ? `${pageType}/${mediaType}/${language}` : `${pageType}/${mediaType}`;

      // Upload file to Haliqo_Data bucket
      const { data, error, filePath } = await uploadFile(file, 'Haliqo_Data', folder);

      if (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
        setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
        return;
      }

      // Get public URL
      const publicUrl = getPublicUrl('Haliqo_Data', filePath);

      // Update media settings
      if (pageType === 'home') {
        if (mediaType === 'heroImage' && language) {
          // Delete old file if exists and it's from our bucket
          const oldUrl = mediaSettings.home.heroImage?.[language];
          if (oldUrl && oldUrl.includes('Haliqo_Data')) {
            try {
              const urlParts = oldUrl.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              home: {
                ...prev.home,
                heroImage: {
                  ...prev.home.heroImage,
                  [language]: publicUrl
                }
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'desktopImage' && language) {
          // Delete old file if exists
          const oldUrl = mediaSettings.home.desktopImage?.[language];
          if (oldUrl && oldUrl.includes('Haliqo_Data')) {
            try {
              const urlParts = oldUrl.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              home: {
                ...prev.home,
                desktopImage: {
                  ...prev.home.desktopImage,
                  [language]: publicUrl
                }
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'mobileImage' && language) {
          // Delete old file if exists
          const oldUrl = mediaSettings.home.mobileImage?.[language];
          if (oldUrl && oldUrl.includes('Haliqo_Data')) {
            try {
              const urlParts = oldUrl.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              home: {
                ...prev.home,
                mobileImage: {
                  ...prev.home.mobileImage,
                  [language]: publicUrl
                }
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'demoVideo' && language) {
          // Delete old file if exists and it's from our bucket
          const oldUrl = mediaSettings.home.demoVideo?.[language];
          if (oldUrl && oldUrl.includes('Haliqo_Data')) {
            try {
              const urlParts = oldUrl.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              home: {
                ...prev.home,
                demoVideo: {
                  ...prev.home.demoVideo,
                  [language]: publicUrl
                }
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        }
      } else if (pageType === 'about') {
        if (mediaType === 'heroImage') {
          // Delete old file if exists and it's from our bucket
          if (mediaSettings.about.heroImage && mediaSettings.about.heroImage.includes('Haliqo_Data')) {
            try {
              const urlParts = mediaSettings.about.heroImage.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              about: {
                ...prev.about,
                heroImage: publicUrl
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'ourStoryLeft') {
          // Delete old file if exists
          if (mediaSettings.about.ourStoryLeft && mediaSettings.about.ourStoryLeft.includes('Haliqo_Data')) {
            try {
              const urlParts = mediaSettings.about.ourStoryLeft.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              about: {
                ...prev.about,
                ourStoryLeft: publicUrl
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'ourStoryRight') {
          // Delete old file if exists
          if (mediaSettings.about.ourStoryRight && mediaSettings.about.ourStoryRight.includes('Haliqo_Data')) {
            try {
              const urlParts = mediaSettings.about.ourStoryRight.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              about: {
                ...prev.about,
                ourStoryRight: publicUrl
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        } else if (mediaType === 'ourFounder') {
          // Delete old file if exists
          if (mediaSettings.about.ourFounder && mediaSettings.about.ourFounder.includes('Haliqo_Data')) {
            try {
              const urlParts = mediaSettings.about.ourFounder.split('/Haliqo_Data/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1].split('?')[0];
                await deleteFile('Haliqo_Data', oldPath);
              }
            } catch (e) {
              console.warn('Could not delete old file:', e);
            }
          }
          setMediaSettings(prev => {
            const updated = {
              ...prev,
              about: {
                ...prev.about,
                ourFounder: publicUrl
              }
            };
            // Auto-save after upload
            saveMediaSettings(updated);
            return updated;
          });
        }
      }

      setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Upload failed: ${error.message}`);
      setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  // Save only media settings (helper function for auto-save)
  const saveMediaSettings = async (updatedSettings) => {
    try {
      const { error: mediaError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'media_settings',
          setting_value: updatedSettings,
          description: 'Media files (images, videos) for home, about, and other pages',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (mediaError) {
        console.error('❌ Error saving media settings:', mediaError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving media settings:', error);
      return false;
    }
  };

  // Save only company details (helper function for auto-save)
  const saveCompanyDetails = async (updatedDetails) => {
    try {
      const { error: companyError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'company_details',
          setting_value: updatedDetails,
          description: 'Company contact details (email, phone, address)',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (companyError) {
        console.error('❌ Error saving company details:', companyError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving company details:', error);
      return false;
    }
  };

  // Debounced auto-save for company details
  const handleCompanyDetailsChange = (field, value) => {
    const updated = { ...companyDetails, [field]: value };
    setCompanyDetails(updated);
    
    // Clear existing timeout
    if (companySaveTimeoutRef.current) {
      clearTimeout(companySaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    companySaveTimeoutRef.current = setTimeout(() => {
      saveCompanyDetails(updated);
    }, 1000);
  };

  // Handle social links change
  const handleSocialLinkChange = (platform, value) => {
    const updated = {
      ...companyDetails,
      socialLinks: {
        ...companyDetails.socialLinks,
        [platform]: value
      }
    };
    setCompanyDetails(updated);
    
    // Clear existing timeout
    if (companySaveTimeoutRef.current) {
      clearTimeout(companySaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    companySaveTimeoutRef.current = setTimeout(() => {
      saveCompanyDetails(updated);
    }, 1000);
  };

  // Debounced auto-save for media settings URL changes
  const handleMediaSettingsChange = (updatedSettings) => {
    setMediaSettings(updatedSettings);
    
    // Clear existing timeout
    if (mediaSaveTimeoutRef.current) {
      clearTimeout(mediaSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    mediaSaveTimeoutRef.current = setTimeout(() => {
      saveMediaSettings(updatedSettings);
    }, 1000);
  };

  // Save only sponsored banner settings (helper function for auto-save)
  const saveBannerSettings = async (updatedSettings) => {
    try {
      const { error: bannerError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'sponsored_banner',
          setting_value: updatedSettings,
          description: 'Sponsored banner configuration for dashboard',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (bannerError) {
        console.error('❌ Error saving banner settings:', bannerError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving banner settings:', error);
      return false;
    }
  };

  // Debounced auto-save for sponsored banner settings
  const handleBannerSettingsChange = (updatedSettings) => {
    setSponsoredBannerSettings(updatedSettings);
    
    // Clear existing timeout
    if (bannerSaveTimeoutRef.current) {
      clearTimeout(bannerSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    bannerSaveTimeoutRef.current = setTimeout(() => {
      saveBannerSettings(updatedSettings);
    }, 1000);
  };

  // Save only service visibility settings (helper function for auto-save)
  const saveServiceSettings = async (updatedSettings) => {
    try {
      const { error: serviceError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'service_visibility',
          setting_value: updatedSettings,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (serviceError) {
        console.error('❌ Error saving service settings:', serviceError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving service settings:', error);
      return false;
    }
  };

  // Debounced auto-save for service visibility settings
  const handleServiceSettingsChange = (updatedSettings) => {
    setServiceSettings(updatedSettings);
    
    // Clear existing timeout
    if (serviceSaveTimeoutRef.current) {
      clearTimeout(serviceSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    serviceSaveTimeoutRef.current = setTimeout(() => {
      saveServiceSettings(updatedSettings);
    }, 1000);
  };

  // Save only pricing settings (helper function for auto-save)
  const savePricingSettings = async (updatedSettings) => {
    try {
      const { error: pricingError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'pricing_settings',
          setting_value: updatedSettings,
          description: 'Pricing plans configuration (monthly/yearly)',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (pricingError) {
        console.error('❌ Error saving pricing settings:', pricingError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving pricing settings:', error);
      return false;
    }
  };

  // Helper function to calculate yearly price with 20% discount
  const calculateYearlyPrice = (monthlyPrice) => {
    if (!monthlyPrice || monthlyPrice <= 0) return 0;
    return parseFloat((monthlyPrice * 0.8).toFixed(2)); // 20% discount
  };

  // Debounced auto-save for pricing settings
  const handlePricingSettingsChange = (updatedSettings) => {
    setPricingSettings(updatedSettings);
    
    // Clear existing timeout
    if (pricingSaveTimeoutRef.current) {
      clearTimeout(pricingSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    pricingSaveTimeoutRef.current = setTimeout(() => {
      savePricingSettings(updatedSettings);
    }, 1000);
  };

  // Save only home page services visibility settings (helper function for auto-save)
  const saveHomePageServicesVisibility = async (updatedSettings) => {
    try {
      const { error: homeServicesError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'home_page_services_visibility',
          setting_value: updatedSettings,
          description: 'Controls visibility of Recovery & Credit Insurance section on home page',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (homeServicesError) {
        console.error('❌ Error saving home page services visibility settings:', homeServicesError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving home page services visibility settings:', error);
      return false;
    }
  };

  // Debounced auto-save for home page services visibility settings
  const handleHomePageServicesVisibilityChange = (updatedSettings) => {
    setHomePageServicesVisibility(updatedSettings);
    
    // Clear existing timeout
    if (homeServicesSaveTimeoutRef.current) {
      clearTimeout(homeServicesSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second delay)
    homeServicesSaveTimeoutRef.current = setTimeout(() => {
      saveHomePageServicesVisibility(updatedSettings);
    }, 1000);
  };

  // Handle delete file
  const handleDeleteFile = async (mediaType, pageType, language = null) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      let urlToDelete = '';
      if (pageType === 'home') {
        if (mediaType === 'heroImage' && language) {
          urlToDelete = mediaSettings.home.heroImage?.[language];
        } else if (mediaType === 'desktopImage' && language) {
          urlToDelete = mediaSettings.home.desktopImage?.[language];
        } else if (mediaType === 'mobileImage' && language) {
          urlToDelete = mediaSettings.home.mobileImage?.[language];
        } else if (mediaType === 'demoVideo' && language) {
          urlToDelete = mediaSettings.home.demoVideo?.[language];
        }
      } else if (pageType === 'about') {
        if (mediaType === 'heroImage') {
          urlToDelete = mediaSettings.about.heroImage;
        } else if (mediaType === 'ourStoryLeft') {
          urlToDelete = mediaSettings.about.ourStoryLeft;
        } else if (mediaType === 'ourStoryRight') {
          urlToDelete = mediaSettings.about.ourStoryRight;
        } else if (mediaType === 'ourFounder') {
          urlToDelete = mediaSettings.about.ourFounder;
        } else if (mediaType === 'multiPlatformDesktop' && language) {
          urlToDelete = mediaSettings.about.multiPlatformDesktop?.[language];
        } else if (mediaType === 'multiPlatformMobile' && language) {
          urlToDelete = mediaSettings.about.multiPlatformMobile?.[language];
        }
      }

      if (urlToDelete && urlToDelete.includes('Haliqo_Data')) {
        const urlParts = urlToDelete.split('/Haliqo_Data/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0];
          await deleteFile('Haliqo_Data', filePath);
        }
      }

      // Update state to remove the URL and auto-save
      let updatedSettings = null;
      
      if (pageType === 'home') {
        if (mediaType === 'heroImage' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              home: {
                ...prev.home,
                heroImage: {
                  ...prev.home.heroImage,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'desktopImage' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              home: {
                ...prev.home,
                desktopImage: {
                  ...prev.home.desktopImage,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'mobileImage' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              home: {
                ...prev.home,
                mobileImage: {
                  ...prev.home.mobileImage,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'demoVideo' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              home: {
                ...prev.home,
                demoVideo: {
                  ...prev.home.demoVideo,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        }
      } else if (pageType === 'about') {
        if (mediaType === 'heroImage') {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                heroImage: ''
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'ourStoryLeft') {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                ourStoryLeft: ''
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'ourStoryRight') {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                ourStoryRight: ''
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'ourFounder') {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                ourFounder: ''
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'multiPlatformDesktop' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                multiPlatformDesktop: {
                  ...prev.about.multiPlatformDesktop,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        } else if (mediaType === 'multiPlatformMobile' && language) {
          setMediaSettings(prev => {
            updatedSettings = {
              ...prev,
              about: {
                ...prev.about,
                multiPlatformMobile: {
                  ...prev.about.multiPlatformMobile,
                  [language]: ''
                }
              }
            };
            return updatedSettings;
          });
        }
      }

      // Auto-save media settings after deletion
      if (updatedSettings) {
        const success = await saveMediaSettings(updatedSettings);
        if (!success) {
          alert('File deleted but failed to save settings. Please save manually.');
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e, mediaType, pageType, language = null) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, mediaType, pageType, language);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save service visibility settings
      const { error: serviceError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'service_visibility',
          setting_value: serviceSettings,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (serviceError) {

        return;
      }

      // Save home page services visibility settings
      const { error: homeServicesError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'home_page_services_visibility',
          setting_value: homePageServicesVisibility,
          description: 'Controls visibility of Recovery & Credit Insurance section on home page',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (homeServicesError) {
        console.error('❌ Error saving home page services visibility settings:', homeServicesError);
        return;
      }

      // Save company details
      const { error: companyError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'company_details',
          setting_value: companyDetails,
          description: 'Company contact details (email, phone, address)',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (companyError) {
        console.error('❌ Error saving company details:', companyError);
        return;
      }

      // Save media settings
      const { error: mediaError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'media_settings',
          setting_value: mediaSettings,
          description: 'Media files (images, videos) for home, about, and other pages',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (mediaError) {
        console.error('❌ Error saving media settings:', mediaError);
        return;
      }

      // Save sponsored banner settings
      const { error: bannerError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'sponsored_banner',
          setting_value: sponsoredBannerSettings,
          description: 'Sponsored banner configuration for dashboard',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        });

      if (bannerError) {

        return;
      }


    } catch (error) {

    } finally {
      setSaving(false);
    }
  };

  const services = [
    {
      id: 'creditInsurance',
      name: 'Credit Insurance',
      description: 'Credit insurance service for protecting against payment defaults',
      icon: 'Shield',
      path: '/services/assurance'
    },
    {
      id: 'recovery',
      name: 'Recovery',
      description: 'Debt recovery and collection service',
      icon: 'Banknote',
      path: '/services/recouvrement'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Customization | Super Admin</title>
        <meta name="description" content="Customize application settings and service visibility" />
      </Helmet>

      <SuperAdminSidebar />

      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center gap-3">
                  <Icon name="Sliders" size={24} className="text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Application Customization</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Control which services are visible to users in their sidebar
                </p>
              </div>
            </div>
          </header>

          {loading ? (
            <TableLoader message="Loading customization settings..." />
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-hide border-b border-border">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'services'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Icon name="Eye" size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Service Visibility</span>
                      <span className="xs:hidden">Services</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('banner')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'banner'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Icon name="Gift" size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Sponsored Banner</span>
                      <span className="xs:hidden">Banner</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'company'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Icon name="Building" size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Company Details</span>
                      <span className="xs:hidden">Company</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('media')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'media'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Icon name="Image" size={14} className="sm:w-4 sm:h-4" />
                      <span>Media</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'pricing'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Icon name="DollarSign" size={14} className="sm:w-4 sm:h-4" />
                      <span>Pricing</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Service Visibility Tab */}
              {activeTab === 'services' && (
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <Icon name="Eye" size={18} className="sm:w-5 sm:h-5 text-primary" />
                        Service Visibility
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Toggle services on/off to control what users see in their navigation
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 transition-colors gap-3 sm:gap-0"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${serviceSettings[service.id] ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon
                              name={service.icon}
                              size={20}
                              className="sm:w-6 sm:h-6"
                              style={{ color: serviceSettings[service.id] ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">{service.name}</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-mono truncate">{service.path}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <span className={`text-[10px] sm:text-xs font-medium ${serviceSettings[service.id] ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {serviceSettings[service.id] ? 'Visible' : 'Hidden'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={serviceSettings[service.id]}
                              onChange={() => handleToggle(service.id)}
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    ))}

                    {/* Home Page Services Section Toggle */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-muted/30 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${homePageServicesVisibility.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon
                              name="Home"
                              size={20}
                              className="sm:w-6 sm:h-6"
                              style={{ color: homePageServicesVisibility.enabled ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-medium text-foreground">Home Page Services Section</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">Show/hide Recovery & Credit Insurance section on home page</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <span className={`text-[10px] sm:text-xs font-medium ${homePageServicesVisibility.enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {homePageServicesVisibility.enabled ? 'Visible' : 'Hidden'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={homePageServicesVisibility.enabled}
                              onChange={(e) => handleHomePageServicesVisibilityChange({ enabled: e.target.checked })}
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sponsored Banner Tab */}
              {activeTab === 'banner' && (
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <Icon name="Gift" size={18} className="sm:w-5 sm:h-5 text-primary" />
                        Sponsored Banner Settings
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Configure the sponsored banner displayed on the dashboard
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Language Selection */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border">
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Select Language</label>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => setSelectedLanguage(lang.code)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-colors text-xs sm:text-sm ${selectedLanguage === lang.code
                                ? 'bg-primary text-white border-primary'
                                : 'bg-card text-foreground border-border hover:border-primary/50'
                              }`}
                          >
                            <span className="text-base sm:text-lg">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        Configure banner content for {languages.find(l => l.code === selectedLanguage)?.name}
                      </p>
                    </div>

                    {/* Enabled Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border gap-2 sm:gap-0">
                      <div>
                        <label className="text-sm font-medium text-foreground">Enable Banner</label>
                        <p className="text-xs text-muted-foreground mt-0.5">Show/hide the sponsored banner on dashboard</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={sponsoredBannerSettings.enabled}
                          onChange={(e) => handleBannerSettingsChange({ ...sponsoredBannerSettings, enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Title ({languages.find(l => l.code === selectedLanguage)?.flag})</label>
                      <input
                        type="text"
                        value={sponsoredBannerSettings[selectedLanguage]?.title || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            title: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Optimize Your Quotes with Premium AI"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Description ({languages.find(l => l.code === selectedLanguage)?.flag})</label>
                      <textarea
                        value={sponsoredBannerSettings[selectedLanguage]?.description || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            description: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows="3"
                        placeholder="Increase your signature rate by 40% with intelligent suggestions"
                      />
                    </div>

                    {/* Discount */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Discount Badge ({languages.find(l => l.code === selectedLanguage)?.flag})</label>
                      <input
                        type="text"
                        value={sponsoredBannerSettings[selectedLanguage]?.discount || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            discount: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="30% discount"
                      />
                    </div>

                    {/* Button Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Button Text ({languages.find(l => l.code === selectedLanguage)?.flag})</label>
                      <input
                        type="text"
                        value={sponsoredBannerSettings[selectedLanguage]?.buttonText || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            buttonText: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Discover Premium"
                      />
                    </div>

                    {/* Button Link */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Button Link</label>
                      <input
                        type="text"
                        value={sponsoredBannerSettings[selectedLanguage]?.buttonLink || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            buttonLink: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="/subscription or https://example.com"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Use relative path (e.g., /subscription) or full URL</p>
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Image URL</label>
                      <input
                        type="url"
                        value={sponsoredBannerSettings[selectedLanguage]?.image || ''}
                        onChange={(e) => handleBannerSettingsChange({
                          ...sponsoredBannerSettings,
                          [selectedLanguage]: {
                            ...sponsoredBannerSettings[selectedLanguage],
                            image: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">URL of the banner image</p>
                    </div>

                    {/* Preview */}
                    {sponsoredBannerSettings.enabled && (
                      <div className="mt-6 p-4 sm:p-6 bg-muted/30 rounded-lg border border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Icon name="Eye" size={16} className="text-primary" />
                          Preview ({languages.find(l => l.code === selectedLanguage)?.name})
                        </h4>
                        <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 border border-blue-600/30 rounded-lg p-4 sm:p-6 text-white shadow-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            {sponsoredBannerSettings[selectedLanguage]?.image && (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/20">
                                <img
                                  src={sponsoredBannerSettings[selectedLanguage].image}
                                  alt="Banner preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 space-y-2 sm:space-y-0">
                                <h4 className="text-sm font-semibold text-white">{sponsoredBannerSettings[selectedLanguage]?.title || 'Title'}</h4>
                                {sponsoredBannerSettings[selectedLanguage]?.discount && (
                                  <span className="text-xs px-3 py-1 bg-yellow-500/90 text-white rounded-full w-fit">
                                    {sponsoredBannerSettings[selectedLanguage].discount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/90 mb-3">{sponsoredBannerSettings[selectedLanguage]?.description || 'Description'}</p>
                              <button className="text-xs px-4 py-2 bg-white text-blue-700 rounded-lg font-medium">
                                {sponsoredBannerSettings[selectedLanguage]?.buttonText || 'Button Text'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              
              {/* Company Details Tab */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                          <Icon name="Building" size={24} className="text-primary" />
                          Company Details
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          Manage company contact information displayed on the contact page and footer
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Mail" size={16} className="text-primary" />
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={companyDetails.email || ''}
                        onChange={(e) => handleCompanyDetailsChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="support@haliqo.com"
                      />
                      <p className="text-xs text-muted-foreground mt-2">This email will receive contact form submissions</p>
                    </div>

                    {/* Phone */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Phone" size={16} className="text-primary" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={companyDetails.phone || ''}
                        onChange={(e) => handleCompanyDetailsChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="028846333"
                      />
                    </div>

                    {/* Hours */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Clock" size={16} className="text-primary" />
                        Operating Hours
                      </label>
                      <input
                        type="text"
                        value={companyDetails.hours || ''}
                        onChange={(e) => handleCompanyDetailsChange('hours', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Mon-Fri, 9am-6pm"
                      />
                    </div>

                    {/* Address */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="MapPin" size={16} className="text-primary" />
                        Address
                      </label>
                      <input
                        type="text"
                        value={companyDetails.address || ''}
                        onChange={(e) => handleCompanyDetailsChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Brussels, Belgium"
                      />
                    </div>

                    {/* Address Type */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Tag" size={16} className="text-primary" />
                        Address Type
                      </label>
                      <input
                        type="text"
                        value={companyDetails.addressType || ''}
                        onChange={(e) => handleCompanyDetailsChange('addressType', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Headquarters"
                      />
                    </div>

                    {/* Response Time */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Zap" size={16} className="text-primary" />
                        Response Time
                      </label>
                      <input
                        type="text"
                        value={companyDetails.responseTime || ''}
                        onChange={(e) => handleCompanyDetailsChange('responseTime', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Response within 24h"
                      />
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Icon name="Share2" size={18} className="text-primary" />
                      Social Media Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Icon name="Facebook" size={16} className="text-primary" />
                          Facebook URL
                        </label>
                        <input
                          type="url"
                          value={companyDetails.socialLinks?.facebook || ''}
                          onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://facebook.com/Haliqo"
                        />
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Icon name="Twitter" size={16} className="text-primary" />
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          value={companyDetails.socialLinks?.twitter || ''}
                          onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://twitter.com/Haliqo"
                        />
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Icon name="Linkedin" size={16} className="text-primary" />
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={companyDetails.socialLinks?.linkedin || ''}
                          onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://linkedin.com/company/Haliqo"
                        />
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Icon name="Instagram" size={16} className="text-primary" />
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={companyDetails.socialLinks?.instagram || ''}
                          onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://instagram.com/Haliqo"
                        />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* Media Management Tab */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <Icon name="Image" size={24} className="text-primary" />
                        Media Management
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload and manage images and videos for home, about, and other pages
                      </p>
                    </div>
                  </div>
                </div>
                {/* Language Selector - Only for language-specific media */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Select Language for Multi-Language Media</label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedMediaLanguage(lang.code)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all text-xs sm:text-sm ${selectedMediaLanguage === lang.code
                            ? 'bg-primary text-white border-primary shadow-lg scale-105'
                            : 'bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md'
                          }`}
                      >
                        <span className="text-base sm:text-lg">{lang.flag}</span>
                        <span className="font-medium whitespace-nowrap">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                    <Icon name="Info" size={12} className="sm:w-[14px] sm:h-[14px] inline mr-1" />
                    Select language to upload/view Hero Image, Desktop Image, Mobile Image, and Demo Video for Home Page. Each language has its own media files.
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                {/* Home Page Media */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Home" size={18} className="sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Home Page</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Multi-Platform Section</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Hero Image */}
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <Icon name="Image" size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Hero Image ({languages.find(l => l.code === selectedMediaLanguage)?.flag} {languages.find(l => l.code === selectedMediaLanguage)?.name})</span>
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={homeHeroImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'heroImage', 'home', selectedMediaLanguage)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => homeHeroImageRef.current?.click()}
                            disabled={uploadingFiles[`home_heroImage_${selectedMediaLanguage}`]}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles[`home_heroImage_${selectedMediaLanguage}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.home?.heroImage?.[selectedMediaLanguage] && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('heroImage', 'home', selectedMediaLanguage)}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.home?.heroImage?.[selectedMediaLanguage] || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            home: {
                              ...mediaSettings.home,
                              heroImage: {
                                ...mediaSettings.home.heroImage,
                                [selectedMediaLanguage]: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.home?.heroImage?.[selectedMediaLanguage] && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.home.heroImage[selectedMediaLanguage]}
                              alt="Hero preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Image */}
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <Icon name="Monitor" size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Desktop Image ({languages.find(l => l.code === selectedMediaLanguage)?.flag} {languages.find(l => l.code === selectedMediaLanguage)?.name})</span>
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={homeDesktopImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'desktopImage', 'home', selectedMediaLanguage)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => homeDesktopImageRef.current?.click()}
                            disabled={uploadingFiles[`home_desktopImage_${selectedMediaLanguage}`]}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles[`home_desktopImage_${selectedMediaLanguage}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.home?.desktopImage?.[selectedMediaLanguage] && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('desktopImage', 'home', selectedMediaLanguage)}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.home?.desktopImage?.[selectedMediaLanguage] || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            home: {
                              ...mediaSettings.home,
                              desktopImage: {
                                ...mediaSettings.home.desktopImage,
                                [selectedMediaLanguage]: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.home?.desktopImage?.[selectedMediaLanguage] && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.home.desktopImage[selectedMediaLanguage]}
                              alt="Desktop preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <Icon name="Smartphone" size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Mobile Image ({languages.find(l => l.code === selectedMediaLanguage)?.flag} {languages.find(l => l.code === selectedMediaLanguage)?.name})</span>
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={homeMobileImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'mobileImage', 'home', selectedMediaLanguage)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => homeMobileImageRef.current?.click()}
                            disabled={uploadingFiles[`home_mobileImage_${selectedMediaLanguage}`]}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles[`home_mobileImage_${selectedMediaLanguage}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.home?.mobileImage?.[selectedMediaLanguage] && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('mobileImage', 'home', selectedMediaLanguage)}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.home?.mobileImage?.[selectedMediaLanguage] || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            home: {
                              ...mediaSettings.home,
                              mobileImage: {
                                ...mediaSettings.home.mobileImage,
                                [selectedMediaLanguage]: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.home?.mobileImage?.[selectedMediaLanguage] && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.home.mobileImage[selectedMediaLanguage]}
                              alt="Mobile preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Demo Video */}
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border md:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <Icon name="Video" size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Demo Video ({languages.find(l => l.code === selectedMediaLanguage)?.flag} {languages.find(l => l.code === selectedMediaLanguage)?.name})</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={homeDemoVideoRef}
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileInputChange(e, 'demoVideo', 'home', selectedMediaLanguage)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => homeDemoVideoRef.current?.click()}
                          disabled={uploadingFiles[`home_demoVideo_${selectedMediaLanguage}`]}
                          className="flex-shrink-0"
                        >
                          {uploadingFiles[`home_demoVideo_${selectedMediaLanguage}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Icon name="Upload" size={16} className="mr-2" />
                              Upload Video
                            </>
                          )}
                        </Button>
                        <input
                          type="text"
                          value={mediaSettings.home?.demoVideo?.[selectedMediaLanguage] || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            home: {
                              ...mediaSettings.home,
                              demoVideo: {
                                ...mediaSettings.home.demoVideo,
                                [selectedMediaLanguage]: e.target.value
                              }
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.home?.demoVideo?.[selectedMediaLanguage] && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFile('demoVideo', 'home', selectedMediaLanguage)}
                            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        )}
                      </div>
                      {mediaSettings.home?.demoVideo?.[selectedMediaLanguage] && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                          <video
                            src={mediaSettings.home.demoVideo[selectedMediaLanguage]}
                            controls
                            className="w-full h-auto max-h-64 sm:max-h-80 rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* About Page Media */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="Info" size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">About Page</h3>
                      <p className="text-xs text-muted-foreground">Manage about page media assets</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hero Image */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Image" size={16} className="text-primary" />
                        Hero Image
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={aboutHeroImageRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'heroImage', 'about')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => aboutHeroImageRef.current?.click()}
                            disabled={uploadingFiles['about_heroImage']}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles['about_heroImage'] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.about?.heroImage && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('heroImage', 'about')}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.about?.heroImage || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            about: { ...mediaSettings.about, heroImage: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.about?.heroImage && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.about.heroImage}
                              alt="Hero preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Our Story Left Image */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="BookOpen" size={16} className="text-primary" />
                        Our Story Image (Left)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={aboutOurStoryLeftRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'ourStoryLeft', 'about')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => aboutOurStoryLeftRef.current?.click()}
                            disabled={uploadingFiles['about_ourStoryLeft']}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles['about_ourStoryLeft'] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.about?.ourStoryLeft && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('ourStoryLeft', 'about')}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.about?.ourStoryLeft || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            about: { ...mediaSettings.about, ourStoryLeft: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.about?.ourStoryLeft && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.about.ourStoryLeft}
                              alt="Our Story Left preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Our Story Right Image */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="BookOpen" size={16} className="text-primary" />
                        Our Story Image (Right)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={aboutOurStoryRightRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'ourStoryRight', 'about')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => aboutOurStoryRightRef.current?.click()}
                            disabled={uploadingFiles['about_ourStoryRight']}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles['about_ourStoryRight'] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.about?.ourStoryRight && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('ourStoryRight', 'about')}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.about?.ourStoryRight || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            about: { ...mediaSettings.about, ourStoryRight: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.about?.ourStoryRight && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.about.ourStoryRight}
                              alt="Our Story Right preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Our Founder Image */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="User" size={16} className="text-primary" />
                        Our Founder Image
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={aboutOurFounderRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(e, 'ourFounder', 'about')}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => aboutOurFounderRef.current?.click()}
                            disabled={uploadingFiles['about_ourFounder']}
                            className="flex-shrink-0"
                          >
                            {uploadingFiles['about_ourFounder'] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icon name="Upload" size={16} className="mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          {mediaSettings.about?.ourFounder && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile('ourFounder', 'about')}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={mediaSettings.about?.ourFounder || ''}
                          onChange={(e) => handleMediaSettingsChange({
                            ...mediaSettings,
                            about: { ...mediaSettings.about, ourFounder: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Or paste URL here..."
                        />
                        {mediaSettings.about?.ourFounder && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/20 p-2">
                            <img
                              src={mediaSettings.about.ourFounder}
                              alt="Our Founder preview"
                              className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
                </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                          <Icon name="DollarSign" size={24} className="text-primary" />
                          Pricing Management
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          Configure pricing plans for monthly and yearly subscriptions. These prices will be displayed on pricing page, subscription page, and registration step.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Starter Plan */}
                      <div className="bg-muted/30 rounded-lg p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Icon name="Package" size={20} className="text-primary" />
                            Starter Plan
                          </h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={pricingSettings.starter?.popular || false}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                starter: {
                                  ...pricingSettings.starter,
                                  popular: e.target.checked
                                }
                              })}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm text-muted-foreground">Mark as Popular</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2">Plan Name</label>
                            <input
                              type="text"
                              value={pricingSettings.starter?.name || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                starter: {
                                  ...pricingSettings.starter,
                                  name: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Starter Plan"
                            />
                          </div>
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                            <input
                              type="text"
                              value={pricingSettings.starter?.description || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                starter: {
                                  ...pricingSettings.starter,
                                  description: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Perfect for beginners"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Icon name="Calendar" size={16} className="text-primary" />
                              Monthly Price (€)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingSettings.starter?.monthly || ''}
                              onChange={(e) => {
                                const monthlyPrice = parseFloat(e.target.value) || 0;
                                const calculatedYearly = calculateYearlyPrice(monthlyPrice);
                                handlePricingSettingsChange({
                                  ...pricingSettings,
                                  starter: {
                                    ...pricingSettings.starter,
                                    monthly: monthlyPrice,
                                    yearly: calculatedYearly
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="39,99"
                            />
                          </div>
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Icon name="Calendar" size={16} className="text-primary" />
                              Yearly Price (€/month)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingSettings.starter?.yearly || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                starter: {
                                  ...pricingSettings.starter,
                                  yearly: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="31,99"
                            />
                            <div className="mt-1 space-y-0.5">
                              <p className="text-xs text-muted-foreground">Price per month when billed yearly</p>
                              {pricingSettings.starter?.yearly && pricingSettings.starter?.yearly > 0 && (
                                <>
                                  <p className="text-xs text-green-600 font-medium">
                                    Yearly total: €{(pricingSettings.starter.yearly * 12).toFixed(2)} (20% off)
                                  </p>
                                  {pricingSettings.starter?.monthly && pricingSettings.starter?.monthly > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Save €{((pricingSettings.starter.monthly * 12) - (pricingSettings.starter.yearly * 12)).toFixed(2)} per year
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pro Plan */}
                      <div className="bg-muted/30 rounded-lg p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Icon name="Zap" size={20} className="text-primary" />
                            Pro Plan
                          </h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={pricingSettings.pro?.popular || false}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                pro: {
                                  ...pricingSettings.pro,
                                  popular: e.target.checked
                                }
                              })}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm text-muted-foreground">Mark as Popular</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2">Plan Name</label>
                            <input
                              type="text"
                              value={pricingSettings.pro?.name || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                pro: {
                                  ...pricingSettings.pro,
                                  name: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Pro Plan"
                            />
                          </div>
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                            <input
                              type="text"
                              value={pricingSettings.pro?.description || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                pro: {
                                  ...pricingSettings.pro,
                                  description: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Complete solution with AI"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Icon name="Calendar" size={16} className="text-primary" />
                              Monthly Price (€)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingSettings.pro?.monthly || ''}
                              onChange={(e) => {
                                const monthlyPrice = parseFloat(e.target.value) || 0;
                                const calculatedYearly = calculateYearlyPrice(monthlyPrice);
                                handlePricingSettingsChange({
                                  ...pricingSettings,
                                  pro: {
                                    ...pricingSettings.pro,
                                    monthly: monthlyPrice,
                                    yearly: calculatedYearly
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="69,99"
                            />
                          </div>
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Icon name="Calendar" size={16} className="text-primary" />
                              Yearly Price (€/month)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingSettings.pro?.yearly || ''}
                              onChange={(e) => handlePricingSettingsChange({
                                ...pricingSettings,
                                pro: {
                                  ...pricingSettings.pro,
                                  yearly: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="55,99"
                            />
                            <div className="mt-1 space-y-0.5">
                              <p className="text-xs text-muted-foreground">Price per month when billed yearly</p>
                              {pricingSettings.pro?.yearly && pricingSettings.pro?.yearly > 0 && (
                                <>
                                  <p className="text-xs text-green-600 font-medium">
                                    Yearly total: €{(pricingSettings.pro.yearly * 12).toFixed(2)} (20% off)
                                  </p>
                                  {pricingSettings.pro?.monthly && pricingSettings.pro?.monthly > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Save €{((pricingSettings.pro.monthly * 12) - (pricingSettings.pro.yearly * 12)).toFixed(2)} per year
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={loadSettings}
                  disabled={saving}
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Reset Changes
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="Save" size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Customization;