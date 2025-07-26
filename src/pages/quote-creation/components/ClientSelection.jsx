import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ClientSelection = ({ selectedClient, onClientSelect, onNext }) => {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: ''
  });
  const [projectInfo, setProjectInfo] = useState({
    category: '',
    estimatedAmount: '',
    deadline: '',
    description: ''
  });

  const existingClients = [
    { value: '1', label: 'Jean Martin - Plomberie Martin', description: 'jean.martin@email.com • 06 12 34 56 78' },
    { value: '2', label: 'Marie Dubois - Électricité Pro', description: 'marie.dubois@email.com • 06 87 65 43 21' },
    { value: '3', label: 'Pierre Leroy - Menuiserie Leroy', description: 'pierre.leroy@email.com • 06 11 22 33 44' },
    { value: '4', label: 'Sophie Bernard - Peinture Déco', description: 'sophie.bernard@email.com • 06 55 66 77 88' },
    { value: '5', label: 'Thomas Petit - Maçonnerie TP', description: 'thomas.petit@email.com • 06 99 88 77 66' }
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
    { value: 'autre', label: 'Autre' }
  ];

  const handleNewClientSubmit = (e) => {
    e.preventDefault();
    if (newClient.name && newClient.email) {
      const clientData = {
        value: `new_${Date.now()}`,
        label: `${newClient.name}${newClient.company ? ` - ${newClient.company}` : ''}`,
        description: `${newClient.email} • ${newClient.phone}`,
        ...newClient
      };
      onClientSelect(clientData);
      setShowNewClientForm(false);
      setNewClient({ name: '', email: '', phone: '', address: '', company: '' });
    }
  };

  const handleInputChange = (field, value) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectChange = (field, value) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = selectedClient || (newClient.name && newClient.email);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Users" size={24} color="var(--color-primary)" className="mr-3" />
          Sélection du client
        </h2>
        
        {!showNewClientForm ? (
          <div className="space-y-4">
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
            
            <div className="flex items-center justify-center py-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-4 text-sm text-muted-foreground">ou</span>
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
          <form onSubmit={handleNewClientSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom complet"
                type="text"
                placeholder="Jean Martin"
                value={newClient.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
              <Input
                label="Entreprise (optionnel)"
                type="text"
                placeholder="Plomberie Martin"
                value={newClient.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              />
            </div>
            
            <Input
              label="Adresse"
              type="text"
              placeholder="123 Rue de la République, 75001 Paris"
              value={newClient.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewClientForm(false);
                  setNewClient({ name: '', email: '', phone: '', address: '', company: '' });
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
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center">
            <Icon name="CheckCircle" size={20} color="var(--color-success)" className="mr-3" />
            <div>
              <p className="font-medium text-foreground">{selectedClient.label}</p>
              <p className="text-sm text-muted-foreground">{selectedClient.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Information Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Icon name="FileText" size={24} color="var(--color-primary)" className="mr-3" />
          Informations projet
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Catégorie *"
              placeholder="Sélectionner une catégorie"
              options={categoryOptions}
              value={projectInfo.category}
              onChange={(e) => handleProjectChange('category', e.target.value)}
              required
            />
            
            <div className="relative">
              <Input
                label="Montant estimé *"
                type="number"
                placeholder="2500"
                value={projectInfo.estimatedAmount}
                onChange={(e) => handleProjectChange('estimatedAmount', e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 mt-7 pointer-events-none">
                <span className="text-muted-foreground">€</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date limite
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={projectInfo.deadline}
                  onChange={(e) => handleProjectChange('deadline', e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Icon name="Calendar" size={16} color="var(--color-muted-foreground)" />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description du projet *
            </label>
            <div className="relative">
              <textarea
                value={projectInfo.description}
                onChange={(e) => handleProjectChange('description', e.target.value)}
                rows={4}
                placeholder="Ex: Pose de parquet dans salon 20m²"
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Mic"
                  title="Dicter la description"
                />
                <Button
                  variant="ghost"
                  size="sm"
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

export default ClientSelection;