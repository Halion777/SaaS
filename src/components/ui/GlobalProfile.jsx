import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserProfile from './UserProfile';

const GlobalProfile = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if current page should show the global profile
  const shouldShowProfile = () => {
    // Dashboard pages where profile should be shown
    const dashboardPages = [
      '/dashboard', '/quotes-management', '/invoices-management', 
      '/client-management', '/analytics-dashboard', '/follow-up-management',
      '/quotes-follow-up', '/invoices-follow-up', '/leads-management', 
      '/expense-invoices', '/multi-user-profiles', '/quote-creation', 
      '/services/peppol'
    ];
    
    // Check if current path starts with any dashboard page
    return dashboardPages.some(page => location.pathname.startsWith(page));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const getScrollPosition = () => {
      // First, try to find the main scrollable container (usually the one with h-screen and overflow-y-auto)
      const scrollableContainer = document.querySelector('.h-screen.overflow-y-auto, [class*="h-screen"][class*="overflow-y-auto"]');
      
      if (scrollableContainer) {
        return scrollableContainer.scrollTop || 0;
      }
      
      // Fallback to window scroll
      return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    };

    const handleScroll = () => {
      const currentScrollY = getScrollPosition();
      
      // Show profile only when at the very top, hide when scrolling
      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else {
        // Hide profile when not at top
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    handleResize();
    
    // Find the main scrollable container
    const scrollableContainer = document.querySelector('.h-screen.overflow-y-auto, [class*="h-screen"][class*="overflow-y-auto"]');
    
    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      handleScroll(); // Check initial scroll position
      
      if (scrollableContainer) {
        // Listen to scroll on the container
        scrollableContainer.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        // Fallback to window scroll
        window.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (scrollableContainer) {
        scrollableContainer.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [location.pathname]); // Re-run when route changes

  // Use real user data from AuthContext
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || t('profile.defaultUser.name'),
    company: user.user_metadata?.company_name || t('profile.defaultUser.company'),
    avatar: user.user_metadata?.avatar_url || '/assets/images/no profile.jpg'
  } : {
    name: t('profile.defaultUser.name'),
    company: t('profile.defaultUser.company'),
    avatar: '/assets/images/no profile.jpg'
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext will handle the redirect
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: redirect to login page
      window.location.href = '/login';
    }
  };

  // Only render on mobile AND on dashboard pages AND when user is loaded
  if (!isMobile || !shouldShowProfile() || !user) {
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 z-[9999] pointer-events-none transition-transform duration-100 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="p-4 pt-4 pointer-events-auto">
        <UserProfile 
          user={userData} 
          isCollapsed={false} 
          onLogout={handleLogout}
          isGlobal={true}
        />
      </div>
    </div>
  );
};

export default GlobalProfile; 