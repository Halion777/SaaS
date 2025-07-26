import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import NotificationBadge from './NotificationBadge';

const NavigationItem = ({ 
  id, 
  label, 
  path, 
  icon, 
  notifications = 0, 
  isActive = false, 
  isCollapsed = false,
  isMobile = false 
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(path);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-full flex items-center transition-all duration-150 ease-in-out
        ${isMobile 
          ? 'flex-col justify-center p-2 rounded-lg' 
          : `p-3 rounded-lg ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}`
        }
        ${isActive 
          ? 'bg-primary text-primary-foreground shadow-professional' 
          : 'text-foreground hover:bg-muted hover:text-foreground hover-reveal'
        }
      `}
      title={isCollapsed || isMobile ? label : undefined}
    >
      <div className="relative flex items-center justify-center">
        <Icon 
          name={icon} 
          size={isMobile ? 20 : 20} 
          color="currentColor" 
        />
        {notifications > 0 && (
          <NotificationBadge 
            count={notifications} 
            variant="error"
            className="absolute -top-1 -right-1"
          />
        )}
      </div>
      
      {!isCollapsed && !isMobile && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
      
      {isMobile && (
        <span className="text-xs font-medium mt-1 truncate">{label}</span>
      )}
    </button>
  );
};

export default NavigationItem;