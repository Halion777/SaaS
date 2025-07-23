import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import NavigationItem from './NavigationItem';
import UserProfile from './UserProfile';

const MainSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      path: '/dashboard',
      icon: 'BarChart3',
      notifications: 0
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics-dashboard',
      icon: 'TrendingUp',
      notifications: 0
    },
    {
      id: 'quotes',
      label: 'Devis',
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
      id: 'invoices',
      label: 'Factures',
      path: '/invoices-management',
      icon: 'Receipt',
      notifications: 1
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

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-100">
        <div className="flex justify-around items-center h-16 px-4">
          {navigationItems.slice(0, 3).map((item) => (
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
      className={`fixed left-0 top-0 h-full bg-card border-r border-border z-100 transition-all duration-300 ease-out ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Hammer" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Havitam</h1>
                <p className="text-xs text-muted-foreground">Artisan Pro</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Icon name="Hammer" size={20} color="white" />
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
        <nav className="flex-1 p-4 space-y-3">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              {...item}
              isActive={location.pathname === item.path}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border">
          <UserProfile 
            user={mockUser} 
            onLogout={handleLogout} 
            isCollapsed={isCollapsed} 
          />
        </div>
      </div>
    </aside>
  );
};

export default MainSidebar;