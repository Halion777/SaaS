import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TaskList = () => {
  const { t } = useTranslation();
  const tasks = [
    {
      id: 1,
      type: 'finalize',
      title: t('dashboard.taskList.tasks.0.title'),
      client: t('dashboard.taskList.tasks.0.client'),
      priority: 'high',
      dueDate: '2025-07-19',
      action: t('dashboard.taskList.tasks.0.action')
    },
    {
      id: 2,
      type: 'send',
      title: t('dashboard.taskList.tasks.1.title'),
      client: t('dashboard.taskList.tasks.1.client'),
      priority: 'medium',
      dueDate: '2025-07-20',
      action: t('dashboard.taskList.tasks.1.action')
    },
    {
      id: 3,
      type: 'follow',
      title: t('dashboard.taskList.tasks.2.title'),
      client: t('dashboard.taskList.tasks.2.client'),
      priority: 'high',
      dueDate: '2025-07-19',
      action: t('dashboard.taskList.tasks.2.action')
    },
    {
      id: 4,
      type: 'invoice',
      title: t('dashboard.taskList.tasks.3.title'),
      client: t('dashboard.taskList.tasks.3.client'),
      priority: 'low',
      dueDate: '2025-07-21',
      action: t('dashboard.taskList.tasks.3.action')
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
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.taskList.title')}</h3>
        <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.taskList.tasksCount', { count: tasks.length })}</span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getPriorityBg(task.priority)}`}>
              <Icon 
                name={getTaskIcon(task.type)} 
                size={14} 
                className={`sm:w-4 sm:h-4 ${getPriorityColor(task.priority)}`}
                color="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.client} • {task.action}</p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getPriorityBg(task.priority)}`}></span>
              <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
                <Icon name="ChevronRight" size={14} className="sm:w-4 sm:h-4" color="currentColor" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <Button variant="outline" fullWidth className="text-sm">
          {t('dashboard.taskList.viewAllTasks')}
        </Button>
      </div>
    </div>
  );
};

export default TaskList;