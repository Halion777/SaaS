import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const QuotesTable = ({ quotes, selectedQuotes, onSelectQuote, onSelectAll, onQuoteAction, onQuoteSelect }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');

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
    let filtered = quotes.filter(quote => 
      quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else if (sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [quotes, searchTerm, sortConfig]);

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
      viewed: 'bg-amber-100 text-amber-700',
      signed: 'bg-green-100 text-success',
      refused: 'bg-red-100 text-destructive'
    };
    return colors[status] || colors.draft;
  };

  const getStatusText = (status) => {
    const statusMap = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      viewed: 'Consulté',
      signed: 'Signé',
      refused: 'Refusé'
    };
    return statusMap[status] || status;
  };

  const getAIScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-600';
    return 'text-destructive';
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
            <th className="w-12 p-3 md:p-4">
              <Checkbox
                checked={selectedQuotes.length === quotes.length && quotes.length > 0}
                onChange={onSelectAll}
                indeterminate={selectedQuotes.length > 0 && selectedQuotes.length < quotes.length}
                aria-label="Select all quotes"
              />
            </th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">
              <button
                onClick={() => handleSort('number')}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <span>N° Devis</span>
                <Icon 
                  name={sortConfig.key === 'number' ? 
                    (sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown') : 
                    'ChevronsUpDown'
                  } 
                  size={16} 
                />
              </button>
            </th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">
              <button
                onClick={() => handleSort('clientName')}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <span>Client</span>
                <Icon 
                  name={sortConfig.key === 'clientName' ? 
                    (sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown') : 
                    'ChevronsUpDown'
                  } 
                  size={16} 
                />
              </button>
            </th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">Description</th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">
              <button
                onClick={() => handleSort('amount')}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <span>Montant</span>
                <Icon 
                  name={sortConfig.key === 'amount' ? 
                    (sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown') : 
                    'ChevronsUpDown'
                  } 
                  size={16} 
                />
              </button>
            </th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">Statut</th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <span>Date</span>
                <Icon 
                  name={sortConfig.key === 'createdAt' ? 
                    (sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown') : 
                    'ChevronsUpDown'
                  } 
                  size={16} 
                />
              </button>
            </th>
            <th className="text-left p-3 md:p-4 font-medium text-foreground">
              <button
                onClick={() => handleSort('aiScore')}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <span>Score IA</span>
                <Icon 
                  name={sortConfig.key === 'aiScore' ? 
                    (sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown') : 
                    'ChevronsUpDown'
                  } 
                  size={16} 
                />
              </button>
            </th>
            <th className="text-right p-3 md:p-4 font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
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
              <td className="p-3 md:p-4 text-muted-foreground text-sm truncate max-w-[200px]">{quote.description}</td>
              <td className="p-3 md:p-4 font-medium text-foreground">{formatAmount(quote.amount)}</td>
              <td className="p-3 md:p-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-center ${getStatusColor(quote.status)}`}>
                  {getStatusText(quote.status)}
                </span>
              </td>
              <td className="p-3 md:p-4 text-muted-foreground">{formatDate(quote.createdAt)}</td>
              <td className="p-3 md:p-4">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${getAIScoreColor(quote.aiScore)}`}>
                    {quote.aiScore}%
                  </span>
                  <Icon name="Sparkles" size={14} className="text-accent" />
                </div>
              </td>
              <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('edit', quote)}
                    title="Modifier"
                    className="h-8 w-8"
                  >
                    <Icon name="Edit" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('duplicate', quote)}
                    title="Dupliquer"
                    className="h-8 w-8"
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('convert', quote)}
                    title="Convertir en facture"
                    disabled={quote.status !== 'signed'}
                    className="h-8 w-8"
                  >
                    <Icon name="Receipt" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuoteAction('optimize', quote)}
                    title="Optimiser avec IA"
                    className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                  >
                    <Icon name="Sparkles" size={16} />
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
    <div className="p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {sortedAndFilteredQuotes.map((quote) => (
          <div 
            key={quote.id}
            className="bg-card border border-border rounded-lg p-3 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onQuoteSelect(quote)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedQuotes.includes(quote.id)}
                  onChange={() => onSelectQuote(quote.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select quote ${quote.number}`}
                />
                <div>
                  <h3 className="font-medium text-foreground">{quote.number}</h3>
                  <p className="text-sm text-muted-foreground">{quote.clientName}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-center ${getStatusColor(quote.status)}`}>
                {getStatusText(quote.status)}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">{quote.description}</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{formatAmount(quote.amount)}</span>
              <span className="text-muted-foreground">{formatDate(quote.createdAt)}</span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getAIScoreColor(quote.aiScore)}`}>
                  Score IA: {quote.aiScore}%
                </span>
                <Icon name="Sparkles" size={14} className="text-accent" />
              </div>
              
              <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuoteAction('edit', quote)}
                  className="h-8 w-8"
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuoteAction('optimize', quote)}
                  className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                >
                  <Icon name="Sparkles" size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuoteAction('duplicate', quote)}
                  className="h-8 hidden sm:flex"
                >
                  <span className="flex items-center">
                    <Icon name="Copy" size={14} className="mr-1" />
                    Dupliquer
                  </span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
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