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
  }, [selectedClient, tasks, files, currentStep]);

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
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
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

  const handleSave = (customization) => {
    const quoteData = {
      id: Date.now(),
      number: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      client: selectedClient,
      tasks,
      files,
      customization,
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

  const handleSend = (customization) => {
    const quoteData = {
      id: Date.now(),
      number: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      client: selectedClient,
      tasks,
      files,
      customization,
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
      setSelectedClient(null);
      setTasks([]);
      setFiles([]);
      setCurrentStep(1);
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
      
      <div className="ml-16 lg:ml-72 min-h-screen">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Créer un devis</h1>
              <p className="text-muted-foreground mt-2">
                Remplissez les informations ci-dessous pour générer automatiquement un devis professionnel
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAutoSaving && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="Save" size={16} color="currentColor" className="mr-2" />
                  Sauvegarde automatique...
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={clearDraft}
                iconName="Trash2"
                iconPosition="left"
              >
                Effacer le brouillon
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/quotes-management')}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Retour
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              <StepIndicator currentStep={currentStep} />
              {renderCurrentStep()}
            </div>

            {/* AI Scoring Sidebar */}
            <div className="xl:col-span-1">
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