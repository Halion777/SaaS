import React from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FilterToolbar = ({ filters, onFiltersChange, filteredCount = 0 }) => {
  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'quote', label: 'Devis' },
    { value: 'invoice', label: 'Factures' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Toutes les priorités' },
    { value: 'high', label: 'Haute' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Basse' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'scheduled', label: 'Programmée' },
    { value: 'completed', label: 'Terminée' }
  ];

  const daysOptions = [
    { value: 'all', label: 'Tous les délais' },
    { value: '0-2', label: '0-2 jours' },
    { value: '3-5', label: '3-5 jours' },
    { value: '6-10', label: '6-10 jours' },
    { value: '10+', label: '10+ jours' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    onFiltersChange({
      type: 'all',
      priority: 'all',
      status: 'all',
      days: 'all'
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.priority !== 'all' || filters.status !== 'all' || filters.days !== 'all';

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Type</label>
          <Select
            placeholder="Tous les types"
            options={typeOptions}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
          />
        </div>
        
        {/* Priority Filter */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Priorité</label>
          <Select
            placeholder="Toutes les priorités"
            options={priorityOptions}
            value={filters.priority}
            onChange={(value) => handleFilterChange('priority', value)}
          />
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Statut</label>
          <Select
            placeholder="Tous les statuts"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
          />
        </div>

        {/* Days Filter */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Délai</label>
          <Select
            placeholder="Tous les délais"
            options={daysOptions}
            value={filters.days}
            onChange={(value) => handleFilterChange('days', value)}
          />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-border gap-2 sm:gap-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {filteredCount} relance(s) trouvée(s)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleReset}
              iconName="X"
              iconPosition="left"
              className="h-8 sm:h-9"
            >
              Effacer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar; 