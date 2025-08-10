import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { fetchClients, createClient } from '../../../services/clientsService';

const ClientSelection = ({ selectedClient, projectInfo, onClientSelect, onProjectInfoChange, onNext }) => {
  const { t } = useTranslation();
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clientType, setClientType] = useState('particulier');
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

  const typeOptions = [
    { value: 'particulier', label: 'Particulier' },
    { value: 'professionnel', label: 'Professionnel' }
  ];

  const companySizeOptions = [
    { value: 'TPE', label: 'TPE (1-9 salariés)' },
    { value: 'PME', label: 'PME (10-249 salariés)' },
    { value: 'ETI', label: 'ETI (250-4999 salariés)' },
    { value: 'GE', label: 'Grande Entreprise (5000+ salariés)' }
  ];

  const preferenceOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'sms', label: 'SMS' },
    { value: 'mail', label: 'Courrier' }
  ];

  const categoryOptions = [
    { value: 'plomberie', label: 'Plomberie' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'menuiserie', label: 'Menuiserie' },
    { value: 'peinture', label: 'Peinture' },
    { value: 'maconnerie', label: 'Maçonnerie' },
    { value: 'carrelage', label: 'Carrelage' },
    { value: 'toiture', label: 'Toiture' },
    { value: 'chauffage', label: 'Chauffage' },
    { value: 'renovation', label: 'Rénovation générale' },
    { value: 'nettoyage', label: 'Nettoyage' },
    { value: 'solar', label: 'Installation solaire' },
    { value: 'jardinage', label: 'Jardinage' },
    { value: 'serrurerie', label: 'Serrurerie' },
    { value: 'vitrerie', label: 'Vitrerie' },
    { value: 'isolation', label: 'Isolation' },
    { value: 'climatisation', label: 'Climatisation' },
    { value: 'autre', label: 'Autre' }
  ];

  // Predefined tasks based on category
  const predefinedTasks = {
    plomberie: [
      'Installation robinetterie',
      'Réparation fuite',
      'Installation chauffe-eau',
      'Débouchage canalisation',
      'Installation WC',
      'Installation douche/baignoire',
      'Installation évier',
      'Installation machine à laver'
    ],
    electricite: [
      'Installation prise électrique',
      'Installation interrupteur',
      'Installation luminaire',
      'Mise aux normes électrique',
      'Installation tableau électrique',
      'Installation chauffage électrique',
      'Installation système d\'alarme',
      'Installation domotique'
    ],
    menuiserie: [
      'Installation porte',
      'Installation fenêtre',
      'Installation placard',
      'Installation escalier',
      'Installation parquet',
      'Installation lambris',
      'Installation meuble sur mesure',
      'Réparation meuble'
    ],
    peinture: [
      'Peinture mur intérieur',
      'Peinture plafond',
      'Peinture façade',
      'Peinture porte/fenêtre',
      'Peinture escalier',
      'Peinture meuble',
      'Application enduit',
      'Décoration murale'
    ],
    maconnerie: [
      'Construction mur',
      'Réparation fissure',
      'Installation cheminée',
      'Création ouverture',
      'Installation escalier béton',
      'Installation terrasse',
      'Installation allée',
      'Réparation façade'
    ],
    carrelage: [
      'Pose carrelage sol',
      'Pose carrelage mural',
      'Pose faïence salle de bain',
      'Pose carrelage cuisine',
      'Pose carrelage extérieur',
      'Installation plinthes',
      'Réparation carrelage',
      'Installation mosaïque'
    ],
    toiture: [
      'Installation tuiles',
      'Installation ardoises',
      'Installation zinc',
      'Installation gouttières',
      'Installation velux',
      'Réparation toiture',
      'Installation isolation toiture',
      'Installation cheminée'
    ],
    chauffage: [
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
        
        // Show success message
        setCreateSuccess(true);
        setTimeout(() => setCreateSuccess(false), 3000); // Hide after 3 seconds
        
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

  const handleProjectChange = (field, value) => {
    const updatedProjectInfo = { ...projectInfo, [field]: value };
    onProjectInfoChange(updatedProjectInfo);
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
    // Check if a client is selected (either existing or new)
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

    // If "autre" category is selected, custom category must be filled
    const isCustomCategoryValid = !projectInfo.categories?.includes('autre') || 
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
          Sélection du client
        </h2>
        
        {!showNewClientForm ? (
          <div className="space-y-3 sm:space-y-4">
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Chargement des clients...</span>
              </div>
            ) : existingClients.length === 0 ? (
              <div className="text-center py-4">
                <Icon name="Users" size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Aucun client trouvé</p>
                <p className="text-xs text-muted-foreground">Commencez par ajouter votre premier client</p>
              </div>
            ) : (
            <Select
              label="Choisir un client existant"
              placeholder="Rechercher un client..."
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
              description="Tapez pour rechercher parmi vos clients existants"
            />
            )}
            
            <div className="flex items-center justify-center py-3 sm:py-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">ou</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowNewClientForm(true)}
              iconName="Plus"
              iconPosition="left"
              fullWidth
            >
              Ajouter un nouveau client
            </Button>
          </div>
        ) : (
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
                Type de client *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleClientTypeChange(option.value)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      clientType === option.value
                        ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
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
                    label="Nom complet"
                    type="text"
                    placeholder="Nom et prénom"
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
            {clientType === 'professionnel' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Raison sociale"
                    type="text"
                    placeholder="Nom de l'entreprise"
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
                    label="Ville"
                    type="text"
                    placeholder="Bruxelles"
                    value={newClient.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                  
                  <Select
                    label="Pays"
                    options={countryOptions}
                    value={newClient.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Sélectionner le pays"
                  />
                  
                  <Input
                    label="Code postal"
                    type="text"
                    placeholder="1000"
                    value={newClient.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                </div>

                {/* Professional-specific fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations professionnelles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Personne de contact"
                      type="text"
                      placeholder="Nom de la personne de contact"
                      value={newClient.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    />
                    
                    <Select
                      label="Taille de l'entreprise"
                      options={companySizeOptions}
                      value={newClient.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      placeholder="Sélectionner la taille"
                    />
                    
                    <Input
                      label="Numéro de TVA"
                      type="text"
                      placeholder="Numéro de TVA ou d'enregistrement"
                      value={newClient.regNumber}
                      onChange={(e) => handleInputChange('regNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* PEPPOL Configuration - only for professional clients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Configuration PEPPOL</h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePeppol"
                      checked={newClient.enablePeppol}
                      onChange={(e) => handleInputChange('enablePeppol', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label htmlFor="enablePeppol" className="text-sm font-medium text-foreground">
                      Activer PEPPOL pour ce client
                    </label>
                  </div>
                  
                  {newClient.enablePeppol && (
                    <Input
                      label="Peppol ID du client"
                      type="text"
                      placeholder="Format: 0000:IDENTIFIANT"
                      value={newClient.peppolId}
                      onChange={(e) => handleInputChange('peppolId', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Communication Preferences */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Préférences de communication
              </label>
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
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!newClient.name || !newClient.email || isCreatingClient}
                loading={isCreatingClient}
              >
                {isCreatingClient ? 'Création...' : 'Ajouter le client'}
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {selectedClient && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <Icon name="CheckCircle" size={18} className="sm:w-5 sm:h-5 text-success mr-2 sm:mr-3" />
            <div>
              <p className="text-sm sm:text-base font-medium text-foreground">{selectedClient.label}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{selectedClient.description}</p>
              {selectedClient.type && (
                <p className="text-xs text-muted-foreground">
                  Type: {selectedClient.type === 'particulier' ? 'Particulier' : 'Professionnel'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Information Section */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="FileText" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Informations projet
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <Select
            label="Catégorie"
            placeholder="Sélectionner une ou plusieurs catégories"
            options={categoryOptions}
            value={projectInfo.categories || []}
            onChange={(e) => {
              const selectedCategories = Array.isArray(e.target.value) 
                ? e.target.value 
                : [e.target.value];
              handleProjectChange('categories', selectedCategories);
            }}
            multiple
            required
          />
          
          {projectInfo.categories?.includes('autre') && (
            <Input
              label="Catégorie personnalisée"
              type="text"
              placeholder="Ex: Peinture murale spéciale"
              value={projectInfo.customCategory}
              onChange={(e) => handleProjectChange('customCategory', e.target.value)}
              required
            />
          )}

          <div className="relative">
            <Input
              label="Date"
              type="date"
              value={projectInfo.deadline}
              onChange={(e) => handleProjectChange('deadline', e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Icon name="Calendar" size={16} className="text-muted-foreground" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description du projet
            </label>
            <div className="relative">
              <textarea
                value={projectInfo.description}
                onChange={(e) => handleProjectChange('description', e.target.value)}
                rows={4}
                placeholder="Ex: Pose de parquet dans salon 20m²"
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="xs"
                  iconName="Mic"
                  title="Dicter la description"
                />
                <Button
                  variant="ghost"
                  size="xs"
                  iconName="Sparkles"
                  title="Enrichir avec l'IA"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Décrivez précisément le projet pour un devis adapté
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          iconName="ArrowRight"
          iconPosition="right"
          size="sm"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Étape suivante</span>
          <span className="sm:hidden">Suivant</span>
        </Button>
      </div>
    </div>
  );
};

export default ClientSelection;