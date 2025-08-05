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
      '/leads-management', '/supplier-invoices', '/multi-user-profiles',
      '/quote-creation'
    ];
    
    // Check if current path starts with any dashboard page
    return dashboardPages.some(page => location.pathname.startsWith(page));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
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
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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

  // Only render on mobile AND on dashboard pages
  if (!isMobile || !shouldShowProfile()) {
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