import React, { useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const TasksTable = ({
  tasks,
  viewMode,
  setViewMode,
  onTaskClick,
  formatDate,
  getPriorityColor,
  getPriorityBg,
  getPriorityLabel,
  getTaskIcon,
  getTaskTypeLabel,
  i18n,
  t
}) => {
  // Auto-switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setViewMode]);

  const renderTableView = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-foreground">{t('common.type', 'Type')}</th>
              <th className="text-left p-4 font-medium text-foreground">{t('common.task', 'Task')}</th>
              <th className="text-left p-4 font-medium text-foreground">{t('common.client', 'Client')}</th>
              <th className="text-left p-4 font-medium text-foreground">{t('common.priority', 'Priority')}</th>
              <th className="text-left p-4 font-medium text-foreground">{t('common.dueDate', 'Due Date')}</th>
              <th className="text-left p-4 font-medium text-foreground">{t('common.amount', 'Amount')}</th>
              <th className="text-right p-4 font-medium text-foreground">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr 
                key={task.id} 
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPriorityBg(task.priority)}`}>
                      <Icon 
                        name={getTaskIcon(task.type)} 
                        size={16} 
                        className={getPriorityColor(task.priority)}
                      />
                    </div>
                    <span className="text-sm text-foreground">{getTaskTypeLabel(task.type)}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-foreground">{task.title}</div>
                  <div className="text-sm text-muted-foreground">{task.action}</div>
                </td>
                <td className="p-4 text-foreground">{task.client}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : '-'}
                  {task.daysOverdue > 0 && (
                    <div className="text-xs text-error mt-1">
                      {task.daysOverdue} {t('common.days', 'days')} {t('common.overdue', 'overdue')}
                    </div>
                  )}
                  {task.daysSinceSent > 0 && (
                    <div className="text-xs text-warning mt-1">
                      {task.daysSinceSent} {t('common.days', 'days')} {t('common.withoutResponse', 'without response')}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {task.amount > 0 ? (
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat(i18n.language || 'fr', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(task.amount)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Icon name="ChevronRight" size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPriorityBg(task.priority)}`}>
                <Icon 
                  name={getTaskIcon(task.type)} 
                  size={20} 
                  className={getPriorityColor(task.priority)}
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{getTaskTypeLabel(task.type)}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-1">
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          
          <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{task.client}</p>
          
          <div className="space-y-2 mb-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{t('common.action', 'Action')}:</span> {task.action}
            </div>
            {task.dueDate && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{t('common.dueDate', 'Due Date')}:</span> {formatDate(task.dueDate)}
              </div>
            )}
            {task.daysOverdue > 0 && (
              <div className="text-xs text-error">
                {task.daysOverdue} {t('common.days', 'days')} {t('common.overdue', 'overdue')}
              </div>
            )}
            {task.daysSinceSent > 0 && (
              <div className="text-xs text-warning">
                {task.daysSinceSent} {t('common.days', 'days')} {t('common.withoutResponse', 'without response')}
              </div>
            )}
          </div>
          
          {task.amount > 0 && (
            <div className="pt-3 border-t border-border">
              <span className="font-semibold text-foreground">
                {new Intl.NumberFormat(i18n.language || 'fr', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(task.amount)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* View Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{t('common.view', 'View')}</span>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Table" size={14} className="mr-1" />
              {t('common.tableView', 'Table')}
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Grid" size={14} className="mr-1" />
              {t('common.cardView', 'Cards')}
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {t('dashboard.taskList.tasksCount', { count: tasks.length })}
        </div>
      </div>

      {/* Content */}
      {tasks.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="CheckCircle" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">{t('dashboard.taskList.noTasks', 'No pending tasks')}</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t('common.noTasksMessage', 'All tasks are completed. Great job!')}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'card' && renderCardView()}
        </>
      )}
    </div>
  );
};

export default TasksTable;

