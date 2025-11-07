import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../services/supabaseClient';
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
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'banner'
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // Language for banner settings
  const [serviceSettings, setServiceSettings] = useState({
    creditInsurance: true,
    recovery: true
  });
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
      
      console.log('🔄 Loading settings from database...');
      
      // Load service visibility settings
      const { data: serviceData, error: serviceError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'service_visibility')
        .maybeSingle();

      if (serviceError && serviceError.code !== 'PGRST116') {
        console.error('❌ Error loading service settings:', serviceError);
      } else if (serviceData && serviceData.setting_value) {
        console.log('✅ Service settings loaded successfully:', serviceData);
        setServiceSettings(serviceData.setting_value);
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
        console.log('✅ Banner settings loaded successfully:', bannerData);
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
    setServiceSettings(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      console.log('Saving settings...');

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
              <div className="bg-card border border-border rounded-lg">
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'services'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon name="Eye" size={16} />
                      <span>Service Visibility</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('banner')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'banner'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon name="Gift" size={16} />
                      <span>Sponsored Banner</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Service Visibility Tab */}
              {activeTab === 'services' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon name="Eye" size={20} className="text-primary" />
                      Service Visibility
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toggle services on/off to control what users see in their navigation
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${serviceSettings[service.id] ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon 
                            name={service.icon} 
                            size={24} 
                            className={serviceSettings[service.id] ? 'text-primary' : 'text-muted-foreground'} 
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground">{service.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{service.path}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${serviceSettings[service.id] ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {serviceSettings[service.id] ? 'Visible' : 'Hidden'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={serviceSettings[service.id]}
                            onChange={() => handleToggle(service.id)}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

               

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

              {/* Sponsored Banner Tab */}
              {activeTab === 'banner' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon name="Gift" size={20} className="text-primary" />
                      Sponsored Banner Settings
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure the sponsored banner displayed on the dashboard
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Language Selection */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                    <label className="block text-sm font-medium text-foreground mb-3">Select Language</label>
                    <div className="flex gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang.code)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                            selectedLanguage === lang.code
                              ? 'bg-primary text-white border-primary'
                              : 'bg-card text-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Configure banner content for {languages.find(l => l.code === selectedLanguage)?.name}
                    </p>
                  </div>

                  {/* Enabled Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <label className="text-sm font-medium text-foreground">Enable Banner</label>
                      <p className="text-xs text-muted-foreground mt-0.5">Show/hide the sponsored banner on dashboard</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={sponsoredBannerSettings.enabled}
                        onChange={(e) => setSponsoredBannerSettings({ ...sponsoredBannerSettings, enabled: e.target.checked })}
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                      onChange={(e) => setSponsoredBannerSettings({
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
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Preview ({languages.find(l => l.code === selectedLanguage)?.name})</h4>
                      <div className="bg-gradient-to-r from-blue-700/90 to-blue-800/90 border border-blue-600/30 rounded-lg p-4 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                          {sponsoredBannerSettings[selectedLanguage]?.image && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
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
            </div>
            
          )}
        </main>
      </div>
    </div>
  );
};

export default Customization;

