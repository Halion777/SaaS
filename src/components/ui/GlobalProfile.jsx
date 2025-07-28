import React, { useState, useEffect } from 'react';
import UserProfile from './UserProfile';

const GlobalProfile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const mockUser = {
    name: 'Jean Dupont',
    company: 'Artisan Pro',
    avatar: '/assets/images/avatar.jpg'
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <div className={`fixed top-0 right-0 z-[9999] pointer-events-none transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="p-4 pointer-events-auto">
        <UserProfile 
          user={mockUser} 
          isCollapsed={false} 
          onLogout={handleLogout}
          isGlobal={true}
        />
      </div>
    </div>
  );
};

export default GlobalProfile; 