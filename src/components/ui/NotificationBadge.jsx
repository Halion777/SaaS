import React from 'react';

const NotificationBadge = ({ 
  count = 0, 
  variant = 'error', 
  className = '',
  maxCount = 99 
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const variantClasses = {
    error: 'bg-error text-error-foreground',
    warning: 'bg-warning text-warning-foreground',
    success: 'bg-success text-success-foreground',
    primary: 'bg-primary text-primary-foreground',
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-xs font-medium
        rounded-full
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;