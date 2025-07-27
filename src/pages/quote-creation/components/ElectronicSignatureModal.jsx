import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ElectronicSignatureModal = ({ isOpen, onClose, onSign, quoteData }) => {
  const [clientComment, setClientComment] = useState('');
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'upload'
  const [signatureImage, setSignatureImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  
  const signaturePadRef = useRef(null);
  const fileInputRef = useRef(null);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setSignatureImage(null);
    setUploadedImage(null);
  };

  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureDataURL = signaturePadRef.current.toDataURL();
      setSignatureImage(signatureDataURL);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale: 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Check image dimensions
          if (img.width < 300 || img.height < 100) {
            alert('L\'image est trop petite. Résolution minimale recommandée: 300x100 pixels');
          }
          
          setUploadedImage(e.target.result);
          setSignatureImage(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSign = () => {
    if (!clientComment.trim()) {
      alert('Veuillez ajouter un commentaire client.');
      return;
    }

    if (!signatureImage) {
      alert('Veuillez ajouter une signature.');
      return;
    }

    setIsSigning(true);
    
    // Simulate signature process
    setTimeout(() => {
      const signatureData = {
        clientComment,
        signature: signatureImage,
        signatureMode,
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]" onScroll={handleScroll}>
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

          {/* Signature Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Méthode de signature
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setSignatureMode('draw')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  signatureMode === 'draw'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="PenTool" size={20} />
                  <span className="font-medium">Dessiner</span>
                </div>
              </button>
              <button
                onClick={() => setSignatureMode('upload')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  signatureMode === 'upload'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="Upload" size={20} />
                  <span className="font-medium">Importer</span>
                </div>
              </button>
            </div>
          </div>

          {/* Signature Zone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Zone de signature
              </label>
              {signatureImage && (
                <button
                  onClick={clearSignature}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <Icon name="Trash2" size={16} />
                  <span>Effacer</span>
                </button>
              )}
            </div>

            {signatureMode === 'draw' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: 'w-full h-48 rounded-lg',
                    style: { border: 'none' }
                  }}
                  backgroundColor="white"
                  penColor="black"
                />
                <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Dessinez votre signature ci-dessus
                    </p>
                    <div className="flex space-x-2">
                      {!signatureImage && (
                        <button
                          onClick={() => signaturePadRef.current?.clear()}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Effacer
                        </button>
                      )}
                      <button
                        onClick={saveSignature}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 min-h-[200px] flex flex-col items-center justify-center">
                {uploadedImage ? (
                  <div className="w-full">
                    <img 
                      src={uploadedImage} 
                      alt="Signature" 
                      className="max-w-full max-h-32 mx-auto border border-gray-300 rounded"
                    />
                    <p className="text-sm text-gray-600 mt-2">Image de signature chargée</p>
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-center">
                      <p className="text-xs text-green-700">
                        ✅ Image chargée avec succès. Vérifiez l'aperçu ci-dessous.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Icon name="Upload" size={48} className="text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Cliquez pour importer une image de signature</p>
                    <p className="text-gray-400 text-xs mb-4">Formats acceptés: PNG, JPG, JPEG</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <Icon name="Info" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">Recommandations pour une signature optimale:</p>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            <li>• Utilisez une image PNG avec fond transparent</li>
                            <li>• Signature en noir sur fond blanc ou transparent</li>
                            <li>• Résolution minimale: 300x100 pixels</li>
                            <li>• Taille de fichier: moins de 2MB</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Choisir un fichier
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Signature Preview */}
            {signatureImage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de la signature:</p>
                <div className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded">
                  <img 
                    src={signatureImage} 
                    alt="Signature Preview" 
                    className="max-h-16 max-w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="Shield" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Signature électronique sécurisée</p>
                <p className="text-xs text-blue-700">
                  Cette signature électronique a la même valeur juridique qu'une signature manuscrite. 
                  Elle est horodatée et enregistrée de manière sécurisée.
                </p>
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
            disabled={!clientComment.trim() || !signatureImage || isSigning}
            iconName="PenTool"
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