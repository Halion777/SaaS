import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import StepIndicator from './components/StepIndicator';
import ClientSelection from './components/ClientSelection';
import TaskDefinition from './components/TaskDefinition';
import FileUpload from './components/FileUpload';
import QuotePreview from './components/QuotePreview';
import AIScoring from './components/AIScoring';

const QuoteCreation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      if (selectedClient || tasks.length > 0 || files.length > 0) {
        setIsAutoSaving(true);
        const quoteData = {
          selectedClient,
          tasks,
          files,
          currentStep,
          companyInfo,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('quote-draft', JSON.stringify(quoteData));
        
        setTimeout(() => {
          setIsAutoSaving(false);
        }, 1000);
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [selectedClient, tasks, files, currentStep, companyInfo]);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('quote-draft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setSelectedClient(draftData.selectedClient);
        setTasks(draftData.tasks || []);
        setFiles(draftData.files || []);
        setCurrentStep(draftData.currentStep || 1);
        setCompanyInfo(draftData.companyInfo);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Handle sidebar offset and responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      setIsMobile(isMobile);
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleTasksChange = (newTasks) => {
    setTasks(newTasks);
  };

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
  };

  const handleSave = (data) => {
    const quoteData = {
      id: Date.now(),
      number: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      client: selectedClient,
      tasks,
      files,
      customization: data.customization,
      financialConfig: data.financialConfig,
      companyInfo: data.companyInfo,
      status: 'draft',
      createdAt: new Date().toISOString(),
      totalAmount: tasks.reduce((sum, task) => {
        const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
          matSum + (mat.price * parseFloat(mat.quantity)), 0);
        return sum + task.price + taskMaterialsTotal;
      }, 0)
    };

    // Save to localStorage (in real app, this would be an API call)
    const existingQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem('quotes', JSON.stringify(existingQuotes));

    // Clear draft
    localStorage.removeItem('quote-draft');

    // Show success message and redirect
    alert('Devis sauvegardé avec succès !');
    navigate('/quotes-management');
  };

  const handleSend = (data) => {
    const quoteData = {
      id: Date.now(),
      number: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      client: selectedClient,
      tasks,
      files,
      customization: data.customization,
      financialConfig: data.financialConfig,
      companyInfo: data.companyInfo,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      totalAmount: tasks.reduce((sum, task) => {
        const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
          matSum + (mat.price * parseFloat(mat.quantity)), 0);
        return sum + task.price + taskMaterialsTotal;
      }, 0)
    };

    // Save to localStorage (in real app, this would be an API call)
    const existingQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem('quotes', JSON.stringify(existingQuotes));

    // Clear draft
    localStorage.removeItem('quote-draft');

    // Show success message and redirect
    alert(`Devis envoyé avec succès à ${selectedClient?.label?.split(' - ')[0]} !`);
    navigate('/quotes-management');
  };

  const clearDraft = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer ce brouillon ?')) {
      localStorage.removeItem('quote-draft');
      localStorage.removeItem('quote-signature-data');
      localStorage.removeItem('company-info');
      setSelectedClient(null);
      setTasks([]);
      setFiles([]);
      setCurrentStep(1);
      setCompanyInfo(null);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientSelection
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <TaskDefinition
            tasks={tasks}
            onTasksChange={handleTasksChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <FileUpload
            files={files}
            onFilesChange={handleFilesChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <QuotePreview
            selectedClient={selectedClient}
            tasks={tasks}
            files={files}
            onPrevious={handlePrevious}
            onSave={handleSave}
            onSend={handleSend}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div 
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
          transition: 'margin-left 0.3s ease-out'
        }}
        className="min-h-screen pt-4 md:pt-0"
      >
        <div className="container mx-auto px-4 sm:px-6 pt-0 pb-4 sm:pb-8 max-w-7xl">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <div className="flex items-center">
                  <Icon name="FileText" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Créer un devis</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Remplissez les informations ci-dessous pour générer automatiquement un devis professionnel
              </p>
            </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
              {isAutoSaving && (
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Icon name="Save" size={14} className="sm:w-4 sm:h-4 mr-2" />
                  Sauvegarde automatique...
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={clearDraft}
                iconName="Trash2"
                iconPosition="left"
                  size="sm"
                  className="w-auto"
              >
                  <span className="hidden sm:inline">Effacer le brouillon</span>
                  <span className="sm:hidden">Effacer</span>
              </Button>
              

              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              <StepIndicator currentStep={currentStep} />
              {renderCurrentStep()}
            </div>

            {/* AI Scoring Sidebar */}
            <div className="lg:col-span-1">
              <AIScoring
                selectedClient={selectedClient}
                tasks={tasks}
                currentStep={currentStep}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteCreation;