import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { fetchClients, createClient } from '../../../services/clientsService';
import { generateProjectDescriptionWithGemini, isGoogleAIServiceAvailable } from '../../../services/googleAIService';
import { generateTaskSuggestionsWithGemini } from '../../../services/googleAIService';
import { enhanceTranscriptionWithAI } from '../../../services/googleAIService';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { generateQuoteNumber } from '../../../services/quotesService';

const ClientSelection = ({ selectedClient, projectInfo, onClientSelect, onProjectInfoChange, onNext, leadId, userId }) => {
  const { t } = useTranslation();
  const [showNewClientForm, setShowNewClientForm] = useState(!!leadId); // Auto-show form if leadId exists
  const [clientType, setClientType] = useState(leadId ? 'particulier' : 'particulier');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Initialize clientAddedFromLead from localStorage if leadId exists
  const [clientAddedFromLead, setClientAddedFromLead] = useState(() => {
    if (leadId) {
      try {
        const stored = localStorage.getItem(`lead-client-added-${leadId}`);
        return stored === 'true';
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return false;
      }
    }
    return false;
  });

  // Function to update clientAddedFromLead state and localStorage
  const updateClientAddedFromLead = (value) => {
    setClientAddedFromLead(value);
    if (leadId) {
      try {
        localStorage.setItem(`lead-client-added-${leadId}`, value.toString());
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  };

  // Update localStorage when leadId changes
  useEffect(() => {
    if (leadId) {
      try {
        const stored = localStorage.getItem(`lead-client-added-${leadId}`);
        setClientAddedFromLead(stored === 'true');
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        setClientAddedFromLead(false);
      }
    } else {
      setClientAddedFromLead(false);
    }

    // Don't remove localStorage entries on unmount - they should persist across refreshes
    // The entries will be cleaned up when the quote is successfully created/sent
  }, [leadId]);

  // Update clientAddedFromLead when selectedClient changes (for restored clients after refresh)
  useEffect(() => {
    if (leadId && selectedClient && (selectedClient.id || selectedClient.value)) {
      // If client has an ID/value, it means it was already added (either just now or restored from DB)
      const stored = localStorage.getItem(`lead-client-added-${leadId}`);
      if (stored !== 'true') {
        // Update localStorage and state if not already set
        updateClientAddedFromLead(true);
      }
    }
  }, [leadId, selectedClient]);
  const [newClient, setNewClient] = useState({
    name: '',
    type: 'particulier',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    contactPerson: '',
    companySize: '',
    regNumber: '',
    peppolId: '',
    enablePeppol: false,
    preferences: []
  });

  const [existingClients, setExistingClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [clientsRefreshTrigger, setClientsRefreshTrigger] = useState(0);
  
  // AI functionality state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  // Quote number generation state
  const [preGeneratedQuoteNumber, setPreGeneratedQuoteNumber] = useState('');
  const [isGeneratingQuoteNumber, setIsGeneratingQuoteNumber] = useState(false);
  
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
  const [aiGenerated, setAiGenerated] = useState(false);

  // Auto-fill client form when leadId is present
  useEffect(() => {
    if (leadId && selectedClient) {
      // Convert communication preferences to preferences array
      const communicationPrefs = selectedClient.communicationPreferences || {};
      const preferences = [];
      
      if (communicationPrefs.email) preferences.push('email');
      if (communicationPrefs.phone) preferences.push('phone');
      if (communicationPrefs.sms) preferences.push('sms');
      if (communicationPrefs.mail) preferences.push('mail');
      
      // Pre-fill the new client form with lead data
      setNewClient({
        name: selectedClient.name || '',
        type: 'particulier', // Default type
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        address: selectedClient.address || '',
        city: selectedClient.city || '',
        country: selectedClient.country || 'BE',
        postalCode: selectedClient.postalCode || '',
        contactPerson: '',
        companySize: '',
        regNumber: '',
        peppolId: '',
        enablePeppol: false,
        preferences: preferences
      });
    }
  }, [leadId, selectedClient]);

  // Store lead client data for reuse when form is reopened
  const [leadClientData, setLeadClientData] = useState(null);
  
  // Save lead client data when it's first loaded
  useEffect(() => {
    if (leadId && selectedClient && !leadClientData) {
      setLeadClientData({
        name: selectedClient.name || '',
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        address: selectedClient.address || '',
        city: selectedClient.city || '',
        country: selectedClient.country || 'BE',
        postalCode: selectedClient.postalCode || '',
        communicationPreferences: selectedClient.communicationPreferences || {}
      });
    }
  }, [leadId, selectedClient, leadClientData]);



  // Handle click outside category dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownOpen && !event.target.closest('.category-dropdown')) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Fetch existing clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoadingClients(true);
        const { data, error } = await fetchClients();
        
        if (error) {
          console.error('Error fetching clients:', error);
          return;
        }

        // Format clients for the select dropdown
        const formattedClients = data.map(client => {
          
          const nameIcon = client.type === 'professionnel' ? '🏢' : '👤';
          return {
            value: client.id,
            label: `${nameIcon} ${client.name}`,
            description: `${client.email ? '📧 ' + client.email : ''} ${client.phone ? '📞 ' + client.phone : ''}`.trim(),
            type: client.type, // Keep the original French type values
            client: client, // Keep the full client object for reference
            // Include address fields directly for easier access
            address: client.address,
            city: client.city,
            postalCode: client.postalCode,
            country: client.country,
            email: client.email,
            phone: client.phone
          };
        });

        setExistingClients(formattedClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, [clientsRefreshTrigger]);

  // Cleanup recording state on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        SpeechRecognition.stopListening();
      }
    };
  }, [isRecording]);

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

  // Generate quote number on component mount
  useEffect(() => {
    const generateQuoteNumberForClientSelection = async () => {
      try {
        setIsGeneratingQuoteNumber(true);
        
        // Use the userId prop passed from parent component
        if (!userId) {
          console.warn('No userId provided to ClientSelection component');
          return;
        }
        
        // Use the same function as quote creation page
        const { data: quoteNumber, error: numberError } = await generateQuoteNumber(userId);
        
        if (numberError) {
          console.warn('Error generating quote number for client selection, using fallback:', numberError);
        }
        
        let finalQuoteNumber = quoteNumber;
        
        // If backend didn't provide a number, generate a fallback with timestamp for uniqueness
        if (!finalQuoteNumber) {
          const timestamp = Date.now();
          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
        }
        
        if (finalQuoteNumber) {
          setPreGeneratedQuoteNumber(finalQuoteNumber);
          // Store in localStorage for later use in quote creation
          localStorage.setItem('pre_generated_quote_number', finalQuoteNumber);

        }
      } catch (error) {
        console.error('Error generating quote number for client selection:', error);
        // Use fallback quote number with timestamp and random suffix for uniqueness
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const fallbackNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
        setPreGeneratedQuoteNumber(fallbackNumber);
        localStorage.setItem('pre_generated_quote_number', fallbackNumber);
      } finally {
        setIsGeneratingQuoteNumber(false);
      }
    };

    generateQuoteNumberForClientSelection();
  }, []); // Run once on component mount

  const typeOptions = [
    { value: 'particulier', label: t('quoteCreation.clientSelection.individual', 'Particulier') },
    { value: 'professionnel', label: t('quoteCreation.clientSelection.professional', 'Professionnel') }
  ];

  const companySizeOptions = [
    { value: 'TPE', label: t('quoteCreation.clientSelection.companySize.verySmall', 'TPE (1-9 salariés)') },
    { value: 'PME', label: t('quoteCreation.clientSelection.companySize.small', 'PME (10-249 salariés)') },
    { value: 'ETI', label: t('quoteCreation.clientSelection.companySize.medium', 'ETI (250-4999 salariés)') },
    { value: 'GE', label: t('quoteCreation.clientSelection.companySize.large', 'Grande Entreprise (5000+ salariés)') }
  ];

  const preferenceOptions = [
    { value: 'email', label: t('quoteCreation.clientSelection.contactPreference.email', 'Email') },
    { value: 'phone', label: t('quoteCreation.clientSelection.contactPreference.phone', 'Téléphone') },
    { value: 'sms', label: t('quoteCreation.clientSelection.contactPreference.sms', 'SMS') },
    { value: 'mail', label: t('quoteCreation.clientSelection.contactPreference.mail', 'Courrier') }
  ];

  const categoryOptions = [
    { value: 'plumbing', label: t('quoteCreation.projectInfo.categories.plumbing', 'Plomberie') },
    { value: 'electrical', label: t('quoteCreation.projectInfo.categories.electrical', 'Électricité') },
    { value: 'carpentry', label: t('quoteCreation.projectInfo.categories.carpentry', 'Menuiserie') },
    { value: 'painting', label: t('quoteCreation.projectInfo.categories.painting', 'Peinture') },
    { value: 'masonry', label: t('quoteCreation.projectInfo.categories.masonry', 'Maçonnerie') },
    { value: 'tiling', label: t('quoteCreation.projectInfo.categories.tiling', 'Carrelage') },
    { value: 'roofing', label: t('quoteCreation.projectInfo.categories.roofing', 'Toiture') },
    { value: 'heating', label: t('quoteCreation.projectInfo.categories.heating', 'Chauffage') },
    { value: 'renovation', label: t('quoteCreation.projectInfo.categories.renovation', 'Rénovation générale') },
    { value: 'cleaning', label: t('quoteCreation.projectInfo.categories.cleaning', 'Nettoyage') },
    { value: 'solar', label: t('quoteCreation.projectInfo.categories.solar', 'Installation solaire') },
    { value: 'gardening', label: t('quoteCreation.projectInfo.categories.gardening', 'Jardinage') },
    { value: 'locksmith', label: t('quoteCreation.projectInfo.categories.locksmith', 'Serrurerie') },
    { value: 'glazing', label: t('quoteCreation.projectInfo.categories.glazing', 'Vitrerie') },
    { value: 'insulation', label: t('quoteCreation.projectInfo.categories.insulation', 'Isolation') },
    { value: 'airConditioning', label: t('quoteCreation.projectInfo.categories.airConditioning', 'Climatisation') },
    { value: 'other', label: t('quoteCreation.projectInfo.categories.other', 'Autre') }
  ];

  // Predefined tasks based on category
  const predefinedTasks = {
    plumbing: [
      'Installation robinetterie',
      'Réparation fuite',
      'Installation chauffe-eau',
      'Débouchage canalisation',
      'Installation WC',
      'Installation douche/baignoire',
      'Installation évier',
      'Installation machine à laver'
    ],
    electrical: [
      'Installation prise électrique',
      'Installation interrupteur',
      'Installation luminaire',
      'Mise aux normes électrique',
      'Installation tableau électrique',
      'Installation chauffage électrique',
      'Installation système d\'alarme',
      'Installation domotique'
    ],
    carpentry: [
      'Installation porte',
      'Installation fenêtre',
      'Installation placard',
      'Installation escalier',
      'Installation parquet',
      'Installation lambris',
      'Installation meuble sur mesure',
      'Réparation meuble'
    ],
    painting: [
      'Peinture mur intérieur',
      'Peinture plafond',
      'Peinture façade',
      'Peinture porte/fenêtre',
      'Peinture escalier',
      'Peinture meuble',
      'Application enduit',
      'Décoration murale'
    ],
    masonry: [
      'Construction mur',
      'Réparation fissure',
      'Installation cheminée',
      'Création ouverture',
      'Installation escalier béton',
      'Installation terrasse',
      'Installation allée',
      'Réparation façade'
    ],
    tiling: [
      'Pose carrelage sol',
      'Pose carrelage mural',
      'Pose faïence salle de bain',
      'Pose carrelage cuisine',
      'Pose carrelage extérieur',
      'Installation plinthes',
      'Réparation carrelage',
      'Installation mosaïque'
    ],
    roofing: [
      'Installation tuiles',
      'Installation ardoises',
      'Installation zinc',
      'Installation gouttières',
      'Installation velux',
      'Réparation toiture',
      'Installation isolation toiture',
      'Installation cheminée'
    ],
    heating: [
      'Installation chaudière',
      'Installation radiateur',
      'Installation plancher chauffant',
      'Installation poêle',
      'Installation cheminée',
      'Maintenance chauffage',
      'Installation thermostat',
      'Installation pompe à chaleur'
    ],
    renovation: [
      'Rénovation complète appartement',
      'Rénovation salle de bain',
      'Rénovation cuisine',
      'Rénovation chambre',
      'Rénovation salon',
      'Rénovation extérieur',
      'Rénovation toiture',
      'Rénovation système électrique'
    ],
    nettoyage: [
      'Nettoyage après travaux',
      'Nettoyage vitres',
      'Nettoyage moquette',
      'Nettoyage façade',
      'Nettoyage toiture',
      'Nettoyage gouttières',
      'Nettoyage cheminée',
      'Nettoyage spécialisé'
    ],
    solar: [
      'Installation panneaux solaires',
      'Installation onduleur',
      'Installation système de fixation',
      'Connexion électrique',
      'Installation compteur',
      'Maintenance panneaux',
      'Installation batterie',
      'Optimisation production'
    ],
    jardinage: [
      'Tonte pelouse',
      'Taille haie',
      'Taille arbre',
      'Plantation',
      'Installation système d\'arrosage',
      'Création massif',
      'Installation terrasse bois',
      'Entretien jardin'
    ],
    serrurerie: [
      'Installation serrure',
      'Installation verrou',
      'Installation porte blindée',
      'Installation gâche électrique',
      'Réparation serrure',
      'Installation interphone',
      'Installation digicode',
      'Installation système d\'alarme'
    ],
    vitrerie: [
      'Installation vitre',
      'Installation miroir',
      'Installation vitrine',
      'Réparation vitre',
      'Installation double vitrage',
      'Installation vitre de sécurité',
      'Installation vitre décorative',
      'Installation verrière'
    ],
    isolation: [
      'Installation isolation mur',
      'Installation isolation toiture',
      'Installation isolation plancher',
      'Installation isolation combles',
      'Installation isolation façade',
      'Installation isolation phonique',
      'Installation isolation thermique',
      'Installation VMC'
    ],
    climatisation: [
      'Installation climatiseur',
      'Installation split',
      'Installation gaines',
      'Installation groupe extérieur',
      'Maintenance climatisation',
      'Installation climatisation réversible',
      'Installation climatisation gainable',
      'Installation thermostat'
    ]
  };

  const handleNewClientSubmit = async (e) => {
    e.preventDefault();
    if (newClient.name && newClient.email) {
      try {
        setIsCreatingClient(true);
        setCreateError(null);
        setCreateSuccess(false);
        
        // Create client in the backend
        const { data: createdClient, error } = await createClient({
          ...newClient,
          type: clientType
        });
        
        if (error) {
          console.error('Error creating client:', error);
          setCreateError(error.message || 'Erreur lors de la création du client');
          return;
        }
        
        // Format the created client for selection
      const clientData = {
          value: createdClient.id,
          label: clientType === 'professionnel' 
            ? `${createdClient.name}`
            : createdClient.name,
          description: `${createdClient.email} • ${createdClient.phone}`,
        type: clientType,
          client: createdClient
      };
        
        // Select the newly created client
      onClientSelect(clientData);
      setShowNewClientForm(false);
      
      // If this is a lead, mark that client has been added
      if (leadId) {
        updateClientAddedFromLead(true);
      }
        
        // Show success message
        setCreateSuccess(true);
        setTimeout(() => setCreateSuccess(false), 3000); // Hide after 3 seconds
        
        // Don't automatically move to next step when creating client from lead
        // User will manually navigate when ready
        
        // Refresh the clients list to get the latest data
        setClientsRefreshTrigger(prev => prev + 1);
        
        // Reset form
      setNewClient({ 
        name: '', 
          type: 'particulier', 
        email: '', 
        phone: '', 
        address: '', 
        city: '',
        country: '',
        postalCode: '',
        contactPerson: '', 
        companySize: '',
        regNumber: '',
        peppolId: '',
        enablePeppol: false,
        preferences: []
      });
        setClientType('particulier');
        
      } catch (error) {
        console.error('Error creating client:', error);
        setCreateError('Erreur lors de la création du client');
      } finally {
        setIsCreatingClient(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
    // Clear any previous errors when user starts typing
    if (createError) setCreateError(null);
    if (createSuccess) setCreateSuccess(false);
  };

  // Quick add client function for lead quotes
  const handleQuickAddClient = async () => {
    if (!leadId || !selectedClient || !selectedClient.name || !selectedClient.email) {
      return;
    }

    try {
      setIsCreatingClient(true);
      setCreateError(null);
      
      // Create client using pre-filled data from lead
      const { data: createdClient, error } = await createClient({
        name: selectedClient.name,
        type: 'particulier',
        email: selectedClient.email,
        phone: selectedClient.phone || '',
        address: selectedClient.address || '',
        city: selectedClient.city || '',
        country: selectedClient.country || 'BE',
        postalCode: selectedClient.postalCode || '',
        contactPerson: '',
        companySize: '',
        regNumber: '',
        peppolId: '',
        enablePeppol: false,
        preferences: selectedClient.communicationPreferences ? Object.keys(selectedClient.communicationPreferences).filter(key => selectedClient.communicationPreferences[key]) : []
      });
      
      if (error) {
        console.error('Error creating client:', error);
        setCreateError(error.message || 'Erreur lors de la création du client');
        return;
      }
      
      // Format the created client for selection
      const clientData = {
        value: createdClient.id,
        label: createdClient.name,
        description: `${createdClient.email}${createdClient.phone ? ' • ' + createdClient.phone : ''}`,
        type: 'particulier',
        client: createdClient,
        address: createdClient.address,
        city: createdClient.city,
        postalCode: createdClient.postalCode,
        country: createdClient.country,
        email: createdClient.email,
        phone: createdClient.phone
      };
      
      // Select the newly created client
      onClientSelect(clientData);
      
      // Mark that client has been added and store client ID
      updateClientAddedFromLead(true);
      if (leadId) {
        try {
          localStorage.setItem(`lead-client-id-${leadId}`, createdClient.id);
        } catch (error) {
          console.error('Error storing client ID:', error);
        }
      }
      
      // Refresh the clients list
      setClientsRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error creating client:', error);
      setCreateError('Erreur lors de la création du client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handlePreferenceToggle = (preference) => {
    setNewClient(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const validatePeppolId = (peppolId) => {
    // Basic Peppol ID validation: [Country Code]:[Identifier]
    const peppolRegex = /^[0-9]{4}:[A-Z0-9]+$/;
    return peppolRegex.test(peppolId);
  };

  // Removed auto-enhance while typing: enhance only on Sparkles click

  const handleProjectChange = (field, value) => {
    const updatedProjectInfo = { ...projectInfo, [field]: value };
    onProjectInfoChange(updatedProjectInfo);
    
    if (field === 'description' || field === 'categories' || field === 'customCategory') {
      setAiError(null);
      if (field === 'description') setAiGenerated(false);
    }
  };

  const handleAIDescriptionGeneration = async () => {
    try {
      setIsGeneratingAI(true);
      setAiError(null);
      
      // Get the selected category (use custom category if 'other' is selected)
      const selectedCategory = projectInfo.categories?.includes('other') 
        ? projectInfo.customCategory 
        : projectInfo.categories?.[0] || '';
      
      if (!selectedCategory) {
        setAiError(t('quoteCreation.projectInfo.selectCategoryFirst', 'Veuillez d\'abord sélectionner une catégorie de projet'));
        return;
      }
      
      // Generate AI description with Google Gemini using all selected categories
      const categories = Array.isArray(projectInfo.categories) ? projectInfo.categories : (selectedCategory ? [selectedCategory] : []);
      const result = await generateProjectDescriptionWithGemini(
        categories,
        projectInfo.description,
        projectInfo.customCategory
      );
      
      if (result.success && result.data) {
        // Update the project description with AI-generated content
        onProjectInfoChange({ 
          ...projectInfo, 
          description: result.data 
        });
        setAiGenerated(true);
      } else {
        setAiError(result.error || 'Erreur lors de la génération de la description');
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      setAiError('Erreur inattendue lors de la génération de la description');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Check browser compatibility
      if (!browserSupportsSpeechRecognition) {
        setAiError('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome, Edge, ou Safari.');
        return;
      }

      if (!isMicrophoneAvailable) {
        setAiError('Microphone non disponible. Vérifiez les permissions microphone dans votre navigateur.');
        return;
      }

      // Reset previous transcript
      resetTranscript();
      
      // Start speech recognition using app language from localStorage
      let lang = 'fr-FR';
      try {
        lang = localStorage.getItem('language') || 'fr-FR';
      } catch (_) {}
      SpeechRecognition.startListening({ continuous: true, language: lang, interimResults: false });
      
      setIsRecording(true);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setAiError('Erreur lors du démarrage de la reconnaissance vocale.');
    }
  };

  const stopRecording = async () => {
    try {
      // Stop speech recognition
      SpeechRecognition.stopListening();
      setIsRecording(false);
      
      // Process the transcript if available
      if (transcript && transcript.trim()) {
        await processTranscription(transcript.trim());
      } else {
        setAiError('Aucun texte détecté. Essayez de parler plus clairement.');
      }
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setAiError('Erreur lors de l\'arrêt de la reconnaissance vocale.');
    }
  };

  const processTranscription = async (rawTranscript) => {
    try {
      setIsTranscribing(true);
      setAiError(null);
      
      // Enhance transcription with AI using project context
      const enhancedResult = await enhanceTranscriptionWithAI(
        rawTranscript, 
        projectInfo.categories, 
        projectInfo.customCategory
      );
      
      if (enhancedResult.success && enhancedResult.data) {
        // Update the project description with enhanced text
        onProjectInfoChange({ 
          ...projectInfo, 
          description: enhancedResult.data 
        });
        
        // Show success message
        setAiError(null);
        setAiGenerated(true);
      } else {
        // If AI enhancement fails, use the raw transcription
        onProjectInfoChange({ 
          ...projectInfo, 
          description: rawTranscript 
        });
        setAiError(enhancedResult.error || 'Transcription réussie mais amélioration IA échouée.');
      }
      
    } catch (error) {
      console.error('Error processing transcription:', error);
      setAiError('Erreur lors du traitement de la transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClientTypeChange = (type) => {
    setClientType(type);
    setNewClient(prev => ({ 
      ...prev, 
      type,
      // Reset professional-specific fields when switching to individual
      ...(type === 'particulier' && {
        city: '',
        country: '',
        postalCode: '',
        contactPerson: '',
        companySize: '',
        regNumber: '',
        peppolId: '',
        enablePeppol: false
      })
    }));
    // Clear any previous errors when user changes client type
    if (createError) setCreateError(null);
    if (createSuccess) setCreateSuccess(false);
  };

  // Enhanced validation logic
  const isFormValid = () => {
    // For lead_id cases: client must be successfully added (not just form filled)
    if (leadId) {
      // When lead_id is present, we need a successfully created client
      // Check for either selectedClient.id or selectedClient.value (the client ID)
      // If client has an ID/value, it's valid (either just added or restored from DB)
      const hasClientId = selectedClient && (selectedClient.id || selectedClient.value);
      const isClientValid = hasClientId || (clientAddedFromLead && selectedClient);
      
      // Check if project information is complete
      const isProjectValid = 
        projectInfo.categories && 
        projectInfo.categories.length > 0 &&
        projectInfo.deadline &&
        projectInfo.description &&
        projectInfo.description.trim().length > 0;

      // If "other" category is selected, custom category must be filled
      const isCustomCategoryValid = !projectInfo.categories?.includes('other') || 
        (projectInfo.customCategory && projectInfo.customCategory.trim().length > 0);



      return isClientValid && isProjectValid && isCustomCategoryValid;
    }

    // For normal cases: check if a client is selected (either existing or new)
    const isClientValid = selectedClient || (
      newClient.name && 
      newClient.email && 
      newClient.phone
    );

    // Check if project information is complete
    const isProjectValid = 
      projectInfo.categories && 
      projectInfo.categories.length > 0 &&
      projectInfo.deadline &&
      projectInfo.description &&
      projectInfo.description.trim().length > 0;

    // If "other" category is selected, custom category must be filled
    const isCustomCategoryValid = !projectInfo.categories?.includes('other') || 
      (projectInfo.customCategory && projectInfo.customCategory.trim().length > 0);



    return isClientValid && isProjectValid && isCustomCategoryValid;
  };

  const countryOptions = [
    { value: 'BE', label: 'Belgique' },
    { value: 'FR', label: 'France' },
    { value: 'CH', label: 'Suisse' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'CA', label: 'Canada' },
    { value: 'US', label: 'États-Unis' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'IT', label: 'Italie' },
    { value: 'ES', label: 'Espagne' },
    { value: 'NL', label: 'Pays-Bas' },
    { value: 'GB', label: 'Royaume-Uni' },
    { value: 'OTHER', label: 'Autre' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Users" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          {t('quoteCreation.clientSelection.title')}
        </h2>
        
        {!showNewClientForm ? (
          <div className="space-y-3 sm:space-y-4">
            {leadId && !clientAddedFromLead ? (
              <div className="text-center py-4">
                <Icon name="UserCheck" size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">{t('quoteCreation.clientSelection.clientPrefilledFromRequest', 'Client pré-rempli depuis la demande')}</p>
                <p className="text-xs text-muted-foreground">{t('quoteCreation.clientSelection.clickToEdit', 'Cliquez sur "Modifier les informations client" puis "Ajouter le client" pour continuer')}</p>
                <Button
                  variant="outline"
                  onClick={() => setShowNewClientForm(true)}
                  iconName="Edit"
                  iconPosition="left"
                  className="mt-3"
                >
                  Modifier les informations client
                </Button>
              </div>
            ) : (
              <>
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{t('quoteCreation.clientSelection.loading', 'Chargement des clients...')}</span>
              </div>
            ) : existingClients.length === 0 ? (
              <div className="text-center py-4">
                <Icon name="Users" size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">{t('quoteCreation.clientSelection.noClientsFound', 'Aucun client trouvé')}</p>
                <p className="text-xs text-muted-foreground">{t('quoteCreation.clientSelection.addFirstClient', 'Commencez par ajouter votre premier client')}</p>
              </div>
            ) : (
            <Select
              label={t('quoteCreation.clientSelection.selectExisting')}
              placeholder={t('quoteCreation.clientSelection.searchPlaceholder')}
              searchable
              clearable
              options={existingClients}
              value={selectedClient?.value || ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  // Clear selection
                  onClientSelect(null);
                } else {
                  // Select a client
                  const client = existingClients.find(c => c.value === e.target.value);
                  onClientSelect(client);
                }
              }}
              description={t('quoteCreation.clientSelection.searchDescription', 'Tapez pour rechercher parmi vos clients existants')}
            />
            )}
            
            <div className="flex items-center justify-center py-3 sm:py-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">{t('quoteCreation.clientSelection.or')}</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowNewClientForm(true)}
              iconName="Plus"
              iconPosition="left"
              fullWidth
            >
              {t('quoteCreation.clientSelection.createNew')}
            </Button>
              </>
            )}
            
            {/* Success message when client has been added from lead */}
            {leadId && clientAddedFromLead && (
              <div className="text-center py-4">
                <Icon name="CheckCircle" size={24} className="mx-auto text-green-600 mb-2" />
                <p className="text-sm text-green-700 font-medium mb-1">Client ajouté avec succès !</p>
                <p className="text-xs text-green-600">Vous pouvez maintenant passer à l'étape suivante</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {leadId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Icon name="Info" size={16} />
                  <span className="text-sm font-medium">Formulaire pré-rempli</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Les informations du client sont automatiquement remplies depuis la demande. Vous pouvez les modifier si nécessaire.
                </p>
              </div>
            )}
          <form onSubmit={handleNewClientSubmit} className="space-y-3 sm:space-y-4">
            {/* Error Display */}
            {createError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={16} className="text-destructive" />
                  <span className="text-sm text-destructive">{createError}</span>
                </div>
              </div>
            )}
            
            {/* Success Display */}
            {createSuccess && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success" />
                  <span className="text-sm text-success">Client créé avec succès !</span>
                </div>
              </div>
            )}
            
            {/* Client Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                {t('quoteCreation.clientSelection.clientType', 'Type de client')} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => !leadId || option.value === 'particulier' ? handleClientTypeChange(option.value) : null}
                    className={`p-3 rounded-lg border transition-colors ${
                      clientType === option.value
                        ? 'border-primary bg-primary/10' 
                        : leadId && option.value === 'professionnel'
                          ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                          : 'border-border hover:bg-muted/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon 
                        name={clientType === option.value ? 'CheckCircle' : 'Circle'} 
                        size={16} 
                        color={clientType === option.value ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} 
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Client Form */}
            {clientType === 'particulier' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('quoteCreation.clientSelection.fullName', 'Nom complet')}
                    type="text"
                    placeholder={t('quoteCreation.clientSelection.fullNamePlaceholder', 'Nom et prénom')}
                    value={newClient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="04 12 34 56 78"
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Adresse"
                    type="text"
                    placeholder="Adresse complète"
                    value={newClient.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Professional Client Form */}
            {clientType === 'professionnel' && !leadId && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('quoteCreation.clientSelection.companyName', 'Raison sociale')}
                    type="text"
                    placeholder={t('quoteCreation.clientSelection.companyNamePlaceholder', "Nom de l'entreprise")}
                    value={newClient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="04 12 34 56 78"
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                  
                  <Input
                    label="Adresse"
                    type="text"
                    placeholder="Adresse complète"
                    value={newClient.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                {/* Location fields - moved here after telephone and address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('quoteCreation.clientSelection.city', 'Ville')}
                    type="text"
                    placeholder={t('quoteCreation.clientSelection.cityPlaceholder', 'Bruxelles')}
                    value={newClient.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                  
                  <Select
                    label={t('quoteCreation.clientSelection.country', 'Pays')}
                    options={countryOptions}
                    value={newClient.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder={t('quoteCreation.clientSelection.selectCountry', 'Sélectionner le pays')}
                  />
                  
                  <Input
                    label={t('quoteCreation.clientSelection.postalCode', 'Code postal')}
                    type="text"
                    placeholder={t('quoteCreation.clientSelection.postalCodePlaceholder', '1000')}
                    value={newClient.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                </div>

                {/* Professional-specific fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t('quoteCreation.clientSelection.professionalInfo', 'Informations professionnelles')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('quoteCreation.clientSelection.contactPerson', 'Personne de contact')}
                      type="text"
                      placeholder={t('quoteCreation.clientSelection.contactPersonPlaceholder', 'Nom de la personne de contact')}
                      value={newClient.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    />
                    
                    <Select
                      label={t('quoteCreation.clientSelection.companySizeLabel', "Taille de l'entreprise")}
                      options={companySizeOptions}
                      value={newClient.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      placeholder={t('quoteCreation.clientSelection.selectSize', 'Sélectionner la taille')}
                    />
                    
                    <Input
                      label={t('quoteCreation.clientSelection.vatNumber', 'Numéro de TVA')}
                      type="text"
                      placeholder={t('quoteCreation.clientSelection.vatNumberPlaceholder', "Numéro de TVA ou d'enregistrement")}
                      value={newClient.regNumber}
                      onChange={(e) => handleInputChange('regNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* PEPPOL Configuration - only for professional clients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t('quoteCreation.clientSelection.peppolConfig', 'Configuration PEPPOL')}</h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePeppol"
                      checked={newClient.enablePeppol}
                      onChange={(e) => handleInputChange('enablePeppol', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="enablePeppol" className="text-sm font-medium text-foreground">
                      {t('quoteCreation.clientSelection.enablePeppol', 'Activer PEPPOL pour ce client')}
                    </label>
                  </div>
                  
                  {newClient.enablePeppol && (
                    <Input
                      label={t('quoteCreation.clientSelection.peppolId', 'Peppol ID du client')}
                      type="text"
                      placeholder={t('quoteCreation.clientSelection.peppolIdFormat', 'Format: 0000:IDENTIFIANT')}
                      value={newClient.peppolId}
                      onChange={(e) => handleInputChange('peppolId', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Communication Preferences */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                {t('quoteCreation.clientSelection.communicationPreferences', 'Préférences de communication')}
              </label>
                {leadId && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {t('quoteCreation.clientSelection.prefilledFromRequest', 'Pré-remplies depuis la demande')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {preferenceOptions.map((preference) => (
                  <div key={preference.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={preference.value}
                      checked={newClient.preferences.includes(preference.value)}
                      onChange={(e) => handlePreferenceToggle(preference.value)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor={preference.value} className="text-sm text-foreground">
                      {preference.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewClientForm(false);
                  // Reset form but preserve lead data for next time
                  if (leadId && leadClientData) {
                    // Reset to lead data instead of empty values
                    setNewClient({
                      name: leadClientData.name,
                      type: 'particulier',
                      email: leadClientData.email,
                      phone: leadClientData.phone,
                      address: leadClientData.address,
                      city: leadClientData.city,
                      country: leadClientData.country,
                      postalCode: leadClientData.postalCode,
                      contactPerson: '',
                      companySize: '',
                      regNumber: '',
                      peppolId: '',
                      enablePeppol: false,
                      preferences: Object.entries(leadClientData.communicationPreferences || {})
                        .filter(([_, value]) => value === true)
                        .map(([key, _]) => key)
                    });
                  } else {
                    // Reset to empty values for non-lead cases
                  setNewClient({ 
                    name: '', 
                    type: 'particulier', 
                    email: '', 
                    phone: '', 
                    address: '', 
                    city: '',
                    country: '',
                    postalCode: '',
                    contactPerson: '', 
                    companySize: '', 
                    regNumber: '', 
                    peppolId: '', 
                    enablePeppol: false, 
                    preferences: [] 
                  });
                  }
                  setClientType('particulier');
                }}
              >
                {t('quoteCreation.clientSelection.cancel', 'Annuler')}
              </Button>
              <Button
                type="submit"
                disabled={!newClient.name || !newClient.email || isCreatingClient}
                loading={isCreatingClient}
              >
                {isCreatingClient ? t('quoteCreation.clientSelection.creating', 'Création...') : t('quoteCreation.clientSelection.addClient', 'Ajouter le client')}
              </Button>
            </div>
          </form>
          </>
        )}
      </div>
      
      {selectedClient && (
        <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-semibold text-foreground">{selectedClient.label || selectedClient.name}</p>
              {selectedClient.type && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {selectedClient.type === 'particulier' ? t('quoteCreation.clientSelection.individual', 'Particulier') : t('quoteCreation.clientSelection.professional', 'Professionnel')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                {selectedClient.email && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="AtSign" size={12} className="text-primary" />{selectedClient.email}
                  </span>
                )}
                {selectedClient.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Phone" size={12} className="text-rose-500" />{selectedClient.phone}
                  </span>
                )}
                {(selectedClient.address || selectedClient.city || selectedClient.postalCode || selectedClient.postal_code) && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="MapPin" size={12} className="text-amber-600" />
                    {selectedClient.address || ''}{selectedClient.address && (selectedClient.city || selectedClient.postalCode || selectedClient.postal_code) ? ', ' : ''}
                    {selectedClient.city || ''} {selectedClient.postalCode || selectedClient.postal_code || ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {leadId && !clientAddedFromLead ? (
                <Button
                  onClick={handleQuickAddClient}
                  disabled={isCreatingClient || !selectedClient?.name || !selectedClient?.email}
                  iconName={isCreatingClient ? "Loader2" : "Plus"}
                  iconPosition="left"
                  size="sm"
                >
                  {isCreatingClient ? t('quoteCreation.clientSelection.creating', 'Création...') : t('quoteCreation.clientSelection.addClient', 'Ajouter le client')}
                </Button>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1">
                  <Icon name="CheckCircle" size={12} className="text-green-600" /> {t('quoteCreation.clientSelection.selected', 'Sélectionné')}
                </span>
              )}
            </div>
          </div>
          {createError && leadId && !clientAddedFromLead && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={14} className="text-destructive" />
                <span className="text-xs text-destructive">{createError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Information Section */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="FileText" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          {t('quoteCreation.projectInfo.title')}
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('quoteCreation.projectInfo.projectCategoryLabel', 'Catégories')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full h-11 pl-4 pr-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-left flex items-center justify-between"
              >
                <span className={projectInfo.categories?.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                  {projectInfo.categories?.length > 0 
                    ? projectInfo.categories.map(cat => categoryOptions.find(c => c.value === cat)?.label).join(', ')
                    : t('quoteCreation.projectInfo.selectCategories')
                  }
                </span>
                <div className="text-muted-foreground">
                  <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {/* Dropdown Options */}
              {categoryDropdownOpen && (
                <div className="category-dropdown absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 max-h-60 overflow-y-auto">
                  {categoryOptions.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        const currentCategories = projectInfo.categories || [];
                        const newCategories = currentCategories.includes(category.value)
                          ? currentCategories.filter(c => c !== category.value)
                          : [...currentCategories, category.value];
                        handleProjectChange('categories', newCategories);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground flex items-center rounded-sm ${
                        projectInfo.categories?.includes(category.value) ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center ${
                        projectInfo.categories?.includes(category.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {projectInfo.categories?.includes(category.value) && (
                          <Icon name="Check" className="w-3 h-3" />
                        )}
                      </div>
                      <span className="flex-1">{category.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Categories Display */}
            {projectInfo.categories && projectInfo.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {projectInfo.categories.map(category => {
                  const categoryInfo = categoryOptions.find(c => c.value === category);
                  return (
                    <span
                      key={category}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                    >
                      <Icon name="CheckCircle" size={14} className="text-primary" />
                      {categoryInfo?.label || category}
                      <button
                        type="button"
                        onClick={() => {
                          const newCategories = projectInfo.categories.filter(c => c !== category);
                          handleProjectChange('categories', newCategories);
                        }}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <Icon name="X" size={12} className="text-primary" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          {projectInfo.categories?.includes('other') && (
            <Input
              label={t('quoteCreation.projectInfo.otherCategory')}
              type="text"
              placeholder={t('quoteCreation.projectInfo.otherCategoryPlaceholder', 'Ex: Peinture murale spéciale')}
              value={projectInfo.customCategory}
              onChange={(e) => handleProjectChange('customCategory', e.target.value)}
              required
            />
          )}

          <div className="relative">
            <Input
              label={t('quoteCreation.projectInfo.deadline')}
              type="date"
              value={projectInfo.deadline}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleProjectChange('deadline', e.target.value)}
              required
            />
          </div>
          
                      <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                <span>{t('quoteCreation.projectInfo.description')}</span>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Icon name="Info" size={14} />
                  <span>{t('quoteCreation.projectInfo.aiAnalysis', "L'IA analyse la catégorie et votre contexte")}</span>
                </div>
              </label>
            <div className="relative">
              <textarea
                value={projectInfo.description}
                onChange={(e) => handleProjectChange('description', e.target.value)}
                rows={4}
                placeholder={t('quoteCreation.projectInfo.descriptionPlaceholder')}
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="xs"
                  iconName={isRecording ? "Square" : isTranscribing ? "Loader2" : "Mic"}
                  title={
                    isRecording 
                      ? t('quoteCreation.projectInfo.stopListening', `Arrêter l'écoute (${recordingTime}s)`)
                      : isTranscribing 
                        ? t('quoteCreation.projectInfo.transcribing', "Amélioration IA en cours...")
                        : t('quoteCreation.projectInfo.speakDescription', "Dicter la description")
                  }
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isGeneratingAI}
                  className={
                    isRecording 
                      ? "text-red-500 animate-pulse" 
                      : isTranscribing 
                        ? "animate-spin" 
                        : ""
                  }
                />
                <Button
                  variant="ghost"
                  size="xs"
                  iconName={isGeneratingAI ? "Loader2" : "Sparkles"}
                  title={
                    isGeneratingAI 
                      ? t('quoteCreation.projectInfo.generating', "Génération en cours...") 
                      : !isGoogleAIServiceAvailable() 
                        ? t('quoteCreation.projectInfo.aiUnavailable', "Service Google AI indisponible") 
                        : t('quoteCreation.projectInfo.enhanceWithAI', "Enrichir avec Google AI")
                  }
                  onClick={handleAIDescriptionGeneration}
                  disabled={isGeneratingAI || !isGoogleAIServiceAvailable()}
                  className={isGeneratingAI ? "animate-spin" : ""}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('quoteCreation.projectInfo.descriptionInstruction', 'Décrivez précisément le projet pour un devis adapté')}
            </p>
            
            {/* Recording Status */}
            {isRecording && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-700">
                    Écoute en cours... {recordingTime}s
                  </span>
                </div>
                {transcript && (
                  <div className="mt-2 p-2 bg-white rounded border border-red-100">
                    <p className="text-xs text-gray-600 mb-1">Texte détecté:</p>
                    <p className="text-sm text-gray-800">{transcript}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Transcription Status */}
            {isTranscribing && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Icon name="Loader2" size={14} className="animate-spin text-blue-600" />
                  <span className="text-xs text-blue-700">
                    Amélioration IA en cours...
                  </span>
                </div>
              </div>
            )}
            
            {/* AI Error Display */}
            {aiError && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={14} className="text-destructive" />
                  <span className="text-xs text-destructive">{aiError}</span>
                </div>
              </div>
            )}
            
            {/* Success Message - only after an AI action (generate or enhance) */}
            {!aiError && aiGenerated && !isRecording && !isTranscribing && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={14} className="text-green-600" />
                  <span className="text-xs text-green-700">
                    {transcript ? t('quoteCreation.projectInfo.dictatedDescription', 'Description dictée et améliorée par l\'IA') : t('quoteCreation.projectInfo.generatedDescription', 'Description générée avec succès par Google AI')}
                  </span>
                </div>
              </div>
            )}
            

          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end space-y-2">

        
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          iconName="ArrowRight"
          iconPosition="right"
          size="sm"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">{t('quoteCreation.navigation.nextStep')}</span>
          <span className="sm:hidden">{t('quoteCreation.navigation.next')}</span>
        </Button>
        
        {/* Help text when button is disabled due to lead_id */}
        {leadId && !clientAddedFromLead && (
          <div className="text-xs text-muted-foreground text-center sm:text-right">
            <Icon name="Info" size={12} className="inline mr-1" />
            {t('quoteCreation.clientSelection.addClientFirst', "Vous devez d'abord ajouter le client pour continuer")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSelection;