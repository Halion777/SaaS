import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import MainSidebar from '../../components/ui/MainSidebar';
import PermissionGuard, { usePermissionCheck } from '../../components/PermissionGuard';
import LimitedAccessGuard from '../../components/LimitedAccessGuard';
import TableLoader from '../../components/ui/TableLoader';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import LeadsFilterToolbar from './components/LeadsFilterToolbar';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { LeadManagementService } from '../../services/leadManagementService';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { getCountryOptions, getRegionOptionsForCountry } from '../../constants/countriesAndRegions';
import { useTranslation } from 'react-i18next';

const LeadsManagementPage = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('leads');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState({});
  const [showSpamModal, setShowSpamModal] = useState(false);
  const [spamReason, setSpamReason] = useState('');
  const [selectedLeadForSpam, setSelectedLeadForSpam] = useState(null);
  const tabsScrollRef = useScrollPosition('leads-tabs-scroll');
  const { user } = useAuth();
  const { userProfile } = useMultiUser();
  const { t } = useTranslation();
  
  // Check if user is on Pro plan for full lead generation
  const isProPlan = userProfile?.selected_plan === 'pro';
  
  // State for leads and settings
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    period: 'all',
    startDate: '',
    endDate: ''
  });
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

  // State for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
        setFilteredLeads(data || []);
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

  // Helper function to save settings to database
  const saveSettingsToDatabase = async (settingsToSave) => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Convert regionsServed from flat structure to nested structure
      const regionsServed = {};
      Object.keys(settingsToSave.countriesServed).forEach(countryCode => {
        if (settingsToSave.countriesServed[countryCode]) {
          regionsServed[countryCode] = [];
          Object.keys(settingsToSave.regionsServed).forEach(key => {
            if (key.startsWith(`${countryCode}-`)) {
              const region = key.replace(`${countryCode}-`, '');
              if (settingsToSave.regionsServed[key]) {
                regionsServed[countryCode].push(region);
              }
            }
          });
        }
      });

      const { success, error } = await LeadManagementService.updateArtisanPreferences(user.id, {
        receive_leads: settingsToSave.receiveLeads,
        countries_served: settingsToSave.countriesServed,
        regions_served: regionsServed,
        work_categories: settingsToSave.workCategories,
        other_work_category: settingsToSave.otherWorkCategory
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

  const handleSettingChange = async (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Auto-save to database
    if (user) {
      await saveSettingsToDatabase(newSettings);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Filter leads based on current filters
  const filterLeads = (leadsData, currentFilters) => {
    return leadsData.filter(lead => {
      // Filter by price range
      if (currentFilters.priceRange !== 'all') {
        const priceRange = currentFilters.priceRange;
        if (!lead.price_range) return false;
        
        // Extract numeric values from price range string (e.g., "€1,000 - €5,000" -> [1000, 5000])
        const priceMatch = lead.price_range.match(/€?([0-9,]+)(?:\s*-\s*€?([0-9,]+))?/);
        if (!priceMatch) return false;
        
        const minPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        const maxPrice = priceMatch[2] ? parseInt(priceMatch[2].replace(/,/g, '')) : minPrice;
        
        if (priceRange === '0-1000') {
          if (minPrice > 1000) return false;
        } else if (priceRange === '1000-5000') {
          if (minPrice < 1000 || maxPrice > 5000) return false;
        } else if (priceRange === '5000-10000') {
          if (minPrice < 5000 || maxPrice > 10000) return false;
        } else if (priceRange === '10000-25000') {
          if (minPrice < 10000 || maxPrice > 25000) return false;
        } else if (priceRange === '25000+') {
          if (minPrice < 25000) return false;
        }
      }

      // Filter by period
      if (currentFilters.period !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        
        if (currentFilters.period === '7') {
          const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          if (leadDate < sevenDaysAgo) return false;
        } else if (currentFilters.period === '30') {
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          if (leadDate < thirtyDaysAgo) return false;
        } else if (currentFilters.period === '90') {
          const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          if (leadDate < ninetyDaysAgo) return false;
        } else if (currentFilters.period === 'custom') {
          if (currentFilters.startDate) {
            const startDate = new Date(currentFilters.startDate);
            if (leadDate < startDate) return false;
          }
          if (currentFilters.endDate) {
            const endDate = new Date(currentFilters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (leadDate > endDate) return false;
          }
        }
      }

      return true;
    });
  };

  // Apply filters whenever filters change
  useEffect(() => {
    const filtered = filterLeads(leads, filters);
    setFilteredLeads(filtered);
  }, [filters, leads]);

  const handleCategoryToggle = async (category) => {
    const newSettings = {
      ...settings,
      workCategories: {
        ...settings.workCategories,
        [category]: !settings.workCategories[category]
      }
    };
    setSettings(newSettings);
    
    // Auto-save to database
    if (user) {
      await saveSettingsToDatabase(newSettings);
    }
  };

  const handleSaveSettings = async () => {
    await saveSettingsToDatabase(settings);
  };

  const handleQuoteLead = (leadId) => {
    // Navigate to quote creation with lead data
    const params = new URLSearchParams({ lead_id: leadId });
    window.location.href = `/quote-creation?${params.toString()}`;
  };

  const handleReportSpam = (leadId) => {
    setSelectedLeadForSpam(leadId);
    setSpamReason('');
    setShowSpamModal(true);
  };

  const submitSpamReport = async () => {
    if (!spamReason.trim()) {
      return;
    }

    try {
      const { success, error } = await LeadManagementService.reportLeadAsSpam(
        selectedLeadForSpam, 
        user.id, 
        spamReason.trim(),
        'spam'
      );

      if (success) {
        setShowSpamModal(false);
        setSpamReason('');
        setSelectedLeadForSpam(null);
        // Refresh leads to update the UI
        loadLeads();
      } else {
        console.error('Error reporting spam:', error);
        alert(t('leadsManagement.spamModal.error'));
      }
    } catch (error) {
      console.error('Error reporting spam:', error);
      alert(t('leadsManagement.spamModal.error'));
    }
  };

  const renderLeadsTab = () => (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">{t('leadsManagement.leadsTab.title')}</h2>
      
      {/* Filter Toolbar */}
      <LeadsFilterToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        filteredCount={filteredLeads.length}
      />
      
      <div className="mt-4 sm:mt-6">
      {loading ? (
        <TableLoader message={t('leadsManagement.leadsTab.loading')} />
      ) : error ? (
        <ErrorDisplay 
          error={typeof error === 'string' ? error : error?.message || t('common.errors.loadError', 'Error Loading Data')}
          onRetry={loadLeads}
          title={t('leadsManagement.leadsTab.errorTitle', 'Error Loading Leads')}
        />
      ) : filteredLeads.length === 0 ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <Icon name="Inbox" size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground">{t('leadsManagement.leadsTab.noLeads')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLeads.map((lead) => (
            <div key={lead.lead_id} className="relative bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-4 sm:p-6 overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              <div className="relative z-10">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-5 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg sm:text-xl mb-1 truncate">{lead.client_name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('leadsManagement.leadsTab.leadCard.requestReceived')} {new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                
                {/* Quote Status Badge */}
                <div className="flex-shrink-0 sm:text-right">
                  <div className={`inline-block rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold ${
                    lead.quotes_sent_count >= 3 
                      ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {lead.quotes_sent_count}/3 {t('leadsManagement.leadsTab.leadCard.quotesCount')}
                  </div>
                  {lead.quotes_sent_count >= 3 && (
                    <span className="block text-xs text-destructive mt-1 sm:mt-2 text-center">Max atteint</span>
                  )}
                </div>
              </div>
              
              {/* Key Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Price Range */}
                  {lead.price_range && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Icon name="Coins" className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">{t('leadsManagement.leadsTab.leadCard.estimatedBudget')}</p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{lead.price_range.includes('€') ? lead.price_range : `${lead.price_range} (€)`}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Completion Date */}
                  {lead.completion_date && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                        <Icon name="Calendar" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">{t('leadsManagement.leadsTab.leadCard.desiredCompletionDate')}</p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{new Date(lead.completion_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Column */}
                <div className="space-y-3">
                  {/* Address Information */}
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                      <Icon name="MapPin" className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium">{t('leadsManagement.leadsTab.leadCard.location')}</p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground mb-1 break-words">
                        {lead.street_number && `${lead.street_number} `}{lead.full_address}
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {[
                          lead.zip_code,
                          lead.city,
                          lead.region,
                          lead.country
                        ].filter(value => value && value !== 'N/A' && value !== 'null' && value !== 'undefined' && value.trim() !== '').join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Services Required */}
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                      <Icon name="Wrench" className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium">{t('leadsManagement.leadsTab.leadCard.servicesRequired')}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.project_categories?.map((category) => (
                          <span key={category} className="px-2 py-0.5 sm:py-1 bg-primary/10 text-primary text-xs font-medium rounded border border-primary/20">
                            {category}
                          </span>
                        ))}
                        {lead.custom_category && (
                          <span className="px-2 py-0.5 sm:py-1 bg-secondary/10 text-secondary text-xs font-medium rounded border border-secondary/20">
                            {lead.custom_category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Project Description */}
              <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-muted/20 rounded-lg">
                <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">{t('leadsManagement.leadsTab.leadCard.projectDescription')}</h4>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words">{lead.project_description}</p>
              </div>
              
              {/* Project Images */}
              {lead.project_images && lead.project_images.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">{t('leadsManagement.leadsTab.leadCard.projectImages')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {lead.project_images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                          <img 
                            src={image.url || image.path} 
                            alt={`Project ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              setSelectedImage(image);
                              setShowImageModal(true);
                            }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEN0Q5RDEiLz4KPHBhdGggZD0iTTM1IDM1SDY1VjY1SDM1VjM1WiIgZmlsbD0iI0M3Q0Q5Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiNBM0I0QjYiLz4KPC9zdmc+';
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                          <Icon 
                            name="Eye" 
                            className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-border/50 gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{t('leadsManagement.leadsTab.leadCard.createdOn')} {new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Eye" className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{t('leadsManagement.leadsTab.leadCard.leadId')}{lead.lead_id.slice(-8)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    onClick={() => handleReportSpam(lead.lead_id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                    disabled={!canEdit || !isProPlan}
                    title={!canEdit ? t('permissions.noFullAccess') : (!isProPlan ? t('limitedAccess.banner.message', { feature: t('leadsManagement.leadsTab.leadCard.reportSpam') }, 'Upgrade to Pro to report spam') : '')}
                  >
                    <Icon name="AlertTriangle" className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{t('leadsManagement.leadsTab.leadCard.reportSpam')}</span>
                    <span className="sm:hidden">{t('leadsManagement.leadsTab.leadCard.reportSpam')}</span>
                  </Button>
                  
                  {lead.can_send_quote ? (
                    <Button
                      onClick={() => handleQuoteLead(lead.lead_id)}
                      variant="default"
                      size="default"
                      className="px-4 sm:px-6 py-2 font-semibold w-full sm:w-auto"
                      disabled={!canEdit || !isProPlan}
                      title={!canEdit ? t('permissions.noFullAccess') : (!isProPlan ? t('limitedAccess.banner.message', { feature: t('leadsManagement.leadsTab.leadCard.createQuote') }, 'Upgrade to Pro to create quotes from leads') : '')}
                    >
                      <Icon name="FileText" className="w-4 h-4 mr-2" />
                      {t('leadsManagement.leadsTab.leadCard.createQuote')}
                    </Button>
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-4 py-2 bg-muted/50 rounded-lg border text-center">
                      {lead.quote_status === 'max_reached' ? t('leadsManagement.leadsTab.leadCard.maxQuotesReached') : t('leadsManagement.leadsTab.leadCard.alreadyProcessed')}
                    </span>
                  )}
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t('leadsManagement.settingsTab.title')}</h2>
      
      {/* Receive Quote Requests Toggle */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">{t('leadsManagement.settingsTab.receiveLeads.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('leadsManagement.settingsTab.receiveLeads.description')}</p>
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

      {/* Countries Served - Only show when receiveLeads is ON */}
      {settings.receiveLeads && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">{t('leadsManagement.settingsTab.countriesServed.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('leadsManagement.settingsTab.countriesServed.description')}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCountryOptions().map((country) => (
              <div key={country.value} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{country.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.countriesServed[country.value]}
                    onChange={async () => {
                      const newCountriesServed = {
                        ...settings.countriesServed,
                        [country.value]: !settings.countriesServed[country.value]
                      };
                      const newSettings = { ...settings, countriesServed: newCountriesServed };
                      setSettings(newSettings);
                      if (user) {
                        await saveSettingsToDatabase(newSettings);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regions Served - Only show when receiveLeads is ON */}
      {settings.receiveLeads && Object.keys(settings.countriesServed).filter(country => settings.countriesServed[country]).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">{t('leadsManagement.settingsTab.regionsServed.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('leadsManagement.settingsTab.regionsServed.description')}</p>
          
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
                        onChange={async () => {
                          const newRegionsServed = {
                            ...settings.regionsServed,
                            [`${countryCode}-${region.value}`]: !settings.regionsServed[`${countryCode}-${region.value}`]
                          };
                          const newSettings = { ...settings, regionsServed: newRegionsServed };
                          setSettings(newSettings);
                          if (user) {
                            await saveSettingsToDatabase(newSettings);
                          }
                        }}
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

      {/* Work Categories - Only show when receiveLeads is ON */}
      {settings.receiveLeads && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium text-foreground mb-4">{t('leadsManagement.settingsTab.workCategories.title')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('leadsManagement.settingsTab.workCategories.description')}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Column 1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t('findArtisan.categories.plumbing')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.electrical')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.painting')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.carpentry')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.tiling')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.roofing')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.masonry')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.heating')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.renovation')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.cleaning')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.solar')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.gardening')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.locksmith')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.glazing')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.insulation')}</span>
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
              <span className="text-sm text-foreground">{t('findArtisan.categories.airConditioning')}</span>
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
              <span className="text-sm text-foreground">{t('leadsManagement.settingsTab.workCategories.other')}</span>
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
                label={t('leadsManagement.settingsTab.workCategories.other')}
                type="text"
                value={settings.otherWorkCategory}
                onChange={async (e) => {
                  const newSettings = { ...settings, otherWorkCategory: e.target.value };
                  setSettings(newSettings);
                  if (user) {
                    await saveSettingsToDatabase(newSettings);
                  }
                }}
                placeholder={t('leadsManagement.settingsTab.workCategories.otherPlaceholder')}
              />
            </div>
          )}
        </div>
      )}

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
          {saving ? t('leadsManagement.settingsTab.saveButton.saving') : t('leadsManagement.settingsTab.saveButton.save')}
        </Button>
      </div>
    </div>
  );

  // Check permissions for actions
  const { canEdit } = usePermissionCheck('leadsManagement');

  return (
    <PermissionGuard module="leadsManagement" requiredPermission="view_only">
    <LimitedAccessGuard requiredPlan="pro" featureName={t('leadsManagement.title', 'Lead Generation')}>
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-20 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
                <div className="flex items-center">
                  <Icon name="Target" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('leadsManagement.title')}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('leadsManagement.subtitle')}
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
              {t('leadsManagement.tabs.leads')}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('leadsManagement.tabs.settings')}
            </button>
          </div>

          {/* Content */}
          {activeTab === 'leads' && renderLeadsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </main>
      </div>
      
      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <Icon name="X" className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage.url || selectedImage.path} 
              alt="Project image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNjY2NjY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
        </div>
      )}

      {/* Spam Report Modal */}
      {showSpamModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{t('leadsManagement.spamModal.title')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSpamModal(false);
                    setSpamReason('');
                    setSelectedLeadForSpam(null);
                  }}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('leadsManagement.spamModal.description')}
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('leadsManagement.spamModal.reasonLabel')}
                  </label>
                  <textarea
                    value={spamReason}
                    onChange={(e) => setSpamReason(e.target.value)}
                    placeholder={t('leadsManagement.spamModal.reasonPlaceholder')}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSpamModal(false);
                      setSpamReason('');
                      setSelectedLeadForSpam(null);
                    }}
                  >
                    {t('leadsManagement.spamModal.cancel')}
                  </Button>
                  <Button
                    onClick={submitSpamReport}
                    disabled={!spamReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Icon name="AlertTriangle" className="w-4 h-4 mr-2" />
                    {t('leadsManagement.spamModal.submit')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </LimitedAccessGuard>
    </PermissionGuard>
  );
};

export default LeadsManagementPage; 