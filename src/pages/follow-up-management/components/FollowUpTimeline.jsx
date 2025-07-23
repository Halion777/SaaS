import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const FollowUpTimeline = ({ 
  followUps, 
  onFollowUpSelect, 
  onSendFollowUp, 
  getStatusColor, 
  getPriorityColor, 
  getTypeLabel 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOverdue = (scheduledDate, status) => {
    return status === 'pending' && new Date(scheduledDate) < new Date();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
        <Icon name="Timeline" size={20} className="mr-2" />
        Chronologie des Suivis
      </h2>

      {followUps.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="Calendar" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun suivi planifié</p>
        </div>
      ) : (
        <div className="space-y-4">
          {followUps.map((followUp, index) => (
            <motion.div
              key={followUp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 border rounded-lg transition-all hover:shadow-md ${
                isOverdue(followUp.scheduledDate, followUp.status)
                  ? 'border-red-200 bg-red-50' :'border-border bg-background'
              }`}
            >
              {/* Timeline connector */}
              {index < followUps.length - 1 && (
                <div className="absolute left-8 top-16 w-px h-8 bg-border"></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Status indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  followUp.status === 'pending' ? 'bg-yellow-100' :
                  followUp.status === 'sent' ? 'bg-blue-100' :
                  followUp.status === 'opened'? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  <Icon 
                    name={
                      followUp.status === 'pending' ? 'Clock' :
                      followUp.status === 'sent' ? 'Send' :
                      followUp.status === 'opened'? 'Eye' : 'MessageCircle'
                    } 
                    size={12} 
                    color={
                      followUp.status === 'pending' ? 'var(--color-yellow)' :
                      followUp.status === 'sent' ? 'var(--color-blue)' :
                      followUp.status === 'opened' ? 'var(--color-green)' :
                      'var(--color-purple)'
                    }
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-foreground">{followUp.subject}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.priority)}`}>
                          {followUp.priority === 'high' ? 'Haute' : followUp.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center">
                          <Icon name="User" size={14} className="mr-1" />
                          {followUp.clientName}
                        </span>
                        <span className="flex items-center">
                          <Icon name="Calendar" size={14} className="mr-1" />
                          {formatDate(followUp.scheduledDate)}
                        </span>
                        <span className="flex items-center">
                          <Icon name="Tag" size={14} className="mr-1" />
                          {getTypeLabel(followUp.type)}
                        </span>
                        <span className="flex items-center">
                          <Icon name={followUp.channel === 'email' ? 'Mail' : followUp.channel === 'sms' ? 'MessageSquare' : 'Phone'} size={14} className="mr-1" />
                          {followUp.channel.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-foreground line-clamp-2">
                        {followUp.content}
                      </p>

                      {isOverdue(followUp.scheduledDate, followUp.status) && (
                        <div className="mt-2 flex items-center space-x-1 text-red-600">
                          <Icon name="AlertTriangle" size={14} />
                          <span className="text-xs font-medium">En retard</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                        {followUp.status === 'pending' ? 'En attente' :
                         followUp.status === 'sent' ? 'Envoyé' :
                         followUp.status === 'opened' ? 'Ouvert' : 'Répondu'}
                      </span>
                      
                      {followUp.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSendFollowUp(followUp.id)}
                          iconName="Send"
                          iconPosition="left"
                        >
                          Envoyer
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFollowUpSelect(followUp)}
                        iconName="Eye"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpTimeline;