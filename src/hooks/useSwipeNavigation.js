import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for swipe navigation on mobile
 * Swipe left/right to navigate between pages
 * 
 * @param {Array} navigationItems - Array of navigation items with path property
 * @param {boolean} enabled - Whether swipe navigation is enabled (default: true on mobile)
 */
export const useSwipeNavigation = (navigationItems = [], enabled = true) => {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const minSwipeDistance = useRef(50); // Minimum distance for a swipe
  const maxVerticalDistance = useRef(30); // Max vertical movement to consider it horizontal swipe

  useEffect(() => {
    // Only enable on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!enabled || !isMobile || !navigationItems || navigationItems.length === 0) {
      return;
    }

    // Get current page index
    const currentIndex = navigationItems.findIndex(
      item => item.path === location.pathname || location.pathname.startsWith(item.path + '/')
    );

    // If current page not found in navigation, disable swipe
    if (currentIndex === -1) {
      return;
    }

    let touchStartTime = null;
    const maxSwipeTime = 300; // Maximum time for a swipe (ms)

    const handleTouchStart = (e) => {
      // Only handle single touch
      if (e.touches.length !== 1) return;
      
      // Don't interfere with interactive elements
      const target = e.target;
      const isInteractive = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'BUTTON' ||
                           target.tagName === 'A' ||
                           target.closest('button') ||
                           target.closest('a') ||
                           target.closest('[role="button"]') ||
                           target.closest('.overflow-x-auto'); // Don't interfere with horizontal scrollbars
      
      if (isInteractive) {
        return;
      }
      
      // Check if touch is on a scrollable area (but not the main page container)
      // Only block swipe if the scrollable element is small (not full page height)
      const scrollableParent = target.closest('.overflow-y-auto');
      if (scrollableParent) {
        // Check if this is a content scrollable area (has limited height) vs main container (full height)
        const rect = scrollableParent.getBoundingClientRect();
        const isContentArea = rect.height < window.innerHeight * 0.9; // Less than 90% of viewport
        
        if (isContentArea && scrollableParent.scrollHeight > scrollableParent.clientHeight) {
          // This is a genuine scrollable content area, don't interfere
          return;
        }
        // Otherwise, it's a main container - allow swipe navigation
      }
      
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchMove = (e) => {
      // If user is scrolling vertically, cancel swipe detection
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (deltaY > maxVerticalDistance.current) {
          // User is scrolling vertically, cancel swipe
          touchStartX.current = null;
          touchStartY.current = null;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const swipeTime = touchEndTime - (touchStartTime || touchEndTime);

      // Reset touch start
      touchStartX.current = null;
      touchStartY.current = null;
      touchStartTime = null;

      // Check if swipe was too slow (user was scrolling, not swiping)
      if (swipeTime > maxSwipeTime) {
        return;
      }

      // Check if it's a horizontal swipe (not vertical scroll)
      if (absDeltaY > absDeltaX || absDeltaY > maxVerticalDistance.current) {
        return; // Vertical scroll, ignore
      }

      // Check if swipe distance is sufficient
      if (absDeltaX < minSwipeDistance.current) {
        return; // Not a swipe, just a tap
      }

      // Determine swipe direction and navigate
      if (deltaX > 0) {
        // Swipe right - go to previous page
        if (currentIndex > 0) {
          const previousItem = navigationItems[currentIndex - 1];
          if (previousItem && previousItem.path) {
            navigate(previousItem.path);
          }
        }
      } else {
        // Swipe left - go to next page
        if (currentIndex < navigationItems.length - 1) {
          const nextItem = navigationItems[currentIndex + 1];
          if (nextItem && nextItem.path) {
            navigate(nextItem.path);
          }
        }
      }
    };

    // Add touch event listeners to the document
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location.pathname, navigationItems, navigate, enabled]);
};

