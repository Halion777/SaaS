import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsToolbar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const [selectedAction, setSelectedAction] = useState('');

  const actionOptions = [
    { value: '', label: 'Choisir une action...' },
    { value: 'send-reminder', label: 'Envoyer un rappel' },
    { value: 'mark-sent', label: 'Marquer comme envoyé' },
    { value: 'mark-viewed', label: 'Marquer comme consulté' },
    { value: 'duplicate', label: 'Dupliquer les devis' },
    { value: 'export', label: 'Exporter en PDF' },
    { value: 'ai-optimize', label: 'Optimiser avec IA' },
    { value: 'delete', label: 'Supprimer' }
  ];

  const handleExecuteAction = () => {
    if (selectedAction) {
      onBulkAction(selectedAction);
      setSelectedAction('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} color="var(--color-primary)" />
            <span className="font-medium text-primary">
              {selectedCount} devis sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
            iconPosition="left"
            className="text-muted-foreground hover:text-foreground"
          >
            Désélectionner
          </Button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none sm:w-64">
            <Select
              options={actionOptions}
              value={selectedAction}
              onChange={setSelectedAction}
              placeholder="Choisir une action..."
            />
          </div>
          
          <Button
            variant="default"
            onClick={handleExecuteAction}
            disabled={!selectedAction}
            iconName="Play"
            iconPosition="left"
          >
            Exécuter
          </Button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('send-reminder')}
          iconName="Send"
          iconPosition="left"
        >
          Rappel
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('ai-optimize')}
          iconName="Sparkles"
          iconPosition="left"
        >
          Optimiser IA
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('duplicate')}
          iconName="Copy"
          iconPosition="left"
        >
          Dupliquer
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('export')}
          iconName="Download"
          iconPosition="left"
        >
          Exporter
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onBulkAction('delete')}
          iconName="Trash2"
          iconPosition="left"
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;