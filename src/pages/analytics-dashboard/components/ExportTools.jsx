import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExportTools = () => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  const exportOptions = [
    {
      type: 'pdf',
      label: 'Rapport PDF',
      description: 'Rapport complet avec graphiques',
      icon: 'FileText',
      color: 'error'
    },
    {
      type: 'excel',
      label: 'Données Excel',
      description: 'Données brutes pour analyse',
      icon: 'Table',
      color: 'success'
    },
    {
      type: 'powerpoint',
      label: 'Présentation PPT',
      description: 'Slides pour présentation',
      icon: 'Presentation',
      color: 'warning'
    },
    {
      type: 'json',
      label: 'Export JSON',
      description: 'Données structurées API',
      icon: 'Code',
      color: 'primary'
    }
  ];

  const handleExport = async (type) => {
    setIsExporting(true);
    setExportType(type);
    setIsExportMenuOpen(false);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real application, you would call the actual export API here
      console.log(`Exporting ${type} format...`);
      
      // Create a mock download
      const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.${type}`;
      
      // You could implement actual file generation here
      // For demo purposes, we'll just show success
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
        disabled={isExporting}
        iconName={isExporting ? "Loader2" : "Download"}
        iconPosition="left"
        className={isExporting ? "animate-pulse" : ""}
      >
        {isExporting ? `Export ${exportType}...` : 'Exporter'}
      </Button>

      <AnimatePresence>
        {isExportMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Options d'export</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExportMenuOpen(false)}
                  iconName="X"
                  className="h-6 w-6 p-0"
                />
              </div>
              
              <div className="space-y-2">
                {exportOptions.map((option) => (
                  <motion.button
                    key={option.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport(option.type)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-${option.color}/10`}>
                      <Icon 
                        name={option.icon} 
                        size={16} 
                        color={`var(--color-${option.color})`} 
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <Icon name="ChevronRight" size={16} color="var(--color-muted-foreground)" />
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Icon name="Info" size={12} />
                  <span>Les exports incluent les données filtrées actuelles</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close menu when clicking outside */}
      {isExportMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExportMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportTools;