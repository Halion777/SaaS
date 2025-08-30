import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const QuickExpenseInvoiceUpload = ({ onInvoiceUpload, isDebtCollection = false }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMethod, setUploadMethod] = useState('manual');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    try {
      if (selectedFiles.length === 0) {
        alert(t('invoiceUpload.noFilesSelected'));
        return;
      }

      // TODO: Implement actual file upload logic
      const uploadPromises = selectedFiles.map(async (file) => {
        // Simulate file upload
        return {
          fileName: file.name,
          fileSize: file.size,
          uploadStatus: 'success'
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Callback to parent component
      onInvoiceUpload(uploadResults);

      // Reset state
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Invoice upload error:', error);
      alert(t('invoiceUpload.uploadError'));
    }
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter(file => file !== fileToRemove));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isDebtCollection 
          ? t('invoiceUpload.debtCollection.title') 
          : t('invoiceUpload.title')
        }
      </h2>

      {/* Upload Method Toggle */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setUploadMethod('manual')}
          className={`px-4 py-2 rounded-lg transition-all ${
            uploadMethod === 'manual' 
              ? 'bg-[#0036ab] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('invoiceUpload.manualUpload')}
        </button>
        <button
          onClick={() => setUploadMethod('bulk')}
          className={`px-4 py-2 rounded-lg transition-all ${
            uploadMethod === 'bulk' 
              ? 'bg-[#0036ab] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('invoiceUpload.bulkUpload')}
        </button>
      </div>

      {/* File Upload Area */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0036ab] transition-colors"
      >
        <input 
          type="file" 
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <Icon 
          name="Upload" 
          size={48} 
          className="mx-auto mb-4 text-gray-400" 
        />
        <p className="text-gray-600 mb-4">
          {uploadMethod === 'manual' 
            ? t('invoiceUpload.manualUploadDescription') 
            : t('invoiceUpload.bulkUploadDescription')
          }
        </p>
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current.click()}
        >
          {t('invoiceUpload.selectFiles')}
        </Button>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('invoiceUpload.selectedFiles')}
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon 
                    name="File" 
                    size={24} 
                    className="text-[#0036ab]" 
                  />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFile(file)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Button 
            variant="primary" 
            onClick={handleUpload}
          >
            {t('invoiceUpload.uploadButton')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickExpenseInvoiceUpload; 