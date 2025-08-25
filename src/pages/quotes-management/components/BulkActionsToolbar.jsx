import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const BulkActionsToolbar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} color="var(--color-primary)" />
            <span className="font-medium text-primary">
              {t('quotesManagement.bulkActions.selected', { count: selectedCount })}
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
            {t('quotesManagement.bulkActions.deselect')}
          </Button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('export')}
          iconName="Download"
          iconPosition="left"
        >
          {t('quotesManagement.bulkActions.export')}
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onBulkAction('delete')}
          iconName="Trash2"
          iconPosition="left"
        >
          {t('quotesManagement.bulkActions.delete')}
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;