import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import { resetPassword } from '../../services/authService';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const profileDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mobileNavRef = useScrollPosition('superadmin-mobile-nav-scroll', isMobile);

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

  // Get current user email
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProfileDropdownOpen]);

  // Auto-expand the correct section based on current route
  useEffect(() => {
    // Only auto-expand sections if sidebar is not collapsed and not on tablet
    if (isCollapsed || isTablet) {
      return;
    }
    
    const path = location.pathname;
    
    // Determine which section should be expanded based on the current path
    // Dashboard Analytics is now standalone, so no section needs to be expanded for it
    // Keep the current category expanded if user is on a page within that category
    if (path.startsWith('/admin/super/leads')) {
      setExpandedSections(prev => ({ ...prev, leads: true }));
    } else if (path.startsWith('/admin/super/users')) {
      setExpandedSections(prev => ({ ...prev, users: true }));
    } else if (path.startsWith('/admin/super/billing')) {
      setExpandedSections(prev => ({ ...prev, billing: true }));
    } else if (path.startsWith('/admin/super/email-templates') || path.startsWith('/admin/super/blogs')) {
      setExpandedSections(prev => ({ ...prev, content: true }));
    } else if (path.startsWith('/admin/super/customization')) {
      setExpandedSections(prev => ({ ...prev, customization: true }));
    } else if (path.startsWith('/admin/super/peppol-settings')) {
      setExpandedSections(prev => ({ ...prev, integrations: true }));
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
      
      // Close dropdown
      setIsProfileDropdownOpen(false);
      
      // Navigate to main login
      navigate('/login');
    } catch (error) {
      console.error('Superadmin logout error:', error);
      // Fallback: redirect to main login page
      navigate('/login');
    }
  };

  const handleResetPassword = async () => {
    // Prevent multiple simultaneous calls
    if (isSendingPasswordReset) {
      return;
    }

    if (!userEmail) {
      alert('No email address found');
      return;
    }

    setIsSendingPasswordReset(true);
    
    try {
      const { error } = await resetPassword(userEmail);
      
      if (error) {
        // Handle rate limit error specifically
        if (error.code === 'over_email_send_rate_limit' || error.message?.includes('rate limit')) {
          alert('Email rate limit exceeded\n\nPlease wait 1 hour before requesting another password reset email. You are Using free plan which has a rate limit of 2 email per hour.');
        } else {
          alert(`Failed to send password reset email:\n${error.message || 'An error occurred'}`);
        }
      } else {
        alert('Password reset email sent!\n\nPlease check your inbox and click the link to reset your password.');
        setIsProfileDropdownOpen(false);
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  // Standalone navigation items (no parent category)
  const standaloneItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Analytics',
      path: '/admin/super/dashboard',
      icon: 'BarChart3',
      notifications: 0
    }
  ];

  // Navigation items organized by categories with collapsible sections
  const navigationCategories = [
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

  // Flatten navigation items for mobile view (include standalone items)
  const flatNavigationItems = [
    ...standaloneItems,
    ...navigationCategories.flatMap(category => category.items)
  ];

  // Enable swipe navigation on mobile
  useSwipeNavigation(flatNavigationItems, isMobile && flatNavigationItems.length > 0);

  if (isMobile) {
    return (
      <>
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
              {/* Profile button for mobile */}
              <div className="relative flex-shrink-0" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative flex flex-col items-center justify-center transition-all duration-150 ease-in-out flex-shrink-0 p-2 rounded-lg min-w-[60px] text-foreground hover:bg-muted hover:text-foreground"
                  title="Profile"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
                      <Icon name="User" size={16} className="text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-medium mt-1 truncate">
                    Profile
                  </span>
                </button>

                {/* Profile Dropdown for Mobile */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />

                    {/* Dropdown Menu - positioned above bottom nav */}
                    <div 
                      className="fixed bg-popover border border-border rounded-lg shadow-professional-lg z-[9999] left-4 right-4 w-auto"
                      style={{ 
                        bottom: '80px'
                      }}
                    >
                      <div className="py-2">
                        {/* Email Display */}
                        {userEmail && (
                          <div className="px-4 py-2 border-b border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Email
                            </div>
                            <div className="text-sm text-popover-foreground truncate flex items-center space-x-2">
                              <Icon name="Mail" size={14} color="currentColor" />
                              <span className="truncate">{userEmail}</span>
                            </div>
                          </div>
                        )}

                        {/* Reset Password */}
                        <button
                          onClick={handleResetPassword}
                          disabled={isSendingPasswordReset}
                          className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon name="Key" size={16} color="currentColor" />
                          <span>
                            {isSendingPasswordReset ? 'Sending...' : 'Reset Password'}
                          </span>
                        </button>

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
                        >
                          <Icon name="LogOut" size={16} color="currentColor" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </>
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
              // Expanded view - show standalone items first, then categorized navigation
              <>
                {/* Standalone Items */}
                <div className="space-y-1 mb-2">
                  {standaloneItems.map((item) => (
                    <NavigationItem
                      key={item.id}
                      {...item}
                      isActive={location.pathname === item.path}
                      isCollapsed={isCollapsed}
                      isMobile={false}
                    />
                  ))}
                </div>

                {/* Categorized Navigation */}
                {navigationCategories.map((category) => (
                  <div key={category.id} className="space-y-1">
                    {/* Category Header */}
                    <div className="px-3 py-2">
                      <button
                        onClick={() => category.isCollapsible && toggleSection(category.id)}
                        className={`flex items-center justify-between w-full ${
                          category.isCollapsible ? 'cursor-pointer hover:opacity-80' : ''
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
                ))}
              </>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto" ref={profileDropdownRef}>
          <div className="p-4 border-t border-border">
            {isCollapsed ? (
              // Collapsed state - show profile icon button
              <div className="flex justify-center">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="p-2 rounded-md hover:bg-muted transition-colors duration-150 relative"
                  title="Profile"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full">
                    <Icon name="User" size={16} className="text-white" />
                  </div>
                </button>
              </div>
            ) : (
              // Expanded state - show profile button
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors duration-150"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full flex-shrink-0">
                  <Icon name="User" size={16} className="text-white" />
                </div>
                {!isTablet && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      Super Admin
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail || 'Administrator'}
                    </p>
                  </div>
                )}
                <Icon 
                  name="ChevronUp" 
                  size={16} 
                  color="var(--color-muted-foreground)"
                  className={`transition-transform duration-150 flex-shrink-0 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            )}

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setIsProfileDropdownOpen(false)}
                />

                {/* Dropdown Menu */}
                <div className={`
                  fixed bg-popover border border-border rounded-lg shadow-professional-lg z-[9999]
                  ${isCollapsed ? 'left-16 w-48' : 'left-4 w-64'}
                `}
                style={{ 
                  bottom: '80px'
                }}
                >
                  <div className="py-2">
                    {/* Email Display */}
                    {userEmail && (
                      <div className="px-4 py-2 border-b border-border">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Email
                        </div>
                        <div className="text-sm text-popover-foreground truncate flex items-center space-x-2">
                          <Icon name="Mail" size={14} color="currentColor" />
                          <span className="truncate">{userEmail}</span>
                        </div>
                      </div>
                    )}

                    {/* Reset Password */}
                    <button
                      onClick={handleResetPassword}
                      disabled={isSendingPasswordReset}
                      className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="Key" size={16} color="currentColor" />
                      <span>
                        {isSendingPasswordReset ? 'Sending...' : 'Reset Password'}
                      </span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
                    >
                      <Icon name="LogOut" size={16} color="currentColor" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
