import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { supabase } from '../../services/supabaseClient';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';
import UserProfile from './UserProfile';
import ProfileSwitcher from './ProfileSwitcher';
import MultiUserProfile from './MultiUserProfile';
import { useScrollPosition } from '../../utils/useScrollPosition';

// Map navigation item IDs to permission modules
const NAVIGATION_PERMISSION_MAP = {
  'dashboard': 'dashboard',
  'analytics-dashboard': 'analytics',
  'peppol-access-point': 'peppolAccessPoint',
  'leads-management': 'leadsManagement',
  'quote-creation': 'quoteCreation',
  'quotes-management': 'quotesManagement',
  'quotes-follow-up': 'quotesFollowUp',
  'invoices-follow-up': 'invoicesFollowUp',
  'client-invoices': 'clientInvoices',
  'expense-invoices': 'supplierInvoices',
  'client-management': 'clientManagement',
  'assurance-credit': 'creditInsurance',
  'recouvrement': 'recovery'
};

const MainSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quotes: true,
    clients: false,
    services: false,
    invoices: false,
    followUps: false
  });
  // Initialize service visibility from localStorage cache to prevent flash
  const [serviceVisibility, setServiceVisibility] = useState(() => {
    try {
      const cached = localStorage.getItem('haliqo_service_visibility');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    // Default to true to show services initially (prevents flash)
    return { creditInsurance: true, recovery: true };
  });
  const [isServiceVisibilityLoaded, setIsServiceVisibilityLoaded] = useState(() => {
    // If we have cached data, consider it loaded
    return !!localStorage.getItem('haliqo_service_visibility');
  });
  const [overdueExpenseInvoicesCount, setOverdueExpenseInvoicesCount] = useState(0);
  const [overdueClientInvoicesCount, setOverdueClientInvoicesCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [pendingQuoteFollowUpsCount, setPendingQuoteFollowUpsCount] = useState(0);
  const [pendingInvoiceFollowUpsCount, setPendingInvoiceFollowUpsCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { hasPermission } = useMultiUser();
  const { t } = useTranslation();
  const mobileNavRef = useScrollPosition('mobile-nav-scroll', isMobile);

  // Helper function to check if user can access a navigation item
  const canAccessNavItem = (itemId) => {
    const module = NAVIGATION_PERMISSION_MAP[itemId];
    // If no module mapping, allow access (for items without permission requirements)
    if (!module) return true;
    // Check if user has at least view_only permission
    return hasPermission(module, 'view_only');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // On tablet, always keep sidebar collapsed
      if (tablet) {
        setIsCollapsed(true);
        localStorage.setItem('sidebar-collapsed', 'true');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    // On tablet, always start collapsed regardless of saved state
    if (isTablet) {
      setIsCollapsed(true);
      localStorage.setItem('sidebar-collapsed', 'true');
    } else if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, [isTablet]);

  // Auto-expand the correct section based on current route
  useEffect(() => {
    // Only auto-expand sections if sidebar is not collapsed and not on tablet
    if (isCollapsed || isTablet) {
      return;
    }
    
    const path = location.pathname;
    
    // Determine which section should be expanded based on the current path
    if (path.startsWith('/quote-creation') || path.startsWith('/quotes-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: true, clients: false, services: false, invoices: false, followUps: false }));
    } else if (path.startsWith('/quotes-follow-up') || path.startsWith('/invoices-follow-up') || path.startsWith('/follow-up-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, invoices: false, followUps: true }));
    } else if (path.startsWith('/client-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: true, services: false, invoices: false, followUps: false }));
    } else if (path.startsWith('/services/')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: true, invoices: false, followUps: false }));
            } else if (path.startsWith('/invoices-management') || path.startsWith('/expense-invoices')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, invoices: true, followUps: false }));
    } else if (path.startsWith('/dashboard') || path.startsWith('/analytics-dashboard') || path.startsWith('/peppol-access-point') || path.startsWith('/leads-management')) {
      // Keep all sections collapsed for main pages
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, invoices: false, followUps: false }));
    }
  }, [location.pathname, isCollapsed, isTablet]);

  const toggleSidebar = () => {
    // On tablet, prevent sidebar toggle - always stay collapsed
    if (isTablet) {
      return;
    }
    
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
    
    // Dispatch custom event to notify pages of sidebar state change
    const event = new CustomEvent('sidebar-toggle', { 
      detail: { isCollapsed: newCollapsed } 
    });
    window.dispatchEvent(event);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      // If the section is already expanded, collapse it
      if (prev[sectionId]) {
        return {
          ...prev,
          [sectionId]: false
        };
      }
      // Otherwise, expand only the clicked section and collapse others
      return {
        quotes: sectionId === 'quotes',
        clients: sectionId === 'clients',
        services: sectionId === 'services',
        invoices: sectionId === 'invoices',
        followUps: sectionId === 'followUps'
      };
    });
  };

  // Load service visibility settings (with caching to prevent flash)
  useEffect(() => {
    const loadServiceVisibility = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('setting_key', 'service_visibility')
          .single();

        let visibility;
        if (data && data.setting_value) {
          visibility = data.setting_value;
        } else {
          // If no setting exists, default to showing services
          visibility = { creditInsurance: true, recovery: true };
        }
        
        // Cache in localStorage to prevent flash on next load
        localStorage.setItem('haliqo_service_visibility', JSON.stringify(visibility));
        setServiceVisibility(visibility);
      } catch (error) {
        console.error('Error loading service visibility:', error);
        // Use cached or default settings if there's an error
        const cached = localStorage.getItem('haliqo_service_visibility');
        if (!cached) {
          const defaultVisibility = { creditInsurance: true, recovery: true };
          localStorage.setItem('haliqo_service_visibility', JSON.stringify(defaultVisibility));
          setServiceVisibility(defaultVisibility);
        }
      } finally {
        setIsServiceVisibilityLoaded(true);
      }
    };

    loadServiceVisibility();
  }, []);

  // Fetch overdue expense invoices count
  useEffect(() => {
    const fetchOverdueCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get all expense invoices for the current user
        const { data: invoices, error } = await supabase
          .from('expense_invoices')
          .select('id, due_date, status')
          .eq('user_id', currentUser.id);

        if (error) throw error;

        // Count overdue invoices (due_date < today AND status != 'paid')
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueCount = invoices?.filter(invoice => {
          if (invoice.status === 'paid') return false;
          const dueDate = new Date(invoice.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length || 0;

        setOverdueExpenseInvoicesCount(overdueCount);
      } catch (error) {
        console.error('Error fetching overdue expense invoices count:', error);
        setOverdueExpenseInvoicesCount(0);
      }
    };

    fetchOverdueCount();
    
    // Refresh every 5 minutes to keep count updated
    const interval = setInterval(fetchOverdueCount, 300000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Fetch overdue client invoices count
  useEffect(() => {
    const fetchOverdueClientCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get all client invoices for the current user
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('id, due_date, status')
          .eq('user_id', currentUser.id);

        if (error) throw error;

        // Count overdue invoices (due_date < today AND status != 'paid')
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueCount = invoices?.filter(invoice => {
          if (invoice.status === 'paid') return false;
          const dueDate = new Date(invoice.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length || 0;

        setOverdueClientInvoicesCount(overdueCount);
      } catch (error) {
        console.error('Error fetching overdue client invoices count:', error);
        setOverdueClientInvoicesCount(0);
      }
    };

    fetchOverdueClientCount();
    
    // Refresh every 5 minutes to keep count updated
    const interval = setInterval(fetchOverdueClientCount, 300000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Fetch pending quotes count (quotes sent but not yet responded)
  useEffect(() => {
    const fetchPendingQuotesCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get pending quotes (status = 'sent' or 'viewed')
        const { data: quotes, error } = await supabase
          .from('quotes')
          .select('id')
          .eq('user_id', currentUser.id)
          .in('status', ['sent', 'viewed']);

        if (error) throw error;

        setPendingQuotesCount(quotes?.length || 0);
      } catch (error) {
        console.error('Error fetching pending quotes count:', error);
        setPendingQuotesCount(0);
      }
    };

    fetchPendingQuotesCount();
    const interval = setInterval(fetchPendingQuotesCount, 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch pending quote follow-ups count
  useEffect(() => {
    const fetchPendingQuoteFollowUpsCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get active follow-ups that are due
        const { data: followUps, error } = await supabase
          .from('quote_follow_ups')
          .select('id, next_attempt_at, scheduled_at')
          .eq('user_id', currentUser.id)
          .eq('status', 'active');

        if (error) throw error;

        // Count follow-ups that are due today or overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const dueCount = followUps?.filter(followUp => {
          const nextDate = followUp.next_attempt_at || followUp.scheduled_at;
          if (!nextDate) return false;
          const date = new Date(nextDate);
          return date <= today;
        }).length || 0;

        setPendingQuoteFollowUpsCount(dueCount);
      } catch (error) {
        console.error('Error fetching pending quote follow-ups count:', error);
        setPendingQuoteFollowUpsCount(0);
      }
    };

    fetchPendingQuoteFollowUpsCount();
    const interval = setInterval(fetchPendingQuoteFollowUpsCount, 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch pending invoice follow-ups count
  useEffect(() => {
    const fetchPendingInvoiceFollowUpsCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get active invoice follow-ups that are due
        const { data: followUps, error } = await supabase
          .from('invoice_follow_ups')
          .select('id, next_attempt_at, scheduled_at')
          .eq('user_id', currentUser.id)
          .eq('status', 'active');

        if (error) throw error;

        // Count follow-ups that are due today or overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const dueCount = followUps?.filter(followUp => {
          const nextDate = followUp.next_attempt_at || followUp.scheduled_at;
          if (!nextDate) return false;
          const date = new Date(nextDate);
          return date <= today;
        }).length || 0;

        setPendingInvoiceFollowUpsCount(dueCount);
      } catch (error) {
        console.error('Error fetching pending invoice follow-ups count:', error);
        setPendingInvoiceFollowUpsCount(0);
      }
    };

    fetchPendingInvoiceFollowUpsCount();
    const interval = setInterval(fetchPendingInvoiceFollowUpsCount, 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch new leads count
  useEffect(() => {
    const fetchNewLeadsCount = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Get new leads (status = 'new' or 'contacted' within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: leads, error } = await supabase
          .from('lead_requests')
          .select('id')
          .eq('status', 'new');

        if (error) throw error;

        setNewLeadsCount(leads?.length || 0);
      } catch (error) {
        console.error('Error fetching new leads count:', error);
        setNewLeadsCount(0);
      }
    };

    fetchNewLeadsCount();
    const interval = setInterval(fetchNewLeadsCount, 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Navigation items organized by categories with collapsible sections
  const navigationCategories = [
    {
      id: 'main',
      label: t('sidebar.categories.main.label'),
      items: [
        {
          id: 'dashboard',
          label: t('sidebar.categories.main.items.dashboard'),
          path: '/dashboard',
          icon: 'LayoutDashboard',
          notifications: 0
        },
        {
          id: 'analytics-dashboard',
          label: t('sidebar.categories.main.items.analytics'),
          path: '/analytics-dashboard',
          icon: 'BarChart3',
          notifications: 0
        },
        {
          id: 'peppol-access-point',
          label: t('sidebar.categories.main.items.peppolAccessPoint'),
          path: '/services/peppol',
          icon: 'Network',
          notifications: 0
        },
        {
          id: 'leads-management',
          label: t('sidebar.categories.main.items.leadsManagement'),
          path: '/leads-management',
          icon: 'Users',
          notifications: newLeadsCount
        }
      ]
    },
    {
      id: 'quotes',
      label: t('sidebar.categories.quotes.label'),
      isCollapsible: true,
      isExpanded: expandedSections.quotes,
      items: [
        {
          id: 'quote-creation',
          label: t('sidebar.categories.quotes.items.quoteCreation'),
          path: '/quote-creation',
          icon: 'FileText',
          notifications: 0
        },
        {
          id: 'quotes-management',
          label: t('sidebar.categories.quotes.items.quotesManagement'),
          path: '/quotes-management',
          icon: 'FolderOpen',
          notifications: pendingQuotesCount
        }
      ]
    },
    {
      id: 'followUps',
      label: t('sidebar.categories.followUps.label'),
      isCollapsible: true,
      isExpanded: expandedSections.followUps,
      items: [
        {
          id: 'quotes-follow-up',
          label: t('sidebar.categories.followUps.items.quotesFollowUp'),
          path: '/quotes-follow-up',
          icon: 'MessageCircle',
          notifications: pendingQuoteFollowUpsCount
        },
        {
          id: 'invoices-follow-up',
          label: t('sidebar.categories.followUps.items.invoicesFollowUp'),
          path: '/invoices-follow-up',
          icon: 'Bell',
          notifications: pendingInvoiceFollowUpsCount
        }
      ]
    },
    {
      id: 'invoices',
      label: t('sidebar.categories.invoices.label'),
      isCollapsible: true,
      isExpanded: expandedSections.invoices,
      items: [
        {
          id: 'client-invoices',
          label: t('sidebar.categories.invoices.items.clientInvoices'),
          path: '/invoices-management',
          icon: 'Receipt',
          notifications: overdueClientInvoicesCount
        },
        {
          id: 'expense-invoices',
          label: t('sidebar.categories.invoices.items.expenseInvoices'),
          path: '/expense-invoices',
          icon: 'FileText',
          notifications: overdueExpenseInvoicesCount
        }
      ]
    },
    {
      id: 'clients',
      label: t('sidebar.categories.clients.label'),
      isCollapsible: true,
      isExpanded: expandedSections.clients,
      items: [
        {
          id: 'client-management',
          label: t('sidebar.categories.clients.items.clientManagement'),
          path: '/client-management',
          icon: 'Users',
          notifications: 0
        }
      ]
    },
    {
      id: 'services',
      label: t('sidebar.categories.services.label'),
      isCollapsible: true,
      isExpanded: expandedSections.services,
      items: [
        // Only show services if visibility is loaded and service is enabled
        ...(isServiceVisibilityLoaded && serviceVisibility.creditInsurance ? [{
          id: 'assurance-credit',
          label: t('sidebar.categories.services.items.creditInsurance'),
          path: '/services/assurance',
          icon: 'Shield',
          notifications: 0
        }] : []),
        ...(isServiceVisibilityLoaded && serviceVisibility.recovery ? [{
          id: 'recouvrement',
          label: t('sidebar.categories.services.items.recovery'),
          path: '/services/recouvrement',
          icon: 'Banknote',
          notifications: 0
        }] : [])
      ]
    }
  ];

  // Filter navigation categories based on permissions
  const filteredNavigationCategories = useMemo(() => {
    return navigationCategories
      .map(category => ({
        ...category,
        // Filter items based on user permissions
        items: category.items.filter(item => canAccessNavItem(item.id))
      }))
      .filter(category => {
        // Hide the services category if visibility not loaded yet, or if all services are hidden
        if (category.id === 'services') {
          if (!isServiceVisibilityLoaded) {
            return false; // Hide until loaded to prevent flash
          }
        }
        // Hide categories with no accessible items
        if (category.items.length === 0) {
          return false;
        }
        return true;
      });
  }, [navigationCategories, isServiceVisibilityLoaded, hasPermission]);

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext will handle the redirect
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: redirect to login page
      navigate('/login');
    }
  };

  // Use real user data from AuthContext
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    company: user.user_metadata?.company_name || 'Company',
    avatar: user.user_metadata?.avatar_url || '/assets/images/no profile.jpg'
  } : {
    name: 'User',
    company: 'Company',
    avatar: '/assets/images/no profile.jpg'
  };

  // Flatten navigation items for mobile view (using filtered categories)
  const flatNavigationItems = filteredNavigationCategories.flatMap(category => category.items);

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-100">
        <div ref={mobileNavRef} className="flex overflow-x-auto scrollbar-hide h-16 px-4">
          <div className="flex items-center space-x-2 min-w-full">
            {flatNavigationItems.map((item) => (
              <NavigationItem
                key={item.id}
                {...item}
                isActive={location.pathname === item.path}
                isCollapsed={true}
                isMobile={true}
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-card border-r border-border z-100 transition-all duration-300 ease-out sidebar-container ${
        isTablet ? 'w-20' : (isCollapsed ? 'w-16' : 'w-72')
      } overflow-y-auto`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {(isCollapsed || isTablet) ? (
            // Collapsed header - hide logo
            <div className="flex items-center justify-center w-full">
              {/* Logo hidden when collapsed */}
            </div>
          ) : (
            // Expanded header - show full branding
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logo/logo.png" 
                alt="Haliqo Logo" 
                className="w-14 h-14 object-contain"
              />
              <div>
               
                <p className="text-xs text-muted-foreground">Artisan Pro</p>
              </div>
            </div>
          )}
          {!isMobile && !isTablet && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-muted transition-colors duration-150"
            >
              <Icon 
                name={isCollapsed ? "ChevronRight" : "ChevronLeft"} 
                size={16} 
                color="var(--color-muted-foreground)" 
              />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {(isCollapsed || isTablet) ? (
              // Collapsed view - show all items as icons
              <div className="space-y-1">
                {flatNavigationItems.map((item) => (
                  <NavigationItem
                    key={item.id}
                    {...item}
                    isActive={location.pathname === item.path}
                    isCollapsed={true}
                    isMobile={false}
                  />
                ))}
              </div>
            ) : (
              // Expanded view - show categorized navigation
              filteredNavigationCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (category.isCollapsible) {
                            toggleSection(category.id);
                          }
                        }}
                        className={`flex items-center justify-between w-full ${
                          category.isCollapsible ? 'cursor-pointer hover:bg-muted rounded px-2 py-1' : ''
                        }`}
                      >
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category.label}
                        </h3>
                        {category.isCollapsible && (
                          <Icon 
                            name={category.isExpanded ? "ChevronDown" : "ChevronRight"} 
                            size={12} 
                            color="var(--color-muted-foreground)" 
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Category Items */}
                  {(!category.isCollapsible || category.isExpanded) && (
                    <div className="space-y-1">
                      {category.items.map((item) => (
                        <NavigationItem
                          key={item.id}
                          {...item}
                          isActive={location.pathname === item.path}
                          isCollapsed={isCollapsed}
                          isMobile={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto">
          <UserProfile 
            user={userData} 
            isCollapsed={isCollapsed} 
            onLogout={handleLogout}
            isTablet={isTablet}
          />
        </div>
      </div>
    </aside>
  );
};

export default MainSidebar;