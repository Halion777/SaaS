import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const QuotesTable = ({ quotes, selectedQuotes, onSelectQuote, onSelectAll, onQuoteAction, onQuoteSelect, viewMode = 'table', setViewMode = () => {}, searchTerm = '', setSearchTerm = () => {} }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

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

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-success',
      rejected: 'bg-red-100 text-destructive',
      expired: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.draft;
  };

  const getStatusText = (status) => {
    const statusMap = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré'
    };
    return statusMap[status] || status;
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
                <span>Numéro</span>
                {sortConfig.key === 'number' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('clientName')}>
              <div className="flex items-center space-x-1">
                <span>Client</span>
                {sortConfig.key === 'clientName' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('amount')}>
              <div className="flex items-center space-x-1">
                <span>Montant</span>
                {sortConfig.key === 'amount' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
              <div className="flex items-center space-x-1">
                <span>Statut</span>
                {sortConfig.key === 'status' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('createdAt')}>
              <div className="flex items-center space-x-1">
                <span>Créé le</span>
                {sortConfig.key === 'createdAt' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('validUntil')}>
              <div className="flex items-center space-x-1">
                <span>Valide jusqu'au</span>
                {sortConfig.key === 'validUntil' && (
                  <Icon name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                )}
              </div>
            </th>
            <th className="p-3 md:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">
              Relances
            </th>
            <th className="p-3 md:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">
              Actions
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-center ${getStatusColor(quote.status)}`}>
                  {getStatusText(quote.status)}
                </span>
              </td>
              <td className="p-3 md:p-4 text-muted-foreground">{formatDate(quote.createdAt)}</td>
              <td className="p-3 md:p-4 text-foreground">{quote.validUntil ? formatDate(quote.validUntil) : '-'}</td>
              <td className="p-3 md:p-4">
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-center ${quote.followUpStatusColor || 'bg-gray-100 text-gray-700'}`}>
                    {quote.followUpStatusLabel || 'Aucune'}
                  </span>
                  {quote.followUpMeta && (
                    <span className="text-[10px] text-muted-foreground">
                      {quote.followUpMeta.stage ? `Étape ${quote.followUpMeta.stage}` : ''}
                      {quote.followUpMeta.dueAt ? `${quote.followUpMeta.stage ? ' • ' : ''}${new Date(quote.followUpMeta.dueAt).toLocaleString('fr-FR')}` : ''}
                      {quote.followUpMeta.lastError && quote.followUpStatus === 'failed' ? ` • ${quote.followUpMeta.lastError.substring(0, 40)}` : ''}
                      {quote.followUpMeta.maxAttempts && quote.followUpMeta.attempts >= quote.followUpMeta.maxAttempts ? ' • épuisé' : ''}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  {quote.status === 'draft' && !quote.isDraftPlaceholder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('markAsSent', quote)}
                      title="Marquer comme envoyé"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Icon name="Check" size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('edit', quote)}
                    title="Modifier"
                    className="h-8 w-8"
                  >
                    <Icon name="Edit" size={16} />
                  </Button>
                  {(!quote.isDraftPlaceholder && quote.status === 'sent') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('convert', quote)}
                      title="Convertir en facture"
                      className="h-8 w-8"
                    >
                      <Icon name="Receipt" size={16} />
                    </Button>
                  )}
                  {!quote.isDraftPlaceholder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('followup', quote)}
                      title="Gérer les relances"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Icon name="MessageCircle" size={16} />
                    </Button>
                  )}
                  {/* Send reminder icon removed: manage via Follow-up panel */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('delete', quote)}
                    title="Supprimer le devis"
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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                {getStatusText(quote.status)}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${quote.followUpStatusColor || 'bg-gray-100 text-gray-700'}`}>
                {quote.followUpStatusLabel || 'Aucune'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">{quote.amountFormatted}</span>
            <div className="text-xs text-muted-foreground">Valide jusqu'au {quote.validUntil ? formatDate(quote.validUntil) : '-'}</div>
          </div>
          
          <div className="text-xs text-muted-foreground mb-3">
            Créé le {formatDate(quote.createdAt)}
          </div>
          
            <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
            {quote.status === 'draft' && !quote.isDraftPlaceholder && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuoteAction('markAsSent', quote)}
                title="Marquer comme envoyé"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Icon name="Check" size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuoteAction('edit', quote)}
              title="Modifier le devis"
              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Icon name="Edit" size={14} />
            </Button>
            {(!quote.isDraftPlaceholder && quote.status === 'sent') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuoteAction('convert', quote)}
                title="Convertir en facture"
                className="h-7 w-7"
              >
                <Icon name="Receipt" size={14} />
              </Button>
            )}
            {!quote.isDraftPlaceholder && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuoteAction('followup', quote)}
                title="Gérer les relances"
                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Icon name="MessageCircle" size={14} />
              </Button>
            )}
            {/* Send reminder icon removed in card view */}
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
            placeholder="Rechercher par numéro, client, description ou statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Vue:</span>
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
              Tableau
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
              Cartes
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {sortedAndFilteredQuotes.length} devis(s)
        </div>
      </div>

      {/* Content */}
      {sortedAndFilteredQuotes.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="FileText" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun devis trouvé</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {searchTerm ? 'Aucun devis ne correspond à votre recherche.' : 'Vous n\'avez pas encore créé de devis.'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSearchTerm('')}
            iconName="RotateCcw"
            iconPosition="left"
          >
            {searchTerm ? 'Effacer la recherche' : 'Actualiser'}
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