import React, { useState, useRef, useCallback } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

const FileUpload = ({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB
  showOCRButton = false, // New prop for OCR functionality
  onOCRProcess = null, // New callback for OCR processing
  className,
  id,
  ...props
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
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
    const validFiles = Array.from(files).filter(file => {
      const fileType = file.type;
      const fileSize = file.size;
      
      // Check file type
      const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
      const isValidType = acceptedTypesArray.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return fileType === type;
      });
      
      // Check file size
      const isValidSize = fileSize <= maxSize;
      
      if (!isValidType) {
        console.warn(`File type not accepted: ${file.name}`);
      }
      if (!isValidSize) {
        console.warn(`File too large: ${file.name}`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      if (onFileUpload) {
        onFileUpload(validFiles);
      }
    }
  }, [acceptedTypes, maxSize, onFileUpload]);

  const handleFileRemove = useCallback((index) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (onFileRemove) {
        onFileRemove(newFiles);
      }
      return newFiles;
    });
  }, [onFileRemove]);

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
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
          id={id}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {getFileTypeIcon()}
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer" onClick={() => inputRef.current?.click()}>
              Click to upload
            </span>{" "}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            {acceptedTypes} up to {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* OCR Button for invoice files */}
      {showOCRButton && uploadedFiles.length > 0 && (
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
      {uploadedFiles.length > 0 && (
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