import React from 'react';
import Icon from '../AppIcon';

const SortableHeader = ({ 
  label, 
  sortKey, 
  currentSortKey, 
  sortDirection, 
  onSort,
  className = '',
  align = 'left',
  showIcon = true // Only show icon for numeric/date columns
}) => {
  const isActive = currentSortKey === sortKey;
  const direction = isActive ? sortDirection : null;

  const handleClick = () => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th 
      className={`px-4 py-3 ${alignClass} text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {showIcon && (
          <div className="flex flex-col">
            <Icon 
              name="ChevronUp" 
              size={12} 
              className={direction === 'asc' ? 'text-foreground' : 'text-muted-foreground/30'} 
            />
            <Icon 
              name="ChevronDown" 
              size={12} 
              className={direction === 'desc' ? 'text-foreground' : 'text-muted-foreground/30'} 
              style={{ marginTop: '-4px' }}
            />
          </div>
        )}
      </div>
    </th>
  );
};

export default SortableHeader;

