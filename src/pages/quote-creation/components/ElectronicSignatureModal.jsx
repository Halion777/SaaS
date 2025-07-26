import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ElectronicSignatureModal = ({ isOpen, onClose, onSign, quoteData }) => {
  const [clientComment, setClientComment] = useState('');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = () => {
    if (!clientComment.trim()) {
      alert('Veuillez ajouter un commentaire client.');
      return;
    }

    setIsSigning(true);
    
    // Simulate signature process
    setTimeout(() => {
      const signatureData = {
        clientComment,
        signature: signature || 'Signature électronique',
        signedAt: new Date().toISOString(),
        quoteId: quoteData?.id
      };
      
      onSign(signatureData);
      setIsSigning(false);
      onClose();
    }, 1000);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Prevent scroll event from bubbling to background
  const handleScroll = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Signature électronique</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1" onScroll={handleScroll}>
          {/* Client Comment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Commentaire client (obligatoire)
            </label>
            <textarea
              value={clientComment}
              onChange={(e) => setClientComment(e.target.value)}
              rows={4}
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: J'accepte ce devis et ses conditions..."
            />
          </div>

          {/* Signature Zone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Zone de signature
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 min-h-[120px] flex flex-col items-center justify-center">
              <Icon name="PenTool" size={32} className="text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">Zone de signature</p>
              <p className="text-gray-400 text-xs mt-1">Signature horodatée automatiquement</p>
              
              {/* Simple signature input for demo */}
              <div className="mt-4">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Tapez votre nom pour signer"
                  className="px-3 py-2 border border-gray-300 rounded text-center font-signature text-lg"
                  style={{ fontFamily: 'cursive' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSigning}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSign}
            disabled={!clientComment.trim() || isSigning}
            iconName={isSigning ? "Loader" : "PenTool"}
            iconPosition="left"
          >
            {isSigning ? 'Signature en cours...' : 'Signer le devis'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ElectronicSignatureModal; 