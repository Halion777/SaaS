import React, { useState } from 'react';
import Button from '../../../components/ui/Button';


const ExportControls = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // Simulate PDF generation
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock PDF download
      const element = document.createElement('a');
      element.href = 'data:application/pdf;base64,';
      element.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    // Simulate Excel generation
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a mock Excel download
      const element = document.createElement('a');
      element.href = 'data:application/vnd.ms-excel;base64,';
      element.download = `analytics-data-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        iconName="Printer"
        iconPosition="left"
      >
        <span className="hidden sm:inline">Imprimer</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isExporting}
        iconName={isExporting ? "Loader2" : "Download"}
        iconPosition="left"
        className={isExporting ? "animate-pulse" : ""}
      >
        <span className="hidden sm:inline">Excel</span>
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExporting}
        iconName={isExporting ? "Loader2" : "FileText"}
        iconPosition="left"
        className={isExporting ? "animate-pulse" : ""}
      >
        <span className="hidden sm:inline">
          {isExporting ? 'Export...' : 'PDF'}
        </span>
      </Button>
    </div>
  );
};

export default ExportControls;