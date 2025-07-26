import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';
import UserProfile from './UserProfile';

const MainSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quotes: true,
    clients: false,
    services: false,
    business: false
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (tablet && !mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Auto-expand the correct section based on current route
  useEffect(() => {
    const path = location.pathname;
    
    // Determine which section should be expanded based on the current path
    if (path.startsWith('/quote-creation') || path.startsWith('/quotes-management') || path.startsWith('/statistics')) {
      setExpandedSections(prev => ({ ...prev, quotes: true, clients: false, services: false, business: false }));
    } else if (path.startsWith('/client-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: true, services: false, business: false }));
    } else if (path.startsWith('/services/')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: true, business: false }));
    } else if (path.startsWith('/invoices-management') || path.startsWith('/supplier-invoices') || path.startsWith('/leads-management') || path.startsWith('/follow-up-management')) {
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, business: true }));

    } else if (path.startsWith('/dashboard') || path.startsWith('/analytics-dashboard')) {
      // Keep all sections collapsed for main pages
      setExpandedSections(prev => ({ ...prev, quotes: false, clients: false, services: false, business: false }));
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
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
        business: sectionId === 'business'
      };
    });
  };

  // Navigation items organized by categories with collapsible sections
  const navigationCategories = [
    {
      id: 'main',
      label: 'Principal',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          notifications: 0
        },
        {
          id: 'analytics',
          label: 'Analytics',
          path: '/analytics-dashboard',
          icon: 'BarChart3',
          notifications: 0
        }
      ]
    },
    {
      id: 'quotes',
      label: 'Devis',
      isCollapsible: true,
      isExpanded: expandedSections.quotes,
      items: [
        {
          id: 'quote-creation',
          label: 'Créer un devis',
          path: '/quote-creation',
          icon: 'FileText',
          notifications: 2
        },
        {
          id: 'quotes-management',
          label: 'Gestion des devis',
          path: '/quotes-management',
          icon: 'FolderOpen',
          notifications: 0
        },
        {
          id: 'statistics',
          label: 'Statistiques',
          path: '/statistics',
          icon: 'BarChart3',
          notifications: 0
        }
      ]
    },
    {
      id: 'business',
      label: 'Activité',
      isCollapsible: true,
      isExpanded: expandedSections.business,
      items: [
        {
          id: 'invoices',
          label: 'Factures clients',
          path: '/invoices-management',
          icon: 'Receipt',
          notifications: 1
        },
        {
          id: 'supplier-invoices',
          label: 'Factures fournisseurs',
          path: '/supplier-invoices',
          icon: 'FileText',
          notifications: 2
        },
        {
          id: 'leads-management',
          label: 'Gestion des Leads',
          path: '/leads-management',
          icon: 'Users',
          notifications: 0
        },
        {
          id: 'follow-up',
          label: 'Relances',
          path: '/follow-up-management',
          icon: 'MessageCircle',
          notifications: 0
        }
      ]
    },
    {
      id: 'clients',
      label: 'Clients',
      isCollapsible: true,
      isExpanded: expandedSections.clients,
      items: [
        {
          id: 'client-management',
          label: 'Gestion clients',
          path: '/client-management',
          icon: 'Users',
          notifications: 0
        }
      ]
    },
            {
          id: 'services',
          label: 'Services',
          isCollapsible: true,
          isExpanded: expandedSections.services,
          items: [
            {
              id: 'peppol-network',
              label: 'Peppol Network',
              path: '/services/peppol',
              icon: 'Network',
              notifications: 0
            },
            {
              id: 'assurance-credit',
              label: 'Assurance Crédit',
              path: '/services/assurance',
              icon: 'Shield',
              notifications: 0
            },
            {
              id: 'recouvrement',
              label: 'Recouvrement',
              path: '/services/recouvrement',
              icon: 'Banknote',
              notifications: 0
            }
          ]
        }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const mockUser = {
    name: 'Jean Dupont',
    company: 'Artisan Pro',
    avatar: '/assets/images/avatar.jpg'
  };

  // Flatten navigation items for mobile view
  const flatNavigationItems = navigationCategories.flatMap(category => category.items);

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-100">
        <div className="flex justify-around items-center h-16 px-4">
          {flatNavigationItems.slice(0, 5).map((item) => (
            <NavigationItem
              key={item.id}
              {...item}
              isActive={location.pathname === item.path}
              isCollapsed={true}
              isMobile={true}
            />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-card border-r border-border z-100 transition-all duration-300 ease-out sidebar-container ${
        isCollapsed ? 'w-16' : 'w-72'
      } overflow-y-auto`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logo/logo.png" 
                alt="Havitam Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Havitam</h1>
                <p className="text-xs text-muted-foreground">Artisan Pro</p>
              </div>
            </div>
          )}
          {!isMobile && (
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
            {navigationCategories.map((category) => (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                {!isCollapsed && (
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
                )}

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
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto">
          <UserProfile user={mockUser} isCollapsed={isCollapsed} onLogout={handleLogout} />
        </div>
      </div>
    </aside>
  );
};

export default MainSidebar;