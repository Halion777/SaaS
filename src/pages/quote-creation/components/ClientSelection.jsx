import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ClientSelection = ({ selectedClient, projectInfo, onClientSelect, onProjectInfoChange, onNext }) => {
  const { t } = useTranslation();
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clientType, setClientType] = useState('individual');
  const [newClient, setNewClient] = useState({
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    companySize: '',
    regNumber: '',
    peppolId: '',
    enablePeppol: false,
    preferences: []
  });

  const existingClients = [
    { value: '1', label: 'Jean Martin - Plomberie Martin', description: 'jean.martin@email.com • 06 12 34 56 78', type: 'professional' },
    { value: '2', label: 'Marie Dubois - Électricité Pro', description: 'marie.dubois@email.com • 06 87 65 43 21', type: 'professional' },
    { value: '3', label: 'Pierre Leroy - Menuiserie Leroy', description: 'pierre.leroy@email.com • 06 11 22 33 44', type: 'professional' },
    { value: '4', label: 'Sophie Bernard - Peinture Déco', description: 'sophie.bernard@email.com • 06 55 66 77 88', type: 'professional' },
    { value: '5', label: 'Thomas Petit - Maçonnerie TP', description: 'thomas.petit@email.com • 06 99 88 77 66', type: 'professional' }
  ];

  const typeOptions = [
    { value: 'individual', label: 'Particulier' },
    { value: 'professional', label: 'Professionnel' }
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

  const handleNewClientSubmit = (e) => {
    e.preventDefault();
    if (newClient.name && newClient.email) {
      const clientData = {
        value: `new_${Date.now()}`,
        label: clientType === 'professional' 
          ? `${newClient.name}${newClient.company ? ` - ${newClient.company}` : ''}`
          : newClient.name,
        description: `${newClient.email} • ${newClient.phone}`,
        type: clientType,
        ...newClient
      };
      onClientSelect(clientData);
      setShowNewClientForm(false);
      setNewClient({ name: '', type: 'individual', email: '', phone: '', address: '', company: '', contactPerson: '', companySize: '' });
      setClientType('individual');
    }
  };

  const handleInputChange = (field, value) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
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
    setNewClient(prev => ({ ...prev, type }));
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Users" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Sélection du client
        </h2>
        
        {!showNewClientForm ? (
          <div className="space-y-3 sm:space-y-4">
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
            {clientType === 'individual' && (
              <div className="space-y-3 sm:space-y-4">
                <Input
                  label="Nom complet"
                  type="text"
                  placeholder="Jean Martin"
                  value={newClient.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jean.martin@email.com"
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                
                <Input
                  label="Adresse"
                  type="text"
                  placeholder="123 Rue de la République, 75001 Paris"
                  value={newClient.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            )}

            {/* Professional Client Form */}
            {clientType === 'professional' && (
              <>
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Informations de base</h3>
                  
                  <Input
                    label="Nom / Raison sociale"
                    type="text"
                    value={newClient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nom du client ou de l'entreprise"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@exemple.com"
                      required
                    />
                    
                    <Input
                      label="Téléphone"
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      required
                    />
                  </div>

                  <Input
                    label="Adresse"
                    type="text"
                    value={newClient.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Adresse complète"
                  />
                </div>

                {/* Professional-specific fields */}
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-foreground">Informations entreprise</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Personne de contact"
                      type="text"
                      value={newClient.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Nom du contact principal"
                    />
                    
                    <Select
                      label="Taille de l'entreprise"
                      options={companySizeOptions}
                      value={newClient.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      placeholder="Sélectionner la taille"
                    />
                  </div>
                  
                  <Input
                    label={t('registerForm.step1.vatNumber')}
                    type="text"
                    value={newClient.regNumber}
                    onChange={(e) => handleInputChange('regNumber', e.target.value)}
                    placeholder={t('registerForm.step1.vatNumberPlaceholder')}
                  />
                </div>

                {/* Peppol Configuration */}
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-foreground">Configuration Peppol</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="enablePeppol"
                        checked={newClient.enablePeppol}
                        onChange={(e) => handleInputChange('enablePeppol', e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <label htmlFor="enablePeppol" className="text-sm font-medium">
                        Activer l'envoi de factures via Peppol
                      </label>
                    </div>
                    
                    {newClient.enablePeppol && (
                      <div className="space-y-4 pl-7">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 mb-1">Facturation électronique Peppol</h4>
                              <p className="text-sm text-blue-700">
                                L'envoi de factures via Peppol nécessite un identifiant Peppol valide du client.
                                Contactez votre client pour obtenir son Peppol ID.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            label="Peppol ID du client *"
                            type="text"
                            value={newClient.peppolId}
                            onChange={(e) => handleInputChange('peppolId', e.target.value)}
                            placeholder="Ex: 0208:123456789"
                            helperText="Format: [Pays]:[Numéro d'identification] (ex: 0208:123456789 pour la France)"
                            required={newClient.enablePeppol}
                          />
                          {newClient.peppolId.trim() && (
                            <div className="flex items-center space-x-2 text-xs">
                              {validatePeppolId(newClient.peppolId.trim()) ? (
                                <>
                                  <Icon name="CheckCircle" size={14} color="var(--color-green)" />
                                  <span className="text-green-600">Format Peppol ID valide</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="AlertCircle" size={14} color="var(--color-destructive)" />
                                  <span className="text-red-600">Format invalide. Utilisez: 0208:123456789</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Communication Preferences */}
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-foreground">Préférences de communication</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {preferenceOptions.map((preference) => (
                      <div
                        key={preference.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          newClient.preferences?.includes(preference.value)
                            ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handlePreferenceToggle(preference.value)}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newClient.preferences?.includes(preference.value) || false}
                            onChange={() => {}}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm font-medium">{preference.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewClientForm(false);
                  setNewClient({ name: '', type: 'individual', email: '', phone: '', address: '', contactPerson: '', companySize: '', regNumber: '', peppolId: '', enablePeppol: false, preferences: [] });
                  setClientType('individual');
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!newClient.name || !newClient.email}
              >
                Ajouter le client
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
                  Type: {selectedClient.type === 'individual' ? 'Particulier' : 'Professionnel'}
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