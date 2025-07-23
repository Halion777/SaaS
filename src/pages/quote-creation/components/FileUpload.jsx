import React, { useState, useRef } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const FileUpload = ({ files, onFilesChange, onNext, onPrevious }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date()
    }));
    
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type) => type.startsWith('image/');
  const isPDF = (type) => type === 'application/pdf';

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Upload" size={24} color="var(--color-primary)" className="mr-3" />
          Fichiers et photos
        </h2>
        
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${dragActive 
                ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 hover:bg-muted/30'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Upload" size={32} color="var(--color-primary)" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-foreground">
                  Glissez vos fichiers ici ou cliquez pour parcourir
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Formats acceptés: Images (JPG, PNG, GIF), PDF, Documents Word
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taille maximale: 10 MB par fichier
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                iconName="FolderOpen"
                iconPosition="left"
              >
                Parcourir les fichiers
              </Button>
            </div>
          </div>
          
          {/* Files List */}
          {files.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-4">
                Fichiers ajoutés ({files.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group bg-background border border-border rounded-lg p-4 hover:shadow-professional transition-all duration-200">
                    <div className="flex items-start space-x-3">
                      {/* File Preview */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {isImage(file.type) ? (
                          <Image
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : isPDF(file.type) ? (
                          <Icon name="FileText" size={24} color="var(--color-error)" />
                        ) : (
                          <Icon name="File" size={24} color="var(--color-muted-foreground)" />
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.uploadedAt.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-error text-error-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-error/80"
                    >
                      <Icon name="X" size={14} color="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* File Types Info */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <Icon name="Info" size={16} color="var(--color-primary)" className="mr-2" />
              Types de fichiers recommandés
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Photos :</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Photos de l'état actuel</li>
                  <li>• Plans et schémas</li>
                  <li>• Références visuelles</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Documents :</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Cahier des charges</li>
                  <li>• Spécifications techniques</li>
                  <li>• Contraintes particulières</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Étape précédente
        </Button>
        <Button
          onClick={onNext}
          iconName="ArrowRight"
          iconPosition="right"
        >
          Étape suivante
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;