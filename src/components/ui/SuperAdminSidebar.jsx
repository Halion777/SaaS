import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';

const SuperAdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    system: true,
    leads: false,
    users: false,
    billing: false,
    content: false,
    customization: false,
    integrations: false
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // On tablet, always keep sidebar collapsed
      if (tablet) {
        setIsCollapsed(true);
        localStorage.setItem('superadmin-sidebar-collapsed', 'true');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
    // On tablet, always start collapsed regardless of saved state
    if (isTablet) {
      setIsCollapsed(true);
      localStorage.setItem('superadmin-sidebar-collapsed', 'true');
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
    if (path.startsWith('/admin/super/dashboard')) {
      setExpandedSections(prev => ({ ...prev, system: true, leads: false, users: false, billing: false, content: false, customization: false, integrations: false }));
    } else if (path.startsWith('/admin/super/leads')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: true, users: false, billing: false, content: false, customization: false, integrations: false }));
    } else if (path.startsWith('/admin/super/users')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: false, users: true, billing: false, content: false, customization: false, integrations: false }));
    } else if (path.startsWith('/admin/super/billing')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: false, users: false, billing: true, content: false, customization: false, integrations: false }));
    } else if (path.startsWith('/admin/super/email-templates') || path.startsWith('/admin/super/blogs')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: false, users: false, billing: false, content: true, customization: false, integrations: false }));
    } else if (path.startsWith('/admin/super/customization')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: false, users: false, billing: false, content: false, customization: true, integrations: false }));
    } else if (path.startsWith('/admin/super/peppol-settings')) {
      setExpandedSections(prev => ({ ...prev, system: false, leads: false, users: false, billing: false, content: false, customization: false, integrations: true }));
    }
  }, [location.pathname, isCollapsed, isTablet]);

  const toggleSidebar = () => {
    // On tablet, prevent sidebar toggle - always stay collapsed
    if (isTablet) {
      return;
    }
    
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('superadmin-sidebar-collapsed', JSON.stringify(newCollapsed));
    
    // Dispatch custom event to notify pages of sidebar state change
    const event = new CustomEvent('superadmin-sidebar-toggle', { 
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
        system: sectionId === 'system',
        leads: sectionId === 'leads',
        users: sectionId === 'users',
        billing: sectionId === 'billing',
        content: sectionId === 'content',
        customization: sectionId === 'customization',
        integrations: sectionId === 'integrations'
      };
    });
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Navigate to main login
      navigate('/login');
    } catch (error) {
      console.error('Superadmin logout error:', error);
      // Fallback: redirect to main login page
      navigate('/login');
    }
  };

  // Navigation items organized by categories with collapsible sections
  const navigationCategories = [
    {
      id: 'system',
      label: 'System Management',
      isCollapsible: true,
      isExpanded: expandedSections.system,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Analytics',
          path: '/admin/super/dashboard',
          icon: 'BarChart3',
          notifications: 0
        }
      ]
    },
    {
      id: 'leads',
      label: 'Lead Management',
      isCollapsible: true,
      isExpanded: expandedSections.leads,
      items: [
        {
          id: 'lead-management',
          label: 'Lead Management',
          path: '/admin/super/leads',
          icon: 'Target',
          notifications: 0
        }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      isCollapsible: true,
      isExpanded: expandedSections.users,
      items: [
        {
          id: 'all-users',
          label: 'Users Management',
          path: '/admin/super/users',
          icon: 'Users',
          notifications: 0
        }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Subscriptions',
      isCollapsible: true,
      isExpanded: expandedSections.billing,
      items: [
        {
          id: 'billing-subscriptions',
          label: 'Billing & Subscriptions',
          path: '/admin/super/billing',
          icon: 'CreditCard',
          notifications: 0
        }
      ]
    },
    {
      id: 'content',
      label: 'Content Management',
      isCollapsible: true,
      isExpanded: expandedSections.content,
      items: [
        {
          id: 'email-templates',
          label: 'Email Templates',
          path: '/admin/super/email-templates',
          icon: 'Mail',
          notifications: 0
        },
        {
          id: 'blogs',
          label: 'Blog Posts',
          path: '/admin/super/blogs',
          icon: 'FileText',
          notifications: 0
        }
      ]
    },
    {
      id: 'customization',
      label: 'Customization',
      isCollapsible: true,
      isExpanded: expandedSections.customization,
      items: [
        {
          id: 'app-customization',
          label: 'App Customization',
          path: '/admin/super/customization',
          icon: 'Sliders',
          notifications: 0
        }
      ]
    },
    {
      id: 'integrations',
      label: 'Integrations',
      isCollapsible: true,
      isExpanded: expandedSections.integrations,
      items: [
        {
          id: 'peppol',
          label: 'Peppol',
          path: '/admin/super/peppol-settings',
          icon: 'Network',
          notifications: 0
        }
      ]
    }
  ];

  // Flatten navigation items for mobile view
  const flatNavigationItems = navigationCategories.flatMap(category => category.items);

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-100">
        <div className="flex overflow-x-auto scrollbar-hide h-16 px-4">
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
              <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
                <Icon name="Shield" size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Super Admin</h2>
                <p className="text-xs text-muted-foreground">System Control</p>
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
          <div className="p-4 border-t border-border">
            {isCollapsed ? (
              // Collapsed state - show only logout icon
              <div className="flex justify-center">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md hover:bg-muted transition-colors duration-150"
                  title="Logout"
                >
                  <Icon name="LogOut" size={20} color="var(--color-muted-foreground)" />
                </button>
              </div>
            ) : (
              // Expanded state - show full profile
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
                  <Icon name="User" size={16} className="text-white" />
                </div>
                {!isTablet && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Super Admin
                    </p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                )}
                {!isMobile && !isTablet && (
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors duration-150"
                    title="Logout"
                  >
                    <Icon name="LogOut" size={16} color="var(--color-muted-foreground)" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
