import { supabase } from './supabaseClient';

export class OCRService {
  /**
   * Sanitize file name to remove special characters that cause issues with Supabase Storage
   * @param {string} fileName - Original file name
   * @returns {string} - Sanitized file name
   */
  static sanitizeFileName(fileName) {
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    // Replace spaces and special characters
    // Keep only alphanumeric, dots, hyphens, underscores
    const sanitized = nameWithoutExt
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove all special characters except dots, hyphens, underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    // If name is empty after sanitization, use a default name
    const finalName = sanitized || 'file';
    
    return `${finalName}${extension}`;
  }

  /**
   * Process expense invoice (for expense invoices)
   * @param {File} file - The file to process
   * @param {boolean} keepFileInStorage - Whether to keep file in storage after processing
   * @returns {Promise<{extractedData: Object, storagePath: string}>}
   */
  static async processExpenseInvoice(file, keepFileInStorage = true) {
    let fileName = null;
    try {
      // 1. Sanitize file name to avoid special character issues
      const sanitizedFileName = this.sanitizeFileName(file.name);
      fileName = `invoices/${Date.now()}_${sanitizedFileName}`;
      
      // 2. Upload file to Supabase Storage (expense-invoice-attachments bucket for expense invoices)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('expense-invoice-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('expense-invoice-attachments')
        .getPublicUrl(fileName);

      // 3. Call Gemini OCR via Supabase Edge Function (use process-expense-invoice for expense invoices)
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('process-expense-invoice', {
        body: {
          fileUrl: publicUrl,
          fileName: fileName
        }
      });

      if (ocrError) {
        // If OCR failed, delete the file and throw error
        if (fileName) {
          await this.removeFileFromStorage(fileName, 'expense-invoice-attachments');
        }
        throw ocrError;
      }

      // Check if extraction was successful (data exists and has useful content)
      if (!ocrData || !ocrData.extractedData || !ocrData.success) {
        // If extraction failed, delete the file
        if (fileName) {
          await this.removeFileFromStorage(fileName, 'expense-invoice-attachments');
        }
        throw new Error('No data extracted from document. Document structure may not be supported.');
      }

      // 4. Clean up uploaded file ONLY if keepFileInStorage is false
      // For expense invoices, we keep files in storage until user removes them
      if (!keepFileInStorage) {
        await supabase.storage
          .from('expense-invoice-attachments')
          .remove([fileName]);
      }

      // Return both extracted data and file path for storage management
      return {
        extractedData: ocrData.extractedData,
        storagePath: fileName
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      // Ensure file is deleted if upload succeeded but processing failed
      if (fileName) {
        try {
          await this.removeFileFromStorage(fileName, 'expense-invoice-attachments');
        } catch (deleteError) {
          console.error('Error deleting file after processing failure:', deleteError);
        }
      }
      throw error;
    }
  }

  // Keep old method for backward compatibility (maps to expense invoice)
  static async processInvoice(file, keepFileInStorage = true) {
    return this.processExpenseInvoice(file, keepFileInStorage);
  }

  /**
   * Remove file from storage
   * @param {string} storagePath - The file path in storage (e.g., "invoices/1234567890_file.pdf")
   * @param {string} bucketName - The bucket name ('expense-invoice-attachments' or 'invoice-uploads')
   */
  static async removeFileFromStorage(storagePath, bucketName = 'expense-invoice-attachments') {
    try {
      if (!storagePath) {
        console.warn('removeFileFromStorage called with empty storagePath');
        return { success: false, error: 'Storage path is empty' };
      }
      
      console.log('Attempting to remove file from storage:', storagePath, 'bucket:', bucketName);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);

      if (error) {
        console.error('Error removing file from storage:', error);
        return { success: false, error: error.message };
      }

      console.log('File successfully removed from storage:', storagePath, data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to remove file from storage:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  static async validateExtractedData(data) {
    // Validate that at least some useful data is present
    // For expense invoices only (client invoice OCR removed)
    const usefulFields = ['amount', 'invoice_number', 'supplier_name', 'issue_date', 'net_amount', 'tax_amount'];
    const hasUsefulData = usefulFields.some(field => data[field]);
    
    if (!hasUsefulData) {
      throw new Error('No useful data extracted from invoice');
    }

    return data;
  }

  /**
   * Extract expense invoice data (for expense invoices)
   * @param {File} file - The file to extract data from
   * @param {boolean} keepFileInStorage - Whether to keep file in storage after processing
   * @returns {Promise<{success: boolean, data: Object, storagePath: string, error: string}>}
   */
  static async extractExpenseInvoiceData(file, keepFileInStorage = true) {
    let storagePath = null;
    try {
      // Process the invoice with OCR
      const result = await this.processExpenseInvoice(file, keepFileInStorage);
      storagePath = result.storagePath;
      
      // Validate the extracted data
      const validatedData = await this.validateExtractedData(result.extractedData);
      
      return {
        success: true,
        data: validatedData,
        storagePath: result.storagePath, // Return storage path so we can delete it later
        confidence: "high"
      };
      
    } catch (error) {
      // If extraction failed and we have a storage path, delete the file
      if (storagePath) {
        try {
          await this.removeFileFromStorage(storagePath, 'expense-invoice-attachments');
          console.log('File deleted from storage due to extraction failure:', storagePath);
        } catch (deleteError) {
          console.error('Error deleting file after extraction failure:', deleteError);
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to extract data from document',
        data: null,
        storagePath: null,
        shouldDeleteFile: true // Flag to indicate file should be deleted
      };
    }
  }

  // Keep old method for backward compatibility (maps to expense invoice)
  static async extractInvoiceData(file, keepFileInStorage = true) {
    return this.extractExpenseInvoiceData(file, keepFileInStorage);
  }
}
