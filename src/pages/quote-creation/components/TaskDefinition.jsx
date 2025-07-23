import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import VoiceInput from '../../../components/VoiceInput';
import { generateTaskDescription } from '../../../services/openaiService';

const TaskDefinition = ({ tasks, onTasksChange, onNext, onPrevious }) => {
  const [currentTask, setCurrentTask] = useState({
    description: '',
    duration: '',
    price: '',
    materials: []
  });
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: '', price: '' });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const durationOptions = [
    { value: '0.5', label: '30 minutes' },
    { value: '1', label: '1 heure' },
    { value: '2', label: '2 heures' },
    { value: '4', label: '4 heures' },
    { value: '8', label: '1 jour' },
    { value: '16', label: '2 jours' },
    { value: '24', label: '3 jours' },
    { value: '40', label: '1 semaine' },
    { value: 'custom', label: 'Durée personnalisée' }
  ];

  const unitOptions = [
    { value: 'pièce', label: 'Pièce' },
    { value: 'm', label: 'Mètre' },
    { value: 'm²', label: 'Mètre carré' },
    { value: 'kg', label: 'Kilogramme' },
    { value: 'l', label: 'Litre' },
    { value: 'boîte', label: 'Boîte' },
    { value: 'sac', label: 'Sac' }
  ];

  const handleVoiceTranscription = async (transcription) => {
    if (transcription) {
      setIsGenerating(true);
      setIsVoiceActive(false);
      try {
        // Enhanced prompt for better AI task generation
        const enhancedPrompt = `Créez une description détaillée pour cette tâche: "${transcription}". 
        Incluez les spécifications techniques, les étapes de réalisation, et estimez les matériaux nécessaires.`;
        
        const aiResponse = await generateTaskDescription(enhancedPrompt);
        setCurrentTask(prev => ({
          ...prev,
          description: aiResponse.description,
          duration: aiResponse.estimatedDuration || prev.duration,
          materials: [
            ...prev.materials,
            ...aiResponse.suggestedMaterials?.map(mat => ({
              id: Date.now() + Math.random(),
              name: mat.name,
              quantity: mat.quantity,
              unit: mat.unit,
              price: 0
            })) || []
          ]
        }));
      } catch (error) {
        console.error('AI generation error:', error);
        // Fallback: use the transcription directly
        setCurrentTask(prev => ({ ...prev, description: transcription }));
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleTaskChange = (field, value) => {
    setCurrentTask(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (field, value) => {
    setNewMaterial(prev => ({ ...prev, [field]: value }));
  };

  const addMaterial = () => {
    if (newMaterial.name && newMaterial.quantity && newMaterial.unit) {
      const material = {
        id: Date.now(),
        ...newMaterial,
        price: parseFloat(newMaterial.price) || 0
      };
      setCurrentTask(prev => ({
        ...prev,
        materials: [...prev.materials, material]
      }));
      setNewMaterial({ name: '', quantity: '', unit: '', price: '' });
    }
  };

  const removeMaterial = (materialId) => {
    setCurrentTask(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }));
  };

  const addTask = () => {
    if (currentTask.description && currentTask.duration && currentTask.price) {
      const task = {
        id: Date.now(),
        ...currentTask,
        price: parseFloat(currentTask.price)
      };
      onTasksChange([...tasks, task]);
      setCurrentTask({ description: '', duration: '', price: '', materials: [] });
    }
  };

  const removeTask = (taskId) => {
    onTasksChange(tasks.filter(t => t.id !== taskId));
  };

  const generateAIDescription = async () => {
    if (!currentTask.description) return;
    
    setIsGenerating(true);
    try {
      const enhancedPrompt = `Améliorez et détaillez cette description de tâche: "${currentTask.description}". 
      Ajoutez des spécifications techniques professionnelles et des recommandations d'optimisation.`;
      
      const aiResponse = await generateTaskDescription(enhancedPrompt);
      setCurrentTask(prev => ({
        ...prev,
        description: aiResponse.description,
        duration: aiResponse.estimatedDuration || prev.duration,
        materials: [
          ...prev.materials,
          ...aiResponse.suggestedMaterials?.map(mat => ({
            id: Date.now() + Math.random(),
            name: mat.name,
            quantity: mat.quantity,
            unit: mat.unit,
            price: 0
          })) || []
        ]
      }));
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPrice = tasks.reduce((sum, task) => {
    const taskTotal = task.price + task.materials.reduce((matSum, mat) => matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + taskTotal;
  }, 0);

  const isFormValid = tasks.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Wrench" size={24} color="var(--color-primary)" className="mr-3" />
          Définition des tâches avec assistance IA
        </h2>
        
        <div className="space-y-6">
          {/* Enhanced Task Form with Voice Integration */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h3 className="font-medium text-foreground mb-4 flex items-center justify-between">
              Nouvelle tâche
              <div className="flex space-x-2">
                <VoiceInput
                  onTranscription={handleVoiceTranscription}
                  disabled={isGenerating}
                  onRecordingStart={() => setIsVoiceActive(true)}
                  onRecordingStop={() => setIsVoiceActive(false)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  iconName="Sparkles"
                  iconPosition="left"
                  className={showAIAssistant ? "bg-primary/10 text-primary" : ""}
                >
                  Assistant IA
                </Button>
              </div>
            </h3>
            
            {/* Voice Status Indicator */}
            {isVoiceActive && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <Icon name="Mic" size={16} color="var(--color-primary)" />
                  <span className="text-sm text-primary font-medium">
                    Parlez maintenant... L'IA va générer une description complète de votre tâche
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Conseil: Décrivez précisément la tâche, les matériaux nécessaires et les spécifications techniques
                </p>
              </div>
            )}

            {/* AI Processing Indicator */}
            {isGenerating && (
              <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name="Brain" size={16} color="var(--color-success)" className="animate-pulse" />
                  <span className="text-sm text-success font-medium">
                    L'IA génère une description professionnelle...
                  </span>
                </div>
                <div className="mt-2 flex space-x-1">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="w-2 h-2 bg-success rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Description de la tâche"
                  type="text"
                  placeholder="Décrivez la tâche à réaliser ou utilisez la dictée vocale pour une description IA complète..."
                  value={currentTask.description}
                  onChange={(e) => handleTaskChange('description', e.target.value)}
                  description="Utilisez la dictée vocale pour une génération automatique par IA"
                  disabled={isGenerating}
                  className={isVoiceActive ? "border-primary bg-primary/5" : ""}
                />
                
                {currentTask.description && !isGenerating && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIDescription}
                    disabled={isGenerating}
                    iconName="Sparkles"
                    iconPosition="left"
                    className="bg-gradient-to-r from-primary/10 to-success/10 hover:from-primary/20 hover:to-success/20"
                  >
                    Améliorer avec IA
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Durée estimée"
                  placeholder="Sélectionner la durée"
                  options={durationOptions}
                  value={currentTask.duration}
                  onChange={(value) => handleTaskChange('duration', value)}
                />
                <Input
                  label="Prix (€)"
                  type="number"
                  placeholder="0.00"
                  value={currentTask.price}
                  onChange={(e) => handleTaskChange('price', e.target.value)}
                  description="Prix hors matériaux"
                />
              </div>
              
              {/* Enhanced Materials Section */}
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Icon name="Package" size={16} color="var(--color-primary)" className="mr-2" />
                  Matériaux nécessaires
                  {currentTask.materials.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {currentTask.materials.length} matériau{currentTask.materials.length > 1 ? 'x' : ''}
                    </span>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <Input
                    label="Nom du matériau"
                    type="text"
                    placeholder="Ex: Tuyau PVC"
                    value={newMaterial.name}
                    onChange={(e) => handleMaterialChange('name', e.target.value)}
                  />
                  <Input
                    label="Quantité"
                    type="number"
                    placeholder="1"
                    value={newMaterial.quantity}
                    onChange={(e) => handleMaterialChange('quantity', e.target.value)}
                  />
                  <Select
                    label="Unité"
                    placeholder="Unité"
                    options={unitOptions}
                    value={newMaterial.unit}
                    onChange={(value) => handleMaterialChange('unit', value)}
                  />
                  <div className="flex items-end space-x-2">
                    <Input
                      label="Prix unitaire (€)"
                      type="number"
                      placeholder="0.00"
                      value={newMaterial.price}
                      onChange={(e) => handleMaterialChange('price', e.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={addMaterial}
                      disabled={!newMaterial.name || !newMaterial.quantity || !newMaterial.unit}
                      iconName="Plus"
                    />
                  </div>
                </div>
                
                {currentTask.materials.length > 0 && (
                  <div className="space-y-2">
                    {currentTask.materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-background border border-border rounded">
                        <div className="flex-1">
                          <span className="font-medium">{material.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {material.quantity} {material.unit} × {material.price}€ = {(material.quantity * material.price).toFixed(2)}€
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(material.id)}
                          iconName="Trash2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                onClick={addTask}
                disabled={!currentTask.description || !currentTask.duration || !currentTask.price}
                iconName="Plus"
                iconPosition="left"
                fullWidth
                className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90"
              >
                Ajouter cette tâche
              </Button>
            </div>
          </div>
          
          {/* Enhanced Tasks List */}
          {tasks.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-4 flex items-center">
                <Icon name="CheckSquare" size={20} color="var(--color-success)" className="mr-2" />
                Tâches ajoutées ({tasks.length})
              </h3>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const taskMaterialsTotal = task.materials.reduce((sum, mat) => sum + (mat.price * parseFloat(mat.quantity)), 0);
                  const taskTotal = task.price + taskMaterialsTotal;
                  
                  return (
                    <div key={task.id} className="p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{task.description}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Icon name="Clock" size={14} />
                              <span>Durée: {task.duration}h</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Icon name="User" size={14} />
                              <span>Main d'œuvre: {task.price}€</span>
                            </span>
                            {taskMaterialsTotal > 0 && (
                              <span className="flex items-center space-x-1">
                                <Icon name="Package" size={14} />
                                <span>Matériaux: {taskMaterialsTotal.toFixed(2)}€</span>
                              </span>
                            )}
                            <span className="font-medium text-foreground">Total: {taskTotal.toFixed(2)}€</span>
                          </div>
                          {task.materials.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Matériaux:</p>
                              <div className="flex flex-wrap gap-2">
                                {task.materials.map((material) => (
                                  <span key={material.id} className="text-xs bg-muted px-2 py-1 rounded">
                                    {material.name} ({material.quantity} {material.unit})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(task.id)}
                          iconName="Trash2"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total du devis:</span>
                  <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Étape précédente
        </Button>
        <Button
          onClick={onNext}
          disabled={!isFormValid}
          iconName="ArrowRight"
          iconPosition="right"
        >
          Étape suivante
        </Button>
      </div>
    </div>
  );
};

export default TaskDefinition;