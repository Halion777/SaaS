import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { fetchClients, createClient } from '../../../services/clientsService';
import { useMultiUser } from '../../../context/MultiUserContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { generateProjectDescriptionWithGemini, isGoogleAIServiceAvailable } from '../../../services/googleAIService';
import { generateTaskSuggestionsWithGemini } from '../../../services/googleAIService';
import { enhanceTranscriptionWithAI } from '../../../services/googleAIService';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { generateQuoteNumber } from '../../../services/quotesService';
import { getPeppolVATSchemeId } from '../../../utils/peppolSchemes';
import { getClientCountryOptions } from '../../../utils/countryList';

const ClientSelection = ({ selectedClient, projectInfo, onClientSelect, onProjectInfoChange, onNext, leadId, userId, isSaving = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, subscriptionLimits } = useMultiUser();
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
    firstName: '',
    lastName: '',
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
    preferences: [],
    languagePreference: 'fr'
  });

  const [existingClients, setExistingClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [clientsRefreshTrigger, setClientsRefreshTrigger] = useState(0);
  const [monthlyClientsAdded, setMonthlyClientsAdded] = useState(0);
  const [clientLimitReached, setClientLimitReached] = useState(false);
  
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
      // Split name into firstName and lastName for individual clients
      let firstName = '';
      let lastName = '';
      if (selectedClient.name) {
        const nameParts = selectedClient.name.trim().split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }
      
      setNewClient({
        name: selectedClient.name || '',
        firstName: firstName,
        lastName: lastName,
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
        preferences: preferences,
        languagePreference: selectedClient.languagePreference || selectedClient.language_preference || 'fr'
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

  // Check monthly clients added for Starter plan
  useEffect(() => {
    const checkMonthlyClients = async () => {
      if (!user?.id) return;
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());
        
        setMonthlyClientsAdded(count || 0);
        
        // Check if limit is reached
        const isStarterPlan = userProfile?.selected_plan === 'starter';
        const limit = subscriptionLimits?.clientsPerMonth || 30;
        if (isStarterPlan && limit > 0 && (count || 0) >= limit) {
          setClientLimitReached(true);
        } else {
          setClientLimitReached(false);
        }
      } catch (error) {
        console.error('Error checking monthly clients:', error);
      }
    };
    
    checkMonthlyClients();
  }, [user?.id, userProfile, subscriptionLimits, clientsRefreshTrigger]);

  // Ensure selected client is in existingClients array (for lead quotes after refresh)
  useEffect(() => {
    if (selectedClient && (selectedClient.value || selectedClient.id)) {
      // Get the client ID to check
      const clientId = selectedClient.id || selectedClient.value;
      
      if (!clientId) return;
      
      // Check if selected client is already in the array
      const isInArray = existingClients.some(c => 
        c.value === clientId || 
        c.id === clientId ||
        (c.client && c.client.id === clientId)
      );
      
      if (!isInArray) {
        // Client is selected but not in the array (e.g., restored from localStorage after refresh)
        // Add it to the array so it appears in the dropdown
        const clientObj = selectedClient.client || selectedClient;
        // Extract name from label if it has icon prefix (e.g., "👤 John" -> "John")
        let clientName = selectedClient.name || clientObj?.name || '';
        if (!clientName && selectedClient.label) {
          // Remove icon prefix from label if present
          clientName = selectedClient.label.replace(/^[👤🏢]\s*/, '');
        }
        const clientType = selectedClient.type || clientObj?.type || 'particulier';
        const nameIcon = clientType === 'professionnel' ? '🏢' : '👤';
        
        const clientToAdd = {
          value: clientId,
          label: `${nameIcon} ${clientName}`,
          description: `${selectedClient.email || clientObj?.email || ''} ${selectedClient.phone || clientObj?.phone ? '📞 ' + (selectedClient.phone || clientObj?.phone) : ''}`.trim(),
          type: clientType,
          client: clientObj,
          address: selectedClient.address || clientObj?.address,
          city: selectedClient.city || clientObj?.city,
          postalCode: selectedClient.postalCode || clientObj?.postalCode || clientObj?.postal_code,
          country: selectedClient.country || clientObj?.country || 'BE',
          email: selectedClient.email || clientObj?.email,
          phone: selectedClient.phone || clientObj?.phone,
          id: clientId
        };
        
        // Add to the beginning of the array so it's visible
        setExistingClients(prev => {
          // Check again to avoid duplicates
          const alreadyExists = prev.some(c => 
            c.value === clientToAdd.value || 
            c.id === clientToAdd.id ||
            (c.client && c.client.id === clientToAdd.id)
          );
          if (alreadyExists) return prev;
          return [clientToAdd, ...prev];
        });
      }
    }
  }, [selectedClient, existingClients]);

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
    // Validate all required fields - consistent with Client Management
    const isIndividualValid = newClient.firstName.trim() && newClient.lastName.trim() && newClient.email.trim() && newClient.phone.trim() && newClient.address.trim() && newClient.city.trim() && newClient.country.trim() && newClient.postalCode.trim();
    const isProfessionalValid = newClient.name.trim() && newClient.email.trim() && newClient.phone.trim() && newClient.address.trim() && newClient.city.trim() && newClient.country.trim() && newClient.postalCode.trim() && newClient.contactPerson.trim() && newClient.companySize.trim() && newClient.regNumber.trim();
    
    if (clientType === 'particulier' && !isIndividualValid) {
      alert(t('quoteCreation.clientSelection.validation.individualRequired', 'Veuillez remplir tous les champs obligatoires pour un client particulier'));
      return;
    }
    if (clientType === 'professionnel' && !isProfessionalValid) {
      alert(t('quoteCreation.clientSelection.validation.professionalRequired', 'Veuillez remplir tous les champs obligatoires pour un client professionnel'));
      return;
    }

    if (newClient.email && !/\S+@\S+\.\S+/.test(newClient.email)) {
      alert(t('errors.invalidEmail'));
      return;
    }

    if (newClient.phone && !/^\+?[0-9]{10,15}$/.test(newClient.phone.replace(/\s/g, ''))) {
      alert(t('errors.invalidPhone'));
      return;
    }

    if (newClient.enablePeppol && newClient.peppolId.trim() && !validatePeppolId(newClient.peppolId.trim())) {
      alert(t('clientManagement.modal.invalidPeppolId'));
      return;
    }
    
    if (isIndividualValid || isProfessionalValid) {
      try {
        setIsCreatingClient(true);
        setCreateError(null);
        setCreateSuccess(false);
        
        // Prepare client data - combine firstName and lastName for individual clients
        const clientData = { ...newClient, type: clientType };
        if (clientType === 'particulier') {
          // Combine firstName and lastName into name for backend
          const fullName = [newClient.firstName, newClient.lastName].filter(Boolean).join(' ').trim();
          clientData.name = fullName;
        }
        
        // Create client in the backend
        const { data: createdClient, error } = await createClient(clientData);
        
        if (error) {
          console.error('Error creating client:', error);
          
          // Handle client limit reached error with upgrade message
          if (error.code === 'CLIENT_LIMIT_REACHED') {
            const limitMessage = t('clientManagement.errors.clientLimitReached', {
              limit: error.limit,
              current: error.current,
              defaultValue: `You have reached your monthly client limit (${error.current}/${error.limit}). This limit resets at the start of each month. Upgrade to Pro for unlimited clients.`
            });
            setCreateError(limitMessage);
            setClientLimitReached(true);
            return;
          }
          
          // Handle duplicate validation errors with user-friendly messages
          let errorMessage = t('clientManagement.errors.createFailed', { defaultValue: 'Erreur lors de la création du client' });
          if (error.code === 'DUPLICATE_EMAIL') {
            errorMessage = t('clientManagement.errors.duplicateEmail', { email: clientData.email, defaultValue: `A client with email "${clientData.email}" already exists. Please use a different email address.` });
          } else {
            // Note: Peppol ID uniqueness check removed - clients can share the same Peppol ID
            errorMessage = error.message || errorMessage;
          }
          
          setCreateError(errorMessage);
          return;
        }
        
        // Reset limit reached flag on successful creation
        setClientLimitReached(false);
        
        // Format the created client for selection
      const formattedClientData = {
          value: createdClient.id,
          label: clientType === 'professionnel' 
            ? `${createdClient.name}`
            : createdClient.name,
          description: `${createdClient.email} • ${createdClient.phone}`,
        type: clientType,
          client: createdClient,
          address: createdClient.address,
          city: createdClient.city,
          postalCode: createdClient.postalCode,
          country: createdClient.country,
          email: createdClient.email,
          phone: createdClient.phone
      };
        
        // Select the newly created client
      onClientSelect(formattedClientData);
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
        firstName: '',
        lastName: '',
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
        preferences: [],
        languagePreference: 'fr'
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

  // Helper function to extract country code from VAT number
  const extractCountryFromVAT = (vatNumber) => {
    if (!vatNumber || vatNumber.length < 2) return null;
    // Check if VAT number starts with country code (e.g., BE123456789)
    const firstTwo = vatNumber.substring(0, 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(firstTwo)) {
      return firstTwo;
    }
    return null;
  };

  // Helper function to clean VAT number (remove country prefix and non-alphanumeric)
  const cleanVATNumber = (vatNumber) => {
    if (!vatNumber) return '';
    // Remove country prefix if present
    let cleaned = vatNumber.replace(/^[A-Z]{2}/i, '');
    // Remove all non-alphanumeric characters
    cleaned = cleaned.replace(/[^A-Z0-9]/gi, '');
    return cleaned.toUpperCase();
  };

  // Helper function to format Peppol ID from VAT number
  const formatPeppolIdFromVAT = (vatNumber, countryCode) => {
    if (!vatNumber || !vatNumber.trim()) return '';
    
    // Extract country from VAT number or use provided country code
    let country = extractCountryFromVAT(vatNumber) || countryCode || 'BE';
    country = country.toUpperCase();
    
    // Clean VAT number (remove country prefix and special characters)
    const cleanedVAT = cleanVATNumber(vatNumber);
    
    if (!cleanedVAT) return '';
    
    // Get scheme ID for the country
    const schemeId = getPeppolVATSchemeId(country);
    if (!schemeId) return '';
    
    // Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    // For Belgium: 9925:BE1009915101
    // For other countries: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    return `${schemeId}:${country}${cleanedVAT}`;
  };

  const handleInputChange = (field, value) => {
    setNewClient(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill Peppol ID when VAT number is entered for professional clients
      if (field === 'regNumber' && clientType === 'professionnel') {
        if (value && value.trim()) {
        const countryCode = prev.country || 'BE';
        const peppolId = formatPeppolIdFromVAT(value, countryCode);
        
        if (peppolId) {
          updated.peppolId = peppolId;
          updated.enablePeppol = true; // Auto-enable Peppol when VAT is entered
          }
        } else {
          // Clear Peppol ID if VAT is cleared
          updated.peppolId = '';
          updated.enablePeppol = false;
        }
      }
      
      // Update Peppol ID if country changes and VAT number exists
      if (field === 'country' && clientType === 'professionnel' && prev.regNumber && prev.regNumber.trim()) {
        const peppolId = formatPeppolIdFromVAT(prev.regNumber, value);
        if (peppolId) {
          updated.peppolId = peppolId;
          updated.enablePeppol = true; // Auto-enable Peppol when country changes and VAT exists
        }
      }
      
      return updated;
    });
    
    // Clear any previous errors when user starts typing
    if (createError) setCreateError(null);
    if (createSuccess) setCreateSuccess(false);
  };

  // Quick add client function for lead quotes
  const handleQuickAddClient = async () => {
    if (!leadId || !selectedClient || !selectedClient.name || !selectedClient.email) {
      return;
    }

    // Check if limit is reached before allowing creation
    if (limitReached || clientLimitReached) {
      setCreateError(t('clientManagement.limitReached.submitError', {
        current: monthlyClientsAdded,
        limit: clientLimit,
        defaultValue: `You have reached your monthly client limit (${monthlyClientsAdded}/${clientLimit}). Please upgrade to Pro to add more clients.`
      }));
      return;
    }

    try {
      setIsCreatingClient(true);
      setCreateError(null);
      
      // Create client using pre-filled data from lead
      // Get name from name property or extract from label
      const clientName = selectedClient.name || (selectedClient.label ? selectedClient.label.replace(/^[👤🏢]\s*/, '') : '');
      
      const { data: createdClient, error } = await createClient({
        name: clientName,
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
        preferences: selectedClient.communicationPreferences ? Object.keys(selectedClient.communicationPreferences).filter(key => selectedClient.communicationPreferences[key]) : [],
        languagePreference: selectedClient.languagePreference || selectedClient.language_preference || 'fr'
      });
      
      if (error) {
        console.error('Error creating client from lead:', error);
        
        // Handle client limit reached error with upgrade message
        if (error.code === 'CLIENT_LIMIT_REACHED') {
          const limitMessage = t('clientManagement.errors.clientLimitReached', {
            limit: error.limit,
            current: error.current,
            defaultValue: `You have reached your monthly client limit (${error.current}/${error.limit}). This limit resets at the start of each month. Upgrade to Pro for unlimited clients.`
          });
          setCreateError(limitMessage);
          setClientLimitReached(true);
          return;
        }
        
        // Handle duplicate validation errors with user-friendly messages
        let errorMessage = t('clientManagement.errors.createFailed', { defaultValue: 'Erreur lors de la création du client' });
        if (error.code === 'DUPLICATE_EMAIL') {
          errorMessage = t('clientManagement.errors.duplicateEmail', { email: selectedClient.email, defaultValue: `A client with email "${selectedClient.email}" already exists. Please use a different email address.` });
        } else {
          // Note: Peppol ID uniqueness check removed - clients can share the same Peppol ID
          errorMessage = error.message || errorMessage;
        }
        
        setCreateError(errorMessage);
        return;
      }
      
      // Reset limit reached flag on successful creation
      setClientLimitReached(false);
      
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

  const countryOptions = getClientCountryOptions(t);

  // Check if client limit is reached for Starter plan
  // Only check limit if we have subscription data loaded
  const isStarterPlan = userProfile?.selected_plan === 'starter';
  const clientLimit = subscriptionLimits?.clientsPerMonth || 30;
  // Only consider limit reached if we have subscription data and are actually at the limit
  const limitReached = userProfile && subscriptionLimits && isStarterPlan && clientLimit > 0 && monthlyClientsAdded >= clientLimit;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Users" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          {t('quoteCreation.clientSelection.title')}
        </h2>
        
        {/* Client Limit Reached Banner */}
        {(limitReached || clientLimitReached) && (
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertCircle" size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-900 mb-1">
                    {t('clientManagement.limitReached.title', 'Monthly Client Limit Reached')}
                  </h3>
                  <p className="text-sm text-orange-800">
                    {t('clientManagement.limitReached.message', {
                      current: monthlyClientsAdded,
                      limit: clientLimit,
                      defaultValue: `You have reached your monthly client limit (${monthlyClientsAdded}/${clientLimit}). This limit resets at the start of each month. Upgrade to Pro for unlimited clients.`
                    })}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/subscription')}
                className="w-full sm:w-auto flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <Icon name="ArrowUp" size={16} className="mr-2" />
                {t('clientManagement.limitReached.upgradeButton', 'Upgrade to Pro')}
              </Button>
            </div>
          </div>
        )}
        
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
              searchPlaceholder={t('quoteCreation.clientSelection.searchPlaceholder', 'Rechercher des clients...')}
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
              maxHeight="300px"
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
              <div className={`rounded-lg p-3 ${clientLimitReached ? 'bg-orange-50 border border-orange-200' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-start gap-3">
                  <Icon name="AlertCircle" size={16} className={clientLimitReached ? 'text-orange-600 mt-0.5' : 'text-destructive mt-0.5'} />
                  <div className="flex-1">
                    <span className={`text-sm ${clientLimitReached ? 'text-orange-800' : 'text-destructive'}`}>{createError}</span>
                    {clientLimitReached && (
                      <div className="mt-2">
                        <Button
                          onClick={() => navigate('/subscription')}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="sm"
                        >
                          <Icon name="ArrowUp" size={14} className="mr-2" />
                          {t('clientManagement.limitReached.upgradeButton', 'Upgrade to Pro')}
                        </Button>
                      </div>
                    )}
                  </div>
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
                {t('quoteCreation.clientSelection.clientType', 'Type de client')} <span className="text-red-500">*</span>
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
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="User" size={20} />
                    {t('clientManagement.modal.personalInfo', 'Personal Information')}
                  </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                        label={t('registerForm.step1.firstName', 'First Name')}
                    type="text"
                        placeholder={t('registerForm.step1.firstNamePlaceholder', 'John')}
                        value={newClient.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                  
                  <Input
                        label={t('registerForm.step1.lastName', 'Last Name')}
                        type="text"
                        placeholder={t('registerForm.step1.lastNamePlaceholder', 'Doe')}
                        value={newClient.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={t('clientManagement.modal.email')}
                    type="email"
                        placeholder={t('clientManagement.modal.emailPlaceholder')}
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                
                  <Input
                        label={t('clientManagement.modal.phone')}
                    type="tel"
                        placeholder={t('clientManagement.modal.phonePlaceholder')}
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="MapPin" size={20} />
                    {t('clientManagement.modal.locationInfo', 'Location Information')}
                  </h3>
                  <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                        label={t('clientManagement.modal.country')}
                    options={countryOptions}
                    value={newClient.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder={t('clientManagement.modal.countryPlaceholder')}
                        required
                  />
                  
                  <Input
                        label={t('clientManagement.modal.city')}
                    type="text"
                        placeholder={t('clientManagement.modal.cityPlaceholder')}
                        value={newClient.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label={t('clientManagement.modal.postalCode')}
                        type="text"
                        placeholder={t('clientManagement.modal.postalCodePlaceholder')}
                    value={newClient.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                      
                      <div className="md:col-span-2">
                        <Input
                          label={t('clientManagement.modal.address')}
                          type="text"
                          placeholder={t('clientManagement.modal.addressPlaceholder', 'Street name + number (e.g., Rue de la Paix 123)')}
                          value={newClient.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required
                  />
                </div>
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    {t('clientManagement.modal.preferences', 'Preferences')}
                  </h3>
                  <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.languagePreference')}
                  </label>
                  <Select
                    value={newClient.languagePreference || 'fr'}
                    onChange={(e) => handleInputChange('languagePreference', e.target.value)}
                    options={[
                      { value: 'fr', label: '🇫🇷 Français' },
                      { value: 'en', label: '🇬🇧 English' },
                      { value: 'nl', label: '🇳🇱 Nederlands' }
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                        {t('clientManagement.modal.languagePreferenceHelp')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">
                        {t('quoteCreation.clientSelection.communicationPreferences', 'Préférences de communication')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {preferenceOptions.map((preference) => (
                          <div key={preference.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`individual-${preference.value}`}
                              checked={newClient.preferences.includes(preference.value)}
                              onChange={(e) => handlePreferenceToggle(preference.value)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                            />
                            <label htmlFor={`individual-${preference.value}`} className="text-sm text-foreground">
                              {preference.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Client Form */}
            {clientType === 'professionnel' && !leadId && (
              <div className="space-y-6">
                {/* Company Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Briefcase" size={20} />
                    {t('clientManagement.modal.companyInfo', 'Company Information')}
                  </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                        label={t('clientManagement.modal.companyName')}
                    type="text"
                        placeholder={t('clientManagement.modal.companyNamePlaceholder')}
                    value={newClient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  
                  <Input
                        label={t('clientManagement.modal.email')}
                    type="email"
                        placeholder={t('clientManagement.modal.emailPlaceholder')}
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                        label={t('clientManagement.modal.phone')}
                    type="tel"
                        placeholder={t('clientManagement.modal.phonePlaceholder')}
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="MapPin" size={20} />
                    {t('clientManagement.modal.locationInfo', 'Location Information')}
                  </h3>
                  <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                        label={t('clientManagement.modal.country')}
                    options={countryOptions}
                    value={newClient.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder={t('clientManagement.modal.countryPlaceholder')}
                        required
                  />
                  
                  <Input
                        label={t('clientManagement.modal.city')}
                    type="text"
                        placeholder={t('clientManagement.modal.cityPlaceholder')}
                        value={newClient.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label={t('clientManagement.modal.postalCode')}
                        type="text"
                        placeholder={t('clientManagement.modal.postalCodePlaceholder')}
                    value={newClient.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                      
                      <div className="md:col-span-2">
                        <Input
                          label={t('clientManagement.modal.address')}
                          type="text"
                          placeholder={t('clientManagement.modal.addressPlaceholder', 'Street name + number (e.g., Rue de la Paix 123)')}
                          value={newClient.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required
                  />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Building" size={20} />
                    {t('clientManagement.modal.professionalInfo')}
                  </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={t('clientManagement.modal.contactPerson')}
                      type="text"
                        placeholder={t('clientManagement.modal.contactPersonPlaceholder')}
                      value={newClient.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        required
                    />
                    
                    <Select
                        label={t('clientManagement.modal.companySize')}
                      options={companySizeOptions}
                      value={newClient.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                        placeholder={t('clientManagement.modal.companySizePlaceholder')}
                        required
                    />
                    
                    <Input
                        label={t('clientManagement.modal.vatNumber')}
                      type="text"
                        placeholder={t('clientManagement.modal.vatNumberPlaceholder')}
                      value={newClient.regNumber}
                      onChange={(e) => handleInputChange('regNumber', e.target.value)}
                        required
                    />
                  </div>
                </div>
                  </div>
                  
                {/* Preferences */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    {t('clientManagement.modal.preferences', 'Preferences')}
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {t('clientManagement.modal.languagePreference')}
                      </label>
                      <Select
                        value={newClient.languagePreference || 'fr'}
                        onChange={(e) => handleInputChange('languagePreference', e.target.value)}
                        options={[
                          { value: 'fr', label: '🇫🇷 Français' },
                          { value: 'en', label: '🇬🇧 English' },
                          { value: 'nl', label: '🇳🇱 Nederlands' }
                        ]}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('clientManagement.modal.languagePreferenceHelp')}
                      </p>
                </div>

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
                              id={`professional-${preference.value}`}
                      checked={newClient.preferences.includes(preference.value)}
                      onChange={(e) => handlePreferenceToggle(preference.value)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                            <label htmlFor={`professional-${preference.value}`} className="text-sm text-foreground">
                      {preference.label}
                    </label>
                  </div>
                ))}
                      </div>
                    </div>
              </div>
            </div>

                {/* PEPPOL Configuration - only for professional clients */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="Globe" size={20} />
                    {t('quoteCreation.clientSelection.peppolConfig', 'Configuration PEPPOL')}
                  </h3>
                  <div className="space-y-4">
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
              </div>
            )}

            
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
                        .map(([key, _]) => key),
                      languagePreference: leadClientData.languagePreference || leadClientData.language_preference || (leadClientData.communicationPreferences?.language_preference) || 'fr'
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
                    preferences: [],
                    languagePreference: 'fr'
                  });
                  }
                  setClientType('particulier');
                }}
              >
                {t('quoteCreation.clientSelection.cancel', 'Annuler')}
              </Button>
              <Button
                type="submit"
                disabled={
                  limitReached || clientLimitReached ||
                  (clientType === 'particulier' 
                    ? (!newClient.firstName?.trim() || !newClient.lastName?.trim()) 
                    : !newClient.name?.trim()) 
                  || !newClient.email?.trim() 
                  || isCreatingClient
                }
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
                  disabled={
                    isCreatingClient || 
                    !selectedClient ||
                    !(selectedClient.name || (selectedClient.label && selectedClient.label.replace(/^[👤🏢]\s*/, ''))) ||
                    !selectedClient.email || 
                    (userProfile && subscriptionLimits && (limitReached || clientLimitReached))
                  }
                  iconName={isCreatingClient ? "Loader2" : "Plus"}
                  iconPosition="left"
                  size="sm"
                  title={
                    (limitReached || clientLimitReached) && userProfile && subscriptionLimits
                      ? t('clientManagement.limitReached.disabledTooltip', 'Upgrade to Pro to add more clients')
                      : (!selectedClient || !(selectedClient.name || selectedClient.label) || !selectedClient.email)
                        ? t('quoteCreation.clientSelection.fillClientInfo', 'Please fill in client name and email information')
                        : ''
                  }
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
                <span className={`flex-1 truncate ${projectInfo.categories?.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {projectInfo.categories?.length > 0 
                    ? (
                      <>
                        <span className="hidden sm:inline">
                          {projectInfo.categories.map(cat => categoryOptions.find(c => c.value === cat)?.label).join(', ')}
                        </span>
                        <span className="sm:hidden">
                          {projectInfo.categories.length === 1 
                            ? categoryOptions.find(c => c.value === projectInfo.categories[0])?.label
                            : `${projectInfo.categories.length} ${t('quoteCreation.projectInfo.categoriesSelected', 'categories selected')}`
                          }
                        </span>
                      </>
                    )
                    : t('quoteCreation.projectInfo.selectCategories')
                  }
                </span>
                <div className="text-muted-foreground flex-shrink-0 ml-2">
                  <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {/* Dropdown Options */}
              {categoryDropdownOpen && (
                <div className="category-dropdown absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-10 flex flex-col max-h-60">
                  <div className="overflow-y-auto flex-1">
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
                  
                  {/* Ok Button */}
                  <div className="border-t border-border p-2 bg-popover sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="w-full px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {t('quoteCreation.projectInfo.done', 'Ok')}
                    </button>
                  </div>
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
          disabled={!isFormValid() || isSaving}
          iconName="ArrowRight"
          iconPosition="right"
          size="sm"
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            t('quoteCreation.navigation.saving', 'Saving...')
          ) : (
            <>
          <span className="hidden sm:inline">{t('quoteCreation.navigation.nextStep')}</span>
          <span className="sm:hidden">{t('quoteCreation.navigation.next')}</span>
            </>
          )}
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