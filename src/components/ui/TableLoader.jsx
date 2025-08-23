import React from 'react';
import Icon from '../AppIcon';

/**
 * A reusable table loader component that matches the style used in quote follow-up tables
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display under the loader
 * @param {string} props.icon - Icon name to display (defaults to Loader2)
 * @param {number} props.size - Size of the icon (defaults to 32)
 * @param {string} props.className - Additional class names for the container
 * @param {string} props.iconClassName - Additional class names for the icon
 * @param {string} props.textClassName - Additional class names for the text
 * @returns {React.ReactNode}
 */
const TableLoader = ({ 
  message = "Chargement des données...", 
  icon = "Loader2", 
  size = 32,
  className = "",
  iconClassName = "",
  textClassName = ""
}) => {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <div className="text-center">
        <Icon 
          name={icon} 
          size={size} 
          className={`sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4 text-primary ${iconClassName}`} 
        />
        <p className={`text-xs sm:text-sm text-muted-foreground ${textClassName}`}>{message}</p>
      </div>
    </div>
  );
};

/**
 * A skeleton loader for table rows
 * 
 * @param {Object} props - Component props
 * @param {number} props.rows - Number of rows to display (defaults to 5)
 * @param {number} props.columns - Number of columns to display (defaults to 4)
 * @param {string} props.className - Additional class names for the container
 * @returns {React.ReactNode}
 */
export const TableSkeletonLoader = ({ 
  rows = 5, 
  columns = 4,
  className = "" 
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-lg ${className}`}>
      {/* Header skeleton */}
      <div className="flex bg-muted/30 p-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div 
            key={`header-${i}`} 
            className={`h-6 bg-muted animate-pulse rounded ${i === 0 ? 'w-8' : 'flex-1'} ${i !== 0 ? 'ml-4' : ''}`}
          />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className={`flex p-3 ${rowIndex % 2 === 0 ? 'bg-muted/10' : ''}`}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={`h-6 bg-muted/50 animate-pulse rounded ${colIndex === 0 ? 'w-8' : 'flex-1'} ${colIndex !== 0 ? 'ml-4' : ''}`}
              style={{ 
                animationDelay: `${(rowIndex * 0.1) + (colIndex * 0.05)}s`,
                opacity: 0.7 - (rowIndex * 0.1)
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * A card skeleton loader for dashboard cards
 * 
 * @param {Object} props - Component props
 * @param {number} props.cards - Number of cards to display (defaults to 3)
 * @param {string} props.className - Additional class names for the container
 * @returns {React.ReactNode}
 */
export const CardSkeletonLoader = ({ 
  cards = 3,
  className = "" 
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div 
          key={`card-${i}`} 
          className="bg-card border border-border rounded-lg p-4 h-32 flex flex-col"
        >
          <div className="w-1/2 h-5 bg-muted/50 animate-pulse rounded mb-3" 
            style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="w-3/4 h-8 bg-muted/50 animate-pulse rounded mb-4" 
            style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
          <div className="mt-auto flex justify-between">
            <div className="w-1/4 h-4 bg-muted/50 animate-pulse rounded" 
              style={{ animationDelay: `${i * 0.1 + 0.2}s` }} />
            <div className="w-1/4 h-4 bg-muted/50 animate-pulse rounded" 
              style={{ animationDelay: `${i * 0.1 + 0.3}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableLoader;
