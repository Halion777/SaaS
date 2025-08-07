import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
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
  const { user } = useAuth();
  const { currentProfile } = useMultiUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projectInfo, setProjectInfo] = useState({
    categories: [],
    customCategory: '',
    deadline: '',
    description: ''
  });
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);

  // Helper function to generate draft key with user and profile IDs
  const getDraftKey = () => {
    return `quote-draft-${user?.id}-${currentProfile?.id || 'default'}`;
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      // Auto-save if there's any data to save
      if (selectedClient || tasks.length > 0 || files.length > 0 || 
          projectInfo.categories.length > 0 || projectInfo.description || projectInfo.deadline) {
        setIsAutoSaving(true);
        const savedTime = new Date().toISOString();
        const quoteData = {
          selectedClient,
          projectInfo,
          tasks,
          files,
          currentStep,
          companyInfo,
          lastSaved: savedTime
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
        setLastSaved(savedTime);
        
        setTimeout(() => {
          setIsAutoSaving(false);
        }, 1500);
      }
    };

    // Auto-save every 15 seconds (more frequent)
    const interval = setInterval(autoSave, 15000);
    
    // Also auto-save immediately when data changes (debounced)
    const timeoutId = setTimeout(autoSave, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [selectedClient, projectInfo, tasks, files, currentStep, companyInfo, user?.id, currentProfile?.id]);

  // Load draft on component mount and when profile changes
  useEffect(() => {
    const savedDraft = localStorage.getItem(getDraftKey());
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setSelectedClient(draftData.selectedClient);
        setProjectInfo(draftData.projectInfo || { categories: [], customCategory: '', deadline: '', description: '' });
        setTasks(draftData.tasks || []);
        setFiles(draftData.files || []);
        setCurrentStep(draftData.currentStep || 1);
        setCompanyInfo(draftData.companyInfo);
        setLastSaved(draftData.lastSaved);
      } catch (error) {
        console.error('Error loading draft:', error);
        // If there's an error loading the draft, clear the form
        clearFormData();
      }
    } else {
      // If no draft exists for this profile, clear the form
      clearFormData();
    }
  }, [user?.id, currentProfile?.id]);

  // Helper function to clear form data
  const clearFormData = () => {
    setSelectedClient(null);
    setProjectInfo({
      categories: [],
      customCategory: '',
      deadline: '',
      description: ''
    });
    setTasks([]);
    setFiles([]);
    setCurrentStep(1);
    setCompanyInfo(null);
    setLastSaved(null);
  };



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
      // Auto-save before moving to next step
      const savedTime = new Date().toISOString();
      const quoteData = {
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: currentStep + 1,
        companyInfo,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Auto-save before moving to previous step
      const savedTime = new Date().toISOString();
      const quoteData = {
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: currentStep - 1,
        companyInfo,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleProjectInfoChange = (newProjectInfo) => {
    setProjectInfo(newProjectInfo);
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
    const existingQuotes = JSON.parse(localStorage.getItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`) || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`, JSON.stringify(existingQuotes));

    // Clear draft
    localStorage.removeItem(getDraftKey());

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
    const existingQuotes = JSON.parse(localStorage.getItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`) || '[]');
    existingQuotes.push(quoteData);
    localStorage.setItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`, JSON.stringify(existingQuotes));

    // Clear draft
    localStorage.removeItem(getDraftKey());

    // Show success message and redirect
    alert(`Devis envoyé avec succès à ${selectedClient?.label?.split(' - ')[0]} !`);
    navigate('/quotes-management');
  };

  const handleStepChange = (newStep) => {
    // Validation functions matching the component validation logic
    const isStep1Valid = () => {
      // Check if a client is selected (either existing or new)
      const isClientValid = selectedClient;

      // Check if project information is complete
      const isProjectValid = 
        projectInfo.categories && 
        projectInfo.categories.length > 0 &&
        projectInfo.deadline &&
        projectInfo.description &&
        projectInfo.description.trim().length > 0;

      // If "autre" category is selected, custom category must be filled
      const isCustomCategoryValid = !projectInfo.categories?.includes('autre') || 
        (projectInfo.customCategory && projectInfo.customCategory.trim().length > 0);

      return isClientValid && isProjectValid && isCustomCategoryValid;
    };

    const isStep2Valid = () => {
      return tasks.length > 0;
    };

    // Validate step change based on comprehensive validation
    let canProceed = false;
    
    if (newStep <= currentStep) {
      // Can always go back or stay on current step
      canProceed = true;
    } else if (newStep === 2) {
      canProceed = isStep1Valid();
    } else if (newStep === 3) {
      canProceed = isStep1Valid() && isStep2Valid();
    } else if (newStep === 4) {
      canProceed = isStep1Valid() && isStep2Valid();
    }

    if (canProceed) {
      // Auto-save before changing step
      const savedTime = new Date().toISOString();
      const quoteData = {
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: newStep,
        companyInfo,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      setCurrentStep(newStep);
    } else {
      // Show specific validation error message
      let errorMessage = 'Veuillez remplir les informations requises avant de passer à l\'étape suivante.';
      
      if (newStep === 2 && !isStep1Valid()) {
        if (!selectedClient) {
          errorMessage = 'Veuillez sélectionner un client.';
        } else if (!projectInfo.categories || projectInfo.categories.length === 0) {
          errorMessage = 'Veuillez sélectionner au moins une catégorie de projet.';
        } else if (!projectInfo.deadline) {
          errorMessage = 'Veuillez définir une date limite pour le projet.';
        } else if (!projectInfo.description || projectInfo.description.trim().length === 0) {
          errorMessage = 'Veuillez décrire le projet.';
        } else if (projectInfo.categories.includes('autre') && (!projectInfo.customCategory || projectInfo.customCategory.trim().length === 0)) {
          errorMessage = 'Veuillez spécifier la catégorie personnalisée.';
        }
      } else if (newStep === 3 && !isStep2Valid()) {
        errorMessage = 'Veuillez ajouter au moins une tâche avant de continuer.';
      }
      
      alert(errorMessage);
    }
  };

  const clearDraft = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer ce brouillon ?')) {
      localStorage.removeItem(getDraftKey());
      localStorage.removeItem('quote-signature-data');
      localStorage.removeItem(`company-info-${user?.id}-${currentProfile?.id || 'default'}`);
      clearFormData();
    }
  };



  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientSelection
            selectedClient={selectedClient}
            projectInfo={projectInfo}
            onClientSelect={handleClientSelect}
            onProjectInfoChange={handleProjectInfoChange}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <TaskDefinition
            tasks={tasks}
            projectCategory={projectInfo.categories}
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
                  <div className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                    <Icon name="Save" size={14} className="sm:w-4 sm:h-4 mr-2 animate-pulse" />
                    Sauvegarde automatique...
                  </div>
              )}
              {lastSaved && !isAutoSaving && (
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 mr-2 text-green-500" />
                    Sauvegardé {new Date(lastSaved).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
              <StepIndicator 
                currentStep={currentStep} 
                onStepChange={handleStepChange} 
              />
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