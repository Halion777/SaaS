import React, { useState } from 'react';

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'bottom-full mb-2';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 whitespace-nowrap px-2 py-1 rounded text-xs 
            bg-popover text-popover-foreground border border-border shadow-sm
            ${getPositionClasses()}
            ${position === 'top' || position === 'bottom' ? 'left-1/2 transform -translate-x-1/2' : ''}
            ${position === 'left' || position === 'right' ? 'top-1/2 transform -translate-y-1/2' : ''}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip; 