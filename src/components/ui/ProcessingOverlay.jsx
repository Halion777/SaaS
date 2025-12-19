import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * A reusable processing overlay component that prevents navigation during processing
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the overlay is visible
 * @param {string} props.message - Message to display in the overlay
 * @param {string} props.id - Optional ID for the overlay
 * @param {function} props.onClose - Optional callback when the overlay is closed
 * @param {boolean} props.preventNavigation - Whether to prevent navigation with warning (default: true)
 * @returns {React.ReactNode}
 */
const ProcessingOverlay = ({ isVisible, message = null, id = "processing-overlay", onClose = null, preventNavigation = true }) => {
  const { t } = useTranslation();
  
  // Use provided message or fallback to default translation
  const displayMessage = message || t('ui.processingOverlay.defaultMessage');
  
  useEffect(() => {
    // Only prevent navigation if preventNavigation is true
    if (!preventNavigation) return;
    
    // Prevent closing the tab with a warning when overlay is visible
    const beforeUnloadListener = (event) => {
      if (isVisible) {
        event.preventDefault();
        return event.returnValue = t('ui.processingOverlay.leaveWarning');
      }
    };
    
    // Add event listener when overlay becomes visible
    if (isVisible) {
      window.addEventListener('beforeunload', beforeUnloadListener);
    }
    
    // Clean up event listener when overlay is hidden or component unmounts
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadListener);
      
      // Call onClose callback if provided and overlay was visible
      if (isVisible && onClose) {
        onClose();
      }
    };
  }, [isVisible, onClose, t, preventNavigation]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      id={id}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[10001] flex items-center justify-center"
    >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="font-medium text-foreground">{displayMessage}</p>
      </div>
    </div>
  );
};

/**
 * Create and show a processing overlay imperatively (without React)
 * 
 * @param {string} message - Message to display in the overlay
 * @param {string} id - Optional ID for the overlay
 * @returns {Object} - Object with show and hide methods
 */
export const createProcessingOverlay = (message = null, id = "processing-overlay") => {
  // Check if overlay already exists
  let overlayElement = document.getElementById(id);
  if (overlayElement) {
    document.body.removeChild(overlayElement);
  }
  
  // Create overlay element
  overlayElement = document.createElement('div');
  overlayElement.id = id;
  overlayElement.style.position = 'fixed';
  overlayElement.style.top = '0';
  overlayElement.style.left = '0';
  overlayElement.style.width = '100%';
  overlayElement.style.height = '100%';
  // Use backdrop blur with semi-transparent background (matching signature modal style)
  // Try to get background color from CSS variables, fallback to white with opacity
  let bgColor = 'rgba(255, 255, 255, 0.8)'; // Default light mode
  try {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgVar = computedStyle.getPropertyValue('--background')?.trim();
    if (bgVar) {
      // If it's an RGB value, convert to rgba with opacity
      if (bgVar.startsWith('rgb')) {
        bgColor = bgVar.replace('rgb', 'rgba').replace(')', ', 0.8)');
      } else {
        bgColor = bgVar + 'CC'; // Add opacity hex (80% = CC)
      }
    }
  } catch (e) {
    // Fallback if CSS variables not available
  }
  
  overlayElement.style.backgroundColor = bgColor;
  overlayElement.style.backdropFilter = 'blur(4px)';
  overlayElement.style.WebkitBackdropFilter = 'blur(4px)';
  overlayElement.style.zIndex = '10001';
  overlayElement.style.display = 'flex';
  overlayElement.style.flexDirection = 'column';
  overlayElement.style.justifyContent = 'center';
  overlayElement.style.alignItems = 'center';
  overlayElement.style.gap = '16px';
  
  // Use provided message or fallback to default
  const displayMessage = message || 'Processing...';
  
  // Create spinner element
  const spinnerElement = document.createElement('div');
  spinnerElement.className = 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary';
  
  // Create message element
  const messageElement = document.createElement('p');
  messageElement.style.fontWeight = '500';
  messageElement.style.color = '#1f2937';
  messageElement.textContent = displayMessage;
  
  // Append spinner and message directly to overlay
  overlayElement.appendChild(spinnerElement);
  overlayElement.appendChild(messageElement);
  
  // Add beforeunload event listener
  // Note: This function is used imperatively without React context, so we can't use translations here
  const beforeUnloadListener = (event) => {
    event.preventDefault();
    return event.returnValue = "Processing in progress. Are you sure you want to leave this page?";
  };
  
  // Return methods to show and hide the overlay
  return {
    show: () => {
      document.body.appendChild(overlayElement);
      window.addEventListener('beforeunload', beforeUnloadListener);
    },
    hide: () => {
      if (document.body.contains(overlayElement)) {
        document.body.removeChild(overlayElement);
      }
      window.removeEventListener('beforeunload', beforeUnloadListener);
    }
  };
};

export default ProcessingOverlay;
