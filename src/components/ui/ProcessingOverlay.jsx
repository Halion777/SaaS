import React, { useEffect } from 'react';

/**
 * A reusable processing overlay component that prevents navigation during processing
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the overlay is visible
 * @param {string} props.message - Message to display in the overlay
 * @param {string} props.id - Optional ID for the overlay
 * @param {function} props.onClose - Optional callback when the overlay is closed
 * @returns {React.ReactNode}
 */
const ProcessingOverlay = ({ isVisible, message = "Traitement en cours...", id = "processing-overlay", onClose = null }) => {
  useEffect(() => {
    // Prevent closing the tab with a warning when overlay is visible
    const beforeUnloadListener = (event) => {
      if (isVisible) {
        event.preventDefault();
        return event.returnValue = "Traitement en cours. Êtes-vous sûr de vouloir quitter cette page?";
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
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      id={id}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
    >
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-xs w-full text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="font-medium text-gray-800">{message}</p>
        </div>
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
export const createProcessingOverlay = (message = "Traitement en cours...", id = "processing-overlay") => {
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
  overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlayElement.style.backdropFilter = 'blur(2px)';
  overlayElement.style.zIndex = '9999';
  overlayElement.style.display = 'flex';
  overlayElement.style.justifyContent = 'center';
  overlayElement.style.alignItems = 'center';
  
  // Create content element
  const contentElement = document.createElement('div');
  contentElement.style.backgroundColor = 'white';
  contentElement.style.padding = '24px';
  contentElement.style.borderRadius = '8px';
  contentElement.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  contentElement.style.textAlign = 'center';
  contentElement.style.maxWidth = '320px';
  contentElement.style.width = '100%';
  
  // Create spinner and message
  contentElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p style="font-weight: 500; color: #1f2937;">${message}</p>
    </div>
  `;
  
  overlayElement.appendChild(contentElement);
  
  // Add beforeunload event listener
  const beforeUnloadListener = (event) => {
    event.preventDefault();
    return event.returnValue = "Traitement en cours. Êtes-vous sûr de vouloir quitter cette page?";
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
