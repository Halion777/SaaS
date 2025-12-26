import React from 'react';
import Button from './Button';
import Icon from '../AppIcon';
import { useTranslation } from 'react-i18next';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  showInfo = true,
  className = ''
}) => {
  const { t } = useTranslation();
  
  if (totalPages <= 1) {
    return null;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of middle range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`bg-card border border-border rounded-lg px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {showInfo && (
          <div className="text-sm text-muted-foreground">
            {t('pagination.showing', 'Showing')} {startIndex + 1} {t('pagination.to', 'to')} {endIndex} {t('pagination.of', 'of')} {totalItems} {t('pagination.results', 'results')}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <Icon name="ChevronLeft" size={16} />
            <span>{t('pagination.previous', 'Previous')}</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                );
              }
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            <span>{t('pagination.next', 'Next')}</span>
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

