import React from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const FilterControls = ({
  dateRange,
  onDateRangeChange,
  selectedSegment,
  onSegmentChange,
  selectedService,
  onServiceChange
}) => {
  const dateRangeOptions = [
    { value: 'last7days', label: '7 derniers jours' },
    { value: 'last30days', label: '30 derniers jours' },
    { value: 'last3months', label: '3 derniers mois' },
    { value: 'last6months', label: '6 derniers mois' },
    { value: 'lastyear', label: 'Dernière année' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  const segmentOptions = [
    { value: 'all', label: 'Tous les segments' },
    { value: 'residential', label: 'Résidentiel' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industriel' }
  ];

  const serviceOptions = [
    { value: 'all', label: 'Tous les services' },
    { value: 'plumbing', label: 'Plomberie' },
    { value: 'electrical', label: 'Électricité' },
    { value: 'renovation', label: 'Rénovation' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
        <Icon name="Filter" size={18} className="sm:w-5 sm:h-5" color="var(--color-muted-foreground)" />
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Filtres d'analyse</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Select
          label="Période d'analyse"
          placeholder="Sélectionner une période"
          options={dateRangeOptions}
          value={dateRange}
          onChange={onDateRangeChange}
        />
        
        <Select
          label="Segment client"
          placeholder="Tous les segments"
          options={segmentOptions}
          value={selectedSegment}
          onChange={onSegmentChange}
        />
        
        <Select
          label="Type de service"
          placeholder="Tous les services"
          options={serviceOptions}
          value={selectedService}
          onChange={onServiceChange}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
          <Icon name="Clock" size={14} className="sm:w-4 sm:h-4" />
          <span>Dernière mise à jour: il y a 5 minutes</span>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;