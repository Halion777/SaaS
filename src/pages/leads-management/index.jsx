import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import MainSidebar from '../../components/ui/MainSidebar';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { LeadManagementService } from '../../services/leadManagementService';
import { useAuth } from '../../context/AuthContext';
import { getCountryOptions, getRegionOptionsForCountry } from '../../constants/countriesAndRegions';

const LeadsManagementPage = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('leads');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState({});
  const tabsScrollRef = useScrollPosition('leads-tabs-scroll');
  const { user } = useAuth();
  
  // State for leads and settings
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    receiveLeads: false,
    countriesServed: {},
    regionsServed: {},
    workCategories: {
      plumbing: false,
      electrical: false,
      painting: false,
      carpentry: false,
      tiling: false,
      roofing: false,
      masonry: false,
      heating: false,
      renovation: false,
      cleaning: false,
      solar: false,
      gardening: false,
      locksmith: false,
      glazing: false,
      insulation: false,
      airConditioning: false,
      other: false
    },
    otherWorkCategory: ''
  });

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
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
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Load artisan preferences and leads
  useEffect(() => {
    if (user) {
      loadArtisanPreferences();
      loadLeads();
    }
  }, [user]);

  // Refresh leads when switching to leads tab
  useEffect(() => {
    if (activeTab === 'leads' && user) {
      loadLeads();
    }
  }, [activeTab, user]);

  const loadArtisanPreferences = async () => {
    try {
      const { success, data, error } = await LeadManagementService.getArtisanPreferences(user.id);
      if (success && data) {
        // Convert regionsServed from nested structure to flat structure for UI
        const flatRegionsServed = {};
        if (data.regions_served) {
          Object.keys(data.regions_served).forEach(countryCode => {
            if (data.regions_served[countryCode] && Array.isArray(data.regions_served[countryCode])) {
              data.regions_served[countryCode].forEach(region => {
                flatRegionsServed[`${countryCode}-${region}`] = true;
              });
            }
          });
        }

        setSettings(prev => ({
          ...prev,
          receiveLeads: data.receive_leads || false,
          countriesServed: data.countries_served || {},
          regionsServed: flatRegionsServed,
          workCategories: data.work_categories || prev.workCategories,
          otherWorkCategory: data.other_work_category || ''
        }));
      }
    } catch (error) {
      console.error('Error loading artisan preferences:', error);
    }
  };

  const loadLeads = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { success, data, error } = await LeadManagementService.getLeadsForArtisan(user.id);
      if (success) {
        setLeads(data || []);
      } else {
        setError(error?.message || error || 'Erreur lors du chargement des leads');
      }
    } catch (error) {
      setError(error?.message || 'Erreur lors du chargement des leads');
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category) => {
    setSettings(prev => ({
      ...prev,
      workCategories: {
        ...prev.workCategories,
        [category]: !prev.workCategories[category]
      }
    }));
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Convert regionsServed from flat structure to nested structure
      const regionsServed = {};
      Object.keys(settings.countriesServed).forEach(countryCode => {
        if (settings.countriesServed[countryCode]) {
          regionsServed[countryCode] = [];
          Object.keys(settings.regionsServed).forEach(key => {
            if (key.startsWith(`${countryCode}-`)) {
              const region = key.replace(`${countryCode}-`, '');
              if (settings.regionsServed[key]) {
                regionsServed[countryCode].push(region);
              }
            }
          });
        }
      });

      const { success, error } = await LeadManagementService.updateArtisanPreferences(user.id, {
        receive_leads: settings.receiveLeads,
        countries_served: settings.countriesServed,
        regions_served: regionsServed,
        work_categories: settings.workCategories,
        other_work_category: settings.otherWorkCategory
      });
      
      if (!success) {
        console.error('Error saving settings:', error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleQuoteLead = (leadId) => {
    // Navigate to quote creation with lead data
    const params = new URLSearchParams({ lead_id: leadId });
    window.location.href = `/quote-creation?${params.toString()}`;
  };

  const renderLeadsTab = () => (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Demandes de devis reçues</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <Icon name="Loader" size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground animate-spin" />
            <p className="text-xs sm:text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Icon name="AlertCircle" className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">
            {typeof error === 'string' ? error : error?.message || 'Erreur inconnue'}
          </p>
          <button
            onClick={loadLeads}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <Icon name="Inbox" size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground">Aucune demande de devis reçue pour le moment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.lead_id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-2">{lead.client_name}</h3>
                  
                  {/* Address Information */}
                  <div className="flex items-start gap-2 mb-3">
                    <Icon name="MapPin" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm text-foreground font-medium">
                        {lead.street_number && `${lead.street_number} `}{lead.full_address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.zip_code}, {lead.country}, {lead.region}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Quote Status */}
                <div className="text-right ml-4">
                  <div className="bg-muted/50 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {lead.quotes_sent_count}/3 devis
                    </span>
                  </div>
                  {lead.quotes_sent_count >= 3 && (
                    <span className="block text-xs text-destructive mt-1">Max atteint</span>
                  )}
                </div>
              </div>
              
              {/* Project Description */}
              <div className="mb-3">
                <p className="text-sm text-foreground leading-relaxed">{lead.project_description}</p>
              </div>
              
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lead.project_categories?.map((category) => (
                  <span key={category} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {category}
                  </span>
                ))}
                {lead.custom_category && (
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full border border-secondary/20">
                    {lead.custom_category}
                  </span>
                )}
              </div>
              
              {/* Bottom Section */}
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Calendar" className="w-3 h-3" />
                  <span>{new Date(lead.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                
                {lead.can_send_quote ? (
                  <Button
                    onClick={() => handleQuoteLead(lead.lead_id)}
                    variant="default"
                    size="sm"
                    className="px-4"
                  >
                    <Icon name="FileText" className="w-4 h-4 mr-2" />
                    Devis
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">
                    {lead.quote_status === 'max_reached' ? 'Max atteint' : 'Déjà appliqué'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground">Paramètres de réception des leads</h2>
      
      {/* Receive Quote Requests Toggle */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">Recevoir des demandes de devis</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Activez cette option pour recevoir des demandes de devis</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.receiveLeads}
              onChange={(e) => handleSettingChange('receiveLeads', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Countries Served */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">Pays couverts</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">Sélectionnez les pays où vous souhaitez recevoir des demandes</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCountryOptions().map((country) => (
            <div key={country.value} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{country.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.countriesServed[country.value]}
                  onChange={() => handleSettingChange('countriesServed', {
                    ...settings.countriesServed,
                    [country.value]: !settings.countriesServed[country.value]
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Regions Served */}
      {Object.keys(settings.countriesServed).filter(country => settings.countriesServed[country]).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">Régions couvertes</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">Sélectionnez les régions où vous souhaitez recevoir des demandes</p>
          
          {Object.keys(settings.countriesServed).filter(country => settings.countriesServed[country]).map((countryCode) => (
            <div key={countryCode} className="mb-4">
              <h4 className="text-base font-semibold text-foreground mb-2">{getCountryOptions().find(c => c.value === countryCode)?.label}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRegionOptionsForCountry(countryCode).map((region) => (
                  <div key={region.value} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{region.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.regionsServed[`${countryCode}-${region.value}`] || false}
                        onChange={() => handleSettingChange('regionsServed', {
                          ...settings.regionsServed,
                          [`${countryCode}-${region.value}`]: !settings.regionsServed[`${countryCode}-${region.value}`]
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Work Categories */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">Catégories de travaux</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">Sélectionnez les types de travaux pour lesquels vous souhaitez recevoir des demandes</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Column 1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Plomberie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.plumbing}
                  onChange={() => handleCategoryToggle('plumbing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Électricité</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.electrical}
                  onChange={() => handleCategoryToggle('electrical')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Peinture</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.painting}
                  onChange={() => handleCategoryToggle('painting')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Menuiserie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.carpentry}
                  onChange={() => handleCategoryToggle('carpentry')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Carrelage</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.tiling}
                  onChange={() => handleCategoryToggle('tiling')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Toiture</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.roofing}
                  onChange={() => handleCategoryToggle('roofing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Maçonnerie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.masonry}
                  onChange={() => handleCategoryToggle('masonry')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Chauffage</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.heating}
                  onChange={() => handleCategoryToggle('heating')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Rénovation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.renovation}
                  onChange={() => handleCategoryToggle('renovation')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Nettoyage</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.cleaning}
                  onChange={() => handleCategoryToggle('cleaning')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Énergie solaire</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.solar}
                  onChange={() => handleCategoryToggle('solar')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Jardinage</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.gardening}
                  onChange={() => handleCategoryToggle('gardening')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Serrurerie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.locksmith}
                  onChange={() => handleCategoryToggle('locksmith')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Vitrerie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.glazing}
                  onChange={() => handleCategoryToggle('glazing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Isolation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.insulation}
                  onChange={() => handleCategoryToggle('insulation')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Climatisation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.airConditioning}
                  onChange={() => handleCategoryToggle('airConditioning')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Autres</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workCategories.other}
                  onChange={() => handleCategoryToggle('other')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Conditional input for "Autres" category */}
        {settings.workCategories.other && (
          <div className="mt-4">
            <Input
              label="Précisez le type de travaux"
              type="text"
              value={settings.otherWorkCategory}
              onChange={(e) => handleSettingChange('otherWorkCategory', e.target.value)}
              placeholder="Ex: Ébénisterie, Ferronnerie, etc."
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
          disabled={saving}
        >
          {saving ? (
            <Icon name="Loader" size={16} className="mr-2 animate-spin" />
          ) : (
            <Icon name="Save" size={16} className="mr-2" />
          )}
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
                <div className="flex items-center">
                  <Icon name="Target" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des Leads</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez vos prospects et convertissez-les en clients
                </p>
          </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div ref={tabsScrollRef} className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mes Leads
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Paramètres
            </button>
          </div>

          {/* Content */}
          {activeTab === 'leads' && renderLeadsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </main>
      </div>
    </div>
  );
};

export default LeadsManagementPage; 