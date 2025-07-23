import React from 'react';
import Select from '../../../components/ui/Select';

const FilterToolbar = ({ filters, onFiltersChange }) => {
  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'individual', label: 'Particuliers' },
    { value: 'professional', label: 'Professionnels' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' },
    { value: 'prospect', label: 'Prospects' }
  ];

  const locationOptions = [
    { value: 'all', label: 'Toutes les régions' },
    { value: 'paris', label: 'Île-de-France' },
    { value: 'lyon', label: 'Auvergne-Rhône-Alpes' },
    { value: 'marseille', label: 'PACA' },
    { value: 'other', label: 'Autres régions' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        placeholder="Type de client"
        options={typeOptions}
        value={filters.type}
        onChange={(value) => handleFilterChange('type', value)}
        className="min-w-[150px]"
      />
      
      <Select
        placeholder="Statut"
        options={statusOptions}
        value={filters.status}
        onChange={(value) => handleFilterChange('status', value)}
        className="min-w-[150px]"
      />
      
      <Select
        placeholder="Région"
        options={locationOptions}
        value={filters.location}
        onChange={(value) => handleFilterChange('location', value)}
        className="min-w-[150px]"
      />
    </div>
  );
};

export default FilterToolbar;