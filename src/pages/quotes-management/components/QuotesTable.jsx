import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useTranslation } from 'react-i18next';

const QuotesTable = ({ quotes, selectedQuotes, onSelectQuote, onSelectAll, onQuoteAction, onQuoteSelect, viewMode = 'table', setViewMode = () => {}, searchTerm = '', setSearchTerm = () => {} }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const { t } = useTranslation();

  // Auto-switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedAndFilteredQuotes = useMemo(() => {
    let filtered = quotes; // Use quotes directly since parent already filters them

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'validUntil') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [quotes, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (quote) => {
    const { status, trackingData } = quote;
    
    // Expiration is now handled by edge functions - use status directly from backend
    const currentStatus = status;
    
    // Enhanced status with tracking information
    const statusConfig = {
      draft: { label: t('quotesManagement.filter.status.draft'), className: 'bg-gray-100 text-gray-800' },
      sent: { label: t('quotesManagement.filter.status.sent'), className: 'bg-blue-100 text-blue-800' },
      viewed: { label: t('quotesManagement.filter.status.viewed'), className: 'bg-orange-100 text-orange-800' },
      accepted: { label: t('quotesManagement.filter.status.accepted'), className: 'bg-green-100 text-green-800' },
      rejected: { label: t('quotesManagement.filter.status.rejected'), className: 'bg-red-100 text-red-800' },
      expired: { label: t('quotesManagement.filter.status.expired'), className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[currentStatus] || { label: currentStatus, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
        
        {/* Show tracking status for sent quotes */}
        {status === 'sent' && trackingData && (
          <div className="flex flex-col gap-1">
            {trackingData.relanceStatus === 'not_viewed' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                📧 Non ouvert
              </span>
            )}
            {trackingData.relanceStatus === 'viewed_no_action' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                👁️ Vue sans action
              </span>
            )}
            {trackingData.relanceStatus === 'accepted' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✅ Accepté
              </span>
            )}
            {trackingData.relanceStatus === 'rejected' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                ❌ Rejeté
              </span>
            )}
            {trackingData.relanceStatus === 'expired' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                ⏰ Expiré
              </span>
            )}
          </div>
        )}
        

      </div>
    );
  };

  const getStatusColor = (status) => {
    // Expiration is now handled by edge functions - use status directly from backend
    const currentStatus = status;
    
    const colors = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-blue-100 text-blue-700',
      viewed: 'bg-orange-100 text-orange-700',
      accepted: 'bg-green-100 text-success',
      rejected: 'bg-red-100 text-destructive',
      expired: 'bg-yellow-100 text-yellow-700'
    };
    return colors[currentStatus] || colors.draft;
  };


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 md:p-4 text-left">
              <Checkbox
                checked={selectedQuotes.length === sortedAndFilteredQuotes.length && sortedAndFilteredQuotes.length > 0}
                onChange={onSelectAll}
                aria-label="Select all quotes"
              />
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('number')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.number')}</span>
                {sortConfig.key === 'number' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('clientName')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.client')}</span>
                {sortConfig.key === 'clientName' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('amount')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.amount')}</span>
                {sortConfig.key === 'amount' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.status')}</span>
                {sortConfig.key === 'status' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>

            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('createdAt')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.createdAt')}</span>
                {sortConfig.key === 'createdAt' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('validUntil')}>
              <div className="flex items-center space-x-1">
                <span>{t('quotesManagement.table.headers.validUntil')}</span>
                {sortConfig.key === 'validUntil' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">
              {t('quotesManagement.table.headers.followUps')}
            </th>
            <th className="p-3 md:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">
              {t('quotesManagement.table.headers.files')}
            </th>
            <th className="p-3 md:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">
              {t('quotesManagement.table.headers.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedAndFilteredQuotes.map((quote) => (
            <tr 
              key={quote.id} 
              className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onQuoteSelect(quote)}
            >
              <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedQuotes.includes(quote.id)}
                  onChange={() => onSelectQuote(quote.id)}
                  aria-label={`Select quote ${quote.number}`}
                />
              </td>
              <td className="p-3 md:p-4 font-medium text-foreground">{quote.number}</td>
              <td className="p-3 md:p-4 text-foreground">{quote.clientName}</td>
              <td className="p-3 md:p-4 font-medium text-foreground">{formatAmount(quote.amount)}</td>
              <td className="p-3 md:p-4">
                {getStatusBadge(quote)}
              </td>
              <td className="p-3 md:p-4 text-muted-foreground">{formatDate(quote.createdAt)}</td>
              <td className="p-3 md:p-4 text-foreground">{quote.validUntil ? formatDate(quote.validUntil) : '-'}</td>
              <td className="p-3 md:p-4">
                <div className="flex flex-col gap-1">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-center ${quote.followUpStatusColor || 'bg-gray-100 text-gray-700'}`}
                  >
                    {quote.followUpStatusLabel || 'Aucune'}
                  </span>
                  {/* Per request: hide step number and time details in reminder column */}
                </div>
              </td>
              <td className="p-3 md:p-4 text-center">
                <div className="flex items-center justify-center">
                  {/* Filter out duplicate files or files without valid paths */}
                  {(() => {
                    let fileCount = 0;
                    
                    if (quote.isDraftPlaceholder) {
                      // For draft placeholders, handle files differently
                      const draftFiles = quote.files || [];
                      // Get unique files by path or name to avoid counting duplicates
                      const uniqueFilePaths = new Set();
                      draftFiles.forEach(file => {
                        if (file) {
                          const identifier = file.path || file.file_path || file.name || file.file_name;
                          if (identifier && !uniqueFilePaths.has(identifier)) {
                            uniqueFilePaths.add(identifier);
                          }
                        }
                      });
                      fileCount = uniqueFilePaths.size;
                    } else {
                      // For regular quotes
                      const validFiles = quote.files && quote.files.filter(file => file && file.file_path);
                      // Get unique files by path to avoid counting duplicates
                      const uniqueFilePaths = new Set();
                      const uniqueFiles = validFiles && validFiles.filter(file => {
                        const isDuplicate = uniqueFilePaths.has(file.file_path);
                        if (!isDuplicate) uniqueFilePaths.add(file.file_path);
                        return !isDuplicate;
                      });
                      fileCount = uniqueFiles ? uniqueFiles.length : 0;
                    }
                    
                    return (
                      <>
                        <Icon name="Paperclip" size={16} className={fileCount > 0 ? "text-blue-600" : "text-gray-400"} />
                        <span className={`ml-1 text-xs font-medium ${fileCount > 0 ? "text-blue-600" : "text-gray-400"}`}>
                          {fileCount}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </td>
              <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  {quote.status === 'draft' && !quote.isDraftPlaceholder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('markAsSent', quote)}
                      title={t('quotesManagement.table.actions.markAsSent')}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Icon name="Check" size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('edit', quote)}
                    title={t('quotesManagement.table.actions.edit')}
                    className="h-8 w-8"
                  >
                    <Icon name="Edit" size={16} />
                  </Button>
                  {(!quote.isDraftPlaceholder && quote.status === 'sent') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('convert', quote)}
                      title={t('quotesManagement.table.actions.convertToInvoice')}
                      className="h-8 w-8"
                    >
                      <Icon name="Receipt" size={16} />
                    </Button>
                  )}
                  {/* Follow-up management icon removed per request */}
                  {/* Send reminder icon removed: manage via Follow-up panel */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('delete', quote)}
                    title={t('quotesManagement.table.actions.delete')}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Icon name="Trash" size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedAndFilteredQuotes.map((quote) => (
        <div
          key={quote.id}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onQuoteSelect(quote)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{quote.number}</h3>
              <p className="text-sm text-muted-foreground mb-2">{quote.clientName}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(quote)}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">{quote.amountFormatted}</span>
            <div className="text-xs text-muted-foreground">{t('quotesManagement.table.card.validUntil')} {quote.validUntil ? formatDate(quote.validUntil) : '-'}</div>
          </div>
          
                    <div className="text-xs text-muted-foreground mb-3">
            {t('quotesManagement.table.card.createdAt')} {formatDate(quote.createdAt)}
          </div>
          
          {/* Files indicator */}
          <div className="flex items-center mb-3 text-xs">
            {(() => {
              let fileCount = 0;
              
              if (quote.isDraftPlaceholder) {
                // For draft placeholders, handle files differently
                const draftFiles = quote.files || [];
                // Get unique files by path or name to avoid counting duplicates
                const uniqueFilePaths = new Set();
                draftFiles.forEach(file => {
                  if (file) {
                    const identifier = file.path || file.file_path || file.name || file.file_name;
                    if (identifier && !uniqueFilePaths.has(identifier)) {
                      uniqueFilePaths.add(identifier);
                    }
                  }
                });
                fileCount = uniqueFilePaths.size;
              } else {
                // For regular quotes
                const validFiles = quote.files && quote.files.filter(file => file && file.file_path);
                // Get unique files by path to avoid counting duplicates
                const uniqueFilePaths = new Set();
                const uniqueFiles = validFiles && validFiles.filter(file => {
                  const isDuplicate = uniqueFilePaths.has(file.file_path);
                  if (!isDuplicate) uniqueFilePaths.add(file.file_path);
                  return !isDuplicate;
                });
                fileCount = uniqueFiles ? uniqueFiles.length : 0;
              }
              
              return (
                <>
                  <Icon name="Paperclip" size={14} className={`mr-1 ${fileCount > 0 ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={fileCount > 0 ? "text-blue-600" : "text-gray-400"}>
                    {fileCount > 0 ? t('quotesManagement.table.card.files', { count: fileCount }) : t('quotesManagement.table.card.noFiles')}
                  </span>
                </>
              );
            })()}
          </div>
          
          <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
            {quote.status === 'draft' && !quote.isDraftPlaceholder && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuoteAction('markAsSent', quote)}
                title={t('quotesManagement.table.actions.markAsSent')}
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Icon name="Check" size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuoteAction('edit', quote)}
                              title={t('quotesManagement.table.actions.edit')}
              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Icon name="Edit" size={14} />
            </Button>
            {(!quote.isDraftPlaceholder && quote.status === 'sent') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuoteAction('convert', quote)}
                title={t('quotesManagement.table.actions.convertToInvoice')}
                className="h-7 w-7"
              >
                <Icon name="Receipt" size={14} />
              </Button>
            )}
            {/* Follow-up management icon removed per request */}
            {/* Send reminder icon removed in card view */}
            {/* Sync status and test expiration icons removed per request */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuoteAction('delete', quote)}
              title="Supprimer le devis"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Icon name="Trash" size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Search Bar */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('quotesManagement.table.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{t('quotesManagement.table.view')}</span>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Table" size={14} className="mr-1" />
              {t('quotesManagement.table.tableView')}
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Grid" size={14} className="mr-1" />
              {t('quotesManagement.table.cardView')}
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {t('quotesManagement.table.quotesCount', { count: sortedAndFilteredQuotes.length })}
        </div>
      </div>

      {/* Content */}
      {sortedAndFilteredQuotes.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="FileText" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">{t('quotesManagement.table.noQuotesFound')}</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {searchTerm ? t('quotesManagement.table.noSearchResults') : t('quotesManagement.table.noQuotesMessage')}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSearchTerm('')}
            iconName="RotateCcw"
            iconPosition="left"
          >
            {searchTerm ? t('quotesManagement.table.clearSearch') : t('quotesManagement.table.refresh')}
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'card' && renderCardView()}
        </>
      )}
    </div>
  );
};

export default QuotesTable;