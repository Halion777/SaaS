import React, { useState, useRef } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const FileUpload = ({
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  disabled = false,
  loading = false,
  label = "Choisir un fichier",
  description = "Glissez-déposez ou cliquez pour sélectionner",
  className,
  id,
  ...props
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
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
    setError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError('Type de fichier non supporté');
      return;
    }

    // Validate file size
    if (maxSize && file.size > maxSize) {
      setError(`Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }

    onFileSelect(file);
  };

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  const getFileTypeIcon = () => {
    if (accept.includes('image')) return 'Image';
    if (accept.includes('pdf')) return 'FileText';
    if (accept.includes('document')) return 'FileText';
    return 'Upload';
  };

  const getFileTypeText = () => {
    if (accept.includes('image')) return 'PNG, JPG jusqu\'à 5MB';
    if (accept.includes('pdf')) return 'PDF jusqu\'à 10MB';
    if (accept.includes('document')) return 'DOC, DOCX jusqu\'à 10MB';
    return 'Fichiers acceptés';
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || loading}
        id={id}
        {...props}
      />
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          dragActive && "border-primary bg-primary/5",
          disabled || loading
            ? "border-muted bg-muted/30 cursor-not-allowed"
            : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
          dragActive && "border-primary bg-primary/10"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-full",
              disabled || loading
                ? "bg-muted"
                : "bg-primary/10"
            )}>
              {loading ? (
                <Icon name="Loader" size={20} className="animate-spin text-muted-foreground" />
              ) : (
                <Icon 
                  name={getFileTypeIcon()} 
                  size={20} 
                  className={disabled ? "text-muted-foreground" : "text-primary"} 
                />
              )}
            </div>
            
            <div className="text-center sm:text-left">
              <p className={cn(
                "text-sm font-medium",
                disabled || loading ? "text-muted-foreground" : "text-foreground"
              )}>
                {loading ? 'Téléchargement...' : label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getFileTypeText()}
              </p>
              {!disabled && !loading && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Icon name="Upload" size={24} className="text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Déposez le fichier ici</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-destructive">
          <Icon name="AlertCircle" size={12} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="Loader" size={12} className="animate-spin" />
          <span>Téléchargement en cours...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 