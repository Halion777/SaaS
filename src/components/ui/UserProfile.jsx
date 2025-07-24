import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';

const UserProfile = ({ user, onLogout, isCollapsed = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    // Navigate to settings page
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    <div className="relative overflow-hidden" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`
          w-full p-4 flex items-center transition-all duration-150 ease-in-out
          hover:bg-muted hover-reveal
          ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
        `}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
          <Image
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {!isCollapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.company}
              </p>
            </div>
            <Icon 
              name="ChevronUp" 
              size={16} 
              color="var(--color-muted-foreground)"
              className={`transition-transform duration-150 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className={`
          absolute bottom-full mb-2 bg-popover border border-border rounded-lg shadow-professional-lg z-200
          ${isCollapsed ? 'left-16 w-48' : 'left-4 right-4'}
        `}>
          <div className="py-2">
            {isCollapsed && (
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-popover-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.company}
                </p>
              </div>
            )}
            
            <button
              onClick={handleSettings}
              className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
            >
              <Icon name="Settings" size={16} color="currentColor" />
              <span>Paramètres</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors duration-150 flex items-center space-x-2"
            >
              <Icon name="LogOut" size={16} color="currentColor" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;