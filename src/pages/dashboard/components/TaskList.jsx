import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TaskList = () => {
  const tasks = [
    {
      id: 1,
      type: 'finalize',
      title: 'Finaliser devis plomberie',
      client: 'Marie Dubois',
      priority: 'high',
      dueDate: '2025-07-19',
      action: 'Ajouter détails matériaux'
    },
    {
      id: 2,
      type: 'send',
      title: 'Envoyer devis électricité',
      client: 'Pierre Martin',
      priority: 'medium',
      dueDate: '2025-07-20',
      action: 'Relecture et envoi'
    },
    {
      id: 3,
      type: 'follow',
      title: 'Relancer client peinture',
      client: 'Sophie Leroy',
      priority: 'high',
      dueDate: '2025-07-19',
      action: 'Appel téléphonique'
    },
    {
      id: 4,
      type: 'invoice',
      title: 'Créer facture carrelage',
      client: 'Jean Moreau',
      priority: 'low',
      dueDate: '2025-07-21',
      action: 'Devis signé hier'
    }
  ];

  const getTaskIcon = (type) => {
    const icons = {
      finalize: 'Edit3',
      send: 'Send',
      follow: 'Phone',
      invoice: 'Receipt'
    };
    return icons[type] || 'CheckCircle';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-error',
      medium: 'text-warning',
      low: 'text-muted-foreground'
    };
    return colors[priority] || 'text-muted-foreground';
  };

  const getPriorityBg = (priority) => {
    const colors = {
      high: 'bg-error/10',
      medium: 'bg-warning/10',
      low: 'bg-muted/50'
    };
    return colors[priority] || 'bg-muted/50';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Tâches du jour</h3>
        <span className="text-sm text-muted-foreground">{tasks.length} tâches</span>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPriorityBg(task.priority)}`}>
              <Icon 
                name={getTaskIcon(task.type)} 
                size={16} 
                color="currentColor"
                className={getPriorityColor(task.priority)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.client} • {task.action}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${getPriorityBg(task.priority)}`}></span>
              <Button variant="ghost" size="sm">
                <Icon name="ChevronRight" size={16} color="currentColor" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" fullWidth>
          Voir toutes les tâches
        </Button>
      </div>
    </div>
  );
};

export default TaskList;