import React, { useState, useRef, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import { uploadQuoteFile } from '../../../services/quoteFilesService';
import { useAuth } from '../../../context/AuthContext';

const FileUpload = ({ files, onFilesChange, onNext, onPrevious, quoteId, isSaving = false }) => {

  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const fileInputRef = useRef(null);

  // Load files from localStorage when component mounts (only for new quotes, not editing)
  useEffect(() => {
    if (user?.id && !quoteId && files.length === 0) {
      try {
        const storageKey = `quote-files-${user.id}`;
        const savedFiles = localStorage.getItem(storageKey);
        if (savedFiles) {
          const parsedFiles = JSON.parse(savedFiles);
  
          onFilesChange(parsedFiles);
        }
      } catch (error) {
        console.error('Error loading files from localStorage:', error);
      }
    }
  }, [user?.id, quoteId, files.length, onFilesChange]);

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

  const handleFiles = async (fileList) => {
    const newFiles = [];
    
    for (const file of fileList) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux. Taille maximale: 10MB`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Le fichier ${file.name} n'est pas un type de fichier supporté.`);
        continue;
      }

      const tempFile = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
        uploadedAt: new Date(),
        isUploading: true
      };

      // Convert file to base64 immediately (same as client signature)
      const reader = new FileReader();
      reader.onload = (e) => {
        tempFile.data = e.target.result; // This is the base64 string
        
        newFiles.push(tempFile);
        setUploadingFiles(prev => new Set(prev).add(tempFile.id));
        
        // Add to files list immediately for UI feedback
        onFilesChange([...files, tempFile]);

        // Save to localStorage for draft
        if (user?.id) {
          try {
            const storageKey = `quote-files-${user.id}`;
            const existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingFiles.push(tempFile);
            localStorage.setItem(storageKey, JSON.stringify(existingFiles));
            
          } catch (error) {
            console.error('Error saving files to localStorage:', error);
          }
        }
      };
      reader.readAsDataURL(file);

      // Upload to backend if we have a quote ID (for editing existing quotes)
      if (quoteId && user?.id) {
        try {
          const result = await uploadQuoteFile(file, quoteId, user.id, 'attachment');
          if (result.success) {
            // Update the file with backend data
            const updatedFiles = files.map(f => 
              f.id === tempFile.id 
                ? { ...f, ...result.data, isUploading: false, backendId: result.data.id }
                : f
            );
            onFilesChange(updatedFiles);
            
            // Also update localStorage
            if (user?.id) {
              try {
                const storageKey = `quote-files-${user.id}`;
                const existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const updatedLocalFiles = existingFiles.map(f => 
                  f.id === tempFile.id 
                    ? { ...f, ...result.data, isUploading: false, backendId: result.data.id }
                    : f
                );
                localStorage.setItem(storageKey, JSON.stringify(updatedLocalFiles));
        
              } catch (error) {
                console.error('Error updating file in localStorage:', error);
              }
            }
          } else {
            console.error('File upload failed:', result.error);
            // Remove the failed file
            const filteredFiles = files.filter(f => f.id !== tempFile.id);
            onFilesChange(filteredFiles);
            alert(`Erreur lors de l'upload de ${file.name}: ${result.error}`);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          // Remove the failed file
          const filteredFiles = files.filter(f => f.id !== tempFile.id);
          onFilesChange(filteredFiles);
          alert(`Erreur lors de l'upload de ${file.name}`);
        } finally {
          setUploadingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempFile.id);
            return newSet;
          });
        }
      } else {
        // For new quotes, prepare file for upload when quote is created
        tempFile.isUploading = false;
        tempFile.readyForUpload = true; // Mark as ready for upload
        tempFile.uploadPath = `attachments/${tempFile.name}`; // Define upload path
      }
    }
  };

  const removeFile = (fileId) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.backendId) {
      // TODO: Implement backend deletion for existing quotes
      
    }
    
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
    
    // Also remove from localStorage
    if (user?.id) {
      try {
        const storageKey = `quote-files-${user.id}`;
        const existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filteredFiles = existingFiles.filter(f => f.id !== fileId);
        localStorage.setItem(storageKey, JSON.stringify(filteredFiles));

      } catch (error) {
        console.error('Error removing file from localStorage:', error);
      }
    }
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <Icon name="Upload" size={20} className="sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
          Fichiers et photos
        </h2>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200
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
            
            <div className="space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Upload" size={24} className="sm:w-8 sm:h-8 text-primary" />
              </div>
              
              <div>
                <p className="text-base sm:text-lg font-medium text-foreground">
                  Glissez vos fichiers ici ou cliquez pour parcourir
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group bg-background border border-border rounded-lg p-3 sm:p-4 hover:shadow-professional transition-all duration-200">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* File Preview */}
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                                                        {isImage(file.type) ? (
                          file.data ? (
                            // Show image from base64 data (for newly uploaded files)
                            <img
                              src={file.data}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.publicUrl ? (
                            // Show from database URL (for existing files)
                            <div className="relative w-full h-full">
                                                                                      <img
                                src={file.publicUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error(`Failed to load image: ${file.name} from URL: ${file.publicUrl}`);
                                  console.error('Error details:', e.target.error);
                                  // Fallback to placeholder if image fails to load
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                                
                                onAbort={() => {
                                  console.error(`Image load aborted for: ${file.name}`);
                                }}
                              />
                              {/* Fallback placeholder (hidden by default) */}
                              <div className="absolute inset-0 bg-muted flex items-center justify-center" style={{ display: 'none' }}>
                                <Icon name="Image" size={20} className="sm:w-6 sm:h-6 text-muted-foreground" />
                              </div>
                            </div>
                          ) : (
                            // Show placeholder
                            <Icon name="Image" size={20} className="sm:w-6 sm:h-6 text-muted-foreground" />
                          )
                        ) : isPDF(file.type) ? (
                          <Icon name="FileText" size={20} className="sm:w-6 sm:h-6 text-error" />
                        ) : (
                          <Icon name="File" size={20} className="sm:w-6 sm:h-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.uploadedAt ? new Date(file.uploadedAt).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </p>
                        {/* Upload Status */}
                        {file.isUploading && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-blue-600">Upload en cours...</span>
                          </div>
                        )}
                        {file.backendId && !file.isUploading && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Icon name="CheckCircle" size={12} className="text-green-500" />
                            <span className="text-xs text-green-600">Sauvegardé</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={file.isUploading}
                      className="absolute top-1 sm:top-2 right-1 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-error text-error-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-error/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="X" size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* File Types Info */}
          <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <Icon name="Info" size={14} className="sm:w-4 sm:h-4 text-primary mr-2" />
              Types de fichiers recommandés
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
          disabled={isSaving}
        >
          Étape précédente
        </Button>
        <Button
          onClick={onNext}
          iconName="ArrowRight"
          iconPosition="right"
          disabled={isSaving}
        >
          Étape suivante
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;