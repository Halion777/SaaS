import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';
import UserProfile from './UserProfile';
import ProfileSwitcher from './ProfileSwitcher';
import MultiUserProfile from './MultiUserProfile';
import { useScrollPosition } from '../../utils/useScrollPosition';

const MainSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quotes: true,
    clients: false,
    services: false,
    invoices: false
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const mobileNavRef = useScrollPosition('mobile-nav-scroll', isMobile);

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
    if (path.startsWith('/quote-creation') || path.startsWith('/quotes-management') || path.startsWith('/quotes-follow-up')) {
      setExpandedSections(prev => ({ ...prev, quotes: true, clients: false, services: false, invoices: false }));
    } else if (path.startsWith('/client-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: true, services: false, invoices: false }));
    } else if (path.startsWith('/services/')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: true, invoices: false }));
    } else if (path.startsWith('/invoices-management') || path.startsWith('/supplier-invoices') || path.startsWith('/invoices-follow-up')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, invoices: true }));
    } else if (path.startsWith('/dashboard') || path.startsWith('/analytics-dashboard') || path.startsWith('/peppol-access-point') || path.startsWith('/leads-management')) {
      // Keep all sections collapsed for main pages
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, invoices: false }));
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
        invoices: sectionId === 'invoices'
      };
    });
  };



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
          notifications: 0
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
          notifications: 2
        },
        {
          id: 'quotes-management',
          label: t('sidebar.categories.quotes.items.quotesManagement'),
          path: '/quotes-management',
          icon: 'FolderOpen',
          notifications: 0
        },
        {
          id: 'quotes-follow-up',
          label: t('sidebar.categories.quotes.items.quotesFollowUp'),
          path: '/quotes-follow-up',
          icon: 'MessageCircle',
          notifications: 0
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
          notifications: 1
        },
        {
          id: 'supplier-invoices',
          label: t('sidebar.categories.invoices.items.supplierInvoices'),
          path: '/supplier-invoices',
          icon: 'FileText',
          notifications: 2
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
        {
          id: 'assurance-credit',
          label: t('sidebar.categories.services.items.creditInsurance'),
          path: '/services/assurance',
          icon: 'Shield',
          notifications: 0
        },
        {
          id: 'recouvrement',
          label: t('sidebar.categories.services.items.recovery'),
          path: '/services/recouvrement',
          icon: 'Banknote',
          notifications: 0
        }
      ]
    }
  ];

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

  // Flatten navigation items for mobile view
  const flatNavigationItems = navigationCategories.flatMap(category => category.items);

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
                alt="Havitam Logo" 
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
              navigationCategories.map((category) => (
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