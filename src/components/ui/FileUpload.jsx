import React, { useState, useRef, useCallback } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';

const FileUpload = ({
  onFileUpload,
  onFileSelect, // For single file selection (avatar uploads)
  onFileRemove,
  uploadedFiles,
  accept, // Alias for acceptedTypes
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB
  showOCRButton = false, // New prop for OCR functionality
  onOCRProcess = null, // New callback for OCR processing
  loading = false, // Loading state
  disabled = false, // Disabled state
  label, // Custom label text
  description, // Custom description text
  className,
  id,
  ...props
}) => {
  // Use accept prop if provided, otherwise fall back to acceptedTypes
  const finalAcceptedTypes = accept || acceptedTypes;
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = useCallback((files) => {
    if (disabled || loading) return;
    
    const validFiles = Array.from(files).filter(file => {
      const fileType = file.type;
      const fileSize = file.size;
      
      // Check file type
      const acceptedTypesArray = finalAcceptedTypes.split(',').map(type => type.trim());
      const isValidType = acceptedTypesArray.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        // Handle wildcard types like "image/*"
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType + '/');
        }
        return fileType === type;
      });
      
      // Check file size (skip if maxSize is Infinity or not provided)
      const isValidSize = maxSize === Infinity || maxSize === Number.MAX_SAFE_INTEGER || !maxSize ? true : fileSize <= maxSize;
      
      if (!isValidType) {
        console.warn(`File type not accepted: ${file.name}`);
      }
      if (!isValidSize && maxSize !== Infinity && maxSize !== Number.MAX_SAFE_INTEGER && maxSize) {
        console.warn(`File too large: ${file.name}`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      // Support both onFileSelect (single file) and onFileUpload (multiple files)
      if (onFileSelect) {
        onFileSelect(validFiles[0]); // Pass single file
      }
      if (onFileUpload) {
        onFileUpload(validFiles);
      }
    }
  }, [finalAcceptedTypes, maxSize, onFileUpload, onFileSelect, disabled, loading]);

  const handleFileRemove = useCallback((index) => {
    if (onFileRemove) {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      // Pass the removed index so parent can delete from storage
      onFileRemove(newFiles, index);
    }
  }, [onFileRemove, uploadedFiles]);

  const handleOCRProcess = async (file) => {
    if (onOCRProcess) {
      onOCRProcess(file);
    }
  };

  const getFileTypeIcon = () => {
    return <Icon name="FileText" className="w-6 h-6 text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && !disabled && !loading ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          loading && "opacity-70",
          className
        )}
        onDragEnter={!disabled && !loading ? handleDrag : undefined}
        onDragLeave={!disabled && !loading ? handleDrag : undefined}
        onDragOver={!disabled && !loading ? handleDrag : undefined}
        onDrop={!disabled && !loading ? handleDrop : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={!onFileSelect} // Single file mode for onFileSelect
          accept={finalAcceptedTypes}
          onChange={handleChange}
          className="hidden"
          id={id}
          disabled={disabled || loading}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {loading ? (
            <Icon name="Loader2" className="w-6 h-6 text-gray-400 animate-spin" />
          ) : (
            getFileTypeIcon()
          )}
          <div className="text-sm text-gray-600">
            <span 
              className={cn(
                "font-medium",
                disabled || loading 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-blue-600 hover:text-blue-500 cursor-pointer"
              )} 
              onClick={() => !disabled && !loading && inputRef.current?.click()}
            >
              {label || 'Click to upload'}
            </span>{" "}
            {!label && 'or drag and drop'}
          </div>
          <p className="text-xs text-gray-500">
            {description || `${finalAcceptedTypes} up to ${formatFileSize(maxSize)}`}
          </p>
        </div>
      </div>

      {/* OCR Button for invoice files */}
      {showOCRButton && uploadedFiles && uploadedFiles.length > 0 && (
        <div className="mt-3">
          <Button
            onClick={() => handleOCRProcess(uploadedFiles[0])}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Icon name="Scan" className="w-4 h-4 mr-2" />
            Scan Invoice with AI (OCR)
          </Button>
        </div>
      )}

      {/* File list */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileTypeIcon()}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFileRemove(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Icon name="X" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 