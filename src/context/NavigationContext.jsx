import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

const NavigationContext = createContext(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    // Return default values if not within provider (for backwards compatibility)
    return { navigationItems: [], isMobile: false, setNavigationItems: () => {} };
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [navigationItems, setNavigationItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enable swipe navigation on mobile
  useSwipeNavigation(navigationItems, isMobile && navigationItems.length > 0);

  return (
    <NavigationContext.Provider value={{ navigationItems, setNavigationItems, isMobile }}>
      {children}
    </NavigationContext.Provider>
  );
};

