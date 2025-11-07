import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { updateAnalyticsObjectives } from '../../../services/authService';

const MetricsProgress = ({ metrics, userObjectives, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValues, setEditingValues] = useState({
    revenueTarget: (userObjectives?.revenueTarget ?? metrics.revenueTarget) || 0,
    clientTarget: (userObjectives?.clientTarget ?? metrics.clientTarget) || 0,
    projectsTarget: (userObjectives?.projectsTarget ?? metrics.projectsTarget) || 0
  });
  const progressItems = [
    {
      label: 'Progression mensuelle',
      value: metrics.monthProgress,
      icon: 'Calendar',
      color: 'blue'
    },
    {
      label: 'Objectif revenus',
      value: metrics.revenueTarget,
      icon: 'Euro',
      color: 'emerald'
    },
    {
      label: 'Objectif clients',
      value: metrics.clientTarget,
      icon: 'Users',
      color: 'purple'
    },
    {
      label: 'Objectif projets',
      value: metrics.projectsTarget,
      icon: 'Briefcase',
      color: 'orange'
    }
  ];

  const getProgressColor = (value, color) => {
    const colors = {
      blue: value >= 80 ? 'bg-blue-500' : value >= 60 ? 'bg-blue-400' : 'bg-blue-300',
      emerald: value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-emerald-400' : 'bg-emerald-300',
      purple: value >= 80 ? 'bg-purple-500' : value >= 60 ? 'bg-purple-400' : 'bg-purple-300',
      orange: value >= 80 ? 'bg-orange-500' : value >= 60 ? 'bg-orange-400' : 'bg-orange-300'
    };
    return colors[color];
  };

  const getStatusIcon = (value) => {
    if (value >= 90) return { icon: 'TrendingUp', color: 'text-emerald-600' };
    if (value >= 70) return { icon: 'Minus', color: 'text-yellow-600' };
    return { icon: 'TrendingDown', color: 'text-red-600' };
  };

  const handleSave = async () => {
    try {
      const objectives = {
        revenueTarget: editingValues.revenueTarget,
        clientTarget: editingValues.clientTarget,
        projectsTarget: editingValues.projectsTarget
      };
      
      const result = await updateAnalyticsObjectives(objectives);
      if (result.error) {
        alert('Erreur lors de la sauvegarde des objectifs');
        return;
      }
      
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(objectives);
      }
    } catch (error) {
      console.error('Error saving objectives:', error);
      alert('Erreur lors de la sauvegarde des objectifs');
    }
  };

  const handleCancel = () => {
    setEditingValues({
      revenueTarget: (userObjectives?.revenueTarget ?? metrics.revenueTarget) || 0,
      clientTarget: (userObjectives?.clientTarget ?? metrics.clientTarget) || 0,
      projectsTarget: (userObjectives?.projectsTarget ?? metrics.projectsTarget) || 0
    });
    setIsEditing(false);
  };

  // Update editing values when userObjectives change
  React.useEffect(() => {
    if (!isEditing) {
      setEditingValues({
        revenueTarget: (userObjectives?.revenueTarget ?? metrics.revenueTarget) || 0,
        clientTarget: (userObjectives?.clientTarget ?? metrics.clientTarget) || 0,
        projectsTarget: (userObjectives?.projectsTarget ?? metrics.projectsTarget) || 0
      });
    }
  }, [userObjectives, metrics, isEditing]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Icon name="Activity" size={20} color="rgb(99 102 241)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Métriques temps réel</h3>
            <p className="text-sm text-muted-foreground">Progression vs objectifs</p>
          </div>
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            iconName="Edit"
            iconPosition="left"
          >
            Modifier
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
            >
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {progressItems.map((item, index) => {
          const status = getStatusIcon(item.value);
          const isTargetMetric = item.label === 'Objectif revenus' || item.label === 'Objectif clients' || item.label === 'Objectif projets';
          const targetKey = item.label === 'Objectif revenus' ? 'revenueTarget' : 
                           item.label === 'Objectif clients' ? 'clientTarget' : 
                           item.label === 'Objectif projets' ? 'projectsTarget' : null;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name={item.icon} size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing && isTargetMetric ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        step={targetKey === 'revenueTarget' ? '100' : '1'}
                        value={editingValues[targetKey]}
                        onChange={(e) => setEditingValues({
                          ...editingValues,
                          [targetKey]: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                        placeholder={targetKey === 'revenueTarget' ? 'Montant (€)' : 'Nombre'}
                      />
                      <span className="text-xs text-muted-foreground">
                        {targetKey === 'revenueTarget' ? '€' : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-foreground">{item.value}%</span>
                  )}
                  {!isEditing && <Icon name={status.icon} size={16} className={status.color} />}
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(item.value, item.color)} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
                {item.value > 100 && (
                  <div className="absolute right-0 top-0 transform translate-x-2">
                    <Icon name="Crown" size={16} className="text-yellow-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Performance globale</p>
            <p className="text-xl font-bold text-foreground">
              {Math.round(progressItems.reduce((sum, item) => sum + item.value, 0) / progressItems.length)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tendance</p>
            <div className="flex items-center justify-center space-x-1">
              <Icon name="TrendingUp" size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">Positive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsProgress;