import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import Button from './Button';

/**
 * Reusable error display component for loading errors
 * 
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 * @param {string} props.title - Optional custom title (defaults to generic error title)
 * @param {string} props.retryText - Optional custom retry button text (defaults to "Retry")
 */
const ErrorDisplay = ({ error, onRetry, title, retryText }) => {
  const { t } = useTranslation();

  if (!error) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 text-center">
      <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title || t('common.errors.loadError', 'Error Loading Data')}
      </h3>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        {retryText || t('common.retry', 'Retry')}
      </Button>
    </div>
  );
};

export default ErrorDisplay;
