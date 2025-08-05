import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import Button from './Button';
import { createPortal } from 'react-dom';

const PinModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  profileName, 
  title = 'Code PIN requis',
  message = 'Entrez le code PIN pour accéder à ce profil',
  error: externalError = '',
  isLoading: externalLoading = false
}) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPin(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      return;
    }

    try {
      await onConfirm(pin);
      setPin('');
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={24} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">{message}</p>
          {profileName && (
            <p className="text-sm font-medium text-foreground">{profileName}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Code PIN
            </label>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={handlePinChange}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground text-center text-lg tracking-widest"
              placeholder="••••"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {externalError && (
            <div className="text-sm text-destructive text-center">
              {externalError}
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={externalLoading || pin.length < 4}
            >
              {externalLoading ? (
                <div className="flex items-center space-x-2">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  <span>Vérification...</span>
                </div>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>Le code PIN protège l'accès à ce profil</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PinModal; 