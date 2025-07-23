import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const QuotesTable = ({ quotes, selectedQuotes, onSelectQuote, onSelectAll, onQuoteAction, onQuoteSelect }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAndFilteredQuotes = useMemo(() => {
    let filtered = quotes.filter(quote => 
      quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      draft: 'text-muted-foreground bg-muted',
      sent: 'text-blue-700 bg-blue-100',
      viewed: 'text-amber-700 bg-amber-100',
      signed: 'text-success bg-green-100',
      refused: 'text-destructive bg-red-100'
    };
    return colors[status] || colors.draft;
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

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <Input
          type="search"
          placeholder="Rechercher par numéro, client ou statut..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={selectedQuotes.length === quotes.length && quotes.length > 0}
                  onChange={onSelectAll}
                  indeterminate={selectedQuotes.length > 0 && selectedQuotes.length < quotes.length}
                />
              </th>
              <th className="text-left p-4 font-medium text-foreground">
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
              <th className="text-left p-4 font-medium text-foreground">
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
              <th className="text-left p-4 font-medium text-foreground">
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
              <th className="text-left p-4 font-medium text-foreground">Statut</th>
              <th className="text-left p-4 font-medium text-foreground">
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
              <th className="text-left p-4 font-medium text-foreground">Score IA</th>
              <th className="text-right p-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredQuotes.map((quote) => (
              <tr 
                key={quote.id} 
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onQuoteSelect(quote)}
              >
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedQuotes.includes(quote.id)}
                    onChange={() => onSelectQuote(quote.id)}
                  />
                </td>
                <td className="p-4 font-medium text-foreground">{quote.number}</td>
                <td className="p-4 text-foreground">{quote.clientName}</td>
                <td className="p-4 font-medium text-foreground">{formatAmount(quote.amount)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {quote.status === 'draft' && 'Brouillon'}
                    {quote.status === 'sent' && 'Envoyé'}
                    {quote.status === 'viewed' && 'Consulté'}
                    {quote.status === 'signed' && 'Signé'}
                    {quote.status === 'refused' && 'Refusé'}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{formatDate(quote.createdAt)}</td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${getAIScoreColor(quote.aiScore)}`}>
                      {quote.aiScore}%
                    </span>
                    <Icon name="Sparkles" size={14} color="var(--color-accent)" />
                  </div>
                </td>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('edit', quote)}
                      title="Modifier"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('duplicate', quote)}
                      title="Dupliquer"
                    >
                      <Icon name="Copy" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('convert', quote)}
                      title="Convertir en facture"
                      disabled={quote.status !== 'signed'}
                    >
                      <Icon name="Receipt" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuoteAction('optimize', quote)}
                      title="Optimiser avec IA"
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {sortedAndFilteredQuotes.map((quote) => (
          <div 
            key={quote.id}
            className="bg-card border border-border rounded-lg p-4 space-y-3 hover:shadow-professional transition-shadow cursor-pointer"
            onClick={() => onQuoteSelect(quote)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedQuotes.includes(quote.id)}
                  onChange={() => onSelectQuote(quote.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <h3 className="font-medium text-foreground">{quote.number}</h3>
                  <p className="text-sm text-muted-foreground">{quote.clientName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                {quote.status === 'draft' && 'Brouillon'}
                {quote.status === 'sent' && 'Envoyé'}
                {quote.status === 'viewed' && 'Consulté'}
                {quote.status === 'signed' && 'Signé'}
                {quote.status === 'refused' && 'Refusé'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{formatAmount(quote.amount)}</span>
              <span className="text-muted-foreground">{formatDate(quote.createdAt)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getAIScoreColor(quote.aiScore)}`}>
                  Score IA: {quote.aiScore}%
                </span>
                <Icon name="Sparkles" size={14} color="var(--color-accent)" />
              </div>
              
              <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuoteAction('edit', quote)}
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuoteAction('optimize', quote)}
                >
                  <Icon name="Sparkles" size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedAndFilteredQuotes.length === 0 && (
        <div className="p-8 text-center">
          <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun devis trouvé</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Aucun devis ne correspond à votre recherche.' : 'Vous n\'avez pas encore créé de devis.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotesTable;