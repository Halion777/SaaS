import React from 'react';
import Icon from '../AppIcon';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Icon name="AlertCircle" className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage; 