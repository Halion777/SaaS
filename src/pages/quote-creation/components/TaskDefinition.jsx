import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { generateTaskDescriptionWithGemini } from '../../../services/googleAIService';
import { enhanceTranscriptionWithAI } from '../../../services/googleAIService';
import { generateTaskSuggestionsWithGemini } from '../../../services/googleAIService';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Helpers to detect multiple tasks and per-task details from natural language
function extractMultiTaskInfo(text = '') {
  const src = (text || '').toLowerCase();
  const info = {
    taskCount: 1,
    durationValue: null,
    durationUnit: null,
    eachTaskMaterial: null // { name, quantity, unit, price }
  };

  // Task count ("2 tasks", fallback to room count)
  const taskCountMatch = src.match(/(\d+)\s*(?:tasks?|tâches?)/i);
  const roomCountMatch = src.match(/(\d+)\s*(?:rooms?|pi[eè]ces?)/i);
  if (taskCountMatch) {
    info.taskCount = parseInt(taskCountMatch[1], 10);
  } else if (roomCountMatch) {
    info.taskCount = parseInt(roomCountMatch[1], 10);
  }

  // Per-task duration ("1 day", "8 hours", "120 minutes")
  const durationMatch = src.match(/(\d+)\s*(day|days|jour|jours|hour|hours|heure|heures|minute|minutes)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unitRaw = durationMatch[2];
    let unit = 'minutes';
    if (/day|jour/.test(unitRaw)) unit = 'days';
    else if (/hour|heure/.test(unitRaw)) unit = 'hours';
    else unit = 'minutes';
    info.durationValue = value;
    info.durationUnit = unit;
  }

  // Material per task with price: "each task need 1 paint box cost 20 euro"
  const materialRegex = /each\s+task\s+need[s]?\s+(\d+(?:[.,]\d+)?)\s+([a-zA-Z\u00C0-\u017F\s]+?)\s+(?:cost|co[uû]te|à)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro|euros)/i;
  const materialMatch = src.match(materialRegex);
  if (materialMatch) {
    const quantity = parseFloat(materialMatch[1].replace(',', '.')) || 1;
    const name = materialMatch[2].trim();
    const price = parseFloat(materialMatch[3].replace(',', '.')) || 0;
    // Try to guess unit from name words
    let unit = 'pièce';
    if (/(box|bo[iî]te)/.test(name)) unit = 'boîte';
    else if (/(kg)/.test(name)) unit = 'kg';
    else if (/(l|litre)/.test(name)) unit = 'l';
    info.eachTaskMaterial = { name, quantity, unit, price };
  }

  return info;
}

function minutesFrom(value, unit) {
  if (value == null) return null;
  switch (unit) {
    case 'days':
      return value * 8 * 60; // assume 8h working day
    case 'hours':
      return value * 60;
    case 'minutes':
    default:
      return value;
  }
}

function minutesToHoursCeil(minutes) {
  const m = parseFloat(minutes);
  if (isNaN(m) || m <= 0) return '';
  return Math.ceil(m / 60);
}

// Extract labor price hints from prompt
function extractLaborPriceInfo(text = '') {
  const src = (text || '').toLowerCase();
  const price = {
    perTaskLaborPrice: null,
    totalLaborPrice: null
  };

  // e.g., "each task cost 120 euro", "chaque tâche coûte 120€"
  const perTaskRegex = /(each|chaque)\s+(?:task|tâche)\s+(?:cost|co[uû]te|prix|price|=|à)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro|euros)/i;
  const perTaskMatch = src.match(perTaskRegex);
  if (perTaskMatch) {
    price.perTaskLaborPrice = parseFloat(perTaskMatch[2].replace(',', '.'));
  }

  // e.g., "total cost 300 euro", "coût total 300€", "budget 300€"
  const totalRegex = /(?:total\s*(?:cost|co[uû]t|prix)|budget)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro|euros)?/i;
  const totalMatch = src.match(totalRegex);
  if (totalMatch) {
    price.totalLaborPrice = parseFloat(totalMatch[1].replace(',', '.'));
  }

  // French explicit keys like "prix main d’œuvre: 20€" or "prix main d'oeuvre 20€"
  const laborKeyRegex = /prix\s+main\s+d['’]oeuvre\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euro|euros)?/i;
  const laborKeyMatch = src.match(laborKeyRegex);
  if (laborKeyMatch) {
    price.perTaskLaborPrice = parseFloat(laborKeyMatch[1].replace(',', '.'));
  }

  return price;
}

const TaskDefinition = ({ tasks, onTasksChange, onNext, onPrevious, projectCategory, projectDescription, projectCustomCategory }) => {
  const [currentTask, setCurrentTask] = useState({
    description: '',
    duration: '',
    durationUnit: 'hours',
    price: '',
    materials: [],
    hourlyRate: '',
    pricingType: 'flat'
  });
  const [editingPredefinedTask, setEditingPredefinedTask] = useState(null);
  const [editingExistingTask, setEditingExistingTask] = useState(null);
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: '', price: '' });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Speech recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [wasGeneratedByAI, setWasGeneratedByAI] = useState(false);
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
        durationUnit: 'minutes',
        price: 120,
        icon: 'Droplet'
      },
      {
        id: 'plomb-2',
        title: 'Réparation fuite',
        description: 'Diagnostic et réparation d\'une fuite d\'eau',
        duration: '90',
        durationUnit: 'minutes',
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

  const durationUnitOptions = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Heures' },
    { value: 'days', label: 'Jours' }
  ];

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  const [suggestionsCacheKey, setSuggestionsCacheKey] = useState(null);

  // Load AI suggestions when category or description changes
  useEffect(() => {
    const loadSuggestions = async () => {
      const categoriesRaw = Array.isArray(projectCategory) ? projectCategory : [projectCategory];
      const categories = (categoriesRaw || []).filter(Boolean);
      if (categories.length === 0 || !projectDescription || !projectDescription.trim()) {
        setAiSuggestions([]);
        setSuggestionsCacheKey(null);
        return;
      }

      // Cache key to avoid re-calls when navigating back to step 2
      const cacheKey = JSON.stringify({ c: [...categories].sort(), cc: projectCustomCategory || '', d: (projectDescription || '').trim().slice(0, 150) });
      if (cacheKey === suggestionsCacheKey && aiSuggestions.length > 0) {
        return;
      }

      setIsLoadingAISuggestions(true);
      try {
        let aggregated = [];
        const isMulti = categories.length > 1;
        const perCategoryMax = isMulti ? 3 : 6;
        for (const cat of categories) {
          const res = await generateTaskSuggestionsWithGemini(cat, projectDescription, perCategoryMax);
          if (res.success && Array.isArray(res.data)) {
            const mapped = res.data.map((t, idx) => ({
              id: `ai-${cat}-${Date.now()}-${idx}`,
              title: t.title,
              description: t.description,
              duration: minutesToHoursCeil(t.estimatedDuration) || '',
              durationUnit: 'hours',
              price: typeof t.laborPrice === 'number' ? t.laborPrice : parseFloat(t.laborPrice) || '',
              materials: (t.suggestedMaterials || []).map(m => ({
                id: Date.now() + Math.random(),
                name: m.name,
                quantity: m.quantity,
                unit: m.unit,
                price: parseFloat(m.price) || 0
              }))
            }));
            aggregated = aggregated.concat(mapped);
          }
        }
        setAiSuggestions(aggregated);
        setSuggestionsCacheKey(cacheKey);
      } catch (e) {
        console.error('AI suggestions error', e);
        setAiSuggestions([]);
      } finally {
        setIsLoadingAISuggestions(false);
      }
    };
    loadSuggestions();
  }, [projectCategory, projectDescription, projectCustomCategory]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Check browser compatibility
      if (!browserSupportsSpeechRecognition) {
        console.error('Browser does not support speech recognition');
        return;
      }

      if (!isMicrophoneAvailable) {
        console.error('Microphone not available');
        return;
      }

      // Reset previous transcript
      resetTranscript();
      
      // Start speech recognition
      let lang = 'fr-FR';
      try {
        lang = localStorage.getItem('language') || 'fr-FR';
      } catch (_) {}
      SpeechRecognition.startListening({ continuous: true, language: lang, interimResults: false });
      
      setIsRecording(true);
      setIsVoiceActive(true);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      // Stop speech recognition
      SpeechRecognition.stopListening();
      setIsRecording(false);
      setIsVoiceActive(false);
      
      // Process the transcript if available
      if (transcript && transcript.trim()) {
        await processTranscription(transcript.trim());
      } else {
      
      }
      
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const processTranscription = async (rawTranscript) => {
    try {
      setIsTranscribing(true);
      
      // Enhance transcription with AI using project context
      const categories = Array.isArray(projectCategory)
        ? projectCategory
        : (projectCategory ? [projectCategory] : []);
      const enhancedResult = await enhanceTranscriptionWithAI(
        rawTranscript, 
        categories,
        projectCustomCategory || ''
      );
      
      if (enhancedResult.success && enhancedResult.data) {
        // Update the task description with enhanced text
        setCurrentTask(prev => ({ 
          ...prev, 
          description: enhancedResult.data 
        }));
        setWasGeneratedByAI(true);
      } else {
        // If AI enhancement fails, use the raw transcription
        setCurrentTask(prev => ({ 
          ...prev, 
          description: rawTranscript 
        }));
        setWasGeneratedByAI(true);
        console.error('AI enhancement failed:', enhancedResult.error);
      }
      
    } catch (error) {
      console.error('Error processing transcription:', error);
      // Fallback to raw transcription
      setCurrentTask(prev => ({ 
        ...prev, 
        description: rawTranscript 
      }));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceTranscription = async (transcription) => {
    if (transcription) {
      setIsGenerating(true);
      setIsVoiceActive(false);
      try {
        // Detect multi-task info from the user's natural language
        const info = extractMultiTaskInfo(transcription);
        const laborPriceInfo = extractLaborPriceInfo(transcription);

        // Enhanced prompt for better AI task generation
        const enhancedPrompt = `Créez une description détaillée pour cette tâche: "${transcription}". 
        Incluez les spécifications techniques, les étapes de réalisation, et estimez les matériaux nécessaires.`;
        
        const categories = Array.isArray(projectCategory)
          ? projectCategory
          : (projectCategory ? [projectCategory] : []);
        const projectCtx = [...categories, projectCustomCategory || ''].filter(Boolean).join(', ');
        const aiResponse = await generateTaskDescriptionWithGemini(transcription, projectCtx);
        if (aiResponse.success && aiResponse.data) {
          // Build one or multiple tasks based on detected count
          const baseDescription = aiResponse.data.description;
          const durationMinutes = info.durationValue != null ? minutesFrom(info.durationValue, info.durationUnit) : (aiResponse.data.estimatedDuration || 0);
          const suggestedMaterials = (aiResponse.data.suggestedMaterials || []).map(mat => ({
                id: Date.now() + Math.random(),
                name: mat.name,
                quantity: mat.quantity,
                unit: mat.unit,
            price: parseFloat(mat.price) || 0
          }));

          const newTasks = [];
          const count = Math.max(1, info.taskCount || 1);
          for (let i = 1; i <= count; i++) {
            const taskMaterials = [...suggestedMaterials];
            if (info.eachTaskMaterial) {
              taskMaterials.push({ id: Date.now() + Math.random(), ...info.eachTaskMaterial });
            }
            // Determine labor price per task
            let taskPrice = '';
            if (laborPriceInfo.perTaskLaborPrice != null) {
              taskPrice = laborPriceInfo.perTaskLaborPrice;
            } else if (laborPriceInfo.totalLaborPrice != null && count > 0) {
              taskPrice = parseFloat((laborPriceInfo.totalLaborPrice / count).toFixed(2));
            } else if (aiResponse.data?.laborPrice != null) {
              taskPrice = parseFloat(aiResponse.data.laborPrice) || '';
            }
            newTasks.push({
              id: Date.now() + i,
              description: count > 1 ? `${baseDescription} (Tâche ${i}/${count})` : baseDescription,
              duration: minutesToHoursCeil(durationMinutes) || '',
              durationUnit: 'hours',
              price: taskPrice,
              materials: taskMaterials,
              hourlyRate: '',
              pricingType: 'flat'
            });
          }

          // Append generated tasks; user can verify and set prices
          onTasksChange([...tasks, ...newTasks]);
          // Reset current task form for clarity
          setCurrentTask({ description: '', duration: '', durationUnit: 'hours', price: '', materials: [], hourlyRate: '', pricingType: 'flat' });
        } else {
          // Fallback: use the transcription directly
          setCurrentTask(prev => ({ ...prev, description: transcription }));
        }
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

    // Reset AI generation flag when user manually types in description
    if (field === 'description') {
      setWasGeneratedByAI(false);
    }

    setCurrentTask(updatedTask);
  };

  // Timer effect for recording
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Cleanup recording state on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        SpeechRecognition.stopListening();
      }
    };
  }, [isRecording]);

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
        id: Date.now() + Math.random(), // Ensure unique ID
        name: newMaterial.name,
        quantity: parseFloat(newMaterial.quantity),
        unit: newMaterial.unit,
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

  const editMaterial = (material) => {
    if (!material || !material.id) return;
    
    setEditingMaterial(material);
    setNewMaterial({
      name: material.name || '',
      quantity: (material.quantity || 0).toString(),
      unit: material.unit || '',
      price: (material.price || 0).toString()
    });
  };

  const saveMaterialEdit = () => {
    if (!editingMaterial) return;
    
    setCurrentTask(prev => ({
      ...prev,
      materials: prev.materials.map(m => 
        m.id === editingMaterial.id 
          ? {
              ...m,
              name: newMaterial.name,
              quantity: parseFloat(newMaterial.quantity),
              unit: newMaterial.unit,
              price: parseFloat(newMaterial.price)
            }
          : m
      )
    }));
    
    setEditingMaterial(null);
    setNewMaterial({ name: '', quantity: '', unit: '', price: '' });
  };

  const cancelMaterialEdit = () => {
    setEditingMaterial(null);
    setNewMaterial({ name: '', quantity: '', unit: '', price: '' });
  };

  const clearMaterialForm = () => {
    setNewMaterial({ name: '', quantity: '', unit: '', price: '' });
    setEditingMaterial(null);
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
      setCurrentTask({ description: '', duration: '', durationUnit: 'hours', price: '', materials: [], hourlyRate: '', pricingType: 'flat' });
      setEditingPredefinedTask(null);
      clearMaterialForm();
    }
  };

  const addPredefinedTask = (task) => {
    // Open AI-suggested task for editing with its materials and price
    setEditingPredefinedTask(task);
    setCurrentTask({
      description: task.title ? `${task.title} - ${task.description}` : task.description,
      duration: task.duration,
      durationUnit: 'hours',
      price: task.price || '',
      materials: task.materials || [],
      hourlyRate: '',
      pricingType: 'flat'
    });
  };

  const cancelEditing = () => {
    setEditingPredefinedTask(null);
    setCurrentTask({
      description: '',
      duration: '',
      durationUnit: 'hours',
      price: '',
      materials: [],
      hourlyRate: '',
      pricingType: 'flat'
    });
  };

  const removeTask = (taskId) => {
    onTasksChange(tasks.filter(t => t.id !== taskId));
  };

  const editTask = (task) => {
    setEditingExistingTask(task);
    setCurrentTask({
      description: task.description,
      duration: task.durationUnit === 'minutes' ? minutesToHoursCeil(task.duration) : task.duration,
      durationUnit: 'hours',
      price: task.price,
      materials: [...task.materials],
      hourlyRate: task.hourlyRate || '',
      pricingType: task.pricingType || 'flat'
    });
  };

  const saveEditedTask = () => {
    if (!editingExistingTask) return;
    
    const updatedTask = {
      ...editingExistingTask,
      description: currentTask.description,
      duration: currentTask.duration,
      durationUnit: 'hours',
      price: currentTask.price,
      materials: currentTask.materials,
      hourlyRate: currentTask.hourlyRate,
      pricingType: currentTask.pricingType
    };
    
    const updatedTasks = tasks.map(t => 
      t.id === editingExistingTask.id ? updatedTask : t
    );
    
    onTasksChange(updatedTasks);
    setEditingExistingTask(null);
    setCurrentTask({
      description: '',
      duration: '',
      durationUnit: 'hours',
      price: '',
      materials: [],
      hourlyRate: '',
      pricingType: 'flat'
    });
  };

  const cancelEditTask = () => {
    setEditingExistingTask(null);
    setCurrentTask({
      description: '',
      duration: '',
      durationUnit: 'hours',
      price: '',
      materials: [],
      hourlyRate: '',
      pricingType: 'flat'
    });
  };

  const generateAIDescription = async () => {
    if (!currentTask.description) return;
    
    setIsGenerating(true);
    try {
      const enhancedPrompt = `Améliorez et détaillez cette description de tâche: "${currentTask.description}". 
      Ajoutez des spécifications techniques professionnelles et des recommandations d'optimisation.`;
      // Include project/category context and parse labor price from the user's text as hints
      const laborPriceInfo = extractLaborPriceInfo(currentTask.description);
      const categories = Array.isArray(projectCategory)
        ? projectCategory
        : (projectCategory ? [projectCategory] : []);
      const projectCtx = [...categories, projectCustomCategory || ''].filter(Boolean).join(', ');
      const aiResponse = await generateTaskDescriptionWithGemini(currentTask.description, projectCtx);
      if (aiResponse.success && aiResponse.data) {
        // Determine task labor price from prompt or AI response
        let taskPrice = currentTask.price;
        if (laborPriceInfo.perTaskLaborPrice != null) {
          taskPrice = laborPriceInfo.perTaskLaborPrice;
        } else if (aiResponse.data?.laborPrice != null) {
          taskPrice = parseFloat(aiResponse.data.laborPrice) || currentTask.price;
        }

        setCurrentTask(prev => ({
          ...prev,
          description: aiResponse.data.description,
          duration: minutesToHoursCeil(aiResponse.data.estimatedDuration) || prev.duration,
          durationUnit: 'hours',
          price: taskPrice,
          materials: [
            ...prev.materials,
            ...aiResponse.data.suggestedMaterials?.map(mat => ({
              id: Date.now() + Math.random(),
              name: mat.name,
              quantity: mat.quantity,
              unit: mat.unit,
              price: parseFloat(mat.price) || 0
            })) || []
          ]
        }));
        
        // Show warning if response was partial
        if (aiResponse.warning) {
          // You can add a toast notification here if you have one
          console.warn('AI Response Warning:', aiResponse.warning);
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to format duration based on unit
  const formatDuration = (duration, unit = 'minutes') => {
    if (!duration || isNaN(duration)) return '0';
    
    const value = parseFloat(duration);
    
    switch (unit) {
      case 'minutes':
        const hours = Math.floor(value / 60);
        const remainingMinutes = value % 60;
        
        if (hours === 0) {
          return `${remainingMinutes}min`;
        } else if (remainingMinutes === 0) {
          return `${hours}h`;
        } else {
          return `${hours}h ${remainingMinutes}min`;
        }
      case 'hours':
        if (value === 1) {
          return '1h';
        } else {
          return `${value}h`;
        }
      case 'days':
        if (value === 1) {
          return '1 jour';
        } else {
          return `${value} jours`;
        }
      default:
        return `${value}min`;
    }
  };

  const totalPrice = tasks.reduce((sum, task) => {
    const taskTotal = task.price + task.materials.reduce((matSum, mat) => matSum + (mat.price * parseFloat(mat.quantity)), 0);
    return sum + taskTotal;
  }, 0);

  const isFormValid = tasks.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">


      {/* AI Suggested Tasks Section */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Sparkles" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Suggestions IA de tâches
        </h2>
        
        {!projectCategory || (Array.isArray(projectCategory) && projectCategory.length === 0) ? (
          <div className="text-center py-8">
            <Icon name="Info" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez une catégorie et décrivez le projet pour obtenir des suggestions IA
            </p>
          </div>
        ) : isLoadingAISuggestions ? (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Génération des tâches suggérées…</p>
          </div>
        ) : aiSuggestions.length > 0 ? (
          <>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Suggestions basées sur votre description et catégorie, avec durées, matériaux et prix de main d'œuvre.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {aiSuggestions.map(task => {
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
                          <Icon name="ListChecks" size={14} className="sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <h3 className="text-sm sm:text-base font-medium">{task.title}</h3>
                      </div>
                      <div className="text-base sm:text-lg font-semibold">{task.price || 0}€</div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{task.description}</p>
                                                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Icon name="Clock" size={12} className="mr-1" />
                      <span>{formatDuration(task.duration, 'hours')}</span>
                    </div>
                    {task.materials?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Matériaux suggérés:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.materials.map((m) => (
                            <span key={m.id} className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
                              {m.name} ({m.quantity} {m.unit}) {m.price ? `· ${m.price}€` : ''}
                          </span>
                          ))}
                      </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Icon name="Package" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune suggestion IA disponible. Décrivez davantage le projet.</p>
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
                <Button
                  variant="ghost"
                  size="sm"
                  iconName={isRecording ? "Square" : isTranscribing ? "Loader2" : "Mic"}
                  title={
                    isRecording 
                      ? `Arrêter l'écoute (${recordingTime}s)` 
                      : isTranscribing 
                        ? "Amélioration IA en cours..." 
                        : "Dicter la description de la tâche"
                  }
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isGenerating}
                  className={
                    isRecording 
                      ? "text-red-500 animate-pulse" 
                      : isTranscribing 
                        ? "animate-spin" 
                        : ""
                  }
                />

              </div>
            </h3>
            
            {/* Recording Status */}
            {isRecording && (
              <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <Icon name="Mic" size={14} className="sm:w-4 sm:h-4 text-red-600" />
                  <span className="text-xs sm:text-sm text-red-700 font-medium">
                    Écoute en cours... {recordingTime}s
                  </span>
                </div>
                {transcript && (
                  <div className="mt-2 p-2 bg-white rounded border border-red-100">
                    <p className="text-xs text-gray-600 mb-1">Texte détecté:</p>
                    <p className="text-sm text-gray-800">{transcript}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Conseil: Décrivez précisément la tâche, les matériaux nécessaires et les spécifications techniques
                </p>
              </div>
            )}
            
            {/* Transcription Status */}
            {isTranscribing && (
              <div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Icon name="Loader2" size={14} className="sm:w-4 sm:h-4 animate-spin text-blue-600" />
                  <span className="text-xs sm:text-sm text-blue-700 font-medium">
                    Amélioration IA en cours...
                  </span>
                </div>
              </div>
            )}
            
            {/* Success Message - Only show after successful AI transcription, not manual typing */}
            {!isRecording && !isTranscribing && wasGeneratedByAI && currentTask.description && (
              <div className="mb-3 sm:mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-xs sm:text-sm text-green-700 font-medium">
                    Description de tâche dictée et améliorée par l'IA
                  </span>
                </div>
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
                <div className="relative">
                  <Input
                    label="Description de la tâche"
                    type="text"
                    placeholder="Décrivez la tâche à réaliser ou utilisez la dictée vocale pour une description IA complète..."
                    value={currentTask.description}
                    onChange={(e) => handleTaskChange('description', e.target.value)}
                    description="Utilisez la dictée vocale pour une génération automatique par IA"
                    disabled={isGenerating || isTranscribing}
                    className={isRecording ? "border-red-500 bg-red-50" : ""}
                  />
                  
                  {/* AI Enhancement Button */}
                  {currentTask.description && !isGenerating && !isTranscribing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      iconName="Sparkles"
                      title="Améliorer la description avec l'IA"
                      onClick={generateAIDescription}
                      disabled={isGenerating || isTranscribing}
                      className="absolute right-2 top-8 text-primary hover:text-primary/80"
                    />
                  )}
                </div>
                

              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Durée estimée"
                    type="number"
                    placeholder="Ex: 120"
                    value={currentTask.duration}
                    onChange={(e) => handleTaskChange('duration', e.target.value)}
                    description={`Durée en ${currentTask.durationUnit === 'minutes' ? 'minutes' : currentTask.durationUnit === 'hours' ? 'heures' : 'jours'}`}
                  />
                </div>
                <Select
                  label="Unité"
                  placeholder="Unité"
                  options={durationUnitOptions}
                  value={currentTask.durationUnit}
                  onChange={(e) => handleTaskChange('durationUnit', e.target.value)}
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
                  <div className="text-right">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={editingMaterial ? saveMaterialEdit : addMaterial}
                        disabled={!newMaterial.name || !newMaterial.quantity || !newMaterial.unit}
                        iconName={editingMaterial ? "Save" : "Plus"}
                        iconPosition="left"
                        className={!newMaterial.name || !newMaterial.quantity || !newMaterial.unit ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {editingMaterial ? "Sauvegarder" : "Ajouter le matériau"}
                      </Button>
                      {editingMaterial && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelMaterialEdit}
                          iconName="X"
                          iconPosition="left"
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                    {(!newMaterial.name || !newMaterial.quantity || !newMaterial.unit) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Remplissez le nom, la quantité et l'unité pour ajouter un matériau
                      </p>
                    )}
                  </div>
                </div>
                
                {currentTask.materials.length > 0 && (
                  <div className="space-y-2">
                    {currentTask.materials.map((material) => (
                      <div key={material.id} className={`flex items-center justify-between p-3 border rounded ${
                        editingMaterial?.id === material.id 
                          ? 'bg-primary/5 border-primary' 
                          : 'bg-background border-border'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{material.name}</span>
                            {editingMaterial?.id === material.id && (
                              <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                                En cours d'édition
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {material.quantity} {material.unit} × {material.price}€ = {(material.quantity * material.price).toFixed(2)}€
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editMaterial(material)}
                            iconName="Edit"
                            disabled={editingMaterial && editingMaterial.id !== material.id}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(material.id)}
                            iconName="Trash2"
                            disabled={editingMaterial && editingMaterial.id !== material.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={editingExistingTask ? saveEditedTask : addTask}
                  disabled={!currentTask.description || !currentTask.duration || !currentTask.price}
                  iconName={editingPredefinedTask || editingExistingTask ? "Save" : "Plus"}
                  iconPosition="left"
                  className="flex-1 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90"
                >
                  {editingPredefinedTask || editingExistingTask ? "Sauvegarder les modifications" : "Ajouter cette tâche"}
                </Button>
                {editingExistingTask && (
                  <Button
                    onClick={cancelEditTask}
                    variant="outline"
                    iconName="X"
                    iconPosition="left"
                  >
                    Annuler
                  </Button>
                )}
              </div>
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
                    <div key={task.id} className={`relative p-4 bg-background border rounded-lg hover:shadow-md transition-shadow ${
                      editingExistingTask?.id === task.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}>
                      <div className="flex items-start justify-between">
                        {editingExistingTask?.id === task.id && (
                          <div className="absolute -top-2 -left-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                            En cours d'édition
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{task.description}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Icon name="Clock" size={14} />
                              <span>Durée: {formatDuration(task.duration, task.durationUnit || 'minutes')}</span>
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
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editTask(task)}
                            iconName="Edit"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                            iconName="Trash2"
                          />
                        </div>
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