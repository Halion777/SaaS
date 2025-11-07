import React, { useMemo } from 'react';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const FilterControls = ({
  dateRange,
  onDateRangeChange,
  selectedSegment,
  onSegmentChange,
  selectedService,
  onServiceChange,
  analyticsData
}) => {
  const dateRangeOptions = [
    { value: 'last7days', label: '7 derniers jours' },
    { value: 'last30days', label: '30 derniers jours' },
    { value: 'last3months', label: '3 derniers mois' },
    { value: 'last6months', label: '6 derniers mois' },
    { value: 'lastyear', label: 'Dernière année' },
    { value: 'all', label: 'Toutes les périodes' }
  ];

  // Get actual client segments from data
  const segmentOptions = useMemo(() => {
    const segments = [{ value: 'all', label: 'Tous les segments' }];
    
    const professionalCount = analyticsData?.clients?.filter(c => c.client_type === 'company').length || 0;
    const individualCount = analyticsData?.clients?.filter(c => c.client_type === 'individual').length || 0;
    
    if (professionalCount > 0) {
      segments.push({ value: 'company', label: `Professionnel (${professionalCount})` });
    }
    if (individualCount > 0) {
      segments.push({ value: 'individual', label: `Particulier (${individualCount})` });
    }
    
    return segments;
  }, [analyticsData]);

  // Get actual service types from quotes
  const serviceOptions = useMemo(() => {
    const categoryLabels = {
      'plumbing': 'Plomberie',
      'electrical': 'Électricité',
      'carpentry': 'Menuiserie',
      'painting': 'Peinture',
      'masonry': 'Maçonnerie',
      'tiling': 'Carrelage',
      'roofing': 'Toiture',
      'heating': 'Chauffage',
      'renovation': 'Rénovation',
      'cleaning': 'Nettoyage',
      'solar': 'Solaire',
      'gardening': 'Jardinage',
      'locksmith': 'Serrurerie',
      'glazing': 'Vitrerie',
      'insulation': 'Isolation',
      'airConditioning': 'Climatisation',
      'other': 'Autre'
    };

    const services = [{ value: 'all', label: 'Tous les services' }];
    const categoryCounts = {};
    
    analyticsData?.quotes?.forEach(quote => {
      const categories = quote.project_categories && quote.project_categories.length > 0
        ? quote.project_categories
        : (quote.custom_category ? [quote.custom_category] : ['other']);
      
      categories.forEach(category => {
        const categoryKey = category.toLowerCase();
        const displayName = categoryLabels[categoryKey] || category || 'Autre';
        categoryCounts[displayName] = (categoryCounts[displayName] || 0) + 1;
      });
    });
    
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        services.push({ value: name.toLowerCase(), label: `${name} (${count})` });
      });
    
    return services;
  }, [analyticsData]);

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
      
    </div>
  );
};

export default FilterControls;