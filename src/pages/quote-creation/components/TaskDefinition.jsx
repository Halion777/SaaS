import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import VoiceInput from '../../../components/VoiceInput';
import { generateTaskDescription } from '../../../services/openaiService';

const TaskDefinition = ({ tasks, onTasksChange, onNext, onPrevious, projectCategory }) => {
  const [currentTask, setCurrentTask] = useState({
    description: '',
    duration: '',
    price: '',
    materials: [],
    hourlyRate: '',
    pricingType: 'flat'
  });
  const [editingPredefinedTask, setEditingPredefinedTask] = useState(null);
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: '', price: '' });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  // Remove selectedCategories state
  // const [selectedCategories, setSelectedCategories] = useState([]);

  // Predefined tasks based on category
  const predefinedTasksByCategory = {
    plomberie: [
      {
        id: 'plomb-1',
        title: 'Installation robinetterie',
        description: 'Installation complète d\'une robinetterie avec raccordement',
        duration: '120',
        price: 120,
        icon: 'Droplet'
      },
      {
        id: 'plomb-2',
        title: 'Réparation fuite',
        description: 'Diagnostic et réparation d\'une fuite d\'eau',
        duration: '90',
        price: 80,
        icon: 'AlertTriangle'
      },
      {
        id: 'plomb-3',
        title: 'Installation chauffe-eau',
        description: 'Installation d\'un chauffe-eau électrique ou thermodynamique',
        duration: '240',
        price: 200,
        icon: 'Thermometer'
      },
      {
        id: 'plomb-4',
        title: 'Débouchage canalisation',
        description: 'Débouchage de canalisation bouchée',
        duration: '60',
        price: 60,
        icon: 'Zap'
      },
      {
        id: 'plomb-5',
        title: 'Installation WC',
        description: 'Installation complète d\'un WC avec raccordement',
        duration: '180',
        price: 150,
        icon: 'Home'
      },
      {
        id: 'plomb-6',
        title: 'Installation douche/baignoire',
        description: 'Installation d\'une douche ou baignoire avec robinetterie',
        duration: '240',
        price: 180,
        icon: 'Droplets'
      }
    ],
    electricite: [
      {
        id: 'elec-1',
        title: 'Installation prise électrique',
        description: 'Installation d\'une prise électrique standard',
        duration: '30',
        price: 45,
        icon: 'Zap'
      },
      {
        id: 'elec-2',
        title: 'Installation interrupteur',
        description: 'Installation d\'un interrupteur simple ou double',
        duration: '30',
        price: 40,
        icon: 'ToggleLeft'
      },
      {
        id: 'elec-3',
        title: 'Installation luminaire',
        description: 'Installation d\'un luminaire au plafond ou au mur',
        duration: '60',
        price: 60,
        icon: 'Lightbulb'
      },
      {
        id: 'elec-4',
        title: 'Mise aux normes électrique',
        description: 'Mise aux normes d\'une installation électrique',
        duration: '480',
        price: 400,
        icon: 'Shield'
      },
      {
        id: 'elec-5',
        title: 'Installation tableau électrique',
        description: 'Installation ou remplacement d\'un tableau électrique',
        duration: '360',
        price: 300,
        icon: 'Settings'
      },
      {
        id: 'elec-6',
        title: 'Installation système d\'alarme',
        description: 'Installation d\'un système d\'alarme complet',
        duration: '4',
        price: 250,
        icon: 'Bell'
      }
    ],
    menuiserie: [
      {
        id: 'menu-1',
        title: 'Installation porte',
        description: 'Installation d\'une porte intérieure ou extérieure',
        duration: '3',
        price: 120,
        icon: 'DoorOpen'
      },
      {
        id: 'menu-2',
        title: 'Installation fenêtre',
        description: 'Installation d\'une fenêtre PVC, bois ou alu',
        duration: '4',
        price: 200,
        icon: 'Window'
      },
      {
        id: 'menu-3',
        title: 'Installation placard',
        description: 'Installation d\'un placard sur mesure',
        duration: '6',
        price: 300,
        icon: 'Package'
      },
      {
        id: 'menu-4',
        title: 'Installation parquet',
        description: 'Pose de parquet flottant ou massif',
        duration: '8',
        price: 400,
        icon: 'Square'
      },
      {
        id: 'menu-5',
        title: 'Installation escalier',
        description: 'Installation d\'un escalier en bois',
        duration: '12',
        price: 600,
        icon: 'TrendingUp'
      },
      {
        id: 'menu-6',
        title: 'Installation meuble sur mesure',
        description: 'Fabrication et installation de meubles sur mesure',
        duration: '16',
        price: 800,
        icon: 'Box'
      }
    ],
    peinture: [
      {
        id: 'peint-1',
        title: 'Peinture mur intérieur',
        description: 'Peinture complète d\'une pièce (murs et plafond)',
        duration: '6',
        price: 300,
        icon: 'Palette'
      },
      {
        id: 'peint-2',
        title: 'Peinture façade',
        description: 'Peinture de façade extérieure',
        duration: '8',
        price: 400,
        icon: 'Home'
      },
      {
        id: 'peint-3',
        title: 'Peinture porte/fenêtre',
        description: 'Peinture de portes et fenêtres',
        duration: '2',
        price: 80,
        icon: 'Brush'
      },
      {
        id: 'peint-4',
        title: 'Application enduit',
        description: 'Application d\'enduit décoratif',
        duration: '4',
        price: 200,
        icon: 'Droplet'
      },
      {
        id: 'peint-5',
        title: 'Décoration murale',
        description: 'Réalisation de décoration murale',
        duration: '8',
        price: 350,
        icon: 'Image'
      }
    ],
    maconnerie: [
      {
        id: 'macon-1',
        title: 'Construction mur',
        description: 'Construction d\'un mur en parpaings ou briques',
        duration: '8',
        price: 400,
        icon: 'Square'
      },
      {
        id: 'macon-2',
        title: 'Réparation fissure',
        description: 'Réparation de fissures dans les murs',
        duration: '2',
        price: 100,
        icon: 'AlertTriangle'
      },
      {
        id: 'macon-3',
        title: 'Installation cheminée',
        description: 'Installation d\'une cheminée complète',
        duration: '12',
        price: 600,
        icon: 'Flame'
      },
      {
        id: 'macon-4',
        title: 'Création ouverture',
        description: 'Création d\'une ouverture dans un mur porteur',
        duration: '16',
        price: 800,
        icon: 'DoorOpen'
      },
      {
        id: 'macon-5',
        title: 'Installation terrasse',
        description: 'Création d\'une terrasse en béton',
        duration: '20',
        price: 1000,
        icon: 'Square'
      }
    ],
    carrelage: [
      {
        id: 'carr-1',
        title: 'Pose carrelage sol',
        description: 'Pose de carrelage au sol avec préparation',
        duration: '8',
        price: 400,
        icon: 'Grid'
      },
      {
        id: 'carr-2',
        title: 'Pose carrelage mural',
        description: 'Pose de carrelage mural',
        duration: '6',
        price: 300,
        icon: 'Square'
      },
      {
        id: 'carr-3',
        title: 'Pose faïence salle de bain',
        description: 'Pose de faïence dans salle de bain',
        duration: '10',
        price: 500,
        icon: 'Droplet'
      },
      {
        id: 'carr-4',
        title: 'Installation plinthes',
        description: 'Installation de plinthes carrelage',
        duration: '2',
        price: 80,
        icon: 'Minus'
      }
    ],
    toiture: [
      {
        id: 'toit-1',
        title: 'Installation tuiles',
        description: 'Pose de tuiles sur toiture',
        duration: '16',
        price: 800,
        icon: 'Home'
      },
      {
        id: 'toit-2',
        title: 'Installation gouttières',
        description: 'Installation de gouttières et descentes',
        duration: '4',
        price: 200,
        icon: 'Droplet'
      },
      {
        id: 'toit-3',
        title: 'Installation velux',
        description: 'Installation d\'une fenêtre de toit',
        duration: '6',
        price: 300,
        icon: 'Window'
      },
      {
        id: 'toit-4',
        title: 'Réparation toiture',
        description: 'Réparation de fuites ou dégâts toiture',
        duration: '8',
        price: 400,
        icon: 'AlertTriangle'
      }
    ],
    chauffage: [
      {
        id: 'chauf-1',
        title: 'Installation chaudière',
        description: 'Installation d\'une chaudière gaz ou fioul',
        duration: '8',
        price: 400,
        icon: 'Thermometer'
      },
      {
        id: 'chauf-2',
        title: 'Installation radiateur',
        description: 'Installation d\'un radiateur à eau',
        duration: '3',
        price: 150,
        icon: 'Zap'
      },
      {
        id: 'chauf-3',
        title: 'Installation poêle',
        description: 'Installation d\'un poêle à bois ou granulés',
        duration: '6',
        price: 300,
        icon: 'Flame'
      },
      {
        id: 'chauf-4',
        title: 'Maintenance chauffage',
        description: 'Entretien et maintenance système chauffage',
        duration: '2',
        price: 100,
        icon: 'Settings'
      }
    ],
    renovation: [
      {
        id: 'reno-1',
        title: 'Rénovation salle de bain',
        description: 'Rénovation complète d\'une salle de bain',
        duration: '40',
        price: 2000,
        icon: 'Droplet'
      },
      {
        id: 'reno-2',
        title: 'Rénovation cuisine',
        description: 'Rénovation complète d\'une cuisine',
        duration: '32',
        price: 1600,
        icon: 'Utensils'
      },
      {
        id: 'reno-3',
        title: 'Rénovation chambre',
        description: 'Rénovation complète d\'une chambre',
        duration: '24',
        price: 1200,
        icon: 'Bed'
      }
    ],
    nettoyage: [
      {
        id: 'net-1',
        title: 'Nettoyage après travaux',
        description: 'Nettoyage complet après rénovation',
        duration: '4',
        price: 120,
        icon: 'Sparkles'
      },
      {
        id: 'net-2',
        title: 'Nettoyage vitres',
        description: 'Nettoyage de toutes les vitres',
        duration: '2',
        price: 80,
        icon: 'Window'
      },
      {
        id: 'net-3',
        title: 'Nettoyage façade',
        description: 'Nettoyage de façade extérieure',
        duration: '6',
        price: 200,
        icon: 'Home'
      }
    ],
    solar: [
      {
        id: 'sol-1',
        title: 'Installation panneaux solaires',
        description: 'Installation complète de panneaux photovoltaïques',
        duration: '24',
        price: 1200,
        icon: 'Sun'
      },
      {
        id: 'sol-2',
        title: 'Installation onduleur',
        description: 'Installation d\'un onduleur solaire',
        duration: '4',
        price: 200,
        icon: 'Zap'
      },
      {
        id: 'sol-3',
        title: 'Connexion électrique',
        description: 'Connexion au réseau électrique',
        duration: '6',
        price: 300,
        icon: 'Settings'
      }
    ],
    jardinage: [
      {
        id: 'jard-1',
        title: 'Tonte pelouse',
        description: 'Tonte complète du jardin',
        duration: '2',
        price: 60,
        icon: 'Scissors'
      },
      {
        id: 'jard-2',
        title: 'Taille haie',
        description: 'Taille de haies et arbustes',
        duration: '3',
        price: 90,
        icon: 'Tree'
      },
      {
        id: 'jard-3',
        title: 'Installation système d\'arrosage',
        description: 'Installation d\'un système d\'arrosage automatique',
        duration: '8',
        price: 400,
        icon: 'Droplet'
      }
    ],
    serrurerie: [
      {
        id: 'serr-1',
        title: 'Installation serrure',
        description: 'Installation d\'une nouvelle serrure',
        duration: '1',
        price: 60,
        icon: 'Key'
      },
      {
        id: 'serr-2',
        title: 'Installation porte blindée',
        description: 'Installation d\'une porte blindée',
        duration: '4',
        price: 200,
        icon: 'Shield'
      },
      {
        id: 'serr-3',
        title: 'Installation interphone',
        description: 'Installation d\'un système d\'interphone',
        duration: '3',
        price: 150,
        icon: 'Phone'
      }
    ],
    vitrerie: [
      {
        id: 'vitr-1',
        title: 'Installation vitre',
        description: 'Installation d\'une vitre simple ou double',
        duration: '2',
        price: 100,
        icon: 'Window'
      },
      {
        id: 'vitr-2',
        title: 'Installation miroir',
        description: 'Installation d\'un miroir mural',
        duration: '1',
        price: 50,
        icon: 'Image'
      },
      {
        id: 'vitr-3',
        title: 'Installation double vitrage',
        description: 'Installation d\'un double vitrage',
        duration: '3',
        price: 150,
        icon: 'Layers'
      }
    ],
    isolation: [
      {
        id: 'isol-1',
        title: 'Installation isolation mur',
        description: 'Installation d\'isolation thermique sur murs',
        duration: '12',
        price: 600,
        icon: 'Thermometer'
      },
      {
        id: 'isol-2',
        title: 'Installation isolation toiture',
        description: 'Installation d\'isolation en combles',
        duration: '16',
        price: 800,
        icon: 'Home'
      },
      {
        id: 'isol-3',
        title: 'Installation VMC',
        description: 'Installation d\'une ventilation mécanique',
        duration: '6',
        price: 300,
        icon: 'Wind'
      }
    ],
    climatisation: [
      {
        id: 'clim-1',
        title: 'Installation climatiseur',
        description: 'Installation d\'un climatiseur split',
        duration: '6',
        price: 300,
        icon: 'Thermometer'
      },
      {
        id: 'clim-2',
        title: 'Installation gaines',
        description: 'Installation de gaines de climatisation',
        duration: '8',
        price: 400,
        icon: 'Zap'
      },
      {
        id: 'clim-3',
        title: 'Maintenance climatisation',
        description: 'Entretien et maintenance climatisation',
        duration: '2',
        price: 100,
        icon: 'Settings'
      }
    ]
  };

  // Modify the categories to support multi-select
  const categoryOptions = [
    { value: 'plomberie', label: 'Plomberie' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' },
    { value: 'maconnerie', label: 'Maçonnerie' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'toiture', label: 'Toiture' },
    { value: 'chauffage', label: 'Chauffage' },
    { value: 'renovation', label: 'Rénovation' },
    { value: 'nettoyage', label: 'Nettoyage' },
    { value: 'solar', label: 'Énergie solaire' },
    { value: 'jardinage', label: 'Jardinage' },
    { value: 'serrurerie', label: 'Serrurerie' },
    { value: 'vitrerie', label: 'Vitrerie' },
    { value: 'isolation', label: 'Isolation' },
    { value: 'climatisation', label: 'Climatisation' }
  ];

  // Update useEffect or add a new one to handle category changes
  useEffect(() => {
    // If projectCategory is provided, set it as the initial selected category
    // if (projectCategory) {
    //   setSelectedCategories([projectCategory]);
    // }
  }, [projectCategory]);

  // Modify predefinedTasks to support multiple categories
  const getPredefinedTasks = () => {
    const selectedCategories = projectCategory || [];
    const categories = Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories];
    
    // Filter out any empty or undefined categories
    const validCategories = categories.filter(cat => cat && cat.trim() !== '');
    
    if (validCategories.length === 0) {
      return []; // Return empty array if no valid categories
    }
    
    let tasks = [];
    validCategories.forEach(category => {
      // Ensure the category exists in predefinedTasksByCategory
      if (predefinedTasksByCategory[category]) {
        tasks = tasks.concat(
          predefinedTasksByCategory[category].map(task => ({
            ...task,
            category: category // Add category information to each task
          }))
        );
      }
    });
    
    return tasks;
  };

  const predefinedTasks = getPredefinedTasks();

  // Add a method to get category label
  const getCategoryLabel = (categoryValue) => {
    const categoryOption = categoryOptions.find(c => c.value === categoryValue);
    return categoryOption ? categoryOption.label : categoryValue;
  };

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

  // Modify handleTaskChange to support pricing type
  const handleTaskChange = (field, value) => {
    let updatedTask = { ...currentTask, [field]: value };

    // Auto-calculate price if hourly rate and duration are set
    if (field === 'hourlyRate' || field === 'duration') {
      const hourlyRate = parseFloat(field === 'hourlyRate' ? value : currentTask.hourlyRate);
      const duration = parseFloat(field === 'duration' ? value : currentTask.duration);

      if (!isNaN(hourlyRate) && !isNaN(duration) && currentTask.pricingType === 'hourly') {
        updatedTask.price = (hourlyRate * duration).toFixed(2);
      }
    }

    setCurrentTask(updatedTask);
  };

  // Remove handleCategoryToggle method
  // const handleCategoryToggle = (category) => {
  //   setSelectedCategories(prev => 
  //     prev.includes(category) 
  //       ? prev.filter(cat => cat !== category)
  //       : [...prev, category]
  //   );
  // };

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
      
      // Clear the form and editing state
      setCurrentTask({ description: '', duration: '', price: '', materials: [], hourlyRate: '', pricingType: 'flat' });
      setEditingPredefinedTask(null);
    }
  };

  const addPredefinedTask = (predefinedTask) => {
    // Instead of adding directly, open it for editing
    setEditingPredefinedTask(predefinedTask);
    setCurrentTask({
      description: predefinedTask.title + ' - ' + predefinedTask.description,
      duration: predefinedTask.duration,
      price: predefinedTask.price,
      materials: [],
      hourlyRate: '',
      pricingType: 'flat'
    });
  };

  const cancelEditing = () => {
    setEditingPredefinedTask(null);
    setCurrentTask({
      description: '',
      duration: '',
      price: '',
      materials: [],
      hourlyRate: '',
      pricingType: 'flat'
    });
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

  // Helper function to format duration from minutes to readable format
  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0h';
    
    const mins = parseInt(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  const totalPrice = tasks.reduce((sum, task) => {
    const taskTotal = task.price + task.materials.reduce((matSum, mat) => matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + taskTotal;
  }, 0);

  const isFormValid = tasks.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">


      {/* Predefined Tasks Section */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Package" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Tâches prédéfinies
          {projectCategory && (
            <div className="ml-2 flex space-x-1">
              {(Array.isArray(projectCategory) ? projectCategory : [projectCategory]).map(cat => (
                <span 
                  key={cat} 
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
            </div>
          )}
        </h2>
        
        {!projectCategory || projectCategory.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Info" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez d'abord une catégorie de projet pour voir les tâches prédéfinies disponibles
            </p>
          </div>
        ) : predefinedTasks.length > 0 ? (
          <>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Ajoutez rapidement des tâches courantes pour {
                (Array.isArray(projectCategory) ? projectCategory : [projectCategory])
                  .map(getCategoryLabel)
                  .join(', ')
              } avec tarifs recommandés
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {predefinedTasks.map(task => {
                return (
                  <div 
                    key={task.id} 
                    className={`border rounded-lg p-3 sm:p-4 transition-all cursor-pointer ${
                      editingPredefinedTask?.id === task.id 
                        ? 'border-primary bg-primary/10 shadow-md' 
                        : 'border-border hover:shadow-md'
                    }`}
                    onClick={() => addPredefinedTask(task)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 sm:mr-3">
                          <Icon name={task.icon} size={14} className="sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <h3 className="text-sm sm:text-base font-medium">{task.title}</h3>
                      </div>
                      <div className="text-base sm:text-lg font-semibold">{task.price}€</div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{task.description}</p>
                                                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Icon name="Clock" size={12} className="mr-1" />
                      <span>{formatDuration(task.duration)}</span>
                        {task.category && (
                          <span className="ml-2 px-1 py-0.5 bg-muted/30 rounded text-[0.6rem]">
                            {getCategoryLabel(task.category)}
                          </span>
                        )}
                        {editingPredefinedTask?.id === task.id && (
                          <span className="ml-2 px-1 py-0.5 bg-primary/30 text-primary rounded text-[0.6rem]">
                            En cours d'édition
                          </span>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Icon name="Package" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune tâche prédéfinie disponible pour cette catégorie. Créez vos propres tâches ci-dessous.
            </p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Wrench" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Définition des tâches avec assistance IA
        </h2>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Task Form with Voice Integration */}
          <div className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
            <h3 className="font-medium text-foreground mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <span>
                {editingPredefinedTask ? (
                  <div className="flex items-center">
                    <Icon name="Edit" size={16} className="mr-2 text-primary" />
                    Modifier: {editingPredefinedTask.title}
                  </div>
                ) : (
                  "Nouvelle tâche"
                )}
              </span>
              <div className="flex space-x-2">
                {editingPredefinedTask && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    iconName="X"
                  >
                    Annuler
                  </Button>
                )}
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
              <div className="mb-3 sm:mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <Icon name="Mic" size={14} className="sm:w-4 sm:h-4 text-primary" />
                  <span className="text-xs sm:text-sm text-primary font-medium">
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
              <div className="mb-3 sm:mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Icon name="Brain" size={14} className="sm:w-4 sm:h-4 text-success animate-pulse" />
                  <span className="text-xs sm:text-sm text-success font-medium">
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
            
            <div className="space-y-3 sm:space-y-4">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Durée estimée (minutes)"
                  type="number"
                  placeholder="Ex: 120"
                  value={currentTask.duration}
                  onChange={(e) => handleTaskChange('duration', e.target.value)}
                  description="Durée en minutes (ex: 120 = 2h)"
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
              <div className="border-t border-border pt-3 sm:pt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Icon name="Package" size={14} className="sm:w-4 sm:h-4 text-primary mr-2" />
                  Matériaux nécessaires
                  {currentTask.materials.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {currentTask.materials.length} matériau{currentTask.materials.length > 1 ? 'x' : ''}
                    </span>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
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
                    onChange={(e) => handleMaterialChange('unit', e.target.value)}
                  />
                  <Input
                    label="Prix unitaire (€)"
                    type="number"
                    placeholder="0.00"
                    value={newMaterial.price}
                    onChange={(e) => handleMaterialChange('price', e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMaterial}
                    disabled={!newMaterial.name || !newMaterial.quantity || !newMaterial.unit}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Ajouter le matériau
                  </Button>
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
                iconName={editingPredefinedTask ? "Save" : "Plus"}
                iconPosition="left"
                fullWidth
                className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90"
              >
                {editingPredefinedTask ? "Sauvegarder les modifications" : "Ajouter cette tâche"}
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
                              <span>Durée: {formatDuration(task.duration)}</span>
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