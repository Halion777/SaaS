import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const AutomationRules = ({ rules, onRulesChange }) => {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'quote_sent',
    delay: 3,
    delayUnit: 'days',
    action: 'send_followup',
    template: 'quote_followup_template',
    isActive: true
  });

  const triggerOptions = [
    { value: 'quote_sent', label: 'Devis envoyé' },
    { value: 'quote_viewed', label: 'Devis consulté' },
    { value: 'invoice_overdue', label: 'Facture client en retard' },
    { value: 'supplier_invoice_due', label: 'Facture fournisseur à échéance' },
    { value: 'supplier_invoice_overdue', label: 'Facture fournisseur en retard' },
    { value: 'project_completed', label: 'Projet terminé' }
  ];

  const delayUnitOptions = [
    { value: 'hours', label: 'Heures' },
    { value: 'days', label: 'Jours' },
    { value: 'weeks', label: 'Semaines' }
  ];

  const actionOptions = [
    { value: 'send_followup', label: 'Envoyer un suivi' },
    { value: 'send_reminder', label: 'Envoyer un rappel' },
    { value: 'create_task', label: 'Créer une tâche' }
  ];

  const templateOptions = [
    { value: 'quote_followup_template', label: 'Modèle suivi devis' },
    { value: 'payment_reminder_template', label: 'Modèle rappel paiement client' },
    { value: 'supplier_payment_reminder_template', label: 'Modèle rappel paiement fournisseur' },
    { value: 'supplier_invoice_due_template', label: 'Modèle facture fournisseur à échéance' },
    { value: 'satisfaction_survey_template', label: 'Modèle enquête satisfaction' }
  ];

  const handleAddRule = () => {
    if (newRule.name) {
      const rule = {
        id: Date.now(),
        ...newRule
      };
      onRulesChange([...rules, rule]);
      setNewRule({
        name: '',
        trigger: 'quote_sent',
        delay: 3,
        delayUnit: 'days',
        action: 'send_followup',
        template: 'quote_followup_template',
        isActive: true
      });
      setIsAddingRule(false);
    }
  };

  const toggleRule = (ruleId) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
  };

  const deleteRule = (ruleId) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground flex items-center">
          <Icon name="Settings" size={20} className="mr-2" />
          Règles d'Automatisation
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingRule(true)}
          iconName="Plus"
        />
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="p-3 border border-border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-foreground text-sm">{rule.name}</h4>
                  <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Déclenché {rule.delay} {rule.delayUnit === 'days' ? 'jour(s)' : rule.delayUnit === 'hours' ? 'heure(s)' : 'semaine(s)'} après {
                    triggerOptions.find(option => option.value === rule.trigger)?.label
                  }
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRule(rule.id)}
                  iconName={rule.isActive ? "Pause" : "Play"}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRule(rule.id)}
                  iconName="Trash2"
                />
              </div>
            </div>
          </div>
        ))}

        {isAddingRule && (
          <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
            <div className="space-y-3">
              <Input
                label="Nom de la règle"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Suivi automatique devis"
                size="sm"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Déclencheur"
                  options={triggerOptions}
                  value={newRule.trigger}
                  onChange={(value) => setNewRule(prev => ({ ...prev, trigger: value }))}
                  size="sm"
                />
                
                <Select
                  label="Modèle"
                  options={templateOptions}
                  value={newRule.template}
                  onChange={(value) => setNewRule(prev => ({ ...prev, template: value }))}
                  size="sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Délai"
                  type="number"
                  value={newRule.delay}
                  onChange={(e) => setNewRule(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                  size="sm"
                />
                
                <Select
                  label="Unité"
                  options={delayUnitOptions}
                  value={newRule.delayUnit}
                  onChange={(value) => setNewRule(prev => ({ ...prev, delayUnit: value }))}
                  size="sm"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingRule(false)}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddRule}
                  disabled={!newRule.name}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationRules;