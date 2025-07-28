import { useEffect, useRef } from 'react';

/**
 * Custom hook for persisting scroll position of horizontal scrollable elements
 * @param {string} storageKey - Unique key for localStorage
 * @param {boolean} enabled - Whether scroll persistence is enabled
 * @returns {React.RefObject} - Ref to attach to the scrollable element
 */
export const useScrollPosition = (storageKey, enabled = true) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!enabled || !scrollRef.current) return;

    const saveScrollPosition = () => {
      if (scrollRef.current) {
        localStorage.setItem(storageKey, scrollRef.current.scrollLeft.toString());
      }
    };

    const restoreScrollPosition = () => {
      const savedScroll = localStorage.getItem(storageKey);
      if (savedScroll && scrollRef.current) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollLeft = parseInt(savedScroll, 10);
          }
        });
      }
    };

    // Restore scroll position on mount
    restoreScrollPosition();

    // Save scroll position on scroll
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', saveScrollPosition);
      return () => element.removeEventListener('scroll', saveScrollPosition);
    }
  }, [storageKey, enabled]);

  return scrollRef;
}; 